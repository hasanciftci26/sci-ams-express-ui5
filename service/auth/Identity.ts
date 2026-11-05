import xsenv from "@sap/xsenv";
import { IdentityService, IdentityServiceSecurityContext, IdentityServiceToken } from "@sap/xssec";

export default class Identity {
    private static service?: IdentityService;

    public static getService() {
        if (!this.service) {
            this.service = new IdentityService(xsenv.serviceCredentials({ label: "identity" }));
            // TODO: Certificate update
        }

        return this.service;
    }

    public static getMockedSecurityContext(username: string, api?: string) {
        const mockPayload = {
            app_tid: "default",
            scim_id: username,
            sub: username,
            azp: "client_id",
            ias_apis: api ? [api] : []
        };

        const mockToken = new IdentityServiceToken(null, { header: {}, payload: mockPayload });
        const mockService = new IdentityService({});
        const mockedSecurityContext = new IdentityServiceSecurityContext(mockService, mockToken, {});

        return mockedSecurityContext;
    }
}