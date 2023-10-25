"use strict";

const { BadRequestError } = require("../expressError");

/**
 * This function allows us to update SQL values from camelCased data.
 * Errors if dataToUpdate has no keys
 *
 * Takes in dataToUpdate, a POJO with k/v pairs of values to update
 * like {username:"New username", lastName: "Smith"}
 *
 * and jsToSql, a POJO with k/v pairs of dataToUpdate's keys translated to snake
 * like {"lastName":"last_name"}
 *
 *  Returns {setCols : `username=$1, last_name=$2`
 *           values :  ["New username", "Smith"] }
 */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
    `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}


function sqlForCompanyFilter(dataToUpdate) {
  const keys = Object.keys(dataToUpdate);
  if ("minEmployees" in keys &&
    "maxEmployees" in keys &&
    dataToUpdate[minEmployees] > dataToUpdate[maxEmployees]) {
    throw new BadRequestError("Min employees must be less than max employees.");
  }

  const cols = keys.map((colName, idx) => {
    if (colName === 'nameLike')
    return `"${jsToSql[colName] || colName}" ILIKE $${idx + 1}`;
  } elif (colName === 'minEmployees') {

  }
);


}

module.exports = { sqlForPartialUpdate };
