import type { Database } from "better-sqlite3";
import RouterBase from "./RouterBase.js";
import type CustomError from "../core/CustomError.js";
import DepartmentService from "../core/DepartmentService.js";
import DepartmentSchema from "../schema/DepartmentSchema.js";

export default class DepartmentRouter extends RouterBase {
    private readonly service: DepartmentService;

    constructor(db: Database) {
        super(db);

        this.service = new DepartmentService(this.db);
        this.configureRoutes();
    }

    private configureRoutes() {
        this.configureReadRoute();
        this.configureCreateRoute();
        this.configureUpdateRoute();
        this.configureDeleteRoute();
    }

    private configureReadRoute() {
        this._router.get("{/:departmentId}", (req, res) => {
            if (req.params.departmentId) {
                try {
                    const department = this.service.getDepartment(req.params.departmentId);
                    return res.json(department);
                } catch (error) {
                    return res.status((error as CustomError).status).json({
                        message: (error as CustomError).message
                    });
                }
            } else {
                return res.json(this.service.getAllDepartments());
            }
        });
    }

    private configureCreateRoute() {
        this._router.post("/", (req, res) => {
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
        });
    }

    private configureUpdateRoute() {

    }

    private configureDeleteRoute() {

    }
}