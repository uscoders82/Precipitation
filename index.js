const { Client, Intents, MessageEmbed, Permissions } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_PRESENCES] });
const fs = require('fs');
const colors = require('colors'); // yes, you can do this within the node.js console using the weird thingies. however, im lazy, i do this later lol, i just want to get this done quickly
const readline = require('readline');
const locations = require("./locations.json")
const help = require("./help.json")

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


var prefix = "pr:"
var version = "v0.2.7"
var verText = "in a flash"

var debugging = 0;

var warningStage = {};
var warnedUser = {};
var removeWarnNumber = {};

var privilegedUsers = {
  "319858536328724481": {},
  "297201585090723841": {}
}

function getTextInput(text) {
  var slurs = ["nigger", "nigga", "retard", "fag", "faggot"]
  for(let i = 0; i < slurs.length; i++) {
    if(text.toLowerCase().includes(slurs[i])) return true;
  }
  return false;
}

function processConsoleCommand() {
  rl.question('', (answer) => {
    switch (answer) {
      case "ping":
        log("Hello!\n", "output", 0)
        break;
      case "help":
        log("\nPrecipitation Help Index", "output", 3)
        log("General", "output", 1)
        log("ping", "output", 0)
        log("help", "output", 0)
        log("e\n", "output", 0)
    }
    if(answer.startsWith("e ")) {
      let cmd = answer.slice(2)
      eval(cmd)
    }
    processConsoleCommand();
  });
}

function saveConfiguration() {
  fs.writeFile('config.json', JSON.stringify(config), function (err) {
    if (!err) log("Saved settings.", "debug", 3, null)
    if (err) log("Settings couldn't be saved!", "error", 3, null)
  })
  setTimeout(saveConfiguration, 5000);
}

function log(message, type, level) {
  // debug level: will only display if the current debugging level is >= the level set on the log

  // rule of thumb:
  // level 0 debugging: should be used most of the time, will log next to nothing
  // level 1 debugging: will log specific areas that are known to cause trouble, or may not be very stable (always changing)
  // level 2 debugging: logs new changes, describes most of what the bot is doing
  // level 3 debugging: logs ALL messages that begin with the bot prefix
  let msg;
  switch (type) {
    case "error":
      msg = ("[X] " + message).brightRed
      break;
    case "warn":
      msg = ("[!] " + message).brightYellow
      break;
    case "info":
      msg = ("[i] " + message).brightBlue
      break;
    case "success":
      msg = ("[>] " + message).brightGreen
      break;
    case "unknown":
      msg = ("[?] " + message).brightCyan
      break;
    case "output":
      msg = (message).brightWhite
      break;
    case "debug":
      msg = ("[-] " + message).brightMagenta
      break;
  }
  if (type != "debug") {
    switch(level) {
      case 0:
      default:
        break;
      case 1:
        msg = msg.bold
        break;
      case 2:
        msg = msg.bold.italic
        break;
      case 3:
        msg = msg.bold.italic.underline
        break;
    }
    console.log(msg)
  } else {
    if(debugging >= level) {
      if(level == debugging) {
        console.log(msg.bold)
      } else {
        console.log(msg)
      }
    }
  }
}

function initUser(au) {
  if(!config.users[au.id]) {
    config.users[au.id] = {};
  }
  if(!config.users[au.id].birthday) {
    config.users[au.id].birthday = {};
  }
  if(!config.users[au.id].location) {
    config.users[au.id].location = {};
  }
}

function initGuild(guild) {
  if(!config.guilds[guild.id]) {
    config.guilds[guild.id] = {};
  }
  if(!config.guilds[guild.id].prefix) config.guilds[guild.id].prefix = prefix;
  if(!config.guilds[guild.id].filter) config.guilds[guild.id].filter = false;
  if(!config.guilds[guild.id].warnings) config.guilds[guild.id].warnings = {};
}

function name(user) {
  if(!config.users[user.id].name) {
    return user.username
  } else {
    return config.users[user.id].name
  }
}

function gender(user, mMessage, fMessage, oMessage, naMessage) { // male first, female second, others third
  if(mMessage && fMessage && oMessage) {
    if(naMessage) {
      if(config.users[user.id].gender == "male") return mMessage;
      if(config.users[user.id].gender == "female") return fMessage;
      if(config.users[user.id].gender == "other") return oMessage;
      if(!config.users[user.id].gender) return naMessage;
    } else {
      if(config.users[user.id].gender == "male") return mMessage;
      if(config.users[user.id].gender == "female") return fMessage;
      if(!config.users[user.id].gender || config.users[user.id].gender == "other") return oMessage;
    }
  } else {
    if(config.users[user.id].gender) {
      return config.users[user.id].gender
    } else {
      return "other";
    }
  }
}

function placeValue(num) {
  let number = parseInt(num)
  if(number.toString().endsWith("11") || number.toString().endsWith("12") || number.toString().endsWith("13")) {
    return number.toString() + "th";
  } else if(number.toString().endsWith("1")) {
    return number.toString() + "st";
  } else if(number.toString().endsWith("2")) {
    return number.toString() + "nd";
  } else if(number.toString().endsWith("3")) {
    return number.toString() + "rd";
  } else {
    return number.toString() + "th";
  }
}

function getMonth(month) {
  switch(month) {
    case 1:
      return "January";
    case 2:
      return "February";
    case 3:
      return "March";
    case 4:
      return "April";
    case 5:
      return "May";
    case 6:
      return "June";
    case 7:
      return "July";
    case 8:
      return "August";
    case 9:
      return "September";
    case 10:
      return "October";
    case 11:
      return "November";
    case 12:
      return "December";
    }
}

function getDaysInMonth(month, year) {
  let leap = (year % 100 === 0) ? (year % 400 === 0) : (year % 4 === 0);
  switch(month) {
    case 1:
      return 31;
    case 2:
      if(leap == true) {
        return 29;
      } else {
        return 28;
      }
    case 3:
      return 31;
    case 4:
      return 30;
    case 5:
      return 31;
    case 6:
      return 30;
    case 7:
      return 31;
    case 8:
      return 31;
    case 9:
      return 30;
    case 10:
      return 31;
    case 11:
      return 30;
    case 12:
      return 31;
    default:
      return "invalid month"
  }
}

function toProperUSFormat(month, day, year) {
  return getMonth(month) + " " + placeValue(day) + ", " + year;
}

function getLocationFormat(user) {
  if(!config.users[user.id].location.continent) return "Please set a continent first."
  if(config.users[user.id].location.city) return config.users[user.id].location.city + ", " + config.users[user.id].location.state + ", " + config.users[user.id].location.country
  if(config.users[user.id].location.state) return config.users[user.id].location.state + ", " + config.users[user.id].location.country
  if(config.users[user.id].location.country) {
    if(config.users[user.id].location.country == "Western" || config.users[user.id].location.country == "Eastern" || config.users[user.id].location.country == "Northern" || config.users[user.id].location.country == "Southern") {
      return config.users[user.id].location.country + " " + config.users[user.id].location.continent;
    }
    return config.users[user.id].location.country
  } else {
    return config.users[user.id].location.continent
  }
}

function find(query, when, many, whatToReturn) {
  if(when == "list") {
    let users = client.users.cache
    let list = "";
    let amount = 0;
    let returnValue = 0;
    users.each(user => {
      if(user.tag.toLowerCase().startsWith(query)) {
        if(amount < many) {
          list = list + user.username + "\n"
          amount = amount + 1;
        } else {
          returnValue++;
        }
      }
    })
    if(whatToReturn == "list") {
      if(list == "") {
        return "No results were found."
      } else {
        return list;
      }
    } else if(whatToReturn == "amount") {
      if(returnValue == 0) {
        return "";
      } else {
        return " || There are " + returnValue + " results not shown -- please narrow your query."
      }
    }
  } else if (when == "first") {
    let users = client.users.cache
    let userReturn;
    let amount = 0;
    users.each(user => {
      if(user.tag.toLowerCase().startsWith(query)) {
        if(amount < 1) {
          userReturn = user;
          amount++;
        }
      }
    })
    if(userReturn == null) return null;
    return userReturn;
  }
}

client.on('ready', () => {
  log('Precipitation has started!', "success", 1, null)
  client.user.setActivity(version + " || " + prefix + "help")
  setTimeout(saveConfiguration, 5000)
  processConsoleCommand();
})

if(!fs.existsSync('./config.json')) {
  log('config.json does not exist. Creating now.', "warn", 0, null)
  var config = {
    "guilds": {

    },﻿
    "users": {

    },
    "general": {
      "token": ""
    }
  };
  fs.writeFile('config.json', JSON.stringify(config), function (err) {
    if (err) throw err;
    log('config.json has been created.', "success", 0, null)
    rl.question("Please paste the token: ", (answer) => {
      config.general.token = answer;
      client.login(config.general.token)
    });
  })
} else {
  var config = JSON.parse(fs.readFileSync("./config.json"));
  client.login(config.general.token)
}

client.on('messageCreate', message => {
  initGuild(message.guild)
  if(warningStage[message.author.id] == 1) {
    warningStage[message.author.id] = 0;
    if(!Array.isArray(config.guilds[message.guild.id].warnings[warnedUser[message.author.id].id])) config.guilds[message.guild.id].warnings[warnedUser[message.author.id].id] = [];
    if(message.content == "cancel") return message.channel.send("Okay, I won't warn " + gender(warnedUser[message.author.id], "him", "her", "them", "them") + ".")
    if(getTextInput(message.content) == true) return message.channel.send("Sorry, but I personally won't warn for any offensive reason.")
    if(message.content.length > 200) return message.channel.send("That's too long of a reason, please shorten it.")
    console.log(config.guilds[message.guild.id].warnings[warnedUser[message.author.id].id])
    config.guilds[message.guild.id].warnings[warnedUser[message.author.id].id].push(message.content)
    return message.channel.send("Okay, I've warned " + gender(warnedUser[message.author.id], "him", "her", "them", "them") + " for \"" + message.content + "\".")
  } else if(warningStage[message.author.id] == 2) {
    if(message.content == "y" || message.content == "yes") {
      config.guilds[message.guild.id].warnings[warnedUser[message.author.id].id].splice(removeWarnNumber[message.author.id] - 1, 1)
      warningStage[message.author.id] = 0
      return message.channel.send("Okay, I've removed this warning from " + gender(warnedUser[message.author.id], "him", "her", "them", "them") + ".")
    }
    warningStage[message.author.id] = 0;
    return message.channel.send("Okay, cancelling.")
  }
  if (config.guilds[message.guild.id].filter == true && getTextInput(message.content) == true) {
    message.channel.messages.fetch(message.id).then(message => message.delete())
    if(message.author.id != client.user.id) message.author.send("Hey, " + name(message.author) + "!\n\nThis server has banned very offensive words. Please refrain from using these words.")
  }
  var messagePrefix;
  if (message.content.startsWith("<@!" + client.user.id + ">")) {
    messagePrefix = "<@!" + client.user.id + ">"
  } else {
    messagePrefix = config.guilds[message.guild.id].prefix
  }
  if (message.content.toLowerCase().startsWith(messagePrefix) && !message.author.bot) {
    initUser(message.author)
    var fCommand = message.content.slice(messagePrefix.length).split(" ")
    while(fCommand[0] == "") {
      fCommand.shift();
    }
    var command = fCommand[0]
    if(command == undefined) return message.channel.send("Sorry, but it appears this command is unknown.") // crash otherwise
    var args = message.content.slice(messagePrefix.length + fCommand[0].length + 1)
    var parameters = args.split("--")
    var parameter = parameters[1]
    if(!parameter) parameter = "raelynn is really cute" // bot breaks because "toLowerCase()" may not exist
    switch(command.toLowerCase()) {
      // ping command
      case "ping":
        let user = name(message.author)
        let raelynnTooCute = Math.floor(Math.random() * 7)
        let pingMessage;
        switch (raelynnTooCute) {
          case 0:
            pingMessage = "Pinging..."
            break;
          case 1:
            pingMessage = "yeah i got you"
            break;
          case 2:
            pingMessage = "awooga"
            break;
          case 3:
            pingMessage = "i'm so random and quirky!!!"
            break;
          case 4:
            pingMessage = "ew are you a pisces? that makes you satan!"
            break;
          case 5:
            pingMessage = "i'm a scorpio so it makes sense for me to kill my whole family"
            break;
          case 6:
            pingMessage = "pay my onlyfans"  // Why only lowercase?
            break;
        }
        let startTime = Date.now();
        message.channel.send("<:ping_receive:502755206841237505> " + pingMessage).then(function(message) {
          switch(parameter) { // I'm aware you cannot combine the two. I'm sorry, that's how it is for now.
            case "no-name":
              message.edit("<:ping_transmit:502755300017700865> (" + (Date.now() - startTime) + "ms) Hey!")
              break;
            case "client-ping":
              message.edit("<:ping_transmit:502755300017700865> (" + Math.round(client.ws.ping) + "ms) Hey, " + user + "!");
              break;
            default:
              message.edit("<:ping_transmit:502755300017700865> (" + (Date.now() - startTime) + "ms) Hey, " + user + "!");
          }
        })
        break;

      // help command
      case "help":
        let cmdHelp = args.toLowerCase()
        switch(cmdHelp) {
          case "ping":
          case "help":
          case "ver":
          case "version":
          case "about":
          case "name":
          case "gender":
          case "birthday":
          case "location":
          case "placevalue":
          case "find":
          case "uinfo":
          case "rm":
          case "purge":
          case "uptime":
          case "config":
          case "warn":
          case "lswarn":
          case "rmwarn":
            let commandHelpEmbed = new MessageEmbed()
            .setTitle("Precipitation Index || " + config.guilds[message.guild.id].prefix + cmdHelp)
            .addFields(
              { name: "Description", value: help.commandHelp[cmdHelp].description},
              { name: "Syntax", value: config.guilds[message.guild.id].prefix + cmdHelp + " " + help.commandHelp[cmdHelp].syntax}
            )
            .setColor("BLUE")
            .setFooter({ text: 'Precipitation ' + version + " || [] denotes a parameter, () denotes an argument, bolded is REQUIRED."});
            return message.channel.send({embeds: [commandHelpEmbed]})
          default:
            let helpEmbed = new MessageEmbed()
            helpEmbed.setTitle("Precipitation Index")
            helpEmbed.setDescription('List of all commands -- use `' + config.guilds[message.guild.id].prefix + '` before all commands!')
            /*for(section in help.commandList) {
              console.log(section)
              helpEmbed.addField(section, section.commands, true)
            }*/
            // if anyone can figure this out, please make a pr :D
            .addFields(
              { name: "General", value: "ping\nhelp\nversion\nabout\nuptime", inline: true },
              { name: "Personalization", value: "name\ngender\nbirthday\nlocation", inline: true },
              { name: "Alpha", value: "placevalue", inline: true },
              { name: "Moderation", "value": "find\nuinfo\nrm\nconfig\nwarn\nlswarn\nrmwarn", inline: true }
            )
            if(parameter == "easter-eggs") helpEmbed.addField("Secrets", "bitches", true)
            helpEmbed.setColor("BLUE")
            helpEmbed.setFooter({ text: 'Precipitation ' + version });
            return message.channel.send({embeds: [helpEmbed]})
        }

      // version command
      case "ver":
      case "version":
        if(parameter.toLowerCase() == "no-ver-text") return message.channel.send("Precipitation " + version)
        return message.channel.send("Precipitation " + version + ": " + verText + ".");

      // about command
      case "about":
        let aboutEmbed = new MessageEmbed()
        .setTitle("Precipitation " + version)
        .setDescription('Kinda cool hybrid moderation-fun bot')
        .addFields(
          { name: "Creator", value: "**raina#7847** - bot developer\n**arcelo#8442** - bug finder" },
          { name: "Version Support", value: "**Current Stable**: gets all updates after dev build"}
        )
        .setColor("BLUE")
        .setFooter({ text: 'Precipitation ' + version });
        return message.channel.send({embeds: [aboutEmbed]});

      // placevalue command
      case "placevalue":
        if(isNaN(parseInt(args))) return message.channel.send("Please input a number.")
        if(args.includes(".")) return message.channel.send("This will still work with the decimal, but please exclude it. I'm picky, okay?")
        return message.channel.send(placeValue(args))

      // name command
      case "name":
        if(args.length >= 75) return message.channel.send("That's too long of a name.")
        if((args.includes("<@") && args.includes(">")) || args.includes("@everyone") || args.includes("@here")) return message.channel.send("Nice try.")
        if(getTextInput(args) == true) return message.channel.send("Hey, I'm not going to yell out offensive words.")
        if(args == "") {
          config.users[message.author.id].name = null;
          return message.channel.send("Sure, I'll refer to you by your username.")
        }
        config.users[message.author.id].name = args;
        return message.channel.send("Sure, I'll refer to you by \"" + name(message.author) + "\".")

      // gender command
      case "gender":
        let cmdGender;
        switch(args) {
          case "female":
          case "she/her":
          case "f":
            cmdGender = "female";
            break;
          case "male":
          case "he/him":
          case "m":
            cmdGender = "male";
            break;
          case "other":
          case "they/them":
          case "o":
            cmdGender = "other";
            break;
          default:
            cmdGender = "n/a"
        }
        if (cmdGender == "n/a") {
          cmdGender = "other";
          message.channel.send("I'll just set your gender to **other**. If you'd rather not be, please use \"female\" or \"male.\"")
        } else {
          message.channel.send("Sure thing, I'll refer to you as **" + cmdGender + "**.")
        }
        config.users[message.author.id].gender = cmdGender;
        break;

      // bitches easter egg i love you raelynn
      case "bitches":
        if(args == "") return message.channel.send("Sorry, but it appears this command is unknown."); // nobody has to know ;)
        if(args.length >= 50) return message.channel.send("Sorry, but it appears this command is unknown.");
        if((args.includes("<@") && args.includes(">")) || args.includes("@everyone") || args.includes("@here")) return message.channel.send("Sorry, but it appears this command is unknown.");
        if(getTextInput(args) == true) return message.channel.send("I think that's a little too far..")
        return message.channel.send("how bout you go " + args + " some bitches?")

      // birthday command
      case "birthday":
        let cmd = args.split("/");
        let year = new Date().getFullYear();
        let list = "Please:\n";
        if(!cmd[0] || !cmd[1] || !cmd[2]) {
          if(!cmd[0]) {
            list = list + "- input an argument"
          } else {
            list = list + "- separate your birthday with slashes\n"
          }
        } else {
          if(isNaN(parseInt(cmd[0])) || isNaN(parseInt(cmd[1])) || isNaN(parseInt(cmd[2]))) {
            list = list + "- only include numbers\n"
          }
          if(cmd.length != 3) {
            list = list + "- only have three numbers separated by slashes\n"
          }
          if(cmd[0].includes("-") || cmd[1].includes("-") || cmd[2].includes("-")) {
            list = list + "- remove the negative sign\n"
          }
          if(cmd[0].includes(".") || cmd[1].includes(".") || cmd[2].includes(".")) {
            list = list + "- remove the decimal\n"
          }
          if(getDaysInMonth(parseInt(cmd[0]), cmd[2]) == "invalid month") {
            list = list + "- give a valid month between 1-12\n"
          }
          if(getDaysInMonth(parseInt(cmd[0]), parseInt(cmd[2])) < parseInt(cmd[1])) {
            list = list + "- make sure the month hasn't already ended\n"
          }
          if(parseInt(cmd[2]) > year || parseInt(cmd[2]) < 1903) {
            list = list + "- ensure you input the correct birthday\n"
          }
        }
        if(list == "Please:\n") {
          message.channel.send("Okay, I will set your birthday as " + toProperUSFormat(parseInt(cmd[0]), parseInt(cmd[1]), parseInt(cmd[2])) + ".")
          config.users[message.author.id].birthday.month = parseInt(cmd[0]);
          config.users[message.author.id].birthday.day = parseInt(cmd[1]);
          config.users[message.author.id].birthday.year = parseInt(cmd[2]);
        } else {
          message.channel.send(list)
        }
        break;

      // location command
      case "location":
        if(args == "continent") return message.channel.send("Please re-run the command with your continent afterwards.")
        if(args == "country") return message.channel.send("Please re-run the command with a country.")
        let doubleArgs;
        if(fCommand[1]) doubleArgs = message.content.slice(messagePrefix.length + fCommand[1].length + fCommand[0].length + 2)
        if(fCommand[1] == "continent") {
          let continent;
          switch(doubleArgs.toLowerCase()) {
            case "north america":
            case "na":
              continent = "North America";
              break;
            case "south america":
            case "sa":
              continent = "South America";
              break;
            case "europe":
            case "eu":
              continent = "Europe";
              break;
            case "africa":
              continent = "Africa";
              break;
            case "asia":
              continent = "Asia";
              break;
            case "oceania":
            case "australia":
              continent = "Oceania";
              break;
            case "antarctica":
              continent = "Antarctica";
              break;
            default:
              continent = "n/a"
          }
          if(continent == "n/a") return message.channel.send("Please enter a valid continent.")
          config.users[message.author.id].location.city = null;
          config.users[message.author.id].location.state = null;
          config.users[message.author.id].location.country = null;
          config.users[message.author.id].location.continent = continent;
          return message.channel.send("Okay, I'm setting your continent to **" + continent + "**.")
        } else if(fCommand[1] == "country") {
          switch(doubleArgs.toLowerCase()) {
            case "us":
            case "united states":
            case "america":
            case "united states of america":
            case "usa":
              config.users[message.author.id].location.country = "United States";
              break;
            case "west":
            case "western":
              if(!config.users[message.author.id].location.continent) return message.channel.send("Please set your continent first.")
              config.users[message.author.id].location.country = "Western";
              break;
            case "east":
            case "eastern":
              if(!config.users[message.author.id].location.continent) return message.channel.send("Please set your continent first.")
              config.users[message.author.id].location.country = "Eastern";
              break;
            case "north":
            case "northern":
              if(!config.users[message.author.id].location.continent) return message.channel.send("Please set your continent first.")
              config.users[message.author.id].location.country = "Northern";
              break;
            case "south":
            case "southern":
              if(!config.users[message.author.id].location.continent) return message.channel.send("Please set your continent first.")
              config.users[message.author.id].location.country = "Southern";
              break;
            case "australia":
            case "au":
              config.users[message.author.id].location.country = "Australia";
              break;
            case "germany":
            case "german":
              config.users[message.author.id].location.country = "Germany";
              break;
            case "norway":
              config.users[message.author.id].location.country = "Norway";
              break;
            case "canada":
              config.users[message.author.id].location.country = "Canada";
              break;
            case "colombia":
              config.users[message.author.id].location.country = "Colombia";
              break;
            case "philippines":
              config.users[message.author.id].location.country = "Philippines";
              break;
            case "indonesia":
              config.users[message.author.id].location.country = "Indonesia";
              break;
            case "united kingdom":
            case "uk":
            case "britain":
            case "britian":
            case "gb":
            case "great britain":
              config.users[message.author.id].location.country = "United Kingdom";
              break;
            case "sweden":
              config.users[message.author.id].location.country = "Sweden";
              break;
            case "mexico":
              config.users[message.author.id].location.country = "Mexico";
              break;
            case "argentina":
              config.users[message.author.id].location.country = "Argentina";
              break;
            case "czech":
            case "czech republic":
            case "czechoslovakia":
              config.users[message.author.id].location.country = "Czech Republic";
              break;
            case "new zealand":
            case "nz":
              config.users[message.author.id].location.country = "New Zealand";
              break;
            default:
              return message.channel.send("Please enter a valid country.")
          }
          config.users[message.author.id].location.city = null;
          config.users[message.author.id].location.state = null;
          if(config.users[message.author.id].location.country == "Western" || config.users[message.author.id].location.country == "Eastern" || config.users[message.author.id].location.country == "Northern" || config.users[message.author.id].location.country == "Southern") return message.channel.send("Okay, I've set it so you are from **" + config.users[message.author.id].location.country + " " + config.users[message.author.id].location.continent + "**.")
          if(config.users[message.author.id].location.country != "Western" && config.users[message.author.id].location.country != "Eastern") config.users[message.author.id].location.continent = locations.countries[config.users[message.author.id].location.country].continent
          return message.channel.send("Okay, I'm setting your country to **" + config.users[message.author.id].location.country + "**.")
        } else if (fCommand[1] == "state") {
          switch(doubleArgs.toLowerCase()) {
            case "arizona":
            case "az":
              config.users[message.author.id].location.state = "Arizona";
              break;
            case "texas":
            case "tx":
              config.users[message.author.id].location.state = "Texas";
              break;
            case "california":
            case "ca":
              config.users[message.author.id].location.state = "California";
              break;
            case "oregon":
            case "or":
              config.users[message.author.id].location.state = "Oregon";
              break;
            case "new mexico":
            case "nm":
              config.users[message.author.id].location.state = "New Mexico";
              break;
            case "ohio":
            case "oh":
              config.users[message.author.id].location.state = "Ohio";
              break;
            case "pennsylvania":
            case "pa":
              config.users[message.author.id].location.state = "Pennsylvania";
              break;
            case "bavaria":
            // case "az":
              config.users[message.author.id].location.state = "Bavaria";
              break;
            case "nj":
            case "new jersey":
              config.users[message.author.id].location.state = "New Jersey";
              break;
            case "nh":
            case "new hampshire":
              config.users[message.author.id].location.state = "New Hampshire";
              break;
            case "ct":
            case "connecticut":
              config.users[message.author.id].location.state = "Connecticut";
              break;
            case "vasdo":
            case "vasdø":
              config.users[message.author.id].location.state = "Vasdø";
              break;
            case "queensland":
              config.users[message.author.id].location.state = "Queensland";
              break;
            case "tasmania":
              config.users[message.author.id].location.state = "Tasmania";
              break;
            case "london":
              config.users[message.author.id].location.state = "London"
              break;
            case "ny":
            case "new york":
              config.users[message.author.id].location.state = "New York"
              break;
            case "ma":
            case "massachusetts":
              config.users[message.author.id].location.state = "Massachusetts"
              break;
            default:
              return message.channel.send("Please enter a valid state.")
          }
          config.users[message.author.id].location.city = null;
          config.users[message.author.id].location.continent = locations.states[config.users[message.author.id].location.state].continent
          config.users[message.author.id].location.country = locations.states[config.users[message.author.id].location.state].country
          return message.channel.send("Okay, I'm setting your state to **" + config.users[message.author.id].location.state + "**.")
        } else if (fCommand[1] == "city") {
          switch(doubleArgs.toLowerCase()) {
            case "phoenix":
            case "px":
              config.users[message.author.id].location.city = "Phoenix"
              break;
            case "glendale":
              config.users[message.author.id].location.city = "Glendale"
              break;
            case "surprise":
              config.users[message.author.id].location.city = "Surprise"
              break;
            case "buckeye":
              config.users[message.author.id].location.city = "Buckeye"
              break;
            case "portland":
              config.users[message.author.id].location.city = "Portland"
              break;
            case "munich":
              config.users[message.author.id].location.city = "Munich";
              break;
            case "los angeles":
            case "la":
              config.users[message.author.id].location.city = "Los Angeles"
              break;
            case "ontario":
              config.users[message.author.id].location.city = "Ontario"
              break;
            default:
              return message.channel.send("Please enter a valid city.")
          }
          config.users[message.author.id].location.continent = locations.cities[config.users[message.author.id].location.city].continent
          config.users[message.author.id].location.country = locations.cities[config.users[message.author.id].location.city].country
          config.users[message.author.id].location.state = locations.cities[config.users[message.author.id].location.city].state
          return message.channel.send("Okay, I'm setting your city to **" + config.users[message.author.id].location.city + "**.")
        } else if(fCommand[1] == "province") {
          switch(doubleArgs.toLowerCase()) {
            case "banten":
              config.users[message.author.id].location.state = "Banten"
              break;
            default:
              return message.channel.send("Please enter a valid province.")
          }
          config.users[message.author.id].location.city = null;
          config.users[message.author.id].location.continent = locations.states[config.users[message.author.id].location.state].continent
          config.users[message.author.id].location.country = locations.states[config.users[message.author.id].location.state].country
          return message.channel.send("Okay, I'm setting your province to **" + config.users[message.author.id].location.state + "**.")
        }
        let locationHelp = new MessageEmbed()
        .setTitle("Precipitation " + version + " Locations")
        .setDescription('Just use ' + config.guilds[message.guild.id].prefix + 'location continent [location] to set!')
        .addFields(
          { name: "Continents", value: "North America\nSouth America\nEurope\nAfrica\nAsia\nOceania\nAntarctica", inline: true },
          { name: "Countries", value: "United States\nAustralia\nNorway\nGermany\nCanada\nColombia\nPhilippines", inline: true },
          { name: "States", value: "Arizona\nTexas\nCalifornia\nOregon\nBavaria", inline: true },
          { name: "Cities", value: "Phoenix\nGlendale\nSurprise\nMunich\nLos Angeles\nOntario", inline: true },
          { name: "Provinces", value: "Banten"}
        )
        .setColor("BLUE")
        .setFooter({ text: 'Precipitation ' + version });
        return message.channel.send({embeds: [locationHelp]})

      // find command
      case "find":
        if(!args) return message.channel.send("Please input a parameter.")
        let findList = new MessageEmbed()
        .setTitle("Precipitation " + version + " Query")
        .addFields(
          { name: "Results", value: find(args.toLowerCase(), "list", 10, "list")}
        )
        .setColor("BLUE")
        .setFooter({ text: 'Precipitation ' + version  + find(args.toLowerCase(), "list", 10, "amount")});
        return message.channel.send({embeds: [findList]})

      // uinfo command
      case "uinfo":
        let uinfoUser;
        if(!args) uinfoUser = message.author;
        if(args) uinfoUser = find(args.toLowerCase(), "first", null, "list")
        if(uinfoUser == null) return message.channel.send("Please type a valid user.")
        initUser(uinfoUser)
        let userBirthday;
        if(config.users[uinfoUser.id].birthday.month == undefined) {
          userBirthday = "*not set*"
        } else {
            userBirthday = toProperUSFormat(config.users[uinfoUser.id].birthday.month, config.users[uinfoUser.id].birthday.day, config.users[uinfoUser.id].birthday.year)
        }
        let userLocation;
        if(config.users[uinfoUser.id].location.continent == undefined) {
          userLocation = "*not set*";
        } else {
          userLocation = getLocationFormat(uinfoUser)
        }
        let uinfoMember;
        message.guild.members.cache.each(member => {
          if(uinfoUser.id == member.id) {
            return uinfoMember = member;
          }
        })
        let joinedAt;
        let nickname;
        if (!uinfoMember) {
          joinedAt = "*not in server*"
          nickname = "*not in server*"
        } else {
          joinedAt = uinfoMember.joinedAt;
          if(uinfoMember.nickname) {
            nickname = uinfoMember.nickname;
          } else {
            nickname = "*not set*"
          }
        }
        let uinfo = new MessageEmbed()
        .setTitle("User Information || " + uinfoUser.tag)
        .addFields(
          { name: "Account Dates", value: "**Creation Date**: " + uinfoUser.createdAt + "\n**Join Date**: " + joinedAt, inline: true },
          { name: "Names", value: "**Username**: " + uinfoUser.username + "\n**Nickname**: " + nickname },
          { name: "Bot Info", value: "**Name**: " + name(uinfoUser) + "\n**Gender**: " + gender(uinfoUser, "Male", "Female", "Other", "*not set*") + "\n**Birthday**: " + userBirthday + "\n**Location**: " + userLocation }
        )
        .setColor("BLUE")
        .setFooter({ text: 'Precipitation ' + version });
        return message.channel.send({embeds: [uinfo]})

      // uptime command
      case "uptime":
        var time;
        var uptime = parseInt(client.uptime);
        uptime = Math.floor(uptime / 1000);
        var minutes = Math.floor(uptime / 60);
        var seconds = Math.floor(uptime);
        var hours = 0;
        var days = 0;
        while (seconds >= 60) {
            seconds = seconds - 60;
        }
        while (minutes >= 60) {
            hours++;
            minutes = minutes - 60;
        }
        while (hours >= 24) {
          days++;
          hours = hours - 24;
        }
        return message.channel.send("Precipitation has been online for " + days + " days, " + hours + " hours, " + minutes + " minutes, and " + seconds + " seconds.");

      // rm command
      case "rm":
      case "purge":
        if(parseInt(args) == 0) return message.channel.send("Okay, I didn't delete any messages.")
        let purgeList = "Please:\n";
        if(!message.member.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) purgeList = purgeList + "- ensure you have permissions\n"
        if(!message.guild.me.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) purgeList = purgeList + "- ensure I have permissions\n"
        if(isNaN(parseInt(args))) purgeList = purgeList + "- insert a number\n"
        if(parseInt(args) > 99) purgeList = purgeList + "- ensure the number you've inputted is between 1-99."
        if(purgeList == "Please:\n") {
          if(parseInt(args) == 1) {
            return message.channel.bulkDelete(parseInt(2)).then(() => {
              message.channel.send("Okay, I've deleted the above message. (really?)")
            })
          }
          return message.channel.bulkDelete(parseInt(args) + 1).then(() => {
            message.channel.send("Okay, I've deleted " + args + " messages.")
          })
        }
        return message.channel.send(purgeList)

      // config command
      case "config":
        if(!message.member.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) return message.channel.send("You don't have the proper permissions to perform this action.")
        let cArg = args.split(" ")
        switch(cArg[0].toLowerCase()) {
          case "prefix":
            if(getTextInput(cArg[1])) return message.channel.send("Maybe set a prefix that's a little less offensive?")
            config.guilds[message.guild.id].prefix = cArg[1].toLowerCase()
            return message.channel.send("Okay, I've set your server prefix to `" + cArg[1].toLowerCase() + "`.");

          case "filter":
            if(cArg[1].toLowerCase() == "true") {
              if(!message.guild.me.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) return message.channel.send("I don't have the permissions to delete messages, so I won't turn on the filter.")
              config.guilds[message.guild.id].filter = true;
              return message.channel.send("Okay, I'm setting your filter to `true`.");
            } else {
              config.guilds[message.guild.id].filter = false;
              return message.channel.send("Okay, I'm setting your filter to `false`.");
            }

          default:
            let configuration = new MessageEmbed()
            .setTitle("Server Configuration || " + message.guild.name)
            .addFields(
              { name: "Prefix (prefix)", value: config.guilds[message.guild.id].prefix },
              { name: "Slur Filter (filter)", value: (config.guilds[message.guild.id].filter).toString() }
            )
            .setColor("BLUE")
            .setFooter({ text: 'Precipitation ' + version });
            return message.channel.send({embeds: [configuration]})
        }

      case "warn":
        if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_NICKNAMES)) return message.channel.send("You don't have the required permissions to perform this action.")
        if (!args) return message.channel.send("Please input a user.")
        let uUser = find(args.toLowerCase(), "first", null, "list")
        if (uUser == null) return message.channel.send("Please input a valid user.")
        if(uUser.id == client.user.id) return message.channel.send("What did I do? :(")
        let userMember;
        message.guild.members.cache.each(member => {
          if(uUser.id == member.id) {
            return userMember = member;
          }
        })
        initUser(uUser)
        if(!config.guilds[message.guild.id].warnings[uUser.id]) config.guilds[message.guild.id].warnings[uUser.id] = [];
        if(!userMember) return message.channel.send("This user does exist, but they are not in the server.")
        if(config.guilds[message.guild.id].warnings[uUser.id].length > 9) return message.channel.send("Sorry, but Precipitation currently only supports up to 9 warnings. (this is because of lswarn...things will get spammy without pages real fast.)")
        warningStage[message.author.id] = 1;
        warnedUser[message.author.id] = uUser;
        return message.channel.send("Please give a reason for warning " + uUser.tag + " (" + name(uUser) + ").");

      case "lswarn":
        if(!args) {
          let warnings = config.guilds[message.guild.id].warnings[message.author.id];
          if(warnings == undefined || warnings.length == 0) return message.channel.send("You have no warnings.")
          let warningEmbed = new MessageEmbed()
          .setTitle("Warnings List for " + message.author.tag)
          .setColor("BLUE")
          .setFooter({ text: 'Precipitation ' + version })
          for(let i = 0; i < warnings.length; i++) {
            warningEmbed.addField("Warning #" + (i + 1), "*" + warnings[i] + "*")
          }
          return message.channel.send({embeds: [warningEmbed]})
        } else {
          if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_NICKNAMES)) return message.channel.send("You don't have the required permissions to perform this action.")
          let listUser = find(args.toLowerCase(), "first", null, "list")
          let warnings = config.guilds[message.guild.id].warnings[listUser.id];
          if(warnings == undefined || warnings.length == 0) return message.channel.send("User does not exist, or they have no warnings.")
          let getWarnings;
          if(listUser) {
            message.guild.members.cache.each(member => {
              if(listUser.id == member.id) {
                return getWarnings = member;
              }
            })
            initUser(listUser)
          }
          if(!getWarnings) return message.channel.send("Please ensure the user is in the server.")
          let warningEmbed = new MessageEmbed()
          .setTitle("Warnings List for " + listUser.tag)
          .setColor("BLUE")
          .setFooter({ text: 'Precipitation ' + version })
          for(let i = 0; i < warnings.length; i++) {
            warningEmbed.addField("Warning #" + (i + 1), "*" + warnings[i] + "*")
          }
          return message.channel.send({embeds: [warningEmbed]})
        }

      case "rmwarn":
        let purgeWarningList = "Please:\n";
        if(!args) purgeWarningList = purgeWarningList + "- enter an argument\n"
        let numArgs = (args.split(" "))[0]
        let newArgs = args.slice(numArgs.length + 1)
        if(!newArgs[0]) purgeWarningList = purgeWarningList + "- enter a user\n"
        let removeUser = find(newArgs.toLowerCase(), "first", null, "first")
        if (removeUser == null) purgeWarningList = purgeWarningList + "- ensure your user exists\n"
        let rmMember;
        if(removeUser) {
          message.guild.members.cache.each(member => {
            if(removeUser.id == member.id) {
              return rmMember = member;
            }
          })
          initUser(removeUser)
        }
        if(!rmMember) purgeWarningList = purgeWarningList + "- ensure your user is in the server\n"
        if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_NICKNAMES)) purgeWarningList = purgeWarningList + "- ensure you have the current permissions\n"
        if(removeUser) {
          if(!config.guilds[message.guild.id].warnings[removeUser.id]) config.guilds[message.guild.id].warnings[removeUser.id] = [];
          if (isNaN(parseInt(numArgs)) || parseInt(numArgs) < 1 || parseInt(numArgs) > config.guilds[message.guild.id].warnings[removeUser.id].length) purgeWarningList = purgeWarningList + "- enter a valid number\n"
        } else {
          if (isNaN(parseInt(numArgs)) || parseInt(numArgs) < 1) purgeWarningList = purgeWarningList + "- enter a valid number\n"
        }
        if(purgeWarningList != "Please:\n") return message.channel.send(purgeWarningList)
        warnedUser[message.author.id] = removeUser;
        warningStage[message.author.id] = 2;
        removeWarnNumber[message.author.id] = numArgs;
        return message.channel.send("Removing warning #" + numArgs + " from " + removeUser.username + ". Are you sure?")

      default:
        message.channel.send("Sorry, but it appears this command is unknown.");
    }
  }
})
