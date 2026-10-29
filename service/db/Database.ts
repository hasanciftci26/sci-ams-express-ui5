import SQLiteDatabase from "better-sqlite3";
import { parse } from "csv-parse/sync";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import type {
    Department,
    Employee,
    EmployeeAddress,
} from "../types/db/Database.types.js";

export default class Database {
    public static create() {
        const db = new SQLiteDatabase(":memory:");

        try {
            db.pragma("foreign_keys = ON");

            this.createSchema(db);
            this.loadDepartments(db);
            this.loadEmployees(db);
            this.loadEmployeeAddresses(db);

            return db;
        } catch (error) {
            db.close();
            throw error;
        }
    }

    private static createSchema(db: SQLiteDatabase.Database) {
        const schemaPath = fileURLToPath(new URL("./schema.sql", import.meta.url));
        const schema = readFileSync(schemaPath, "utf8");

        db.exec(schema);
    }

    private static loadDepartments(db: SQLiteDatabase.Database) {
        const rows = this.readCsv<Department>("Departments.csv");

        const statement = db.prepare(`
            INSERT INTO Departments (
                departmentID,
                name
            )
            VALUES (
                @departmentID,
                @name
            )
        `);

        const insertAll = db.transaction((departments: Department[]) => {
            for (const department of departments) {
                statement.run(department);
            }
        });

        insertAll(rows);
    }

    private static loadEmployees(db: SQLiteDatabase.Database) {
        const rows = this.readCsv<Employee>("Employees.csv");

        const statement = db.prepare(`
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
        `);

        const insertAll = db.transaction((employees: Employee[]) => {
            for (const employee of employees) {
                statement.run(employee);
            }
        });

        insertAll(rows);
    }

    private static loadEmployeeAddresses(db: SQLiteDatabase.Database) {
        const rows = this.readCsv<EmployeeAddress>("EmployeeAddresses.csv");

        const statement = db.prepare(`
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
        `);

        const insertAll = db.transaction((addresses: EmployeeAddress[]) => {
            for (const address of addresses) {
                statement.run({
                    ...address,
                    additionalAddressLine: address.additionalAddressLine === "" ? null : address.additionalAddressLine,
                });
            }
        });

        insertAll(rows);
    }

    private static readCsv<T>(fileName: string) {
        const filePath = fileURLToPath(new URL(`./data/${fileName}`, import.meta.url));
        const content = readFileSync(filePath, "utf8");

        return parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        }) as T[];
    }
}