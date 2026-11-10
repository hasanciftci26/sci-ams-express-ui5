import { z } from "zod";

export default class EmployeeSchema {
    private static readonly schema = z.strictObject({
        employeeID: z.string().min(1).max(12),
        firstName: z.string().min(1).max(40),
        lastName: z.string().min(1).max(40),
        countryCode: z.string().length(2).regex(/^[A-Z]{2}$/),
        dateOfBirth: z.iso.date(),
        departmentID: z.string().min(1)
    });

    public static readonly updateSchema = this.schema
        .omit({
            employeeID: true
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