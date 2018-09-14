const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const querystring = require('querystring');
const http = require('http');
const hbs = require('express-hbs');

module.exports = function(controller) {
  const app = express();
  app.use(function(req, res, next) {
    req.rawBody = '';
    req.on('data', function(chunk) {
      req.rawBody += chunk;
    });
    next();
  });
  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // set up handlebars ready for tabs
  app.engine('hbs', hbs.express4({partialsDir: __dirname + '/../views/partials'}));
  app.set('view engine', 'hbs');
  app.set('views', __dirname + '/../views/');
  
  app.use(express.static('public'));

  const server = http.createServer(app);
  server.listen(8443, null, function() {
    console.log('Express webserver configured and listening at http://localhost:8443');
  });

  // import all the pre-defined routes that are present in /components/routes
  const normalizedPath = require("path").join(__dirname, "routes");
  require("fs").readdirSync(normalizedPath).forEach(function(file) {
    require("./routes/" + file)(app, controller);
  });

  controller.webserver = app;
  controller.httpserver = server;

  return app;
}
