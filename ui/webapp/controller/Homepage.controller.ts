import MessageStrip from "sap/m/MessageStrip";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import SimpleForm from "sap/ui/layout/form/SimpleForm";
import Context from "sap/ui/model/Context";
import Table from "sap/ui/table/Table";
import BaseController from "sci/ams/express/controller/BaseController";
import HttpClient from "sci/ams/express/lib/core/HttpClient";
import HttpError from "sci/ams/express/lib/core/HttpError";
import SimpleFormValidator from "sci/ams/express/lib/core/SimpleFormValidator";
import { Nullable } from "sci/ams/express/types/Global.types";
import { Department, Employee } from "sci/ams/express/types/Homepage.types";

/**
 * @namespace sci.ams.express.controller
 */
export default class Homepage extends BaseController {
    // ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    // Properties
    // ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

    private initialEmployeeData: Employee;

    // ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    // Lifecycle Methods
    // ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

    public override onInit() {
        this.loadEmployees();
        this.loadDepartments();
    }

    // ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    // Event Handlers
    // ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

    public onNewEmployee() {
        this.createEmployeeModel({
            employeeID: null,
            firstName: null,
            lastName: null,
            countryCode: null,
            dateOfBirth: null,
            departmentID: null
        });

        this.fragment.openDialog("homepage.employee.NewEmployee");
    }

    public async onCreateNewEmployee() {
        const hasError = await SimpleFormValidator.hasError(this.getById<SimpleForm>("sfNewEmployee"));

        if (hasError) {
            this.showError("Please correct the highlighted fields.");
            return;
        }

        BusyIndicator.show(0);

        const data = this.json.getModelData<Employee>("employee");

        try {
            const http = new HttpClient();

            await http.post<Employee, Employee>("/employee", data);

            this.fragment.closeDialog();
            this.loadEmployees();
        } catch (error) {
            if (error instanceof HttpError && error.status === 403) {
                this.showError("You are not authorized to create an employee.");
                return;
            }

            this.showError((error as Error).message);
        } finally {
            BusyIndicator.hide();
        }
    }

    public onNewDepartment() {
        this.createDepartmentModel({
            departmentID: null,
            name: null
        });

        this.fragment.openDialog("homepage.department.NewDepartment");
    }

    public async onCreateNewDepartment() {
        const hasError = await SimpleFormValidator.hasError(this.getById<SimpleForm>("sfNewDepartment"));

        if (hasError) {
            this.showError("Please correct the highlighted fields.");
            return;
        }

        BusyIndicator.show(0);

        const data = this.json.getModelData<Department>("department");

        try {
            const http = new HttpClient();

            await http.post<Department, Department>("/department", data);

            this.fragment.closeDialog();
            this.loadDepartments();
        } catch (error) {
            if (error instanceof HttpError && error.status === 403) {
                this.showError("You are not authorized to create a department.");
                return;
            }

            this.showError((error as Error).message);
        } finally {
            BusyIndicator.hide();
        }
    }

    public onEditEmployee() {
        const employee = this.getSelectedEmployeeData();

        if (!employee) {
            this.showError("Please select an employee record on the table.");
            return;
        }

        this.initialEmployeeData = { ...employee };
        this.createEmployeeModel({ ...employee });
        this.fragment.openDialog("homepage.employee.EditEmployee");
    }

    public async onCompleteEditEmployee() {
        const data = this.json.getModelData<Employee>("employee");
        const { employeeID, ...current } = data;
        const { employeeID: _, ...initial } = this.initialEmployeeData;

        const payload = this.getChanges(initial, current);

        if (!Object.keys(payload).length) {
            this.showError("No changes were made.");
            return;
        }

        const hasError = await SimpleFormValidator.hasError(this.getById<SimpleForm>("sfEditEmployee"));

        if (hasError) {
            this.showError("Please correct the highlighted fields.");
            return;
        }

        BusyIndicator.show(0);

        try {
            const http = new HttpClient();

            await http.patch<Employee, Partial<Omit<Employee, "employeeID">>>(`/employee/${employeeID}`, payload);

            this.fragment.closeDialog();
            this.loadEmployees();
        } catch (error) {
            if (error instanceof HttpError && error.status === 403) {
                this.showError("You are not authorized to update an employee.");
                return;
            }

            this.showError((error as Error).message);
        } finally {
            BusyIndicator.hide();
        }
    }

    public onCloseDialog() {
        this.fragment.closeDialog();
    }

    public onDialogESC(event: { resolve: Function; reject: Function; }) {
        event.reject();
        this.fragment.closeDialog();
    }

    // ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    // Internal Methods
    // ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

    private async loadEmployees() {
        const table = this.getById<Table>("tblEmployees");
        const messageStrip = this.getById<MessageStrip>("msgEmployeeNoAuth");

        table.setBusy(true);

        try {
            const http = new HttpClient();
            const employees = await http.get<Employee[]>("/employee");

            this.json.createAndSetModel(this.getCurrentView(), "employees", employees);
        } catch (error) {
            messageStrip.setVisible(true);

            if (error instanceof HttpError && error.status === 403) {
                messageStrip.setText("You are not authorized to display employees.");
                return;
            }

            messageStrip.setText((error as Error).message);
        } finally {
            table.setBusy(false);
        }
    }

    private async loadDepartments() {
        const table = this.getById<Table>("tblDepartments");
        const messageStrip = this.getById<MessageStrip>("msgDepartmentNoAuth");

        table.setBusy(true);

        try {
            const http = new HttpClient();
            const departments = await http.get<Department[]>("/department");

            messageStrip.setVisible(false);
            this.json.createAndSetModel(this.getCurrentView(), "departments", departments);
        } catch (error) {
            messageStrip.setVisible(true);

            if (error instanceof HttpError && error.status === 403) {
                messageStrip.setText("You are not authorized to display departments.");
                return;
            }

            messageStrip.setText((error as Error).message);
        } finally {
            table.setBusy(false);
        }
    }

    private getSelectedEmployeeData() {
        const table = this.getById<Table>("tblEmployees");
        const selectedIndices = table.getSelectedIndices();

        if (!selectedIndices.length) {
            return;
        }

        return (table.getContextByIndex(selectedIndices[0] as number) as Context).getObject() as Employee;
    }

    private createEmployeeModel(data: Nullable<Employee>) {
        this.json.createAndSetModel(this.getCurrentView(), "employee", data);
    }

    private createDepartmentModel(data: Nullable<Department>) {
        this.json.createAndSetModel(this.getCurrentView(), "department", data);
    }

    private getChanges<T extends object>(initial: T, current: T): Partial<T> {
        return Object.keys(current).reduce<Partial<T>>((changes, key) => {
            const property = key as keyof T;

            if (initial[property] !== current[property]) {
                changes[property] = current[property];
            }

            return changes;
        }, {});
    }
}