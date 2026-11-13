import type { Database } from "better-sqlite3";
import type { RequestHandler } from "express";
import RouterBase from "./RouterBase.js";
import DepartmentHandler from "../handler/DepartmentHandler.js";
import Authorization from "../auth/Authorization.js";

export default class DepartmentRouter extends RouterBase {
    private readonly handler: DepartmentHandler;

    constructor(db: Database) {
        super(db, "/department");

        this.handler = new DepartmentHandler(db);
        this.configureRoutes();
    }

    private configureRoutes() {
        this.configureReadRoute();
        this.configureCreateRoute();
        this.configureUpdateRoute();
        this.configureDeleteRoute();
    }

    /**
     * Configures department read routes and applies the unconditional AMS read
     * privilege check before executing their handlers.
     *
     * @see {@link https://github.com/hasanciftci26/sci-ams-express-ui5/blob/main/service/docs/authorization/DepartmentAuthorization.md#read-authorization | Read Authorization}
     */
    private configureReadRoute() {
        this._router.get("/", Authorization.getMiddleware().checkPrivilege("read", "Departments") as RequestHandler, this.handler.getAllDepartments);
        this._router.get("/:departmentId", Authorization.getMiddleware().checkPrivilege("read", "Departments") as RequestHandler, this.handler.getDepartment);
    }

    /**
     * Configures department create routes and applies the unconditional AMS
     * create privilege check before executing their handlers.
     *
     * @see {@link https://github.com/hasanciftci26/sci-ams-express-ui5/blob/main/service/docs/authorization/DepartmentAuthorization.md#create-authorization | Create Authorization}
     */
    private configureCreateRoute() {
        this._router.post("/", Authorization.getMiddleware().checkPrivilege("create", "Departments") as RequestHandler, this.handler.createDepartment);
    }

    /**
     * Configures department update routes and applies the unconditional AMS
     * update privilege check before executing their handlers.
     *
     * @see {@link https://github.com/hasanciftci26/sci-ams-express-ui5/blob/main/service/docs/authorization/DepartmentAuthorization.md#update-authorization | Update Authorization}
     */
    private configureUpdateRoute() {
        this._router.patch("/:departmentId", Authorization.getMiddleware().checkPrivilege("update", "Departments") as RequestHandler, this.handler.updateDepartment);
    }

    /**
     * Configures department delete routes and applies the unconditional AMS
     * delete privilege check before executing their handlers.
     *
     * @see {@link https://github.com/hasanciftci26/sci-ams-express-ui5/blob/main/service/docs/authorization/DepartmentAuthorization.md#delete-authorization | Delete Authorization}
     */
    private configureDeleteRoute() {
        this._router.delete("/:departmentId", Authorization.getMiddleware().checkPrivilege("delete", "Departments") as RequestHandler, this.handler.deleteDepartment);
    }
}