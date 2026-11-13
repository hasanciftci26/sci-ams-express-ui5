/**
 * Represents an HTTP request error returned by the backend.
 *
 * @namespace sci.ams.express.lib.core
 */
export default class HttpError extends Error {
    public readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}