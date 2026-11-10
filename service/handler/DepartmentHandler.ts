import type { Database } from "better-sqlite3";
import type { RequestHandler } from "express";
import DepartmentService from "../core/DepartmentService.js";
import DepartmentSchema from "../schema/DepartmentSchema.js";
import type CustomError from "../core/CustomError.js";

export default class DepartmentHandler {
    private readonly service: DepartmentService;

    constructor(db: Database) {
        this.service = new DepartmentService(db);
    }

    /**
     * Returns all departments after the route-level AMS read privilege check
     * has authorized the request.
     *
     * @see {@link https://github.com/hasanciftci26/sci-ams-express-ui5/blob/main/service/docs/authorization/DepartmentAuthorization.md#read-authorization | Read Authorization}
     */
    public getAllDepartments: RequestHandler = (req, res) => {
        return res.json(this.service.getAllDepartments());
    };

    /**
     * Returns the requested department after the route-level AMS read privilege
     * check has authorized the request.
     *
     * @see {@link https://github.com/hasanciftci26/sci-ams-express-ui5/blob/main/service/docs/authorization/DepartmentAuthorization.md#read-authorization | Read Authorization}
     */
    public getDepartment: RequestHandler<{ departmentId: string }> = (req, res) => {
        try {
            const department = this.service.getDepartment(req.params.departmentId);
            return res.json(department);
        } catch (error) {
            return res.status((error as CustomError).status).json({
                message: (error as CustomError).message
            });
        }
    };

    /**
     * Validates and creates a department after the route-level AMS create
     * privilege check has authorized the request.
     *
     * @see {@link https://github.com/hasanciftci26/sci-ams-express-ui5/blob/main/service/docs/authorization/DepartmentAuthorization.md#create-authorization | Create Authorization}
     */
    public createDepartment: RequestHandler = (req, res) => {
        const result = DepartmentSchema.validate(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: "Invalid department data",
                errors: result.error.issues
            });
        }

        try {
            const department = this.service.createDepartment(result.data);
            return res.status(201).json(department);
        } catch (error) {
            return res.status((error as CustomError).status).json({
                message: (error as CustomError).message
            });
        }
    };

    /**
     * Validates and partially updates a department after the route-level AMS
     * update privilege check has authorized the request.
     *
     * @see {@link https://github.com/hasanciftci26/sci-ams-express-ui5/blob/main/service/docs/authorization/DepartmentAuthorization.md#update-authorization | Update Authorization}
     */
    public updateDepartment: RequestHandler<{ departmentId: string }> = (req, res) => {
        const result = DepartmentSchema.validateUpdate(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: "Invalid department data",
                errors: result.error.issues
            });
        }

        try {
            const department = this.service.updateDepartment(req.params.departmentId, result.data);
            return res.json(department);
        } catch (error) {
            return res.status((error as CustomError).status).json({
                message: (error as CustomError).message
            });
        }
    };

    /**
     * Deletes the requested department after the route-level AMS delete
     * privilege check has authorized the request.
     *
     * @see {@link https://github.com/hasanciftci26/sci-ams-express-ui5/blob/main/service/docs/authorization/DepartmentAuthorization.md#delete-authorization | Delete Authorization}
     */
    public deleteDepartment: RequestHandler<{ departmentId: string }> = (req, res) => {
        try {
            this.service.deleteDepartment(req.params.departmentId);
            return res.sendStatus(204);
        } catch (error) {
            return res.status((error as CustomError).status).json({
                message: (error as CustomError).message
            });
        }
    };
}