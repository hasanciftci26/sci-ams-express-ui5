import { z } from "zod";
import type EmployeeAddressSchema from "../../schema/EmployeeAddressSchema.js";

export type EmployeeAddressUpdate = z.infer<typeof EmployeeAddressSchema.updateSchema>;