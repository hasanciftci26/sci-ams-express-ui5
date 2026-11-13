import BaseObject from "sap/ui/base/Object";
import HttpError from "sci/ams/express/lib/core/HttpError";

/**
 * Provides a centralized HTTP client for communication with the backend API.
 *
 * In local development, requests are authenticated using Basic authentication.
 * In deployed environments, authentication is handled by the application router.
 *
 * @namespace sci.ams.express.lib.core
 */
export default class HttpClient extends BaseObject {
    private readonly baseUrl: string;

    constructor(baseUrl = "ams/api/v1") {
        super();
        this.baseUrl = baseUrl;
    }

    public get<T>(path: string) {
        return this.request<T>(path, {
            method: "GET"
        });
    }

    public post<TResponse, TBody>(path: string, body: TBody) {
        return this.request<TResponse>(path, {
            method: "POST",
            body: JSON.stringify(body)
        });
    }

    public patch<TResponse, TBody>(path: string, body: TBody) {
        return this.request<TResponse>(path, {
            method: "PATCH",
            body: JSON.stringify(body)
        });
    }

    public delete(path: string) {
        return this.request<void>(path, {
            method: "DELETE"
        });
    }

    private async request<T>(path: string, options: RequestInit) {
        const headers = new Headers(options.headers);

        headers.set("Accept", "application/json");

        if (options.body) {
            headers.set("Content-Type", "application/json");
        }

        if (this.isLocal()) {
            headers.set("Authorization", `Basic ${btoa("admin:admin")}`);
        }

        const response = await fetch(`${this.baseUrl}${path}`, {
            ...options,
            headers
        });

        if (!response.ok) {
            throw await this.createError(response);
        }

        if (response.status === 204) {
            return undefined as T;
        }

        return response.json() as Promise<T>;
    }

    private async createError(response: Response) {
        try {
            const error: unknown = await response.json();

            if (this.hasErrorMessage(error)) {
                return new HttpError(error.message, response.status);
            }

            return new HttpError(`Request failed with status ${response.status}.`, response.status);
        } catch {
            return new HttpError(`Request failed with status ${response.status}.`, response.status);
        }
    }

    private hasErrorMessage(error: unknown): error is { message: string } {
        return typeof error === "object" && error !== null && "message" in error && typeof error.message === "string" && error.message !== "";
    }

    private isLocal() {
        return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    }
}