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

    public createEmployee(employee: Employee) {
        try {
            this.db.prepare(`
                INSERT INTO Employees (
                    employeeID,
                    firstName,
                    lastName,
                    countryCode,
                    dateOfBirth,
                    departmentID
                )
                VALUES (
                    @employeeID,
                    @firstName,
                    @lastName,
                    @countryCode,
                    @dateOfBirth,
                    @departmentID
                )
            `).run(employee);

            return this.getEmployee(employee.employeeID);
        } catch (error) {
            throw new CustomError("Failed to create employee: " + (error as Error).message, 500);
        }
    }
}