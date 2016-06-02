'use strict';
let merge = require('merge'), env = process.env.NODE_ENV || 'development',
  development = {
    server_port: 4006,
    server_ip: "0.0.0.0",
    dburi: "mongodb://localhost/camo"
  },
  production = {
    admins: ['U16V56Z4L'],
    slack: {
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
    server_port: parseInt(process.env.OPENSHIFT_NODEJS_PORT) || 80,
    server_ip: process.env.OPENSHIFT_NODEJS_IP,
    dburi: (process.env.OPENSHIFT_MONGODB_DB_URL || "mongodb://localhost/") + "wazebot"
  };

module.exports = (env == "development") ? merge.recursive(true, production, development) : production;
