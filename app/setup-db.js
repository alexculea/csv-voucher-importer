/**
 * Sets up the database layout
 * by executing the SQL found
 * in ./sql/setup-db.sql file.
 */

const Mysql = require('mysql');
const FS = require('fs');
const Path = require('path');

module.exports = {
    /**
     * @param {Object} config
     * @param {string} config.dbHost
     * @param {string | number} config.dbPort
     * @param {string} config.dbUser
     * @param {string} config.dbPass
     */
    initDb: (config) => {
        return new Promise((accept, reject) => {
            const setupDbSqlFile = Path.join(__dirname, 'sql', 'setup-db.sql');
            FS.readFile(setupDbSqlFile, (err, sqlContent) => {
                if (err) {
                    return reject(err); 
                }

                const dbConn = Mysql.createConnection({
                    host: config.dbHost,
                    port: config.dbPort,
                    user: config.dbUser,
                    password: config.dbPass,
                    multipleStatements: true
                });

                dbConn.connect((err) => {
                    if (err) {
                        return reject(err);
                    }

                    dbConn.query(sqlContent.toString(), (err) => {
                        if (err) {
                            return reject(err);
                        } else {
                            accept();
                        }
                    });
                });
            })

        });
    }
}