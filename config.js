'use strict';
let merge = require('merge'), env = process.env.NODE_ENV || 'development',
  development = {
    slack: {
      token: 'xoxb-46491662883-k5AY3jWVBzslpPYnqkrQ3OQx'
    },
    server_port: 4006,
    dburi: "mongodb://localhost/camo"
  },
  production = {
    admins: ['U16V56Z4L'],
    slack: {
      token: 'xoxb-46538763285-qlVSH3gt9nYf696ygyuhM0MH',
      privateGroup: 'wazebotchannel',
      publicChannel: 'general'
    },
    defaults: {
      en: {
        user: "user"
      },
      nl: {
        user: "gebruiker"
      },
      fr: {
        user: "utilisateur"
      }
    },
    server_port: process.env.OPENSHIFT_NODEJS_PORT || 80,
    dburi: (process.env.OPENSHIFT_MONGODB_DB_URL || "mongodb://localhost/") + "wazebot"
  };

module.exports = (env == "development") ? merge.recursive(true, production, development) : production;
