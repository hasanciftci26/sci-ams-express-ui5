import { z } from "zod";
import DepartmentSchema from "../../schema/DepartmentSchema.js";

export type DepartmentUpdate = z.infer<typeof DepartmentSchema.updateSchema>;