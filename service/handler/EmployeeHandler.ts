import type { Database } from "better-sqlite3";
import EmployeeService from "../core/EmployeeService.js";
import type { RequestHandler } from "express";
import EmployeeSchema from "../schema/EmployeeSchema.js";
import type CustomError from "../core/CustomError.js";
import { AMS_AUTHORIZATIONS } from "@sap/ams";
import AuthorizationConditionTranslator from "../auth/AuthorizationConditionTranslator.js";

export default class EmployeeHandler {
    private readonly service: EmployeeService;

    constructor(db: Database) {
        this.service = new EmployeeService(db);
    }

    public getAllEmployees: RequestHandler = (req, res) => {
        const decision = req[AMS_AUTHORIZATIONS].checkPrivilege("read", "Employees");

        if (decision.isGranted()) {
            return res.json(this.service.getAllEmployees());
        }

        const refToFieldMap = new Map<string, string>([
            ["$app.countryCode", "countryCode"]
        ]);

        const translator = new AuthorizationConditionTranslator(decision, refToFieldMap);
        const expression = translator.toSql();

        return res.json(this.service.getEmployeesByExpression(expression));
    };

    /**
     * Returns a single employee if the authenticated user is authorized to read
     * the requested employee record.
     *
     * ## Authorization flow
     *
     * Authorization for reading employees happens in two stages:
     *
     * 1. A privilege precheck in `EmployeeRouter`
     * 2. An entity-specific privilege check in this handler
     *
     * The route is configured with:
     *
     * `precheckPrivilege("read", "Employees")`
     *
     * before this handler is registered. The precheck evaluates whether the user
     * has any potentially applicable authorization for reading the `Employees`
     * resource.
     *
     * An AMS privilege can effectively result in three cases:
     *
     * ### 1. Unconditionally denied
     *
     * The user has no policy that allows reading `Employees`.
     *
     * In this case, `precheckPrivilege` rejects the request with HTTP 403 before
     * this handler is executed. Therefore, this handler does not need to perform
     * another check for the completely unauthorized case before accessing its
     * business logic.
     *
     * ### 2. Unconditionally granted
     *
     * The user has a policy that grants unrestricted read access, for example:
     *
     * `GRANT read ON Employees;`
     *
     * In this case, the precheck allows the request to continue. The
     * entity-specific `checkPrivilege` below will also resolve to a granted
     * decision regardless of the employee's `countryCode`.
     *
     * ### 3. Conditionally granted
     *
     * The user has a policy that allows reading employees only when a condition
     * on the employee data is satisfied, for example:
     *
     * `GRANT read ON Employees WHERE countryCode = 'DE';`
     *
     * or:
     *
     * `GRANT read ON Employees WHERE countryCode = $user.userRegion;`
     *
     * The precheck intentionally does not reject such a request. It only
     * establishes that the user has a potentially applicable read privilege.
     * Whether the user may read this particular employee can only be determined
     * once the authorization-relevant attributes of that employee are known.
     *
     * ## Entity-specific authorization
     *
     * Since this endpoint returns exactly one employee, it is reasonable to first
     * retrieve that employee from the database and then pass the relevant resource
     * attributes to AMS:
     *
     * `{ countryCode: employee.countryCode }`
     *
     * AMS evaluates these values against the user's applicable policies and
     * resolves the previously conditional decision into a concrete authorization
     * decision.
     *
     * For example, given:
     *
     * `GRANT read ON Employees WHERE countryCode = 'DE';`
     *
     * an employee with `countryCode = "DE"` results in a granted decision, while
     * an employee with `countryCode = "TR"` results in a denied decision.
     *
     * For a regional policy such as:
     *
     * `GRANT read ON Employees WHERE countryCode = $user.userRegion;`
     *
     * the `$user.userRegion` value is provided through the user's AMS
     * authorization context. This handler only needs to provide the `$app`
     * attribute belonging to the requested employee. AMS is responsible for
     * evaluating the policy; the application must not duplicate the policy logic
     * by manually comparing the employee country with the user's region.
     *
     * If the final decision is granted, the employee is returned. Otherwise the
     * request is rejected with HTTP 403.
     *
     * ## Why this approach is only used for a single employee
     *
     * Fetching a record before evaluating its conditional authorization is
     * acceptable here because this endpoint operates on one explicitly requested
     * employee.
     *
     * The same approach should NOT be used for collection endpoints such as
     * `GET /employee`. Loading every employee from the database and subsequently
     * checking or filtering each record in application memory would be inefficient
     * and would unnecessarily load unauthorized records into the application.
     *
     * For collection requests, the conditional AMS decision should instead be
     * translated into a database WHERE condition before executing the query.
     *
     * For example, an AMS condition equivalent to:
     *
     * `$app.countryCode = "DE"`
     *
     * should be translated into a parameterized SQL filter such as:
     *
     * `WHERE countryCode = ?`
     *
     * with `"DE"` supplied as a bound parameter. This allows the database to
     * retrieve only records the user is authorized to access.
     *
     * In summary:
     *
     * `precheckPrivilege` -> rejects users with no applicable read privilege
     *
     * `checkPrivilege` with employee attributes -> authorizes one concrete employee
     *
     * AMS condition -> SQL WHERE filter -> authorizes/filter collections efficiently
     */
    public getEmployee: RequestHandler<{ employeeId: string; }> = (req, res) => {
        try {
            const employee = this.service.getEmployee(req.params.employeeId);
            const decision = req[AMS_AUTHORIZATIONS].checkPrivilege("read", "Employees", { countryCode: employee.countryCode });

            if (decision.isGranted()) {
                return res.json(employee);
            }

            return res.sendStatus(403);
        } catch (error) {
            return res.status((error as CustomError).status).json({
                message: (error as CustomError).message
            });
        }
    };

    public createEmployee: RequestHandler = (req, res) => {
        const result = EmployeeSchema.validate(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: "Invalid employee data",
                errors: result.error.issues
            });
        }

        try {
            const employee = this.service.createEmployee(result.data);
            return res.status(201).json(employee);
        } catch (error) {
            return res.status((error as CustomError).status).json({
                message: (error as CustomError).message
            });
        }
    };
}