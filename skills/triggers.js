module.exports = function(controller) {
  controller.hears('hummus', [], function (bot, message) {
    bot.say({
      text: 'https://i.imgur.com/Tm9GN74.png',
      channel: message.channel,
    });
  });
};
