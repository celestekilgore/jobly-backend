"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

// update names
// test for anon

describe("POST /companies", function () {
  const newCompany = {
    handle: "new",
    name: "New",
    logoUrl: "http://new.img",
    description: "DescNew",
    numEmployees: 10,
  };

  test("ok for admin", async function () {
    const resp = await request(app)
      .post("/companies")
      .send(newCompany)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      company: newCompany,
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/companies")
      .send({
        handle: "new",
        numEmployees: 10,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/companies")
      .send({
        ...newCompany,
        logoUrl: "not-a-url",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

   test("error for non admin", async function () {
    const resp = await request(app)
      .post("/companies")
      .send(newCompany)
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.body).toEqual({
      "error": {
        "message": "Must be an administrator to access this route.",
        "status": 401}
      }
    );

  });


});

/************************************** GET /companies */

describe("GET /companies", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/companies");
    expect(resp.body).toEqual({
      companies:
        [
          {
            handle: "c1",
            name: "C1",
            description: "Desc1",
            numEmployees: 1,
            logoUrl: "http://c1.img",
          },
          {
            handle: "c2",
            name: "C2",
            description: "Desc2",
            numEmployees: 2,
            logoUrl: "http://c2.img",
          },
          {
            handle: "c3",
            name: "C3",
            description: "Desc3",
            numEmployees: 3,
            logoUrl: "http://c3.img",
          },
        ],
    });
  });

  test("Returns filtered results", async function () {
    const resp = await request(app).get("/companies")
    .query({nameLike : "2"});;
    expect(resp.body).toEqual({
      companies:
        [
          {
            handle: "c2",
            name: "C2",
            description: "Desc2",
            numEmployees: 2,
            logoUrl: "http://c2.img",
          }
        ]
    });
  });

  test("Throws error for invalid filter", async function () {
    const resp = await request(app).get("/companies")
    .query({invalidName: "Steve"});;
    expect(resp.body).toEqual({
      "error": {
        "message": [
          "instance is not allowed to have the additional property \"invalidName\""
        ],
        "status": 400
      }
    });
  });

  test("Throws error if minEmployees > maxEmployees", async function () {
    const resp = await request(app)
    .get("/companies")
    .query({minEmployees : 800, maxEmployees : 500});

    expect(resp.body).toEqual({
      "error": {
        "message": "Min employees must be less than max employees",
        "status": 400
      }
    });
  });

  test("Errors when min/maxEmployees not number", async function () {
    const resp = await request(app).get("/companies")
    .query({minEmployees : "two"});;
    expect(resp.body).toEqual({
      "error": {
        "message": [
          "instance.minEmployees is not of a type(s) integer"
        ],
        "status": 400
      }
    });

    const resp2 = await request(app).get("/companies")
    .query({maxEmployees : "two"});;
    expect(resp2.body).toEqual({
      "error": {
        "message": [
          "instance.maxEmployees is not of a type(s) integer"
        ],
        "status": 400
      }
    });
  });

  test("Errors when min/maxEmployees less than 1", async function () {
    const resp = await request(app).get("/companies")
    .query({minEmployees : 0});;
    expect(resp.body).toEqual({
      "error": {
        "message": [
          "instance.minEmployees must be greater than or equal to 1"
        ],
        "status": 400
      }
    });

    const resp2 = await request(app).get("/companies")
    .query({maxEmployees : 0});;
    expect(resp2.body).toEqual({
      "error": {
        "message": [
          "instance.maxEmployees must be greater than or equal to 1"
        ],
        "status": 400
      }
    });
  });

});
/************************************** GET /companies/:handle */

describe("GET /companies/:handle", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/companies/c1`);
    expect(resp.body).toEqual({
      company: {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    });
  });

  test("works for anon: company w/o jobs", async function () {
    const resp = await request(app).get(`/companies/c2`);
    expect(resp.body).toEqual({
      company: {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
    });
  });

  test("not found for no such company", async function () {
    const resp = await request(app).get(`/companies/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /companies/:handle */

describe("PATCH /companies/:handle", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        name: "C1-new",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      company: {
        handle: "c1",
        name: "C1-new",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        name: "C1-new",
      });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such company", async function () {
    const resp = await request(app)
      .patch(`/companies/nope`)
      .send({
        name: "new nope",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt", async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        handle: "c1-new",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        logoUrl: "not-a-url",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

   test("error for non admin", async function () {
    const resp = await request(app)
      .patch("/companies/c1")
      .send({
        name: "C1-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      "error": {
        "message": "Must be an administrator to access this route.",
        "status": 401}
      }
    );
  });


});

/************************************** DELETE /companies/:handle */

describe("DELETE /companies/:handle", function () {
  test("works for users", async function () {
    const resp = await request(app)
      .delete(`/companies/c1`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: "c1" });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/companies/c1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
      .delete(`/companies/nope`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("error for non admin", async function () {
    const resp = await request(app)
      .delete(`/companies/c1`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      "error": {
        "message": "Must be an administrator to access this route.",
        "status": 401}
      }
    );
  });
});
