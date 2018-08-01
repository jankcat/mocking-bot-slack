const validUrl = require('valid-url');
const request = require('request');
const querystring = require('querystring');

function unique(a) {
    var seen = {};
    return a.filter(function(item) {
        var k = JSON.stringify(item);
        return seen.hasOwnProperty(k) ? false : (seen[k] = true);
    })
}

function getUsersAndFinish(bot, message, reply, users, channel) {
  // No users left
  if (users.length < 1) {
    finishUp(bot, message, reply, channel);
    return;
  }
  
  const nextUser = users.shift();
  // At least one user left, get their info
  bot.api.users.info({
    user: nextUser.id,
  }, function(err, user) {
    if (err) {
      console.log(err);
      return;
    }
    if (!user.ok) return;
    message = message.replace(new RegExp(nextUser.match, 'g'), `@${user.user.name}`);
    getUsersAndFinish(bot, message, reply, users, channel);
  });
}

function finishUp(bot, message, reply, channel) {
  // do the dew
  // https://wt-22f5e1b994607080041c947354b7f9a5-0.run.webtask.io/sponge?message=
  const q = querystring.stringify({message: message});
  request(`https://wt-22f5e1b994607080041c947354b7f9a5-0.run.webtask.io/sponge?${q}`, function (error, response, body) {
    if (error) return;
    const result = body.replace(/['"]+/g, '');
    const newReply = `${reply}${result}`;
    console.log(newReply);
    // Send the image:
    bot.say(
      {
        text: newReply,
        channel: channel,
      }
    );
  });
}

module.exports = function(controller) {
  controller.on('reaction_added', function(bot, reaction) {
    // Only listen to messages, not attachments
    if (reaction.item.type !== 'message') return;
    
    // Only listen to spongebob emoji
    if (reaction.reaction !== 'mocking') return;
    
    bot.api.reactions.get({
      timestamp: reaction.item.ts,
      channel: reaction.item.channel,
      full: true,
    }, function(err, response) {
      if (err) {
        console.log(err);
        return;
      }
      if (!response.ok) return;
      
      // Ignore bots, integrations, alerts, etc.
      if (response.message.hidden) return;
      if (response.message.subtype) return;
      if (response.message.bot_id) return;
      
      // Make sure the message is long enough
      if (!response.message.text.trim()) return;
      let message = response.message.text.trim();
      if (message.length < 4) return;
      
      // find mocking emoji in reactions, only respond to first mocking reaction
      let valid = false;
      for (const react of response.message.reactions) {
        if (react.name !== 'mocking') continue;
        if (react.count === 1) {
          valid = true;
          break;
        }
      }
      if (!valid) return;
      
      // Make sure the message was sent in the last day
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const messageTime = new Date(reaction.item.ts*1000);
      if (messageTime < yesterday) return;
      
      // Ignore messages that are just valid URLs
      if (validUrl.isUri(message)) return;
      
      bot.api.users.info({
        user: reaction.user,
      }, function(err2, mocker) {
        if (err2) {
          console.log(err2);
          return;
        }
        if (!mocker.ok) return;
        if (mocker.user.is_bot) return;
        
        bot.api.users.info({
          user: reaction.item_user,
        }, function(err3, mockee) {
          if (err3) {
            console.log(err3);
            return;
          }
          if (!mockee.ok) return;
          if (mocker.user.is_bot) return;
          
          // React to the message so no one else can trigger again
          bot.api.reactions.add({
            timestamp: reaction.item.ts,
            channel: reaction.item.channel,
            name: 'mocking',
          }, function(err4, reactionResult) {
            if (err3) {
              console.log(err3);
              return;
            }
            
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
            
            const reply = `<@${mocker.user.id}> mocking <@${mockee.user.id}>: `; 
            getUsersAndFinish(bot, message, reply, uniq, reaction.item.channel);
          });
        });
      });
    });
  });
}
