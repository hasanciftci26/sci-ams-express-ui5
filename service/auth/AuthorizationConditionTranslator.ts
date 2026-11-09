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
            case "and":
                return this.convertToSqlLogical(args, "AND");
            case "or":
                return this.convertToSqlLogical(args, "OR");
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

    private getValueArgs(args: (DcnReference | DcnValue | ValueArg | SqlExpression)[]) {
        return args.filter((arg): arg is ValueArg => this.isValueArg(arg));
    }

    private getSqlExpressions(args: (DcnReference | DcnValue | ValueArg | SqlExpression)[]) {
        return args.filter((arg): arg is SqlExpression => this.isSqlExpression(arg));
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