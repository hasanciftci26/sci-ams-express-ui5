import MessageStrip from "sap/m/MessageStrip";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import SimpleForm from "sap/ui/layout/form/SimpleForm";
import Context from "sap/ui/model/Context";
import Table from "sap/ui/table/Table";
import BaseController from "sci/ams/express/controller/BaseController";
import FragmentManager from "sci/ams/express/lib/core/FragmentManager";
import HttpClient from "sci/ams/express/lib/core/HttpClient";
import HttpError from "sci/ams/express/lib/core/HttpError";
import SimpleFormValidator from "sci/ams/express/lib/core/SimpleFormValidator";
import { Nullable } from "sci/ams/express/types/Global.types";
import {
    Department,
    Employee,
    EmployeeAddress,
    EmployeeAddressCreate,
    EmployeeAddressFinalData,
    EmployeeAddressInitialData
} from "sci/ams/express/types/Homepage.types";

/**
 * @namespace sci.ams.express.controller
 */
export default class Homepage extends BaseController {
    // ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    // Properties
    // ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

    private initialEmployeeData: Employee;
    private initialDepartmentData: Department;
    private employeeAddressFragment: FragmentManager;
    private selectedEmployeeID: string;
    private selectedEmployeeName: string;
    private initialEmployeeAddressData: EmployeeAddressFinalData;

    // ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    // Lifecycle Methods
    // ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

    public override onInit() {
        this.employeeAddressFragment = new FragmentManager(this);
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

    public onEditDepartment() {
        const department = this.getSelectedDepartmentData();

        if (!department) {
            this.showError("Please select a department record on the table.");
            return;
        }

        this.initialDepartmentData = { ...department };
        this.createDepartmentModel({ ...department });
        this.fragment.openDialog("homepage.department.EditDepartment");
    }

    public async onCompleteEditDepartment() {
        const data = this.json.getModelData<Department>("department");
        const { departmentID, ...current } = data;
        const { departmentID: _, ...initial } = this.initialDepartmentData;

        const payload = this.getChanges(initial, current);

        if (!Object.keys(payload).length) {
            this.showError("No changes were made.");
            return;
        }

        const hasError = await SimpleFormValidator.hasError(this.getById<SimpleForm>("sfEditDepartment"));

        if (hasError) {
            this.showError("Please correct the highlighted fields.");
            return;
        }

        BusyIndicator.show(0);

        try {
            const http = new HttpClient();

            await http.patch<Department, Partial<Omit<Department, "departmentID">>>(`/department/${departmentID}`, payload);

            this.fragment.closeDialog();
            this.loadDepartments();
        } catch (error) {
            if (error instanceof HttpError && error.status === 403) {
                this.showError("You are not authorized to update a department.");
                return;
            }

            this.showError((error as Error).message);
        } finally {
            BusyIndicator.hide();
        }
    }

    public onDeleteEmployee() {
        const employee = this.getSelectedEmployeeData();

        if (!employee) {
            this.showError("Please select an employee record on the table.");
            return;
        }

        this.showConfirm("The selected employee will be permanently deleted. Would you like to continue?", async () => {
            BusyIndicator.show(0);

            try {
                const http = new HttpClient();

                await http.delete(`/employee/${employee.employeeID}`);

                this.loadEmployees();
            } catch (error) {
                if (error instanceof HttpError && error.status === 403) {
                    this.showError("You are not authorized to delete an employee.");
                    return;
                }

                this.showError((error as Error).message);
            } finally {
                BusyIndicator.hide();
            }
        });
    }

    public onDeleteDepartment() {
        const department = this.getSelectedDepartmentData();

        if (!department) {
            this.showError("Please select a department record on the table.");
            return;
        }

        this.showConfirm("The selected department will be permanently deleted. Would you like to continue?", async () => {
            BusyIndicator.show(0);

            try {
                const http = new HttpClient();

                await http.delete(`/department/${department.departmentID}`);

                this.loadDepartments();
            } catch (error) {
                if (error instanceof HttpError && error.status === 403) {
                    this.showError("You are not authorized to delete a department.");
                    return;
                }

                this.showError((error as Error).message);
            } finally {
                BusyIndicator.hide();
            }
        });
    }

    public onDisplayEmployeeAddresses() {
        const employee = this.getSelectedEmployeeData();

        if (!employee) {
            this.showError("Please select an employee record on the table.");
            return;
        }

        const dialogTitle = `${employee.firstName} ${employee.lastName}'s Addresses`;
        this.selectedEmployeeID = employee.employeeID;
        this.selectedEmployeeName = `${employee.firstName} ${employee.lastName}`;

        this.fragment.openDialog("homepage.employee.DisplayEmployeeAddresses").then((dialog) => {
            dialog.setTitle(dialogTitle);
            this.loadEmployeeAddresses();
        });
    }

    public onNewEmployeeAddress() {
        this.createEmployeeAddressModel({
            employeeID: this.selectedEmployeeID,
            employeeName: this.selectedEmployeeName,
            addressID: null,
            countryCode: null,
            city: null,
            postalCode: null,
            street: null,
            houseNumber: null,
            additionalAddressLine: null
        });

        this.employeeAddressFragment.openDialog("homepage.employee.NewEmployeeAddress");
    }

    public async onCreateNewEmployeeAddress() {
        const hasError = await SimpleFormValidator.hasError(this.getById<SimpleForm>("sfNewEmployeeAddress"));

        if (hasError) {
            this.showError("Please correct the highlighted fields.");
            return;
        }

        BusyIndicator.show(0);

        const data = this.json.getModelData<EmployeeAddressFinalData>("employeeAddress");

        try {
            const http = new HttpClient();
            const { employeeID, employeeName, ...payload } = data;

            await http.post<EmployeeAddress, EmployeeAddressCreate>(`/employee/${this.selectedEmployeeID}/address`, payload);

            this.employeeAddressFragment.closeDialog();
            this.loadEmployeeAddresses();
        } catch (error) {
            if (error instanceof HttpError && error.status === 403) {
                this.showError("You are not authorized to create an employee address.");
                return;
            }

            this.showError((error as Error).message);
        } finally {
            BusyIndicator.hide();
        }
    }

    public onEditEmployeeAddress() {
        const employeeAddress = this.getSelectedEmployeeAddressData();

        if (!employeeAddress) {
            this.showError("Please select an employee address record on the table.");
            return;
        }

        const initialAddressData = {
            employeeName: this.selectedEmployeeName,
            ...employeeAddress
        };

        this.initialEmployeeAddressData = initialAddressData;
        this.createEmployeeAddressModel({ ...initialAddressData });
        this.employeeAddressFragment.openDialog("homepage.employee.EditEmployeeAddress");
    }

    public async onCompleteEditEmployeeAddress() {
        const data = this.json.getModelData<EmployeeAddressFinalData>("employeeAddress");
        const { employeeID, employeeName, addressID, ...current } = data;
        const { employeeID: _employeeID, employeeName: _employeeName, addressID: _addressID, ...initial } = this.initialEmployeeAddressData;

        const payload = this.getChanges(initial, current);

        if (!Object.keys(payload).length) {
            this.showError("No changes were made.");
            return;
        }

        const hasError = await SimpleFormValidator.hasError(this.getById<SimpleForm>("sfEditEmployeeAddress"));

        if (hasError) {
            this.showError("Please correct the highlighted fields.");
            return;
        }

        BusyIndicator.show(0);

        try {
            const http = new HttpClient();

            await http.patch<EmployeeAddress, Partial<Omit<EmployeeAddress, "employeeID" | "addressID">>>(
                `/employee/${employeeID}/address/${addressID}`, payload
            );

            this.employeeAddressFragment.closeDialog();
            this.loadEmployeeAddresses();
        } catch (error) {
            if (error instanceof HttpError && error.status === 403) {
                this.showError("You are not authorized to update an employee address.");
                return;
            }

            this.showError((error as Error).message);
        } finally {
            BusyIndicator.hide();
        }
    }

    public onDeleteEmployeeAddress() {
        const employeeAddress = this.getSelectedEmployeeAddressData();

        if (!employeeAddress) {
            this.showError("Please select an employee address record on the table.");
            return;
        }

        this.showConfirm("The selected employee address will be permanently deleted. Would you like to continue?", async () => {
            BusyIndicator.show(0);

            try {
                const http = new HttpClient();

                await http.delete(`/employee/${this.selectedEmployeeID}/address/${employeeAddress.addressID}`);

                this.loadEmployeeAddresses();
            } catch (error) {
                if (error instanceof HttpError && error.status === 403) {
                    this.showError("You are not authorized to delete an employee address.");
                    return;
                }

                this.showError((error as Error).message);
            } finally {
                BusyIndicator.hide();
            }
        });
    }

    public onCloseDialog() {
        this.fragment.closeDialog();
    }

    public onDialogESC(event: { resolve: Function; reject: Function; }) {
        event.reject();
        this.fragment.closeDialog();
    }

    public onCloseAddressDialog() {
        this.employeeAddressFragment.closeDialog();
    }

    public onAddressDialogESC(event: { resolve: Function; reject: Function; }) {
        event.reject();
        this.employeeAddressFragment.closeDialog();
    }

    // ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    // Internal Methods
    // ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

    private async loadEmployees() {
        const table = this.getById<Table>("tblEmployees");
        const messageStrip = this.getById<MessageStrip>("msgEmployeeError");

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
        const messageStrip = this.getById<MessageStrip>("msgDepartmentError");

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

    private async loadEmployeeAddresses() {
        const table = this.getById<Table>("tblEmployeeAddresses");
        const messageStrip = this.getById<MessageStrip>("msgEmployeeAddressError");

        this.json.createAndSetModel(this.getCurrentView(), "employeeAddresses", []);
        table.setBusy(true);

        try {
            const http = new HttpClient();
            const employeeAddresses = await http.get<EmployeeAddress[]>(`/employee/${this.selectedEmployeeID}/address`);

            this.json.setModelData("employeeAddresses", employeeAddresses);
        } catch (error) {
            messageStrip.setVisible(true);

            if (error instanceof HttpError && error.status === 403) {
                messageStrip.setText("You are not authorized to display employee addresses.");
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

    private getSelectedDepartmentData() {
        const table = this.getById<Table>("tblDepartments");
        const selectedIndices = table.getSelectedIndices();

        if (!selectedIndices.length) {
            return;
        }

        return (table.getContextByIndex(selectedIndices[0] as number) as Context).getObject() as Department;
    }

    private getSelectedEmployeeAddressData() {
        const table = this.getById<Table>("tblEmployeeAddresses");
        const selectedIndices = table.getSelectedIndices();

        if (!selectedIndices.length) {
            return;
        }

        return (table.getContextByIndex(selectedIndices[0] as number) as Context).getObject() as EmployeeAddress;
    }

    private createEmployeeModel(data: Nullable<Employee>) {
        this.json.createAndSetModel(this.getCurrentView(), "employee", data);
    }

    private createDepartmentModel(data: Nullable<Department>) {
        this.json.createAndSetModel(this.getCurrentView(), "department", data);
    }

    private createEmployeeAddressModel(data: EmployeeAddressInitialData) {
        this.json.createAndSetModel(this.getCurrentView(), "employeeAddress", data);
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