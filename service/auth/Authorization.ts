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
        let ams: AuthorizationManagementService;

        if (process.env["NODE_ENV"] === "test") {
            ams = AuthorizationManagementService.fromLocalDcn("../ams-policies-deployer/dcn", {
                assignments: "./auth/test/mock-policy-assignments.json"
            });
        } else {
            ams = AuthorizationManagementService.fromIdentityService(Identity.getService());
        }

        this.registerErrorHandler(ams);
        return ams;
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

    /**
     * Registers a handler for errors occurring while AMS loads or refreshes
     * its authorization bundle.
     */
    private static registerErrorHandler(ams: AuthorizationManagementService) {
        ams.on("error", event => {
            if (event.type !== "bundleRefreshError") {
                return;
            }

            if (ams.isReady()) {
                console.warn("AMS bundle refresh error:", event.error);
            } else {
                console.error("AMS initial bundle fetch error:", event.error);
            }
        });
    }
}