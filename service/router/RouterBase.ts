import express from "express";
import type { Database } from "better-sqlite3";
import type { Router } from "express";

export default abstract class RouterBase {
    protected readonly _router: Router;
    private readonly _db: Database;

    constructor(db: Database) {
        this._db = db;
        this._router = express.Router();
    }

    public get router() {
        return this._router;
    }

    protected get db() {
        return this._db;
    }
}