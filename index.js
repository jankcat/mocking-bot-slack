if (!process.env.SLACK_CLIENT_ID || !process.env.SLACK_CLIENT_SECRET || !process.env.PORT) {
  usage_tip();
  return;
}

const Botkit = require('botkit');
const debug = require('debug')('botkit:main');

const controller = Botkit.slackbot({
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  scopes: ['bot', 'channels:history', 'chat:write:bot', 'reactions:read'],
  redirectUri: 'https://www.beefcakes.club:8443/oauth',
  json_file_store: __dirname + '/.data/filedb/',
});
controller.startTicking();

// Set up an Express-powered webserver to expose oauth and webhook endpoints
const webserver = require('./components/express_webserver.js')(controller);

webserver.get('/', function(req, res){
  res.render('index', {
    domain: req.get('host'),
    protocol: req.protocol,
    layout: 'layouts/default'
  });
})

require('./components/user_registration.js')(controller);
require('./components/onboarding.js')(controller);

const normalizedPath = require("path").join(__dirname, "skills");
require("fs").readdirSync(normalizedPath).forEach(function(file) {
  require("./skills/" + file)(controller);
});


function usage_tip() {
    console.log('~~~~~~~~~~');
    console.log('Execute your bot application like this:');
    console.log('SLACK_CLIENT_ID=<MY SLACK CLIENT ID> SLACK_CLIENT_SECRET=<MY CLIENT SECRET> PORT=3000 node index.js');
    console.log('Get Slack app credentials here: https://api.slack.com/apps')
    console.log('~~~~~~~~~~');
}
