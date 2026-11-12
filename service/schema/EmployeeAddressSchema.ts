import { z } from "zod";

export default class EmployeeAddressSchema {
    private static readonly schema = z.strictObject({
        addressID: z.uuid(),
        employeeID: z.string().min(1).max(12),
        countryCode: z.string().length(2).regex(/^[A-Z]{2}$/),
        city: z.string().min(1).max(100),
        postalCode: z.string().min(1).max(20),
        street: z.string().min(1).max(100),
        houseNumber: z.string().min(1).max(20),
        additionalAddressLine: z.string().max(255).nullable()
    });

    public static readonly updateSchema = this.schema
        .omit({
            addressID: true,
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