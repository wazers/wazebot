'use strict';
// var SlackBot = require('slackbots');
var config = require('./config'),
  connect = require('camo').connect,
  MongoClient = require('mongodb').MongoClient,
  exec = require('child_process').exec,
  Botkit = require('botkit'),
  url = require('url'),
  Twit = require('twit'),
  allowedUrlKeys = ["env", "lon", "lat", "zoom", "segments", "nodes", "cameras", "mapUpdateRequest", "mapProblem", "venues"],
// mongoStorage = require('botkit-storage-mongo')({mongoUri: 'mongodb://localhost/botkit'}),
  controller = Botkit.slackbot({
    // storage: mongoStorage,
    debug: (process.env.CI),
    port: config.server_port
    //include "log: false" to disable logging
    //or a "logLevel" integer from 0 to 7 to adjust logging verbosity
  }),
  T = new Twit({
    consumer_key: process.env.TWITTER_KEY || "",
    consumer_secret: process.env.TWITTER_SECRET || "",
    app_only_auth: true
  }),
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express(),
  geocoderProvider = 'google', httpAdapter = 'http';
// optional
/*var extra = {
 apiKey: 'YOUR_API_KEY', // for Mapquest, OpenCage, Google Premier
 formatter: null         // 'gpx', 'string', ...
 };*/

var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter);//, extra);

var users, channels, groups, team, privateGroup, publicChannel, uLang = {};
// connect the bot to a stream of messages
var deleteBot = controller.spawn({
  token: process.env.SLACK_TEST_TOKEN || process.env.SLACK_TOKEN || config.slack.token || ""
});
var bot = controller.spawn({
  token: process.env.SLACK_TOKEN || config.slack.token || "",
  incoming_webhook: {
    url: "https://hooks.slack.com/services/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"
  }
}).startRTM(function (err, bot, payload) {
  if (err) {
    return console.log('Could not connect to Slack');
  }
  users = payload.users;
  channels = payload.channels;
  groups = payload.groups;
  team = payload.team;
  privateGroup = find(groups, {name: config.slack.privateGroup || 'private_test'});
  publicChannel = find(channels, {name: config.slack.publicChannel || 'general'});
  // console.log("payload", payload, "end payload");
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
    throw new Error(err);
  console.log("Connected correctly to server");
  usersColl = db.collection('users');
  //TODO embed in users[]
  usersColl.find().forEach(function (u) {
    uLang[u._id] = u.lang;
  });
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
    let n = t.name.lastIndexOf('_');
    if (n > 0) {
      t.waze_name = t.name.substring(0, n);
      t.waze_rank = t.name.substring(n + 1);
    } else
      t.waze_name = t.name;
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
        return console.warn("PC err: ", err);
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
                console.warn(err);
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
function fillTemplate(str, data) {
  return (str) ? str.replace(/<%(([^%>])*)%>/igm, function (match, p1) {
    return data[p1] || ((uLang[data.id]) ? config.defaults[uLang[data.id]][p1] : config.defaults.en[p1]) || "unknown " + p1;
  }) : "";
}
controller.on('hello', function (bot, data) {
  console.log("hello", publicChannel.id);
  exec("git log -1 --pretty='`%s` by `%cN`' | cat", function (error, stdout, stderr) {
    if (error || stderr)
      console.warn(error || stderr);
    bot.api.chat.postMessage({
      channel: publicChannel.id,
      text: ":waze-baby: Hi, I've just (re)connected; automatic link cleanups should work again; although you should use `/closure [level] [url] [extra info]` and/or `/l [level] [url] [extra info]`" +
      ((stdout) ? "\nLast change: " + stdout : "") +
      ((process.env.CI) ? "\nTesting " + process.env.SNAP_COMMIT_SHORT + " stage " + process.env.SNAP_STAGE_NAME + " on *" + process.env.SNAP_BRANCH + "* branch" : ""),
      as_user: true
    });
  });
  exec("git log -1 --pretty='`%s` by <mailto:%cE|%cN>%n%-b%nSigned by: %GS %G?%nNotes: %N' | cat", function (error, stdout, stderr) {
    if (error || stderr)
      console.warn(error || stderr);
    bot.api.chat.postMessage({
      channel: privateGroup.id,
      text: ":waze-baby: Hi, I've just (re)connected; automatic link cleanups should work again; although you should use `/closure [level] [url] [extra info]` and/or `/l [level] [url] [extra info]`" +
      ((stdout) ? "\nLast change: " + stdout : ""),
      as_user: true
    });
  });
  if (process.env.CI) {
    deleteBot.api.chat.postMessage({
      channel: privateGroup.id,
      text: "Testing message, automated. https://www.waze.com/editor?env=row&lon=3.61973&lat=50.87647&zoom=3&segments=212456725%2C212456726%2C212457016%2C88111055%2C191987044%2C151451961%2C88141039&mapUpdateRequest=6241911 https://twitter.com/WazeBelgium/status/740174249604812804 an example message including both a tweet (with quote) and an editor url. L1",
      as_user: true
    }, function (err, msg) {
      if (err || (msg && !msg.ok))
        throw new Error('Unable to send test message using SLACK_TEST_TOKEN');
      console.log(msg);
    });
    setTimeout(function () {
      bot.api.chat.postMessage({
        channel: privateGroup.id,
        text: "Connected for 15 seconds, ending connection.",
        as_user: true
      });
      bot.closeRTM();
      console.log("RTM connection closing...");
      setTimeout(function () {
        bot.destroy();
        console.log("Bot destroyed, ending process");
        process.exit(0);
      }, 2500);
      app.server.close(function () {
        console.log('Stopped listening on ' + config.server_port);
      });
    }, 15000);
  }
})
controller.on('rtm_open', function (bot, data) {
  console.log("rtm opened", data);
})
controller.on('rtm_close', function (bot, data) {
  console.log("rtm closed", data);
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
  console.log(message.match[1], message.match[2], "from", message.user, config.admins.indexOf(message.user));
  if (config.admins.indexOf(message.user) > -1) {
    switch (message.match[1]) {
      case 'asklang':
        let usern = getUserByName(message.match[2]);
        console.log(usern, "asklang", message.match[1], message.match[2])
        askLanguagePref(usern.id);
        break;
    }
    // bot.startConversation(message,function(err,conv){
    //   conv.ask()
    // })
  }
  // console.log("hello", publicChannel.id);
  // bot.api.chat.postMessage({channel: publicChannel.id, text: ":waze-baby: connected", as_user: true});
})
controller.hears('^((?:.|\n)*?)(?:L([0-7])((?:.|\n)*?))?<?((?:(?:https?|ftp):\/)?\/?(?:www\.)?waze\.com(?:\/[^\/]*?)?\/editor\/?\?[^\n >]*)>?((?:.|\n)*?)?(?:L([0-7])((?:.|\n)*)?)?$', ['direct_message', 'mention', 'ambient'], function (bot, message) {
  deleteBot.api.chat.delete({
    channel: message.channel,
    ts: message.ts,
    as_user: true
  }, function (err, res) {
    if (err)
      if (process.env.CI)
        throw new Error("error deleting message", err, res);
      else {
        deleteBot.api.reactions.add({
          name: "down",
          channel: message.channel,
          ts: message.ts,
          as_user: true
        }, function (err) {
          if (err)
            if (process.env.CI)
              throw new Error("error adding reaction to message", err);
            else {
              console.log("error during adding reaction, original message already removed?", err, message.channel, message.ts);
            }
        });
        console.log("error during remove, adding reaction", err, message.channel, message.ts);
      }
  });
  //2 of 6 locklevel, 4 url
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
  let lockLevel = message.match[2] || message.match[6],
    rawUrl = decodeURI(message.match[4]).replace(/&amp;/g, '&');
  prettyEditorUrl(getUserById(message.user), lockLevel,
    url.parse(rawUrl, true),
    (message.match[1] + ((message.match[2]) ? "L" + message.match[2] : "") + message.match[3] + message.match[5] + ((message.match[6]) ? "L" + message.match[6] : "") + message.match[7]).replace(/undefined/g, ""),
    "Clean url",
    ((process.env.SLACK_TEST_TOKEN) ? "" : ":waze-baby: gebruik bij voorkeur `/closure` of `/l`." +
    "\nVoorbeeld: `/l " + ((lockLevel) ? lockLevel : "1") + " https://waze.com/edit...153&lat=50.9419 extra informatie`"))
    .then(function (e) {
      bot.reply(message, e);
    }).catch(function (err) {
    console.log("pretty-error", err);
    bot.reply(message, message);
    if (process.env.CI)
      throw new Error('Failed to prettify message', err, message);
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
      let msg = (uLang[data.user]) ? fillTemplate(find(el.templates, {lang: uLang[data.user]}).template, getUserById(data.user)) : "";
      if (msg == "")
        el.templates.forEach(function (t) {
          msg += fillTemplate(t.template, getUserById(data.user)) + "\n";
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
                    console.warn(err);
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
// controller.setupWebserver(config.server_port, function (err, app) {
var static_dir = __dirname + '/public';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(static_dir));
app.server = app.listen(
  config.server_port,
  config.server_ip,
  function () {
    console.log('** Starting webserver on ' +
      ((config.server_ip) ? config.server_ip + ':' : 'port ') +
      config.server_port);
  });
// if (typeof config.server_ip === "undefined")
//   console.warn('No OPENSHIFT_NODEJS_IP environment variable');
controller.createWebhookEndpoints(app, ['DWINXvU7SwBe4CcjIhZYbMda', 'bTBacffEs5A4ZuxDKeuNyuIZ', 'suqfMGxEr3u58ZW0uaihYeEP']);
// you can pass the tokens as an array, or variable argument list
//controller.createWebhookEndpoints(express_webserver, 'AUTH_TOKEN_1', 'AUTH_TOKEN_2');
// or
//controller.createWebhookEndpoints(express_webserver, 'AUTH_TOKEN');
// });

function getLangStringByKey(key, lang, templateData) {
  if (!lang)
    lang = config.slack.defaultLang;
  return new Promise(function (fulfill, reject) {
    Settings.findOne({key: key}).then(function (key) {
      key.types.forEach(function (el) {
        // console.log(data.type, "Found: " + el.usedFor, privateGroup.id, uLang[data.user]);
        let msg = fillTemplate(find(el.templates, {lang: lang}).template, templateData);
        if (msg == "")
          el.templates.forEach(function (t) {
            msg += fillTemplate(t.template, templateData) + "\n";
            // console.log(t.lang, "template");
          });
        // console.log(msg);
        // console.log("welcomepm loading" + data.user + " lang" + uLang[data.user]);
        fulfill(msg);
        // bot.api.chat.postMessage({channel: data.user, text: msg, as_user: true});
      });
    }, function (err) {
      reject("Missing string for key: " + key + ", report this to @jlsjonas.");
    });
  });
}


function prettyEditorUrl(cUser, lockLevel, cUrl, payload, intent, quote) {
  return new Promise(function (fulfill, reject) {
    lockLevel = (lockLevel > 0) ? lockLevel : false;
    let lockBase = (lockLevel) ? "L" + lockLevel : "",
      lockFull = (lockLevel) ? "Level " + lockLevel + ", " : "",
      lockDesc = (lockLevel) ? lockBase + "_" : "",
      lockMark = (lockLevel) ? lockBase + "!" : "",
      warningMessage = "",
      cSegments = (cUrl.query.segments) ? cUrl.query.segments.split(",").length : 0,
      cNodes = (cUrl.query.nodes) ? cUrl.query.nodes.split(",").length : 0,
      cCameras = (cUrl.query.cameras) ? cUrl.query.cameras.split(",").length : 0,
      cUR = cUrl.query.mapUpdateRequest,
      cMP = cUrl.query.mapProblem,
      cVen = cUrl.query.venues,
      longPayload = payload.length > config.longPayloadMin;
    for (var key in cUrl.query) {
      // skip loop if the property is from prototype
      if (!cUrl.query.hasOwnProperty(key)) continue;
      if (allowedUrlKeys.indexOf(key) == -1)
        delete cUrl.query[key];
    }
    if (cUrl.query.zoom < 3 && (cSegments || cNodes || cCameras)) {
      warningMessage += "\n:warning: Url contained zoom " + cUrl.query.zoom + " and " + ((cSegments) ? "segments" : (cNodes) ? "nodes" : (cCameras) ? "cameras" : "") + ", zoom set to 3 :warning:";
      cUrl.query.zoom = 3;
    }
    delete cUrl.search;
    cUrl.pathname = "/editor";
    let newUrl = url.format(cUrl);


    geocoder.reverse({lat: cUrl.query.lat, lon: cUrl.query.lon})
      .then(function (res) {

        geocoder.geocode(res[0].city + ", " + res[0].country)
          .then(function (resCity) {
            let whosFirst = (res[0].administrativeLevels.level2short && res[0].administrativeLevels.level2short)
                ? res[0].administrativeLevels.level2short.length < res[0].administrativeLevels.level1short.length : false,
              twitterMatch = payload.match(/<?https?:\/\/twitter\.com\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+)>?/i);
            if (twitterMatch)
              payload = payload.replace(twitterMatch[0], "");
            let retMsg = {
              text: lockDesc + ((whosFirst) ? res[0].administrativeLevels.level2short : res[0].administrativeLevels.level1short || res[0].countryCode) +
              " <@" + cUser.id + ">: " + ((longPayload) ? "_" : "") +
              payload.substr(0, (payload.indexOf("\n") > 0) ? payload.indexOf("\n") : config.longPayloadMin) + ((longPayload) ? "..._" : "") + "\n" +
              ((lockLevel) ? "" : lockFull + "Region: ") + lockDesc + res[0].city + " " + lockDesc +
              ((res[0].administrativeLevels.level2short) ? (whosFirst) ? res[0].administrativeLevels.level1short : res[0].administrativeLevels.level2short : "") + " " +
              lockDesc + res[0].countryCode,
              mrkdwn: true,
              unfurl_links: true,
              attachments: [
                {
                  fallback: "<" + newUrl + "|" + "Go to the editor> " + lockBase + "\n" + payload,
                  color: "#439FE0",
                  pretext: ((quote) ? ">" + quote : "") + warningMessage,//Slack profile: <@" + cUser.id + ">",
                  author_name: (cUser.real_name || cUser.name) + ((cUser.waze_rank) ? " (L" + cUser.waze_rank + ")" : ""),
                  author_link: "<@" + cUser.id + ">",//"https://www.waze.com/nl/user/editor/" + cUser.waze_name,
                  author_icon: cUser.profile.image_32,
                  title: "Go to the Waze Editor - " + ((lockLevel) ? "Closure/Edit/Unlock Request - " : "Link") + lockMark,
                  title_link: newUrl,
                  text: (longPayload) ? payload : "",
                  fields: [
                    {
                      value: "*Area* " + res[0].formattedAddress
                    },
                    {
                      value: "*" + ((cUrl.query.nodes) ? cNodes + " node" + ((cNodes > 1) ? "s" : "") :
                        ((cSegments > 0) ? cSegments + " segment" + ((cSegments > 1) ? "s" : "") :
                          (cUrl.query.cameras) ? cCameras + " camera" + ((cCameras > 1) ? "s" : "") :
                            ((cVen) ? "Place" : "No selection"))) + ((cUR || cMP) ? "* and a" : "*") +
                      ((cUR) ? "n *Update Request*" : "") + ((cMP) ? " *Map Problem*" : "")
                    }
                  ],
                  // image_url: "http://maps.googleapis.com/maps/api/staticmap?autoscale=2&size=400x175&maptype=terrain&format=png&visual_refresh=true&markers=size:mid%7Ccolor:0xff0000%7Clabel:%7C" + cUrl.query.lat + "," + cUrl.query.lon + "&markers=size:tiny%7Ccolor:0xff0000%7Clabel:0%7C" + resCity[0].latitude + "," + resCity[0].longitude,
                  thumb_url: "http://maps.googleapis.com/maps/api/staticmap?autoscale=2&size=75x75&maptype=terrain&format=png&visual_refresh=true&markers=size:mid%7Ccolor:0xff0000%7Clabel:%7C" + cUrl.query.lat + "," + cUrl.query.lon + "&markers=size:tiny%7Ccolor:0xff0000%7Clabel:0%7C" + resCity[0].latitude + "," + resCity[0].longitude,//"https://i.imgur.com/as5Xiom.jpg",
                  footer: intent + " (" + res[0].latitude + ", " + res[0].longitude + ")" +
                  ", <https://www.waze.com/nl/user/editor/" + cUser.waze_name + "|Waze profile>",
                  footer_icon: "https://i.imgur.com/as5Xiom.jpg",
                  // ts: Date.now() / 1000,
                  mrkdwn_in: ["pretext", "text", "fields"]
                }
              ]
            };
            if (twitterMatch) {
              T.get('statuses/show/:id', {id: twitterMatch[2]})
                .catch(function (err) {
                  console.log('caught error', err.stack);
                  fulfill(retMsg);
                })
                .then(function (res) {
                  try {
                    let tres = res.data;
                    tres.text = tres.text.replace(/@(\w+)(?: |\n|$)/g, "<https://twitter.com/$1|$&>");
                    console.log(tres);
                    retMsg.attachments.push({
                      fallback: "Tweet: " + tres.text + "\nFrom:" + tres.user.screen_name,
                      color: "#55acee",
                      author_icon: tres.user.profile_image_url,
                      author_link: tres.user.url,
                      author_name: tres.user.name + " @" + tres.user.screen_name,
                      text: ((tres.possibly_sensitive) ? "\n\nPossibly sensitive tweet,\nplease click on _Read more_ to view\n\n\n" : "") +
                      tres.text + ((tres.quoted_status) ? "\n><https://twitter.com/" + tres.quoted_status.user.screen_name +
                      "|@" + tres.quoted_status.user.screen_name + ">:\n> " + tres.quoted_status.text : ""),
                      footer: "<https://twitter.com/" + tres.user.screen_name + "/status/" + tres.id_str + "|" +
                      ((tres.retweeted) ? "Retweet" : "Tweet") + ">",
                      footer_icon: "https://g.twimg.com/about/feature-corporate/image/twitterbird_RGB.png",
                      ts: new Date(tres.created_at) / 1000,
                      mrkdwn_in: ["text"]
                    });
                    fulfill(retMsg);
                  } catch (e) {
                    console.log("twitter parse error", e);
                  }
                });
            } else
              fulfill(retMsg);
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
