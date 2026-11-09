import type { DcnValue } from "@sap/ams/types/Types.js";

export type SqlParameter = string | number | boolean;

export type SqlExpression = {
    sql: string;
    parameters: SqlParameter[];
};

export type ValueArg = {
    type: "field";
    value: string;
} | {
    type: "literal";
    value: DcnValue;
};

export type ComparisonOperators = "=" | "<>" | ">" | ">=" | "<" | "<=";
export type LogicalOperators = "AND" | "OR";