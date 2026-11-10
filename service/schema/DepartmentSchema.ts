import { z } from "zod";

export default class DepartmentSchema {
    private static readonly schema = z.strictObject({
        departmentID: z.uuid(),
        name: z.string().min(1).max(100)
    });

    public static readonly updateSchema = this.schema
        .omit({
            departmentID: true
        })
        .partial()
        .refine(data => Object.keys(data).length > 0, {
            message: "At least one field must be provided."
        });

    public static validate(data: unknown) {
        return this.schema.safeParse(data);
    }

    public static validateUpdate(data: unknown) {
        return this.updateSchema.safeParse(data);
    }
}