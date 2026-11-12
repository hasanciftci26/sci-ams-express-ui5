import type { Database } from "better-sqlite3";
import type { Employee, EmployeeAddress } from "../types/db/Database.types.js";
import CustomError from "./CustomError.js";
import type { SqlExpression, SqlParameter } from "../types/auth/AuthorizationConditionTranslator.types.js";
import type { EmployeeUpdate } from "../types/schema/EmployeeSchema.types.js";
import type { EmployeeAddressUpdate } from "../types/schema/EmployeeAddressSchema.types.js";

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

    public getEmployeesByExpression(expression: SqlExpression) {
        return this.db.prepare<SqlParameter[], Employee>(`SELECT * FROM Employees WHERE ${expression.sql}`).all(...expression.parameters);
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

    public updateEmployee(employeeId: string, changes: EmployeeUpdate) {
        try {
            const entries = Object.entries(changes);
            const setClause = entries.map(([field]) => `${field} = ?`).join(", ");
            const values = entries.map(([, value]) => value);
            const result = this.db.prepare(`UPDATE Employees SET ${setClause} WHERE employeeID = ?`).run(...values, employeeId);

            if (result.changes === 0) {
                throw new CustomError("Employee with the following ID was not found: " + employeeId, 404);
            }

            return this.getEmployee(employeeId);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError("Failed to update employee: " + (error as Error).message, 500);
        }
    }

    public deleteEmployee(employeeId: string) {
        try {
            const result = this.db.prepare<[string]>("DELETE FROM Employees WHERE employeeID = ?").run(employeeId);

            if (result.changes === 0) {
                throw new CustomError("Employee with the following ID was not found: " + employeeId, 404);
            }
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError("Failed to delete employee: " + (error as Error).message, 500);
        }
    }

    public getEmployeeAddress(employeeId: string, addressId: string) {
        const address = this.db.prepare<[string, string], EmployeeAddress>(
            "SELECT * FROM EmployeeAddresses WHERE employeeID = ? AND addressID = ?"
        ).get(employeeId, addressId);

        if (!address) {
            throw new CustomError(`Address with ID '${addressId}' was not found for employee '${employeeId}'.`, 404);
        }

        return address;
    }

    public getAllEmployeeAddresses(employeeId: string) {
        return this.db.prepare<[string], EmployeeAddress>("SELECT * FROM EmployeeAddresses WHERE employeeID = ?").all(employeeId);
    }

    public createEmployeeAddress(employeeId: string, address: Omit<EmployeeAddress, "employeeID">) {
        try {
            this.db.prepare(`
                INSERT INTO EmployeeAddresses (
                    employeeID,
                    addressID,
                    countryCode,
                    city,
                    postalCode,
                    street,
                    houseNumber,
                    additionalAddressLine
                )
                VALUES (
                    @employeeID,
                    @addressID,
                    @countryCode,
                    @city,
                    @postalCode,
                    @street,
                    @houseNumber,
                    @additionalAddressLine
                )
        `).run({
                employeeID: employeeId,
                ...address
            });

            return this.getEmployeeAddress(employeeId, address.addressID);
        } catch (error) {
            throw new CustomError("Failed to create employee address: " + (error as Error).message, 500);
        }
    }

    public updateEmployeeAddress(employeeId: string, addressId: string, changes: EmployeeAddressUpdate) {
        try {
            const entries = Object.entries(changes);
            const setClause = entries.map(([field]) => `${field} = ?`).join(", ");
            const values = entries.map(([, value]) => value);

            const result = this.db.prepare(
                `UPDATE EmployeeAddresses SET ${setClause} WHERE employeeID = ? AND addressID = ?`
            ).run(...values, employeeId, addressId);

            if (result.changes === 0) {
                throw new CustomError(`Address with ID '${addressId}' was not found for employee '${employeeId}'.`, 404);
            }

            return this.getEmployeeAddress(employeeId, addressId);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError("Failed to update employee address: " + (error as Error).message, 500);
        }
    }

    public deleteEmployeeAddress(employeeId: string, addressId: string) {
        try {
            const result = this.db.prepare<[string, string]>(
                "DELETE FROM EmployeeAddresses WHERE employeeID = ? AND addressID = ?"
            ).run(employeeId, addressId);

            if (result.changes === 0) {
                throw new CustomError(`Address with ID '${addressId}' was not found for employee '${employeeId}'.`, 404);
            }
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError("Failed to delete employee address: " + (error as Error).message, 500);
        }
    }
}