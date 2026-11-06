import type { SecurityContext } from "@sap/xssec";
import { SECURITY_CONTEXT } from "@sap/xssec";
import { AMS_AUTHORIZATIONS, type Authorizations } from "@sap/ams";

declare global {
    namespace Express {
        interface Request {
            [SECURITY_CONTEXT]: SecurityContext;
            [AMS_AUTHORIZATIONS]: Authorizations;
        }
    }
}