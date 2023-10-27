"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {

  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if job already in database.
   * */

  static async create({ title, salary, equity, companyHandle }) {

    const result = await db.query(`
                INSERT INTO jobs (
                  title,
                  salary,
                  equity,
                  company_handle)
                VALUES ($1, $2, $3, $4)
                RETURNING
                  id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"`, [
      title,
      salary,
      equity,
      companyHandle
    ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */

  static async findAll() {

    const jobsRes = await db.query(`
        SELECT
        id,
        title,
        salary,
        equity,
        company_handle AS "companyHandle"
        FROM jobs
        ORDER BY id`);

    return jobsRes.rows;
  }



  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, company }
   *   where company is {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(`
        SELECT
        id,
        title,
        salary,
        equity,
        companies.handle AS "handle",
        companies.name AS "name",
        companies.description AS "description",
        companies.num_employees AS "numEmployees",
        companies.logo_url AS "logoUrl",
        FROM jobs
        JOIN companies ON companies.handle = jobs.company_handle
        WHERE id = $1`, [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return {
      id: job.id,
      title: job.title,
      salary: job.salary,
      equity: job.equity,
      company: {
        handle: job.handle,
        name: job.name,
        description: job.description,
        numEmployees: job.numEmployees,
        logoUrl: job.logoUrl
      }
    };
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {

    const { setCols, values } = sqlForPartialUpdate(data);

    const idVarIdx = "$" + (values.length + 1);

    const querySql = `
        UPDATE jobs
        SET ${setCols}
        WHERE id = ${idVarIdx}
        RETURNING
            id,
            title,
            salary,
            equity,
            company_handle AS "companyHandle"`;

    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(`
        DELETE
        FROM jobs
        WHERE id = $1
        RETURNING id`, [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}


module.exports = job;
