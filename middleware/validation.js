"use strict";

const { BadRequestError } = require("../expressError");



/**
 * Checks that query strings only contain values :
 *  nameLike, minEmployees, and maxEmployees
 *
 * If min and max employees are present, ensures
 * min is less than max.
 *
 * Throws BadRequestErrors for invalid filters.
 */
function validateCompanyFilters(req,res,next) {

  const validKeys = ['nameLike','minEmployees','maxEmployees'];

  const keys = Object.keys(req.query);

  for (let key of keys) {
    if (!validKeys.includes(key)) {
     throw new BadRequestError(`${key} not a valid search filter.`);
  }}

  if (keys.includes("minEmployees") &&
  keys.includes("maxEmployees") &&
  Number(req.query['minEmployees']) > Number(req.query['maxEmployees'])) {
  throw new BadRequestError("Min employees must be less than max employees.");
}
    return next();
}



module.exports = { validateCompanyFilters };