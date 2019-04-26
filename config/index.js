module.exports = {
    host: process.env.HOST || "127.0.0.1",
    port: process.env.PORT || 9000,
    dbHost: process.env.DB_HOST || "localhost",
    dbPort: process.env.DB_PORT || "3306",
    dbUser: process.env.DB_USER || "root",
    dbPass: process.env.DB_PASSWORD || "pass",
}