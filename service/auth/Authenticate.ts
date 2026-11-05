import type { RequestHandler } from "express";
import Identity from "./Identity.js";
import { createSecurityContext, SECURITY_CONTEXT, errors } from "@sap/xssec";

export default class Authenticate {
    public static getMiddleware() {
        return process.env["NODE_ENV"] === "test" ? this.getTestMiddleware() : this.getProductionMiddleware();
    }

    private static getProductionMiddleware() {
        const identityService = Identity.getService();

        const middleware: RequestHandler = async function (req, res, next) {
            try {
                const securityContext = await createSecurityContext(identityService, { req });
                req[SECURITY_CONTEXT] = securityContext;
                return next();
            } catch (error) {
                if (error instanceof errors.ValidationError) {
                    console.error("Unauthenticated request: ", error);
                    return res.sendStatus(401);
                }

                throw error;
            }
        }

        return middleware;
    }

    private static getTestMiddleware() {
        const middleware: RequestHandler = async function (req, res, next) {
            const authorization = req.headers.authorization;

            if (!authorization?.startsWith("Basic ")) {
                return res.sendStatus(401);
            }

            const credentials = Buffer.from(authorization.slice(6), "base64").toString();
            const [userPart] = credentials.split(":");
            const [username, api] = userPart?.split("|") ?? [];

            if (!username) {
                return res.sendStatus(401);
            }

            req[SECURITY_CONTEXT] = Identity.getMockedSecurityContext(username, api);
            return next();
        }

        return middleware;
    }
}