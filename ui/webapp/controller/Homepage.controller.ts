import BaseController from "sci/ams/express/controller/BaseController";
import HttpClient from "sci/ams/express/lib/core/HttpClient";
import HttpError from "sci/ams/express/lib/core/HttpError";
import { Employee } from "sci/ams/express/types/Homepage.types";

/**
 * @namespace sci.ams.express.controller
 */
export default class Homepage extends BaseController {
    // ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    // Properties
    // ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

    // ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    // Lifecycle Methods
    // ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

    public override onInit() {
        this.loadEmployees();
    }

    // ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    // Event Handlers
    // ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

    // ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    // Internal Methods
    // ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

    private async loadEmployees() {
        try {
            const http = new HttpClient();
            const employees = await http.get<Employee[]>("/employee");

            this.json.createAndSetModel(this.getCurrentView(), "employees", employees, "TwoWay");
        } catch (error) {
            if (error instanceof HttpError && error.status === 403) {
                this.showError("You are not authorized to display employees.");
                return;
            }

            this.showError((error as Error).message);
        }
    }
}