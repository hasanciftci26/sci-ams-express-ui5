import { z } from "zod";
import type { Employee } from "../types/db/Database.types.js";

export default class EmployeeSchema {
    private static readonly schema: z.ZodType<Employee> = z.strictObject({
        employeeID: z.string().min(1).max(12),
        firstName: z.string().min(1).max(40),
        lastName: z.string().min(1).max(40),
        countryCode: z.string().length(2).regex(/^[A-Z]{2}$/),
        dateOfBirth: z.iso.date(),
        departmentID: z.string().min(1)
    });

    public static validate(data: unknown) {
        return this.schema.safeParse(data);
    }
}