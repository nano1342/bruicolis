"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = get;
const pg_1 = require("pg");
const pool = new pg_1.Pool({
    user: "postgres",
    database: "test",
    password: "root",
    port: 5433,
    host: "localhost",
});
async function get() {
    try {
        const res = await pool.query("SELECT * FROM sexe");
        console.log(res.rows);
        return res;
    }
    catch (error) {
        console.error(error);
    }
}
// export function get() {
//     return { test: "value" }
// }
