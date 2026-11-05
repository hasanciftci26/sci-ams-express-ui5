import xsenv from "@sap/xsenv";
import { IdentityService, IdentityServiceSecurityContext, IdentityServiceToken } from "@sap/xssec";

export default class Identity {
    public static getService() {
        const credentials = xsenv.serviceCredentials({ label: "identity" });
        const service = new IdentityService(credentials);

        // TODO: Certificate update

        return service;
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