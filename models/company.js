"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(`
        SELECT handle
        FROM companies
        WHERE handle = $1`, [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(`
                INSERT INTO companies (handle,
                                       name,
                                       description,
                                       num_employees,
                                       logo_url)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING
                    handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"`, [
      handle,
      name,
      description,
      numEmployees,
      logoUrl,
    ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *  Optionally, filter data based on parameters, passed in as an object
   *
   *  Valid filters:
   *  nameLike : filters based on case-insensitive name match
   *  minEmployees : minimum number of employees
   *  maxEmployees : maximum number of employees
   *
   *  Example input: {nameLike : "green", minEmployees : 5}
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll({ minEmployees, maxEmployees, nameLike }) {

    if (minEmployees > maxEmployees) throw new BadRequestError(
      "Min employees must be less than max employees");

    const { whereClause, values } = Company._filterWhereBuilder(
      { minEmployees, maxEmployees, nameLike });

    const companiesRes = await db.query(`
        SELECT handle,
               name,
               description,
               num_employees AS "numEmployees",
               logo_url      AS "logoUrl"
        FROM companies
        ${whereClause}
        ORDER BY name`, values);

    return companiesRes.rows;
  }


  /**
 * Takes in an object with k/v pairs of filters and data
 * Valid search filters: nameLike, minEmployees, maxEmployees
 *
 * Example input: {nameLike : "green", minEmployees : 5}
 *
 * Returns an object { whereClause, values }
 * where whereClause is a string like 'WHERE name ILIKE $1'
 * and values is an array whose values align with the parameterized values
 * of the where clause
 */
  static _filterWhereBuilder({ minEmployees, maxEmployees, nameLike }) {

    let whereClause = [];
    let values = [];

    if (nameLike) {
      values.push(`%${nameLike}%`);
      whereClause.push(`name ILIKE $${values.length}`);
    }
    if (minEmployees) {
      values.push(minEmployees);
      whereClause.push(`num_employees >= $${values.length}`);
    }
    if (maxEmployees) {
      values.push(maxEmployees);
      whereClause.push(`num_employees <= $${values.length}`);
    }
    if (whereClause.length > 0) {
      whereClause = "WHERE " + whereClause.join(" AND ");
    } else {
      whereClause = "";
    }

    return { whereClause, values };
  }


  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(`
    SELECT handle,
           name,
           description,
           num_employees AS "numEmployees",
           logo_url      AS "logoUrl"
    FROM companies
    WHERE handle = $1`, [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    const jobsRes = await db.query(`
    SELECT id, title, salary, equity
    FROM jobs
    WHERE company_handle = $1
    ORDER BY id`, [handle],
    );

    company.jobs = jobsRes.rows;

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
        UPDATE companies
        SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING
            handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(`
        DELETE
        FROM companies
        WHERE handle = $1
        RETURNING handle`, [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
