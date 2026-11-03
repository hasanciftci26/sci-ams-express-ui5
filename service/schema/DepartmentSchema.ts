import { z } from "zod";
import type { Department } from "../types/db/Database.types.js";

export default class DepartmentSchema {
    private static readonly schema: z.ZodType<Department> = z.strictObject({
        departmentID: z.uuid(),
        name: z.string().min(1).max(100)
    });

    public static validate(data: unknown) {
        return this.schema.safeParse(data);
    }
}