# Jobly

This is the RESTful Express backend for Jobly.

Jobly is a full-stack job search application that allows users to search for jobs and companies.

##### This repo contains the express backend, the frontend can be found <a href="https://github.com/celestekilgore/jobly-frontend">here</a>.

## Live Demo
- Here is a live demo of <a href="https://job-ly.surge.sh/">Jobly</a>. Jobly is hosted using a free service - please give the server a few minutes to warm up.  
- Demo login: testusername | password

## Technologies
- React
- Node.js
- Express
- Bootstrap
- PostgreSQL
- JSONSchema
- JSON Web Token
- bcrypt

## Features
- Users can login/logout. Established secure authentication and authorization using JWT and JSON Schema.
- Users can edit their profile information (name and email).
- Implemented advanced filtering functionality by writing custom SQL queries to allow users to filter
companies based on name and employee count, and jobs based on title, salary, and equity.

## Local setup instructions
Fork and clone the [backend](https://github.com/celestekilgore/jobly-backend)
```
cd [path_to_your_copy]
npm install
npm start
```
the backend will run locally on port 3001

Fork and clone the [frontend](https://github.com/celestekilgore/jobly-frontend)
```
cd [path_to_your_copy]
npm install
npm start
```
the frontend will run locally on port 3000
