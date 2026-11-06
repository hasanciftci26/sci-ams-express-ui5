import type { Database } from "better-sqlite3";
import RouterBase from "./RouterBase.js";
import EmployeeHandler from "../handler/EmployeeHandler.js";
import Authorization from "../auth/Authorization.js";
import type { RequestHandler } from "express";

export default class EmployeeRouter extends RouterBase {
    private readonly handler: EmployeeHandler;

    constructor(db: Database) {
        super(db);

        this.handler = new EmployeeHandler(db);
        this.configureRoutes();
    }

    private configureRoutes() {
        this.configureReadRoute();
        this.configureCreateRoute();
        this.configureUpdateRoute();
        this.configureDeleteRoute();
    }

    private configureReadRoute() {
        this._router.get("/", Authorization.getMiddleware().precheckPrivilege("read", "Employees") as RequestHandler, this.handler.getAllEmployees);
        this._router.get("/:employeeId", Authorization.getMiddleware().precheckPrivilege("read", "Employees") as RequestHandler, this.handler.getEmployee);
    }

    private configureCreateRoute() {
        this._router.post("/", this.handler.createEmployee);
    }

    private configureUpdateRoute() {

    }

    private configureDeleteRoute() {

    }
}