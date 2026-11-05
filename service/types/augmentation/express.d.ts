import type { SecurityContext } from "@sap/xssec";
import { SECURITY_CONTEXT } from "@sap/xssec";

declare global {
    namespace Express {
        interface Request {
            [SECURITY_CONTEXT]?: SecurityContext;
        }
    }
}