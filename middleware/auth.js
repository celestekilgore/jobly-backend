"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  const authHeader = req.headers?.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^[Bb]earer /, "").trim();

    try {
      res.locals.user = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      /* ignore invalid tokens (but don't store user!) */
    }
  }
  return next();

}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  if (res.locals.user?.username) return next();
  throw new UnauthorizedError("Must be logged in to access this route.");
}


/** Middleware to use when user must be admin.
 *
 * If user is not admin, raises Unauthorized.
 */
function ensureAdmin(req, res, next) {
  if (res.locals.user?.isAdmin) return next(); // check for username, strict equality
  throw new UnauthorizedError("Must be an administrator to access this route.");
}

/**
 *  Middleware to ensure user is either an admin or the
 *  subject of the route they are trying to access.
 *
 *  Raises Unauthorized if user is denied.
 */
function ensureCorrectUserOrAdmin(req, res, next) {
  const username = req.params.username;
  if (res.locals.user?.username &&
    (res.locals.user?.isAdmin || res.locals.user?.username === username)) { // strict equality admin and check username
    return next();
  }
  throw new UnauthorizedError
    ("Must be an admin or correct user to access this route.");
}


module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureCorrectUserOrAdmin
};
