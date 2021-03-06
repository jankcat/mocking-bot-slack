module.exports = function(controller) {
  const message_types = ['direct_message', 'direct_mention', 'mention', 'ambient'];
  
  controller.hears('hummus', message_types, function (bot, message) {
    bot.say({
      text: tsUrl('https://i.imgur.com/Tm9GN74.png'),
      channel: message.channel,
    });
  });
  
  controller.hears('dead', message_types, function (bot, message) {
    bot.say({
      text: tsUrl('https://i.imgur.com/WFGswPc.png'),
      channel: message.channel,
    });
  });
  
  controller.hears('turing test', message_types, function (bot, message) {
    bot.say({
      text: 'poop',
      channel: message.channel,
    });
  });
  
  controller.hears('hurricane', message_types, function (bot, message) {
    bot.say({
      text: tsUrl('https://i.imgur.com/f1Wcdhq.png'),
      channel: message.channel,
    });
  });
};

function tsUrl(url) {
  return `${url}?ts=${Date.now()}`;
}
