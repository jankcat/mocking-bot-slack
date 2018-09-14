module.exports = function(controller) {
  controller.hears('hummus', ['direct_message', 'direct_mention', 'mention', 'ambient'], function (bot, message) {
    bot.say({
      text: 'https://i.imgur.com/Tm9GN74.png',
      channel: message.channel,
    });
  });
};
