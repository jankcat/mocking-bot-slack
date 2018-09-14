const debug = require('debug')('botkit:oauth');

module.exports = function(webserver, controller) {
  const handler = {
    login: function(req, res) {
      res.redirect(controller.getAuthorizeURL());
    },
    oauth: function(req, res) {
      const code = req.query.code;
      const state = req.query.state;
      const slackapi = controller.spawn({});
      const opts = {
        client_id: controller.config.clientId,
        client_secret: controller.config.clientSecret,
        code: code
      };
      slackapi.api.oauth.access(opts, function(err, auth) {
        if (err) {
          debug('Error confirming oauth', err);
          return res.redirect('/login_error.html');
        }
        const scopes = auth.scope.split(/\,/);
        slackapi.api.auth.test({token: auth.access_token}, function(err, identity) {
          if (err) {
            debug('Error fetching user identity', err);
            return res.redirect('/login_error.html');
          }
          auth.identity = identity;
          controller.trigger('oauth:success', [auth]);
          res.cookie('team_id', auth.team_id);
          res.cookie('bot_user_id', auth.bot.bot_user_id);
          res.redirect('/login_success.html');
        });
      });
    }
  }
  webserver.get('/login', handler.login);
  webserver.get('/oauth', handler.oauth);
  return handler;
}
