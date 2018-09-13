module.exports = function(controller) {
  var managed_bots = {};
  
  // Capture the rtm:start event and actually start the RTM...
  controller.on('rtm:start', function(config) {
    var bot = controller.spawn(config);
    manager.start(bot);
  });

  controller.on('rtm_close', function(bot) {
    manager.remove(bot);
  });

  // The manager object exposes some useful tools for managing the RTM
  var manager = {
    start: function(bot) {
      if (managed_bots[bot.config.token]) return;
      bot.startRTM(function(err, bot) {
        if (err) return;
        managed_bots[bot.config.token] = bot.rtm;
      });
    },
    stop: function(bot) {
      if (managed_bots[bot.config.token] && managed_bots[bot.config.token].rtm) {
        managed_bots[bot.config.token].closeRTM();
      }
    },
    remove: function(bot) {
      delete managed_bots[bot.config.token];
    },
    reconnect: function() {
      controller.storage.teams.all(function(err, list) {
        if (err) {
          throw new Error('Error: Could not load existing bots:', err);
        } else {
          for (var l = 0; l < list.length; l++) {
            manager.start(controller.spawn(list[l].bot));
          }
        }
      });
    }
  }
  return manager;
}
