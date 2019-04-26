# CSV Voucher Code Importer

This is a tool that imports CSV voucher code files in the database. See [REQUIREMENTS.md]() on what it does.

## Overview
- The configuration is in [./config/index.js](). 
- The API is dynamically `required()`'d from [./app/api/index.js]()
- The database is automatically setup by [./app/setup-db.js]() using SQL in [app/sql/setup-db.sql]()
- The UI is served by `static-server` from [public]()

## How to run

1. Install modules `npm i`

### With Docker (quick)
```BASH
    npm run build-docker
    docker-compose up
    # once done visit localhost:9000 in your browser and upload files (see util).
```

### Without Docker
Get a MySQL server instance ready and reachable. Setup the credentials in [./config/index.js](), then in the project root directory run
```BASH
    npm run start
    # once done visit localhost:9000 in your browser and upload files (see util).
```
