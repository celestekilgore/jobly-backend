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

/**
 * Takes in an object dataToUpdate with k/v pairs of filters and data
 * Valid search filters: nameLike, minEmployees, maxEmployees
 *
 * Returns an object { whereClause, values }
 * where whereClause is a string like 'WHERE name ILIKE $1'
 * and values is an array whose values align with the parameterized values
 * of the where clause
 */
function sqlForCompanyFilter(dataToUpdate) {

  const keys = Object.keys(dataToUpdate);

  const sqlFilters = keys.map((queryString, idx) => {
    if (queryString === 'nameLike') {
      dataToUpdate['nameLike'] = `%${dataToUpdate['nameLike']}%`;
      return `name ILIKE $${idx + 1}`;
    } else if(queryString === 'minEmployees') {
      return `num_employees >= $${idx + 1}`;
    } else if(queryString === 'maxEmployees') {
      return `num_employees <= $${idx + 1}`;
    }
  });

  // removing empty values and converting to WHERE clause syntax
  const validFilters = sqlFilters.join(" AND ");

  return {whereClause : "WHERE " + validFilters,
          values : Object.values(dataToUpdate)};
}

module.exports = { sqlForPartialUpdate, sqlForCompanyFilter };
