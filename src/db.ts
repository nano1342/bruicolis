import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  database: "bruicolis",
  password: "root",
  port: 5433,
  host: "localhost",
})

/**
 * Function that executes the given SQL request and returns its result along with a "success" statement that describes if the request was executed successfully.
 * @param query 
 * @returns @returns {Object} An object containing:
 *   - success {boolean} Indicates whether the query was executed successfully
 *   - sqlRes {any} The result of the SQL query if successful, undefined otherwise
 */
export function sqlRequest(query: string) {
  return pool.query(query);
}