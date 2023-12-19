"use strict";

const jwt = require("jsonwebtoken");
const { createToken } = require("./tokens");
const { SECRET_KEY } = require("../config");
const { commonBeforeEach } = require("../routes/_testCommon");
const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");




// beforeEach( function () {

// })

describe("sqlForPartialUpdate", function () {

  test("correct return values", function () {
    let dataToUpdate = {username:"New username", lastName: "Smith"};
    let jsToSql = {lastName:"last_name"};
      const outputValue = sqlForPartialUpdate(dataToUpdate,jsToSql);
      expect(outputValue).toEqual({setCols : "\"username\"=$1, \"last_name\"=$2",
                                   values: ["New username", "Smith"] });
  });

  test("Error if no keys in dataToUpdate", function() {
    let dataToUpdate = {};
    let jsToSql = {lastName:"last_name"};
    expect(() => {sqlForPartialUpdate(dataToUpdate,jsToSql)}).toThrow(BadRequestError);
  })


});
