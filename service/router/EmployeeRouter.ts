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

    /**
     * Configures the read routes and applies an AMS privilege precheck before
     * executing the corresponding request handlers.
     *
     * `precheckPrivilege` rejects users who have no applicable read authorization
     * for the requested resource, while allowing both unconditionally and
     * conditionally authorized users to continue.
     *
     * Any remaining conditional authorization is resolved by the respective
     * handler using the resource data:
     *
     * - Collection routes translate conditional authorization into a database
     *   filter so that only authorized records are retrieved.
     * - Single-entity routes evaluate the authorization condition against the
     *   requested record.
     */
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