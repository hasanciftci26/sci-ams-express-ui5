import { z } from "zod";
import type EmployeeSchema from "../../schema/EmployeeSchema.js";

export type EmployeeUpdate = z.infer<typeof EmployeeSchema.updateSchema>;