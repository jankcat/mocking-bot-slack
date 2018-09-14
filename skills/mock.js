const validUrl = require('valid-url');
const rp = require('request-promise-native');
const querystring = require('querystring');

function unique(a) {
  var seen = {};
  return a.filter(function(item) {
    var k = JSON.stringify(item);
    return seen.hasOwnProperty(k) ? false : (seen[k] = true);
  })
}

function promisify(func, param) {
  return new Promise(function(resolve, reject) {
    func(param, function(err, resp) {
      if (err) reject(err);
      if (!resp.ok) reject(resp);
      else resolve(resp);
    });
  });
}

module.exports = function(controller) {
  controller.on('reaction_added', async function(bot, reaction) {
    // Only listen to messages, not attachments, and only sponge emoji
    if (reaction.item.type !== 'message') return;
    if (reaction.reaction !== 'mocking') return;
    
    try {
      const reactions = await promisify(bot.api.reactions.get, {
        timestamp: reaction.item.ts,
        channel: reaction.item.channel,
        full: true,
      });
      // find mocking emoji in reactions, only respond to first mocking reaction
      let valid = false;
      for (const react of reactions.message.reactions) {
        if (react.name !== 'mocking') continue;
        if (react.count !== 1) break;
        valid = true;
        break;
      }
      if (!valid) return;
      
      // React to the message so no one else can trigger again
      await promisify(bot.api.reactions.add, {
        timestamp: reaction.item.ts,
        channel: reaction.item.channel,
        name: 'mocking',
      });
      
      // Ignore bots, integrations, alerts, etc.
      if (reactions.message.hidden) return;
      if (reactions.message.subtype) return;
      if (reactions.message.bot_id) return;
      
      // Make sure the message is long enough
      if (!reactions.message.text.trim()) return;
      let message = reactions.message.text.trim();
      if (message.length < 4) return;
      
      // Make sure the message was sent in the last day
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const messageTime = new Date(reaction.item.ts*1000);
      if (messageTime < yesterday) return;
      
      // Ignore messages that are just valid URLs
      if (validUrl.isUri(message)) return;
      
      // Get the mocker and mockee (user being mocked)
      const mocker = await promisify(bot.api.users.info, { user: reaction.user });
      const mockee = await promisify(bot.api.users.info, { user: reaction.item_user });
      if (mocker.user.is_bot || mockee.user.is_bot) return;
      
      // Fix @ everyone, here, channel
      message = message.replace(/<\!everyone>/g, '@everyone');
      message = message.replace(/<\!here>/g, '@here');
      message = message.replace(/<\!channel>/g, '@channel');
      
      // Fix channel names
      message = message.replace(/<#[a-zA-Z\d]*\|([\w\-]*)>/g, '#$1');
      
      // Get user mentions
      const userRegex = /<@([a-zA-Z\d]*)>/g;
      let m;
      const usersFound = [];
      while ((m = userRegex.exec(message)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === userRegex.lastIndex) userRegex.lastIndex++;
        usersFound.push({match: m[0], id: m[1]});
      }
      
      // Filter out duplicates and resolve ones we already know
      let uniq = unique(usersFound);
      for (const found of uniq) {
        // We already have this user's info
        if (found.id === mocker.user.id) {
          message = message.replace(new RegExp(found.match, 'g'), `@${mocker.user.name}`);
          let index = uniq.indexOf(found);
          if (index > -1) {
            uniq.splice(index, 1);
          }
        }
        // We already have this user's info too
        if (found.id === mockee.user.id) {
          message = message.replace(new RegExp(found.match, 'g'), `@${mockee.user.name}`);
          usersFound.pop(found);
          let index = uniq.indexOf(found);
          if (index > -1) {
            uniq.splice(index, 1);
          }
        }
      }
      
      // resolve and replace the rest of the users
      for (const uniqUser of uniq) {
        const resolvedUser = await promisify(bot.api.users.info, { user: uniqUser.id });
        message = message.replace(new RegExp(uniqUser.match, 'g'), `@${resolvedUser.user.name}`);
      }
      
      // do the dew
      // https://wt-22f5e1b994607080041c947354b7f9a5-0.run.webtask.io/sponge?message=
      const q = querystring.stringify({message: message});
      const img = await rp(`https://wt-22f5e1b994607080041c947354b7f9a5-0.run.webtask.io/sponge?${q}`);
      const result = img.replace(/['"]+/g, '');
      const reply = `<@${mocker.user.id}> mocking <@${mockee.user.id}>: ${result}`;
      console.log(`[${bot.team_info.name}] ${mocker.user.name} mocking ${mockee.user.name}: ${result}`);
      bot.say({
        text: reply,
        channel: reaction.item.channel,
      });
    } catch (e) {
      console.error(e);
    }
  });
}
