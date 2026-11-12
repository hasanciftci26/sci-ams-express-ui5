import type { Database } from "better-sqlite3";
import EmployeeService from "../core/EmployeeService.js";
import type { RequestHandler } from "express";
import EmployeeSchema from "../schema/EmployeeSchema.js";
import type CustomError from "../core/CustomError.js";
import { AMS_AUTHORIZATIONS } from "@sap/ams";
import AuthorizationConditionTranslator from "../auth/AuthorizationConditionTranslator.js";

export default class EmployeeHandler {
    private readonly service: EmployeeService;

    constructor(db: Database) {
        this.service = new EmployeeService(db);
    }

    /**
     * Returns a single employee after evaluating read authorization against the
     * requested employee record.
     *
     * @see {@link https://github.com/hasanciftci26/sci-ams-express-ui5/blob/main/service/docs/authorization/EmployeeAuthorization.md#reading-a-single-employee | Reading a Single Employee}
     */
    public getEmployee: RequestHandler<{ employeeId: string; }> = (req, res) => {
        try {
            const employee = this.service.getEmployee(req.params.employeeId);
            const decision = req[AMS_AUTHORIZATIONS].checkPrivilege("read", "Employees", { countryCode: employee.countryCode });

            if (decision.isGranted()) {
                return res.json(employee);
            }

            return res.sendStatus(403);
        } catch (error) {
            return res.status((error as CustomError).status).json({
                message: (error as CustomError).message
            });
        }
    };

    /**
     * Returns all employees the authenticated user is authorized to read,
     * translating conditional AMS authorization into a database filter when required.
     *
     * @see {@link https://github.com/hasanciftci26/sci-ams-express-ui5/blob/main/service/docs/authorization/EmployeeAuthorization.md#reading-an-employee-collection | Reading an Employee Collection}
     */
    public getAllEmployees: RequestHandler = (req, res) => {
        const decision = req[AMS_AUTHORIZATIONS].checkPrivilege("read", "Employees");

        if (decision.isGranted()) {
            return res.json(this.service.getAllEmployees());
        }

        const refToFieldMap = new Map<string, string>([
            ["$app.countryCode", "countryCode"]
        ]);

        const translator = new AuthorizationConditionTranslator(decision, refToFieldMap);
        const expression = translator.toSql();

        return res.json(this.service.getEmployeesByExpression(expression));
    };

    /**
     * Creates an employee after validating read and create authorization against
     * the resulting employee state.
     *
     * @see {@link https://github.com/hasanciftci26/sci-ams-express-ui5/blob/main/service/docs/authorization/EmployeeAuthorization.md#create-authorization | Create Authorization}
     */
    public createEmployee: RequestHandler = (req, res) => {
        const result = EmployeeSchema.validate(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: "Invalid employee data",
                errors: result.error.issues
            });
        }

        const input = {
            countryCode: result.data.countryCode
        };

        const readDecision = req[AMS_AUTHORIZATIONS].checkPrivilege("read", "Employees", input);
        const createDecision = req[AMS_AUTHORIZATIONS].checkPrivilege("create", "Employees", input);

        if (!readDecision.isGranted() || !createDecision.isGranted()) {
            return res.sendStatus(403);
        }

        try {
            const employee = this.service.createEmployee(result.data);
            return res.status(201).json(employee);
        } catch (error) {
            return res.status((error as CustomError).status).json({
                message: (error as CustomError).message
            });
        }
    };

    /**
     * Updates an employee after validating read and update authorization against
     * the current and, when required, resulting employee state.
     *
     * @see {@link https://github.com/hasanciftci26/sci-ams-express-ui5/blob/main/service/docs/authorization/EmployeeAuthorization.md#update-authorization | Update Authorization}
     */
    public updateEmployee: RequestHandler<{ employeeId: string }> = (req, res) => {
        const result = EmployeeSchema.validateUpdate(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: "Invalid employee data",
                errors: result.error.issues
            });
        }

        try {
            const employee = this.service.getEmployee(req.params.employeeId);

            const currentInput = {
                countryCode: employee.countryCode
            };

            const currentReadDecision = req[AMS_AUTHORIZATIONS].checkPrivilege("read", "Employees", currentInput);
            const currentUpdateDecision = req[AMS_AUTHORIZATIONS].checkPrivilege("update", "Employees", currentInput);

            if (!currentReadDecision.isGranted() || !currentUpdateDecision.isGranted()) {
                return res.sendStatus(403);
            }

            if (result.data.countryCode !== undefined) {
                const newInput = {
                    countryCode: result.data.countryCode
                };

                const newReadDecision = req[AMS_AUTHORIZATIONS].checkPrivilege("read", "Employees", newInput);
                const newUpdateDecision = req[AMS_AUTHORIZATIONS].checkPrivilege("update", "Employees", newInput);

                if (!newReadDecision.isGranted() || !newUpdateDecision.isGranted()) {
                    return res.sendStatus(403);
                }
            }

            const updatedEmployee = this.service.updateEmployee(req.params.employeeId, result.data);
            return res.json(updatedEmployee);
        } catch (error) {
            return res.status((error as CustomError).status).json({
                message: (error as CustomError).message
            });
        }
    };

    /**
     * Deletes an employee after validating read and delete authorization against
     * the employee's current state.
     *
     * @see {@link https://github.com/hasanciftci26/sci-ams-express-ui5/blob/main/service/docs/authorization/EmployeeAuthorization.md#delete-authorization | Delete Authorization}
     */
    public deleteEmployee: RequestHandler<{ employeeId: string }> = (req, res) => {
        try {
            const employee = this.service.getEmployee(req.params.employeeId);

            const input = {
                countryCode: employee.countryCode
            };

            const readDecision = req[AMS_AUTHORIZATIONS].checkPrivilege("read", "Employees", input);
            const deleteDecision = req[AMS_AUTHORIZATIONS].checkPrivilege("delete", "Employees", input);

            if (!readDecision.isGranted() || !deleteDecision.isGranted()) {
                return res.sendStatus(403);
            }

            this.service.deleteEmployee(req.params.employeeId);
            return res.sendStatus(204);
        } catch (error) {
            return res.status((error as CustomError).status).json({
                message: (error as CustomError).message
            });
        }
    };

    public getEmployeeAddress: RequestHandler<{ employeeId: string; addressId: string; }> = (req, res) => {
        try {
            const employee = this.service.getEmployee(req.params.employeeId);
            const decision = req[AMS_AUTHORIZATIONS].checkPrivilege("read", "Employees", { countryCode: employee.countryCode });

            if (!decision.isGranted()) {
                return res.sendStatus(403);
            }

            const address = this.service.getEmployeeAddress(req.params.employeeId, req.params.addressId);
            return res.json(address);
        } catch (error) {
            return res.status((error as CustomError).status).json({
                message: (error as CustomError).message
            });
        }
    };

    public getAllEmployeeAddresses: RequestHandler<{ employeeId: string; }> = (req, res) => {
        try {
            const employee = this.service.getEmployee(req.params.employeeId);
            const decision = req[AMS_AUTHORIZATIONS].checkPrivilege("read", "Employees", { countryCode: employee.countryCode });

            if (!decision.isGranted()) {
                return res.sendStatus(403);
            }

            const addresses = this.service.getAllEmployeeAddresses(req.params.employeeId);
            return res.json(addresses);
        } catch (error) {
            return res.status((error as CustomError).status).json({
                message: (error as CustomError).message
            });
        }
    };
}