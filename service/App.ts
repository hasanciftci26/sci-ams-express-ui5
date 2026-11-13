import express, { type Application, type Request, type Response } from "express";
import EmployeeRouter from "./router/EmployeeRouter.js";
import DepartmentRouter from "./router/DepartmentRouter.js";
import Database from "./db/Database.js";
import Authorization from "./auth/Authorization.js";
import Authentication from "./auth/Authentication.js";

export default class App {
    private readonly app: Application;
    private readonly port = Number(process.env["PORT"] || "3000");
    private readonly amsStartupTimeout = Number(process.env["AMS_STARTUP_TIMEOUT"] || "30");
    private readonly employeeRouter: EmployeeRouter;
    private readonly departmentRouter: DepartmentRouter;
    private isReady = false;

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

        this.checkAMSReadiness();
    }

    private configureMiddlewares() {
        this.app.use(express.json());
        this.app.get("/health", this.healthCheck.bind(this));
        this.app.use(/^\/(?!health).*/i, Authentication.getMiddleware(), Authorization.getAuthorizeMiddleware());
    }

    private configureRouters() {
        this.app.use(this.employeeRouter.path, this.employeeRouter.router);
        this.app.use(this.departmentRouter.path, this.departmentRouter.router);
    }

    /**
     * Reports whether the application is ready to serve requests.
     * The application is considered ready once AMS has been initialized.
     */
    private healthCheck(_req: Request, res: Response) {
        if (!this.isReady) {
            return res.status(503).json({
                status: "DOWN",
                message: "Service is not ready"
            });
        }

        return res.json({
            status: "UP"
        });
    }

    /**
     * Waits for AMS to become ready before marking the application as ready.
     * Terminates the process if AMS cannot initialize within the configured timeout.
     */
    private async checkAMSReadiness() {
        try {
            await Authorization.getAMS().whenReady(this.amsStartupTimeout);

            this.isReady = true;
            console.log("AMS has become ready.");
        } catch (error) {
            console.error("AMS did not become ready in time:", error);
            process.exit(1);
        }
    }
}