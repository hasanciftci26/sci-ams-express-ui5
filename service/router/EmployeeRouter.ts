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
     * Configures employee read routes and applies the required AMS privilege
     * prechecks before executing their handlers.
     *
     * @see {@link https://github.com/hasanciftci26/sci-ams-express-ui5/blob/main/service/docs/authorization/EmployeeAuthorization.md#read-authorization | Read Authorization}
     */
    private configureReadRoute() {
        this._router.get("/", Authorization.getMiddleware().precheckPrivilege("read", "Employees") as RequestHandler, this.handler.getAllEmployees);
        this._router.get("/:employeeId", Authorization.getMiddleware().precheckPrivilege("read", "Employees") as RequestHandler, this.handler.getEmployee);

        this._router.get(
            "/:employeeId/address",
            Authorization.getMiddleware().precheckPrivilege("read", "Employees") as RequestHandler,
            Authorization.getMiddleware().checkPrivilege("read", "EmployeeAddresses") as RequestHandler,
            this.handler.getAllEmployeeAddresses
        );


        this._router.get(
            "/:employeeId/address/:addressId",
            Authorization.getMiddleware().precheckPrivilege("read", "Employees") as RequestHandler,
            Authorization.getMiddleware().checkPrivilege("read", "EmployeeAddresses") as RequestHandler,
            this.handler.getEmployeeAddress
        );
    }

    /**
     * Configures employee create routes and applies the required AMS privilege
     * prechecks before executing their handlers.
     *
     * @see {@link https://github.com/hasanciftci26/sci-ams-express-ui5/blob/main/service/docs/authorization/EmployeeAuthorization.md#create-authorization | Create Authorization}
     */
    private configureCreateRoute() {
        this._router.post(
            "/",
            Authorization.getMiddleware().precheckPrivilege("read", "Employees") as RequestHandler,
            Authorization.getMiddleware().precheckPrivilege("create", "Employees") as RequestHandler,
            this.handler.createEmployee
        );
    }

    /**
     * Configures employee update routes and applies the required AMS privilege
     * prechecks before executing their handlers.
     *
     * @see {@link https://github.com/hasanciftci26/sci-ams-express-ui5/blob/main/service/docs/authorization/EmployeeAuthorization.md#update-authorization | Update Authorization}
     */
    private configureUpdateRoute() {
        this._router.patch(
            "/:employeeId",
            Authorization.getMiddleware().precheckPrivilege("read", "Employees") as RequestHandler,
            Authorization.getMiddleware().precheckPrivilege("update", "Employees") as RequestHandler,
            this.handler.updateEmployee
        );
    }

    /**
     * Configures employee delete routes and applies the required AMS privilege
     * prechecks before executing their handlers.
     *
     * @see {@link https://github.com/hasanciftci26/sci-ams-express-ui5/blob/main/service/docs/authorization/EmployeeAuthorization.md#delete-authorization | Delete Authorization}
     */
    private configureDeleteRoute() {
        this._router.delete(
            "/:employeeId",
            Authorization.getMiddleware().precheckPrivilege("read", "Employees") as RequestHandler,
            Authorization.getMiddleware().precheckPrivilege("delete", "Employees") as RequestHandler,
            this.handler.deleteEmployee
        );
    }
}