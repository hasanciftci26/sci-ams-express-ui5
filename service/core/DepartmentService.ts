import type { Database } from "better-sqlite3";
import type { Department } from "../types/db/Database.types.js";
import CustomError from "./CustomError.js";

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
}