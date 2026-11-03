import express, { type Application } from "express";
import EmployeeRouter from "./router/EmployeeRouter.js";
import DepartmentRouter from "./router/DepartmentRouter.js";
import Database from "./db/Database.js";

export default class App {
    private readonly app: Application;
    private readonly port = Number(process.env["PORT"] || "3000");
    private readonly employeeRouter: EmployeeRouter;
    private readonly departmentRouter: DepartmentRouter;

    constructor() {
        const db = Database.create();
        this.app = express();
        this.employeeRouter = new EmployeeRouter(db);
        this.departmentRouter = new DepartmentRouter(db);

        this.configureMiddlewares();
        this.configureRouters();
    }

    public listen() {
        this.app.listen(this.port, () => {
            console.log(`Server running at port: ${this.port}`);
        });
    }

    private configureMiddlewares() {
        this.app.use(express.json());
    }

    private configureRouters() {
        this.app.use("/employee", this.employeeRouter.router);
        this.app.use("/department", this.departmentRouter.router);
    }
}