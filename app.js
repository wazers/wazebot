'use strict';
// var SlackBot = require('slackbots');
var config = require('./config'),
  connect = require('camo').connect,
  MongoClient = require('mongodb').MongoClient,
  Botkit = require('botkit'),
  url = require('url'),
  allowedUrlKeys = ["env", "lon", "lat", "zoom", "segments", "nodes", "cameras", "mapUpdateRequest", "mapProblem", "venues"],
// mongoStorage = require('botkit-storage-mongo')({mongoUri: 'mongodb://localhost/botkit'}),
  controller = Botkit.slackbot({
    // storage: mongoStorage,
    debug: false
    //include "log: false" to disable logging
    //or a "logLevel" integer from 0 to 7 to adjust logging verbosity
  }),
  geocoderProvider = 'google', httpAdapter = 'http';
// optional
/*var extra = {
 apiKey: 'YOUR_API_KEY', // for Mapquest, OpenCage, Google Premier
 formatter: null         // 'gpx', 'string', ...
 };*/

var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter);//, extra);

var users, channels, groups, team, privateGroup, publicChannel, uLang = {};
// connect the bot to a stream of messages
var bot = controller.spawn({
  token: config.slack.token,
  incoming_webhook: {
    url: "https://hooks.slack.com/services/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"
  }
}).startRTM(function (err, bot, payload) {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
  users = payload.users;
  channels = payload.channels;
  groups = payload.groups;
  team = payload.team;
  privateGroup = find(groups, {name: config.slack.privateGroup || 'private_test'});
  publicChannel = find(channels, {name: config.slack.publicChannel || 'general'});
  // console.log("payload", payload, "end payload");
  //TODO embed in users[]
  usersColl.find().forEach(function (u) {
    uLang[u._id] = u.lang;
  });
  // controller.storage.users.all(function (err, all_user_data) {
  //   all_user_data.forEach(function (el) {
  //     uLang[el.id] = el.lang;
  //   });
  // });
});

require('./schemes');

var usersColl;
MongoClient.connect(config.dburi, function (err, db) {
  if (err)
    return console.error(err);
  console.log("Connected correctly to server");
  usersColl = db.collection('users');
  // db.close();
});
// var uri = 'nedb://memory';
connect(config.dburi)//.then(function (db) {
// database = db;
// User.findOneAndUpdate({_id:"U16V56Z4L"}, {lang:'nl'}, {upsert: true});
// Settings.create({
//   name: "welcome",
//   key: ["team_join"],
//   types: [{
//     usedFor: "welcomepm",
//     templates: [{
//       template: 'Welkom <%real_name%>! Je kunt je profiel aanvullen met je foto, functie en regio; bijvoorbeeld: "Editor (L 1) Antwerpen”. <https://wazebenelux.slack.com/account/settings|accountsinstellingen> || Indien je vragen hebt, stel ze gerust in #general  || Bedankt!',
//       lang: "nl"
//     }]
//   }]
// }).save().then(function (d) {
//   console.log(d._id, d);
// });
// Settings.create({
//   name: "typing",
//   key: ["user_typing"],
//   types: [{
//     usedFor: "privategroup",
//     templates: [{
//       template: 'User <https://www.waze.com/nl/user/editor/<%waze_name%>|<%real_name%>> has just joined the team <@<%id%>|<%name%>> <',
//       lang: "en"
//     }]
//   }, {
//     usedFor: "welcomepm",
//     templates: [{
//       template: 'Welkom <%real_name%>! Je kunt je profiel aanvullen met je foto, functie en regio; bijvoorbeeld: "Editor (L1) Antwerpen”. <https://wazebenelux.slack.com/account/settings|accountsinstellingen> || Indien je vragen hebt, stel ze gerust in #general  || Bedankt!',
//       lang: "nl"
//     }, {
//       template: 'Welcome <%real_name%>! You can complete your profile with your photo, function en region; f.e.: "Editor (L1) Antwerpen”. <https://wazebenelux.slack.com/account/settings|Account settings> || If you have any questions, feel free to ask them in #general  || Thanks!',
//       lang: "en"
//     }]
//   }]
// }).save().then(function (d) {
//   // console.log(d._id, d);
//   // Settings.find().then(function (d) {
//   //   console.log("settings",d,"end settings");
//   // })
// });
// console.log("listing...");

// User.find().then(function (d) {
//   console.log("settings", d, "end settings");
// })
// });

// create a bot
// var bot = new SlackBot({
//   token: config.slack.token, // Add a bot https://my.slack.com/services/new/bot and put the token
//   name: 'WazersBot'
// });

function find(arr, params) {
  var result = {};

  arr.forEach(function (item) {
    if (Object.keys(params).every(function (key) {
        return item[key] === params[key];
      })) {
      result = item;
    }
  });

  return result;
}
function getUserById(id) {
  let t = find(users, {id: id});
  if (t.name) {
    let n = t.name.indexOf('_');
    if (n > 0) {
      t.waze_name = t.name.substring(0, n);
      t.waze_rank = t.name.substring(n + 1);
    }
  }
  return t;
}
function getUserByName(name) {
  return find(users, {name: name});
}

// bot.on('open', function () {
//   // more information about additional params https://api.slack.com/methods/chat.postMessage
//   var params = {
//     icon_emoji: ':cat:'
//   };
//
//   // define channel, where bot exist. You can adjust it there https://my.slack.com/services
//   // bot.postMessageToChannel('general', 'meow!', params);
//
//   // define existing username instead of 'user_name'
//   // bot.postMessageToUser('jlsjonas_3', 'meow!', params);
//
//   // define private group instead of 'private_group', where bot exist
//   // bot.postMessageToGroup('private_test', 'meow!', params);
//   // bot.getUser("jlsjonas_3").then(function (data){
//   //     console.log("fulfilled", data);
//   //   }, // onFulfilled reaction
//   //   function(data) {console.log('rejected', data)}, // onRejected reaction
//   //   function(data) {"notified", data}  // onNotified reaction
//   // );
//   bot.getUsers().then(function (data) {
//       users = data.members;
//       // console.log("ufulfilled", data);
//     }, // onFulfilled reaction
//     function (data) {
//       console.log('rejected getting users', data)
//     }, // onRejected reaction
//     function (data) {
//       "notified", data
//     }  // onNotified reaction
//   );
// });
function askLanguagePref(userId) {
  if (!uLang[userId]) {
    bot.startPrivateConversation({user: userId}, function (err, conv) {
      if (err) {
        return console.error("PC err: ", err);
      }

      // conv.say(msg);
      conv.ask("Wat is uw voorkeurstaal?\nQuelle est votre langue préférée?\nWhat is your preferred language?" +
        "\nNederlands (nl), Français (fr) or English (en)", [
        {
          pattern: /^nl|nederlands/i,
          callback: function (response, convo) {
            convo.say('Bedankt, ik zal uw voorkeur zo goed mogelijk respecteren.');
            convo.next();
          }
        },
        {
          pattern: /^fr|french|fran[cç]ais/i,
          callback: function (response, convo) {
            convo.say('Merci, je vais respecter votre préférence chaque fois que possible');
            convo.next();

          }
        },
        {
          pattern: /^en|english|engels/i,
          callback: function (response, convo) {
            convo.say("Thanks, I'll respect your preference whenever possible");
            convo.next();
          }
        },
        {
          default: true,
          callback: function (response, convo) {
            convo.repeat();
            convo.next();
          }
        }
      ], {key: "lang"});
      conv.on('end', function (convo) {
        if (convo.status == 'completed') {
          // var res = convo.extractResponses();
          let lang = convo.extractResponse('lang');
          if (lang.length > 2) {
            switch (lang[0]) {
              case 'n':
                lang = 'nl';
                break;
              case 'f':
                lang = 'fr';
                break;
              case 'e':
                lang = 'en';
                break;
            }
          }

          if (/^en|fr|nl$/.test(lang)) {
            uLang[convo.source_message.user] = lang;
            let cUser = getUserById(convo.source_message.user);
            usersColl.findOneAndUpdate({_id: convo.source_message.user}, {
              $set: {
                lang: lang,
                is_admin: cUser.is_admin,
                waze_name: cUser.waze_name,
                email: cUser.email
              }
            }, {
              upsert: true,
              new: true
            }).then(function (err, ud) {
              if (err)
                console.error(err);
              let ui = ud.pgw;
              // console.log("findOne", ui);
              bot.api.reactions.add({
                name: "flag-" + lang,
                channel: ui.channel,
                timestamp: ui.ts
              }, function (err) {
                if (err)
                  console.log("reaction_res", err);
              });
            }, function (err) {
              console.log("not found", err);
            });
          }
        } else {
          // something happened that caused the conversation to stop prematurely
        }
      });
    });
  }
}
function fillTemplate(str, userId) {
  var user = getUserById(userId);
  return (str) ? str.replace(/<%(([^%>])*)%>/igm, function (match, p1) {
    return user[p1] || ((uLang[userId]) ? config.defaults[uLang[userId]].user : config.defaults.en.user);
  }) : "";
}
controller.on('hello', function (bot, data) {
  console.log("hello", publicChannel.id);
  bot.api.chat.postMessage({
    channel: publicChannel.id,
    text: ":waze-baby: Hi, I've just (re)connected; automatic link cleanups should work again; although you should use `/closure [level] [url] [extra info]` and/or `/l [level] [url] [extra info]`",
    as_user: true
  });
})
controller.on('user_change', function (bot, data) {
  users[users.findIndex(function (el) {
    return el.id == data.user.id;
  })] = data.user;
})
controller.on('team_join', function (bot, data) {
  users.push(data.user);
})
// controller.on('presence_change', function (bot, message) {
//   // if (message.presence == "active")
//     // askLanguagePref(message.user);
//   // console.log("hello", publicChannel.id);
//   // bot.api.chat.postMessage({channel: publicChannel.id, text: ":waze-baby: connected", as_user: true});
// })
controller.hears(['start ([^ ].*) (.*)', 'start'], 'direct_message', function (bot, message) {
  bot.reply(message, "Hi!\nThis part's still under construction, please check back later.");
  askLanguagePref(message.user);
  if (config.admins.indexOf(message.user)) {
    switch (message.match[1]) {
      case 'asklang':
        askLanguagePref(getUserByName(message.match[2]).id);
        break;
    }
    // bot.startConversation(message,function(err,conv){
    //   conv.ask()
    // })
  }
  // console.log("hello", publicChannel.id);
  // bot.api.chat.postMessage({channel: publicChannel.id, text: ":waze-baby: connected", as_user: true});
})
controller.hears('^.*?(?:L([0-7]).*?)?((?:(?:http[s]?|ftp):\/)?\/?www\.waze\.com\/[^\/]*?\/editor\/\?[^ >]*)(?:.*?L([0-7]))?.*?$', ['direct_message', 'mention', 'ambient'], function (bot, message) {
  //1 of 3 locklevel, 2 url
  // console.log("triggered", message, "Triggered", decodeURI(message.match[2]), url.parse(decodeURI(message.match[2]).replace(/&amp;/g, '&'), true));
  // bot.reply(message, "Hi!\nThis part's still under construction, please check back later.");
  // console.log("hello", publicChannel.id);

  // let cUrl = url.parse(message.match[0],true),
  //   queryKeys = Object.keys(cUrl.query);
  // for (var key in cUrl.query) {
  //   // skip loop if the property is from prototype
  //   if (!cUrl.query.hasOwnProperty(key)) continue;
  //   if(allowedUrlKeys.indexOf(key)==-1)
  //     delete cUrl.query[key];
  // }
  // let newUrl = url.format(cUrl);
  //cUser, lockLevel, cUrl, payload, intent
  prettyEditorUrl(getUserById(message.user), message.match[1] || message.match[3], url.parse(decodeURI(message.match[2]).replace(/&amp;/g, '&'), true), ":waze-baby: gebruik bij voorkeur `/closure <level> <url> <bericht>` of `/l <level> <url> <bericht>`.", "Clean url").then(function (e) {
    // console.log("res", e, "endred");
    bot.reply(message, e);
    // bot.api.chat.postMessage({
    //   channel: message.channel,
    //   text: ":waze-baby: clean url: " + newUrl + "\ngebruik `/closure <level> <url> <bericht>` of `/l <level> <url> <bericht>` voor een rijkere weergave.",
    //   as_user: true
    // });
  });
})
// bot.on('message', function(data) {
controller.on('message_received', function (bot, data) {

  // console.log(data, getUserById(data.user).name);
  // bot.reply(data, 'I heard... something!');
  // all ingoing events https://api.slack.com/rtm
  Settings.findOne({key: data.type}).then(function (key) {
    key.types.forEach(function (el) {
      // console.log(data.type, "Found: " + el.usedFor, privateGroup.id, uLang[data.user]);
      let msg = (uLang[data.user]) ? fillTemplate(find(el.templates, {lang: uLang[data.user]}).template, data.user) : "";
      if (msg == "")
        el.templates.forEach(function (t) {
          msg += fillTemplate(t.template, data.user) + "\n";
          // console.log(t.lang, "template");
        });
      // console.log(msg);
      switch (el.usedFor) {
        case 'welcomepm':
          // console.log("welcomepm loading" + data.user + " lang" + uLang[data.user]);
          bot.api.chat.postMessage({channel: data.user, text: msg, as_user: true});
          askLanguagePref(data.user);
          break;
        case 'welcomegeneral':
          bot.api.chat.postMessage({channel: publicChannel.id, text: msg, as_user: true});
          break;
        case 'privategroup':
          // console.log("PG_START")
          bot.api.chat.postMessage({
            channel: privateGroup.id,
            text: msg,
            as_user: true,
            unfurl_links: false
          }, function (err, res) {
            if (!err) {
              // console.log("webhook return", res.channel, res.ts, data.user, "end webhook return", privateGroup);
              if (uLang[data.user])
                bot.api.reactions.add({
                  name: "flag-" + uLang[data.user],
                  channel: res.channel,
                  timestamp: res.ts,
                  icon_emoji: ':waze-baby:'
                }, function (err) {
                  if (err)
                    console.log("error during set flag", err);
                });
              else
                usersColl.findOneAndUpdate({_id: data.user}, {
                  $set: {
                    pgw: {
                      channel: res.channel,
                      ts: res.ts
                    }
                  }
                }, {upsert: true}).then(function (err) {
                  if (err)
                    console.error(err);
                });
            }
          });//, {as_user: true});
          break;
        default:
          console.log("unsupported usedFor " + el.usedFor);
      }
    });
  });
  // original switch
  // switch (data.type) {
  //   case 'message':
  //     if (config.admins.indexOf(data.user)) {
  //       console.log("admin message");
  //     }
  //     break;
  //   case 'team_join':
  //     bot.say({
  //       channel: privateGroup.id,
  //       text: 'New user joined:```\n' + JSON.stringify(data.user) + '\n```',
  //       icon_emoji: ':waze-baby:'
  //     });
  //     let s = data.user.name;
  //     let n = s.indexOf('_');
  //     s = s.substring(0, n != -1 ? n : s.length);
  //     // bot.postMessage(data.user.id, "Welcome " + data.user.name + ", ... https://www.waze.com/nl/user/editor/" + s)
  //     console.log("team join", data);
  //     break;
  //   case 'bot_added':
  //     bot.say({channel: privateGroup.id, text: "New bot: <@" + data.bot.id + "|" + data.bot.name + ">"});
  // }
  // console.log(data, getUserById(data.user).name, "generic_msg");
});


/*
 * Slash command handling
 */
controller.setupWebserver(config.server_port, function (err, express_webserver) {
  controller.createWebhookEndpoints(express_webserver, ['DWINXvU7SwBe4CcjIhZYbMda', 'bTBacffEs5A4ZuxDKeuNyuIZ', 'suqfMGxEr3u58ZW0uaihYeEP']);
  // you can pass the tokens as an array, or variable argument list
  //controller.createWebhookEndpoints(express_webserver, 'AUTH_TOKEN_1', 'AUTH_TOKEN_2');
  // or
  //controller.createWebhookEndpoints(express_webserver, 'AUTH_TOKEN');
});

function prettyEditorUrl(cUser, lockLevel, cUrl, payload, intent, quote) {
  return new Promise(function (fulfill, reject) {
    lockLevel = lockLevel || 0;
    let lockBase = (lockLevel) ? "L" + lockLevel : "";
    for (var key in cUrl.query) {
      // skip loop if the property is from prototype
      if (!cUrl.query.hasOwnProperty(key)) continue;
      if (allowedUrlKeys.indexOf(key) == -1)
        delete cUrl.query[key];
    }
    delete cUrl.search;
    let newUrl = url.format(cUrl);


    geocoder.reverse({lat: cUrl.query.lat, lon: cUrl.query.lon})
      .then(function (res) {
        // console.log(res);

        geocoder.geocode(res[0].city + ", " + res[0].country)
          .then(function (resCity) {
            // console.log(resCity);
            fulfill({
              text: lockBase + (quote) ? quote : "",
              // mrkdwn: true,
              attachments: [
                {
                  fallback: lockBase + " " + newUrl + "\n" + payload,
                  color: "#36a64f",
                  pretext: payload,
                  author_name: (cUser.real_name || cUser.name) + ((cUser.waze_rank) ? " (L" + cUser.waze_rank + ")" : ""),
                  author_link: "https://www.waze.com/nl/user/editor/" + cUser.waze_name,
                  author_icon: cUser.profile.image_32,
                  title: "Waze Editor " + ((lockLevel) ? "Closure/Edit Request" : "Link") + " - " + lockBase,
                  title_link: newUrl,
                  text: res[0].formattedAddress,
                  fields: [
                    {
                      title: ((lockLevel) ? "Lock Level" : "Country"),
                      value: lockBase + "_" + res[0].countryCode,
                      short: true
                    },
                    {
                      title: ((lockLevel) ? "Region Lock" : "Region"),
                      value: lockBase + "_" + res[0].administrativeLevels.level2short,
                      short: true
                    }
                  ],
                  image_url: "http://maps.googleapis.com/maps/api/staticmap?autoscale=2&size=600x300&maptype=terrain&format=png&visual_refresh=true&markers=size:mid%7Ccolor:0xff0000%7Clabel:%7C" + cUrl.query.lat + "," + cUrl.query.lon + "&markers=size:tiny%7Ccolor:0xff0000%7Clabel:0%7C" + resCity[0].latitude + "," + resCity[0].longitude,
                  thumb_url: "https://i.imgur.com/as5Xiom.jpg",
                  footer: intent + " (" + res[0].latitude + ", " + res[0].longitude + ")",
                  footer_icon: "https://i.imgur.com/as5Xiom.jpg",
                  ts: Date.now() / 1000,
                  mrkdwn_in: ["pretext"]
                }
              ]
            });
          })
          .catch(function (err) {
            console.log(err);
            reject();
          });
      })
      .catch(function (err) {
        console.log(err);
        reject()
      });
  });
}

controller.on('slash_command', function (bot, message) {

  // reply to slash command
  // bot.replyPublic(message,'Everyone can see this part of the slash command');
  bot.replyPrivate(message, 'Pushing the right buttons...');
  // console.log("msg", message, "msgEND");

  let payload = message.text.split(" "),
    lockLevel = payload.shift().substr(-1),
    cUrl = url.parse(payload.shift(), true);
  prettyEditorUrl(getUserById(message.user_id), lockLevel, cUrl, payload.join(" "), message.command.substr(1) + " Request").then(function (e) {
    bot.replyPublicDelayed(message, e);
  });


})