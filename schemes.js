'use strict';
/**
 * Created by jonas on 29/05/16.
 */
var Document = require('camo').Document;
var EmbeddedDocument = require('camo').EmbeddedDocument;

/**
 * actual template used to construct the message, language parameter should be respected if available
 */
class Template extends EmbeddedDocument {
  constructor() {
    super();

    this.template = {
      type: String,
      required: true,
      validate: function (el) {
        return !/(<%(?!(name|real_name|wazename|id|color|tz|profile.email)%>).*?%>)/igm.test(el);
      }
    };
    this.lang = {
      type: String,
      choices: ["en", "nl", "fr", "de"]
    };
  }

  static collectionName() {
    return 'template';
  }
}
/**
 * container for templates, per destination
 * allows a pm to triggering user + message in a public and/or private channel; or any combination thereof
 */
class TypeTemplate extends EmbeddedDocument {
  constructor() {
    super();

    this.usedFor = {
      type: String,
      required: true,
      choices: ["welcomepm", "welcomegeneral", "privategroup"]
    }
    this.templates = [Template]
  }

  static collectionName() {
    return 'typeTemplate';
  }
}

/**
 * Base "settings" document, key is linked to (slack) events
 */
class Settings extends Document {
  constructor() {
    super();

    this.name = {
      type: String,
      unique: true
    };
    this.key = {
      type: [String],
      required: true,
      // choices: ["team_join","user_typing"],
      default: ["team_join"]
    }
    this.types = [TypeTemplate];
    this.createdAt = {
      type: Date,
      default: Date.now
    };
  }

  static collectionName() {
    return 'settings';
  }
}
global.Settings = Settings;


/**
 * possible User scheme, currently unused (camo had update issues)
 */
class User extends Document {
  constructor() {
    super();

    this.uid = {
      type: String,
      unique: true
    };
    this.team_id = String;
    this.name = String;
    this.lang = {
      type: String//,
      // choices: ['nl','fr','en','de']
    }
    this.color = String;
    this.real_name = String;
    this.tz = String;
    this.waze_name = String;
    this.email = String;
    this.skype = String;
    this.image_72 = String;
    this.pgw = {
      channel: String,
      ts: String
    };
    // this.profile = Profile;
    this.is_admin = Boolean;
    this.is_owner = Boolean;
    this.is_primary_owner = Boolean;
    this.is_bot = Boolean;

    this.createdAt = {
      type: Date,
      default: Date.now
    };
  }

  static collectionName() {
    return 'user';
  }
}
global.User = User;
