import type { Database } from "better-sqlite3";
import RouterBase from "./RouterBase.js";
import EmployeeService from "../core/EmployeeService.js";
import type CustomError from "../core/CustomError.js";
import EmployeeSchema from "../schema/EmployeeSchema.js";

export default class EmployeeRouter extends RouterBase {
    private readonly service: EmployeeService;

    constructor(db: Database) {
        super(db);

        this.service = new EmployeeService(this.db);
        this.configureRoutes();
    }

    private configureRoutes() {
        this.configureReadRoute();
        this.configureCreateRoute();
        this.configureUpdateRoute();
        this.configureDeleteRoute();
    }

    private configureReadRoute() {
        this._router.get("{/:employeeId}", (req, res) => {
            if (req.params.employeeId) {
                try {
                    const employee = this.service.getEmployee(req.params.employeeId);
                    return res.json(employee);
                } catch (error) {
                    return res.status((error as CustomError).status).json({
                        message: (error as CustomError).message
                    });
                }
            } else {
                return res.json(this.service.getAllEmployees());
            }
        });
    }

    private configureCreateRoute() {
        this._router.post("/", (req, res) => {
            const result = EmployeeSchema.validate(req.body);

            if (!result.success) {
                return res.status(400).json({
                    message: "Invalid employee data",
                    errors: result.error.issues
                });
            }

            try {
                const employee = this.service.createEmployee(result.data);
                return res.status(201).json(employee);
            } catch (error) {
                return res.status((error as CustomError).status).json({
                    message: (error as CustomError).message
                });
            }
        });
    }

    private configureUpdateRoute() {

    }

    private configureDeleteRoute() {

    }
}