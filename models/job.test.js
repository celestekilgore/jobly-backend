"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError.js");
const Company = require("./company.js");
const Job = require("./job.js");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


/************************************** create */

describe("create", function () {
  const newCompany = {
    handle: "new",
    name: "New",
    description: "New Description",
    numEmployees: 1,
    logoUrl: "http://new.img",
  };
  const newJob = {
    id: 1,
    title: "test title",
    salary: 1000,
    equity: 0,
    company_handle: "new"
  };
  const newJob2 = {
    id: 2,
    title: "test title 2",
    salary: 2000,
    equity: 0.2,
    company_handle: "new2"
  };

  test("works", async function () {
    let company = await Company.create(newCompany);
    let job = await Job.create(newJob);
    expect(job).toEqual(newJob);

    const result = await db.query(
      `SELECT
      id,
      title,
      salary,
      equity,
      company_handle
           FROM jobs
           WHERE id = 1`);
    expect(result.rows).toEqual([
      {
        id: 1,
        title: "test title",
        salary: 1000,
        equity: 0,
        company_handle: "new"
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

// _sql : can test WHERE builder

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll({});
    expect(jobs).toEqual([
      {
        id: 1,
        title: "test title",
        salary: 1000,
        equity: 0,
        company_handle: "new"
      },
      {
        id: 2,
        title: "test title 2",
        salary: 2000,
        equity: 0.2,
        company_handle: "new2"
      }
    ]);
  });

  test("works: title filter", async function () {
    let jobs = await Job.findAll({ title: "2" });
    expect(jobs).toEqual([
      {
        id: 2,
        title: "test title 2",
        salary: 2000,
        equity: 0.2,
        company_handle: "new2"
      }
    ]);
  });

  test("works: minSalary filter", async function () {
    let jobs = await Job.findAll({ minSalary: 1500 });
    expect(jobs).toEqual([
      {
        id: 2,
        title: "test title 2",
        salary: 2000,
        equity: 0.2,
        company_handle: "new2"
      }
    ]);
  });

  test("works: hasEquity filter", async function () {
    let jobs = await Job.findAll({ hasEquity: true });
    expect(jobs).toEqual([
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      }
    ]);
  });

  test("works: hasEquity filter false", async function () {
    let jobs = await Job.findAll({ hasEquity: false });
    expect(jobs).toEqual([
      {
        id: 1,
        title: "test title",
        salary: 1000,
        equity: 0,
        company_handle: "new"
      },
      {
        id: 2,
        title: "test title 2",
        salary: 2000,
        equity: 0.2,
        company_handle: "new2"
      }
    ]);
  });
});

/************************************** _sqlForFilter */


describe("_sqlForFilter", function () {
  test("works with valid inputs", function () {
    const filterData = Job._sqlForFilter(
      {
        title: "test",
        minSalary: 1000,
        hasEquity: true
      });

    expect(filterData).toEqual(
      {
        whereClause: "WHERE title ILIKE $1 AND min_salary >= $2 AND hasEquity > 0",
        values: ["%test%", 1000]
      });
  });


  test("works with one input", function () {
    const filterData = Job._sqlForFilter(
      { title: "test" });

    expect(filterData).toEqual(
      {
        whereClause: "WHERE title ILIKE $1",
        values: ["%test%"]
      });
  });


  test("works with invalid field", function () {
    const filterData = Job._sqlForFilter(
      { spork: "test" });

    expect(filterData).toEqual(
      {
        whereClause: "",
        values: []
      });
  });


  test("works with empty input", function () {
    const filterData = Job._sqlForFilter({});

    expect(filterData).toEqual(
      {
        whereClause: "",
        values: []
      });
  });


});


/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(1);
    expect(job).toEqual({
      id: 1,
      title: "test title",
      salary: 1000,
      equity: 0,
      company: {
        handle: "new",
        name: "New",
        description: "New Description",
        numEmployees: 1,
        logoUrl: "http://new.img",
      }
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get("nope");
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New title",
    salary: 50000000,
    equity: .5
  };

  test("works", async function () {
    let job = await Job.update(1, updateData);
    expect(job).toEqual({
      id: 1,
      company_handle: "new",
      ...updateData,
    });

    const result = await db.query(
      `SELECT
        id,
        title,
        salary,
        equity,
        company_handle
      FROM jobs
      WHERE id = 1`);
    expect(result.rows).toEqual([{
      id: 1,
      title: "New title",
      salary: 50000000,
      equity: .5,
      company_handle: "new"
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "New title",
      salary: null,
      equity: null
    };

    let job = await Job.update(1, updateDataSetNulls);
    expect(job).toEqual({
      title: "New title",
      ...updateDataSetNulls,
    });

    const result = await db.query(
      `SELECT
        id,
        title,
        salary,
        equity,
        company_handle
      FROM jobs
      WHERE id = 1`);
    expect(result.rows).toEqual([{
      id: 1,
      title: "New title",
      salary: 1000,
      equity: 0,
      company_handle: "new"
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update("nope", updateData);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update("c1", {});
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(1);
    const res = await db.query(
      "SELECT id FROM companies WHERE id=1");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove("nope");
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
