import type { DcnOperator, DcnReference, DcnValue, Decision } from "@sap/ams/types/Types.js";
import type { SqlExpression, ValueArg } from "../types/auth/AuthorizationConditionTranslator.types.js";

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
                return this.convertToSqlEq(args);
            case "and":
                return this.convertToSqlAnd(args);
            case "or":
                return this.convertToSqlOr(args);
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

    private convertToSqlEq(args: (DcnReference | DcnValue | ValueArg | SqlExpression)[]) {
        const values = this.getValueArgs(args);
        const field = values.find(arg => arg.type === "field");
        const literal = values.find(arg => arg.type === "literal");

        if (!field || !literal) {
            throw new Error("Invalid EQ condition: expected one field and one literal.");
        }

        if (Array.isArray(literal.value)) {
            throw new Error("Invalid EQ condition: expected a scalar literal.");
        }

        return {
            sql: `${field.value} = ?`,
            parameters: [literal.value]
        };
    }

    private convertToSqlAnd(args: (DcnReference | DcnValue | ValueArg | SqlExpression)[]) {
        const [left, right] = this.getSqlExpressions(args);

        if (!left || !right) {
            throw new Error("Invalid AND condition: expected two SQL expressions.");
        }

        return {
            sql: `(${left.sql} AND ${right.sql})`,
            parameters: [
                ...left.parameters,
                ...right.parameters
            ]
        };
    }

    private convertToSqlOr(args: (DcnReference | DcnValue | ValueArg | SqlExpression)[]) {
        const [left, right] = this.getSqlExpressions(args);

        if (!left || !right) {
            throw new Error("Invalid OR condition: expected two SQL expressions.");
        }

        return {
            sql: `(${left.sql} OR ${right.sql})`,
            parameters: [
                ...left.parameters,
                ...right.parameters
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