import { AuthorizationManagementService, IdentityServiceAuthProvider } from "@sap/ams";
import Identity from "./Identity.js";
import type { RequestHandler } from "express";

export default class Authorization {
    private static ams?: AuthorizationManagementService;
    private static authProvider?: IdentityServiceAuthProvider;
    private static middleware?: ReturnType<IdentityServiceAuthProvider["getMiddleware"]>;

    /**
     * Returns the shared Authorization Management Service instance.
     */
    public static getAMS() {
        if (!this.ams) {
            this.ams = this.createAMS();
        }

        return this.ams;
    }

    /**
     * Returns the AMS middleware provider used to create authorization
     * middleware such as privilege checks and authorization prechecks.
     */
    public static getMiddleware() {
        if (!this.middleware) {
            this.middleware = this.getAuthProvider().getMiddleware();
        }

        return this.middleware;
    }

    /**
     * Returns the Express middleware that resolves the authorizations for
     * the authenticated principal and stores them in req[AMS_AUTHORIZATIONS].
     */
    public static getAuthorizeMiddleware() {
        return this.getMiddleware().authorize() as RequestHandler;
    }

    /**
     * Creates the Authorization Management Service using local policies and
     * mock assignments for tests, or the Identity Service in production.
     */
    private static createAMS() {
        if (process.env["NODE_ENV"] === "test") {
            return AuthorizationManagementService.fromLocalDcn("../ams-policies-deployer/dcn",
                {
                    assignments: "./auth/test/mock-policy-assignments.json"
                }
            );
        }

        return AuthorizationManagementService.fromIdentityService(
            Identity.getService()
        );
    }

    /**
     * Returns the shared authentication provider that connects the
     * authenticated Identity Service principal with AMS.
     */
    private static getAuthProvider() {
        if (!this.authProvider) {
            this.authProvider = new IdentityServiceAuthProvider(
                this.getAMS()
            );
        }

        return this.authProvider;
    }
}