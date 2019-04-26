const
    Busboy = require('busboy'),
    HttpStatus = require('http-status-codes'),
    CSVStream = require('csv-stream'),
    MySQL = require('mysql')

csvConfig = {
    delimiter: ',',
    endLine: '\n',
    escapeChar: '"', // default is an empty string
    enclosedChar: '"' // default is an empty string
},

    acceptedCsvColumns = [
        'code', 'brandId', 'startDate', 'expiresAt'
    ];


/**
 * This is the API endpoint handler.
 * - supports file upload with busboy
 * - streams file from upload in CSV parser
 * - for each row given by the CSV parser, insert in DB
 */
module.exports = (req, res) => {
    var busboy = new Busboy({
        headers: req.headers
    });
    
    req.error = {};
    req.totalFilesReceived = 0;

    const dbInsertPromises = [];

    /**
     * Busboy handles multipart/form-data file uploads.
     */
    busboy.on('file', (fieldName, file, filename, encoding, mimetype) => {
        console.log(`Receiving file ${filename}`);
        req.totalFilesReceived++;
        
        createDbConnection(req.app.locals.appConfig).then((dbConn) => {
            req.dbConnection = dbConn;
            
            const csvParser = CSVStream.createStream(csvConfig);
            csvParser.on('header', (columns) => {
                for (const col of columns) {
                    if (acceptedCsvColumns.indexOf(col) < 0) {
                        req.error[filename] = new Error(`Invalid column found: ${col}. Expecting ${JSON.stringify(acceptedCsvColumns)}.`);
                        
                        csvParser.destroy();
                        file.destroy();
                        return;
                    }
                }
            });

            csvParser.on('data', (data) => {
                if (req.error[filename]) {
                    return;
                }

                req.pause(); console.log(`Pausing file ${filename} until DB is done.`);
                const dbInsertPromise = insertCsvRowIntoDatabase(dbConn, data).then(() => {
                    req.resume(); console.log(`Resuming file ${filename}.`);
                }).catch((e) => {
                    req.error[filename] = e;
                    file.destroy();
                });

                dbInsertPromise.file = filename;
                dbInsertPromises.push(dbInsertPromise);

                console.log(JSON.stringify(data));
            });

            csvParser.on('error', (e) => {
                req.error[filename] = e;
                busboy.destroy();
            });

            file.on('data', () => console.log(`Received chunk for ${filename}`));
            file.on('end', () => console.log('File receiving ended.'));
            file.pipe(csvParser);
        }).catch((e) => {
            req.error = e;
            busboy.end();
        });
    });

    busboy.on('finish', function () {
        Promise.all(dbInsertPromises).catch((e) => {
            req.error = e;
        }).then(() => { 
            closeDbConnection(req.dbConnection); 
            let status = HttpStatus.OK
            let message = {success: true, errors: [], processedFileCount: req.totalFilesReceived};

            if (Object.keys(req.error).length > 0) {
                status = 500;
                message.success = false;
                message.errors = req.error;
                message.processedFileCount = message.processedFileCount - Object.keys(req.error).length;

                console.log(`Error while processing CSV import. Reason: ${JSON.stringify(message)}`);
            }

            
            res.writeHead(status, { 'Content-type': 'application/json', 'Connection': 'close' });
            res.end(JSON.stringify(message));
        });
    });

    return req.pipe(busboy);
}

/**
 * @param {Object} config 
 * @param {string} config.dbHost
 * @param {string} config.dbPort
 * @param {string} config.dbUser
 * @param {string} config.dbPass
 * 
 * @return {MySQL.Connection}
 */
function createDbConnection(config) {
    return new Promise((accept, reject) => {
        const conn = MySQL.createConnection({
            host: config.dbHost,
            port: config.dbPort,
            user: config.dbUser,
            password: config.dbPass,
            multipleStatements: true
        });

        conn.connect((err) => {
            if (err) {
                reject(err);
            } else {
                accept(conn);
            }
        })
    });
}

/**
 * Closes the given connection.
 * @param {MySQL.Connection} conn 
 */
function closeDbConnection(conn) {
    conn.end();
}

/**
 * Inserts the given CSV row in the database
 * 
 * @param {MySQL.Connection} connection
 * @param {Object} data 
 * @param {number} data.brandId
 * @param {string} data.code
 * @param {string | Date} data.startDate
 * @param {string | Date} data.expiresAt
 * @return {Promise}
 */
function insertCsvRowIntoDatabase(connection, data) {
    return new Promise((accept, reject) => {
        connection.beginTransaction((transactionError) => {
            if (transactionError) {
                return reject(transactionError);
            }

            const startDate = parseDate(data.startDate);
            const expiresAt = parseDate(data.expiresAt);

            if (!startDate || !expiresAt) {
                return reject(`Invalid date format given in column ${ !startDate ? 'startDate' : '' } ${ !startDate ? 'expiresAt' : '' }`);
            }

            connection.query('INSERT INTO vouchers.codes (code, startDate, expiresAt) VALUES (?, ?, ?);',
                [data.code, startDate, expiresAt],
                (firstInsertError) => {
                    if (firstInsertError) {
                        return reject(firstInsertError);
                    }

                    connection.query('INSERT INTO vouchers.codes_to_brands (brandId, code) VALUES (?, ?)', [
                        data.brandId,
                        data.code
                    ], (secondInsertError) => {
                        if (secondInsertError) {
                            connection.rollback();
                            return reject(secondInsertError);
                        }

                        connection.commit((commitErr) => {
                            if (commitErr) {
                                return reject(commitErr);
                            }

                            accept();
                        });
                    });
                }
            );
        });
    });
}

/**
 * Takes a string formatted as date/time and tries to make a date
 * object or return undefined if failed.
 * 
 * @param {string} string String formated date and time.
 * @return {Date | undefined}
 */
function parseDate(string) {
    const parsedDate = new Date(string);
    if (!parsedDate instanceof Date || isNaN(parsedDate)) { 
        return undefined;
    }

    return parsedDate;
}