import express from "express";
import type { Database } from "better-sqlite3";
import type { Router } from "express";

export default abstract class RouterBase {
    protected readonly _router: Router;
    private readonly _db: Database;
    private readonly _path: string;

    constructor(db: Database, path: string) {
        this._db = db;
        this._path = `/ams/api/v1${path}`;
        this._router = express.Router();
    }

    public get router() {
        return this._router;
    }

    public get path() {
        return this._path;
    }

    protected get db() {
        return this._db;
    }
}