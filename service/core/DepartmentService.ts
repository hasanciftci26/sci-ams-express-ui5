import type { Database } from "better-sqlite3";
import type { Department } from "../types/db/Database.types.js";
import CustomError from "./CustomError.js";
import type { DepartmentUpdate } from "../types/schema/DepartmentSchema.types.js";

export default class DepartmentService {
    private readonly db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    public getDepartment(departmentId: string) {
        const department = this.db.prepare<[string], Department>("SELECT * FROM Departments WHERE departmentID = ?").get(departmentId);

        if (!department) {
            throw new CustomError("Department with the following ID was not found: " + departmentId, 404);
        }

        return department;
    }

    public getAllDepartments() {
        return this.db.prepare<[], Department>("SELECT * FROM Departments").all();
    }

    public createDepartment(department: Department) {
        try {
            this.db.prepare(`
                INSERT INTO Departments (
                    departmentID,
                    name
                )
                VALUES (
                    @departmentID,
                    @name
                )
            `).run(department);

            return this.getDepartment(department.departmentID);
        } catch (error) {
            throw new CustomError("Failed to create department: " + (error as Error).message, 500);
        }
    }

    public updateDepartment(departmentId: string, changes: DepartmentUpdate) {
        try {
            const entries = Object.entries(changes).filter(([, value]) => value !== undefined);
            const setClause = entries.map(([field]) => `${field} = ?`).join(", ");
            const values = entries.map(([, value]) => value);
            const result = this.db.prepare(`UPDATE Departments SET ${setClause} WHERE departmentID = ?`).run(...values, departmentId);

            if (result.changes === 0) {
                throw new CustomError("Department with the following ID was not found: " + departmentId, 404);
            }

            return this.getDepartment(departmentId);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError("Failed to update department: " + (error as Error).message, 500);
        }
    }

    public deleteDepartment(departmentId: string) {
        try {
            const result = this.db.prepare<[string]>("DELETE FROM Departments WHERE departmentID = ?").run(departmentId);

            if (result.changes === 0) {
                throw new CustomError("Department with the following ID was not found: " + departmentId, 404);
            }
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError("Failed to delete department: " + (error as Error).message, 500);
        }
    }
}