const 
  Express = require('express'),
  Config = require('../config'),
  SetupDB = require('./setup-db'),
  app = Express();

/**
 * Sets up routes and database.
 */
async function main() {
  console.log(`Starting CSV Voucher Importer.`);
  process.on('beforeExit', (code) => {
    console.log(`Exiting with code ${code}.`);
  })

  try {
    await SetupDB.initDb(Config)
  } catch (e) {
    console.log(`Error while setting up DB. Reason: ${e.message || JSON.stringify(e)}`);
    process.exit(1);
  }

  setupStatic(app);
  setupRoutes(app);

  app.locals['appConfig'] = Config;

  app.listen(Config.port, Config.host, (err) => {
    if (err) {
      console.log(`Couldn't start server. Reason: ${e.message || JSON.stringify(e)}.`);
      return process.exit(1);
    }

    console.log(`Server listening on ${Config.host}:${Config.port}!`)
  });
}

/**
 * Imports all routes in ./api and sets up routing in Express
 * according to the mapping in ./api/index.js.
 * 
 * All paths are prepended with /api/v1/. If a path titled 'hello-world'
 * is given then the resulting route will be /api/v1/hello-world
 * 
 * @param {Express} app 
 */
function setupRoutes(app) {
  const routes = require('./api');
  const baseRoute = '/api/v1/';
  for (const route of routes) {
    app[route.method.toLowerCase()](baseRoute + route.path.replace(/^\/+/g, ''), route.handler);
  }
}


/**
 * Sets up the static file server based
 * on the /public directory
 * 
 * @param {Express} app 
 */
function setupStatic(app) {
  const options = {
    dotfiles: 'ignore',
    etag: false,
    extensions: ['htm', 'html'],
    index: ['index.html'],
    maxAge: '1d',
    redirect: false,
    setHeaders: function (res, path, stat) {
      res.set('x-timestamp', Date.now());
    }
  }

  app.use(Express.static('public', options));
}


main();