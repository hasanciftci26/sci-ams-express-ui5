import type { Database } from "better-sqlite3";
import type { Employee } from "../types/db/Database.types.js";
import CustomError from "./CustomError.js";

export default class EmployeeService {
    private readonly db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    public getEmployee(employeeId: string) {
        const employee = this.db.prepare<[string], Employee>("SELECT * FROM Employees WHERE employeeID = ?").get(employeeId);

        if (!employee) {
            throw new CustomError("Employee with the following ID was not found: " + employeeId, 404);
        }

        return employee;
    }

    public getAllEmployees() {
        return this.db.prepare<[], Employee>("SELECT * FROM Employees").all();
    }
}