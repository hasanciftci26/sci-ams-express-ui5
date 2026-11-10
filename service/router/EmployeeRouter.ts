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

    /**
     * Configures the create routes and applies AMS privilege prechecks before
     * executing the corresponding request handlers.
     *
     * Create operations require both read and create authorization for the
     * respective resource. This ensures that users can only create resources
     * that they are also authorized to read.
     *
     * `precheckPrivilege` rejects users who have no potentially applicable
     * authorization before the request handler is executed, while allowing both
     * unconditionally and conditionally authorized users to continue.
     *
     * The prechecks do not resolve conditions that depend on the data being
     * created. The respective handler performs the final authorization checks
     * after the request data has been validated and the authorization-relevant
     * resource attributes are available.
     *
     * The authorization therefore happens in two stages:
     *
     * 1. Route-level prechecks verify that the user has potentially applicable
     *    read and create privileges for the resource.
     * 2. The handler evaluates both privileges against the concrete resource data
     *    and proceeds with the creation only if both decisions are granted.
     *
     * This prevents unnecessary request processing for completely unauthorized
     * users while ensuring that conditional policies are evaluated against the
     * actual resource before any database mutation occurs.
     */
    private configureCreateRoute() {
        this._router.post(
            "/",
            Authorization.getMiddleware().precheckPrivilege("read", "Employees") as RequestHandler,
            Authorization.getMiddleware().precheckPrivilege("create", "Employees") as RequestHandler,
            this.handler.createEmployee
        );
    }

    private configureUpdateRoute() {
        this._router.patch("/:employeeId", this.handler.updateEmployee);
    }

    private configureDeleteRoute() {

    }
}