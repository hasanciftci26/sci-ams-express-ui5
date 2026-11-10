import type { DcnOperator, DcnReference, DcnValue, Decision } from "@sap/ams/types/Types.js";
import type { ComparisonOperators, LogicalOperators, SqlExpression, ValueArg } from "../types/auth/AuthorizationConditionTranslator.types.js";

export default class AuthorizationConditionTranslator {
    private readonly decision: Decision;
    private readonly refToFieldMap: Map<string, string>;

    constructor(decision: Decision, refToFieldMap: Map<string, string>) {
        this.decision = decision;
        this.refToFieldMap = refToFieldMap;
    }

    public toSql() {
        return this.decision.visit<SqlExpression, ValueArg>(this.convertCallToSql.bind(this), this.convertValueToSql.bind(this));
    }

    private convertCallToSql(operator: DcnOperator, args: (DcnReference | DcnValue | ValueArg | SqlExpression)[]) {
        switch (operator) {
            case "eq":
                return this.convertToSqlComparison(args, "=");
            case "ne":
                return this.convertToSqlComparison(args, "<>");
            case "gt":
                return this.convertToSqlComparison(args, ">");
            case "ge":
                return this.convertToSqlComparison(args, ">=");
            case "lt":
                return this.convertToSqlComparison(args, "<");
            case "le":
                return this.convertToSqlComparison(args, "<=");
            case "between":
                return this.convertToSqlBetween(args, false);
            case "not_between":
                return this.convertToSqlBetween(args, true);
            case "in":
                return this.convertToSqlIn(args, false);
            case "not_in":
                return this.convertToSqlIn(args, true);
            case "like":
                return this.convertToSqlLike(args, false);
            case "not_like":
                return this.convertToSqlLike(args, true);
            case "is_null":
                return this.convertToSqlNull(args, false);
            case "is_not_null":
                return this.convertToSqlNull(args, true);
            case "and":
                return this.convertToSqlLogical(args, "AND");
            case "or":
                return this.convertToSqlLogical(args, "OR");
            case "not":
                return this.convertToSqlNot(args);
            case "restricted":
            case "not_restricted":
                throw new Error(`DCN operator '${operator}' requires AMS restriction semantics and is not supported by this SQL translator.`);
            default:
                throw new Error(`Unsupported DCN operator '${operator}'.`);
        }
    }

    private convertValueToSql(value: DcnReference | DcnValue): ValueArg {
        if (this.hasRef(value)) {
            const field = this.refToFieldMap.get(value.ref);

            if (!field) {
                throw new Error(`No database field mapping found for AMS reference '${value.ref}'.`);
            }

            return {
                type: "field",
                value: field
            };
        }

        return {
            type: "literal",
            value
        };
    }

    private convertToSqlComparison(args: (DcnReference | DcnValue | ValueArg | SqlExpression)[], operator: ComparisonOperators) {
        const [left, right] = this.getValueArgs(args);

        if (!left || !right) {
            throw new Error(`Invalid ${operator} condition: expected two values.`);
        }

        if (left.type === "field" && right.type === "literal") {
            if (Array.isArray(right.value)) {
                throw new Error(`Invalid ${operator} condition: expected a scalar literal.`);
            }

            return {
                sql: `${left.value} ${operator} ?`,
                parameters: [right.value]
            };
        }

        if (left.type === "literal" && right.type === "field") {
            if (Array.isArray(left.value)) {
                throw new Error(`Invalid ${operator} condition: expected a scalar literal.`);
            }

            return {
                sql: `? ${operator} ${right.value}`,
                parameters: [left.value]
            };
        }

        throw new Error(`Invalid ${operator} condition: expected one field and one scalar literal.`);
    }

    private convertToSqlBetween(args: (DcnReference | DcnValue | ValueArg | SqlExpression)[], negated: boolean) {
        const values = this.getValueArgs(args);

        if (values.length !== 3) {
            throw new Error(`Invalid ${negated ? "NOT BETWEEN" : "BETWEEN"} condition: expected three values.`);
        }

        const [value, min, max] = values;

        if (!value || !min || !max || value.type !== "field" || min.type !== "literal" || max.type !== "literal") {
            throw new Error(`Invalid ${negated ? "NOT BETWEEN" : "BETWEEN"} condition: expected a field, minimum and maximum.`);
        }

        const minValue = this.getScalarLiteral(min);
        const maxValue = this.getScalarLiteral(max);

        return {
            sql: `${value.value} ${negated ? "NOT " : ""}BETWEEN ? AND ?`,
            parameters: [minValue, maxValue]
        };
    }

    private convertToSqlIn(args: (DcnReference | DcnValue | ValueArg | SqlExpression)[], negated: boolean) {
        const [field] = this.getFieldArgs(args);
        const literal = this.getValueArgs(args).find(arg => arg.type === "literal");

        if (!field || !literal || !Array.isArray(literal.value)) {
            throw new Error(`Invalid ${negated ? "NOT IN" : "IN"} condition: expected one field and one array literal.`);
        }

        if (literal.value.length === 0) {
            return {
                sql: negated ? "1 = 1" : "1 = 0",
                parameters: []
            };
        }

        const placeholders = literal.value.map(() => "?").join(", ");

        return {
            sql: `${field.value} ${negated ? "NOT " : ""}IN (${placeholders})`,
            parameters: literal.value
        };
    }

    private convertToSqlLike(args: (DcnReference | DcnValue | ValueArg | SqlExpression)[], negated: boolean) {
        const [left, right] = this.getValueArgs(args);

        if (!left || !right || left.type !== "field" || right.type !== "literal" || typeof right.value !== "string") {
            throw new Error(`Invalid ${negated ? "NOT LIKE" : "LIKE"} condition: expected a field and a string literal.`);
        }

        return {
            sql: `${left.value} ${negated ? "NOT " : ""}LIKE ?`,
            parameters: [right.value]
        };
    }

    private convertToSqlNull(args: (DcnReference | DcnValue | ValueArg | SqlExpression)[], negated: boolean) {
        const fields = this.getFieldArgs(args);

        if (fields.length !== 1) {
            throw new Error(`Invalid ${negated ? "IS NOT NULL" : "IS NULL"} condition: expected exactly one field.`);
        }

        const [field] = fields;

        return {
            sql: `${field!.value} IS ${negated ? "NOT " : ""}NULL`,
            parameters: []
        };
    }

    private convertToSqlLogical(args: (DcnReference | DcnValue | ValueArg | SqlExpression)[], operator: LogicalOperators) {
        const expressions = this.getSqlExpressions(args);

        if (expressions.length !== 2) {
            throw new Error(`Invalid ${operator} condition: expected exactly two SQL expressions.`);
        }

        const [left, right] = expressions;

        return {
            sql: `(${left!.sql} ${operator} ${right!.sql})`,
            parameters: [
                ...left!.parameters,
                ...right!.parameters
            ]
        };
    }

    private convertToSqlNot(args: (DcnReference | DcnValue | ValueArg | SqlExpression)[]) {
        const expressions = this.getSqlExpressions(args);

        if (expressions.length !== 1) {
            throw new Error("Invalid NOT condition: expected exactly one SQL expression.");
        }

        const [expression] = expressions;

        return {
            sql: `NOT (${expression!.sql})`,
            parameters: expression!.parameters
        };
    }

    private getFieldArgs(args: (DcnReference | DcnValue | ValueArg | SqlExpression)[]) {
        return this.getValueArgs(args).filter((arg): arg is Extract<ValueArg, { type: "field" }> => arg.type === "field");
    }

    private getValueArgs(args: (DcnReference | DcnValue | ValueArg | SqlExpression)[]) {
        return args.filter((arg): arg is ValueArg => this.isValueArg(arg));
    }

    private getSqlExpressions(args: (DcnReference | DcnValue | ValueArg | SqlExpression)[]) {
        return args.filter((arg): arg is SqlExpression => this.isSqlExpression(arg));
    }

    private getScalarLiteral(arg: ValueArg) {
        if (arg.type !== "literal" || Array.isArray(arg.value)) {
            throw new Error("Expected a scalar literal value.");
        }

        return arg.value;
    }

    private isValueArg(value: unknown): value is ValueArg {
        if (typeof value !== "object" || value === null || !("type" in value)) {
            return false;
        }

        return value.type === "field" || value.type === "literal";
    }

    private isSqlExpression(value: unknown): value is SqlExpression {
        return (
            typeof value === "object" &&
            value !== null &&
            "sql" in value &&
            "parameters" in value &&
            typeof value.sql === "string" &&
            Array.isArray(value.parameters)
        );
    }

    private hasRef(value: unknown): value is DcnReference {
        return (
            typeof value === "object" &&
            value !== null &&
            "ref" in value &&
            typeof value.ref === "string"
        );
    }
}