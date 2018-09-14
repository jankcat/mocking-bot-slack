module.exports = function(controller) {
  const message_types = ['direct_message', 'direct_mention', 'mention', 'ambient'];
  
  controller.hears('hummus', message_types, function (bot, message) {
    bot.say({
      text: 'https://i.imgur.com/Tm9GN74.png',
      channel: message.channel,
    });
  });
};
