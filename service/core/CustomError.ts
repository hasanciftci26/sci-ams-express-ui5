export default class CustomError extends Error {
    private readonly _status: number;

    constructor(message: string, status: number) {
        super(message);
        this._status = status;
    }

    public get status() {
        return this._status;
    }
}