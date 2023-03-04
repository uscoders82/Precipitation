const { MessageEmbed, Collection } = require('discord.js')
const fs = require('fs')

let fraudVer = "2.0 Beta"

client.fraudModes = new Collection();

function playerList(message) {
  let list = "";
  let specList = "";
  for (player of gameInfo[message.guild.id].players) {
    list = list + player.tag + "\n"
  }
  for(spec of gameInfo[message.guild.id].specs) {
    specList = specList + spec.tag + "\n"
  }
  if(specList == "") specList = "*None.*"
  let embed = new MessageEmbed()
  .setTitle("Fraud #" + gameInfo[message.guild.id].id + " [" + gameInfo[message.guild.id].mode + "] | " + message.guild.name)
  .addField("Players (" + gameInfo[message.guild.id].players.length + "/12)", list)
  .addField ("Spectators", specList)
  .setColor(host.color)
  .setFooter({text: "Fraud v" + fraudVer})
  message.channel.send({embeds: [embed]})
}

fs.readdir("./modules/fraud", function(error, files) {
  if (error) {
    fs.mkdirSync("./modules/fraud/")
    log("fraud gamemodes folder not found - creating now.", logging.warn, "fraud")
  } else {
    let modules = files.filter(f => f.split(".").pop() === "js");
    let counter = 0;
    try {
      modules.forEach((f, i) => {
        let props = require(`../modules/fraud/${f}`);
        client.fraudModes.set(props.help.typename, props)
        counter++;
      })
    } catch (err) {
      log("Sorry, but a module had an error: " + err.stack, logging.error, 3)
    }
    log("loaded " + counter + " fraud modes.", logging.success, "fraud")
  }
})

var command = {
    name: "fraud",
    desc: "Manage Fraud games.",
    args: "**(start | join | create | list | rules | leave | disband | settings)** (join: spectator | player)",
    parameters: "",
    execute: {
        discord: function(message, args) {
          let multiargs = args.split(" ")
            switch(multiargs[0].toLowerCase()) {
                case "create":
                  if(gameInfo[message.guild.id]) return message.channel.send("The game already exists, please **join** the game instead.")
                  gameInfo[message.guild.id] = {
                    players: [],
                    viewers: [],
                    specs: [],
                    list: {

                    },
                    fraud: null,
                    started: false,
                    mode: "Classic",
                    id: currentID
                  };
                  currentID++;
                  gameInfo[message.guild.id].list[message.author.id] = {
                    name: message.author.username,
                    id: message.author.id,
                    player: true,
                    tag: message.author.tag,
                    dead: false,
                    votedFor: null
                  };
                  gameInfo[message.guild.id].players.push(gameInfo[message.guild.id].list[message.author.id])
                  gameInfo[message.guild.id].viewers.push(message.author)
                  currentlyPlaying[message.author.id] = message.guild.id;
                  return message.channel.send("The game has been created, use `" + host.prefix + "fraud join` in this server to join!")
                case "join":
                  if(!gameInfo[message.guild.id]) return message.channel.send("The game does not exist yet, use `" + host.prefix + "fraud create` to create it.")
                  if(gameInfo[message.guild.id].started) return message.channel.send("Sorry, but a game is ongoing in this server. You may not join a game in progress.")
                  if(currentlyPlaying[message.author.id] == message.guild.id) return message.channel.send("You're already in this lobby.")
                  if(currentlyPlaying[message.author.id]) return message.channel.send("Sorry, but you're already in a game in another server. Please leave this game first.")
                  if(!multiargs[1]) multiargs[1] = "player"
                  gameInfo[message.guild.id].list[message.author.id] = {};
                  gameInfo[message.guild.id].list[message.author.id].name = message.author.username;
                  gameInfo[message.guild.id].list[message.author.id].id = message.author.id;
                  //gameInfo[message.guild.id].list[message.author.id].send = message.author.send;
                  gameInfo[message.guild.id].list[message.author.id].tag = message.author.tag;
                  gameInfo[message.guild.id].list[message.author.id].dead = false;
                  gameInfo[message.guild.id].list[message.author.id].votedFor = null;
                  switch(multiargs[1].toLowerCase()) {
                    case "player":
                      if(gameInfo[message.guild.id].players.length >= 12) return message.channel.send("Sorry, but the game is full.")
                      gameInfo[message.guild.id].list[message.author.id].player = true;
                      gameInfo[message.guild.id].players.push(gameInfo[message.guild.id].list[message.author.id])
                      gameInfo[message.guild.id].viewers.push(message.author)
                      break;
                    case "spectator":
                      gameInfo[message.guild.id].viewers.push(message.author)
                      gameInfo[message.guild.id].specs.push(gameInfo[message.guild.id].list[message.author.id])
                      gameInfo[message.guild.id].list[message.author.id].player = false;
                      break;
                  }
                  currentlyPlaying[message.author.id] = message.guild.id;
                  playerList(message)
                  break;
                case "start":
                  if(!gameInfo[message.guild.id]) return message.channel.send("The game does not exist yet, please use `" + host.prefix + "fraud create` to create it.")
                  if(gameInfo[message.guild.id].players[0].id != message.author.id) return message.channel.send("You are not the host, so you may not start the game.")
                  if(gameInfo[message.guild.id].started) return message.channel.send("The game has already been started!")
                  let mode = client.fraudModes.get(gameInfo[message.guild.id].mode.toLowerCase());
                  if(gameInfo[message.guild.id].players.length < mode.help.minPlayers) return message.channel.send("A minimum of " + mode.help.minPlayers + " players are required for the game to start.")
                  mode.startGame(gameInfo[message.guild.id].viewers, message.guild.id)
                  gameInfo[message.guild.id].started = true;
                  message.channel.send("Please check your DM's. The game is starting.")
                  break;
                case "list":
                  if(!gameInfo[message.guild.id]) return message.channel.send("The game does not exist yet, use `" + host.prefix + "fraud create` to create it.")
                  playerList(message)
                  break;
                case "rules":
                  let embed = new MessageEmbed()
                  .setTitle("Fraud's How to Play and Rules")
                  .addField("Roles", "There are two roles: Fraud and Innocent. The Fraud must impersonate somebody, and then act exactly like them. The Innocents must figure out who the Fraud is impersonating.")
                  .addField("Phases", "The Discussion Phase is simple: chat it out, figure it out, do whatever.\nDuring the Voting Phase, you may type `!vote <username>` in order to vote for someone. You don't even have to type their full name!\nDuring the Resting Phase, only the Fraud acts. The Fraud may use `!fraud <username>` (again, doesn't have to type the whole thing) to begin impersonation for the morning.")
                  .addField("Impersonation", "When you impersonate somebody, your messages will show up as theirs, and your votes will count as theirs. The other players will most likely figure out that you've impersonated somebody, but they must figure out WHO you've impersonated afterwards. Your objective is to act like the target you've chosen and avoid suspicion.")
                  .addField("Cheating", "It is against the rules to reveal to anyone outside of Fraud if you are impersonating someone else or if you are being impersonated.")
                  .addField("Spamming", "Typing multiple messages in very short intervals of time is considered spamming. It's annoying, and sometimes the entire game will slow down because of it.")
                  .setColor(host.color)
                  .setFooter({text: "Fraud v" + fraudVer})
                  return message.channel.send({embeds: [embed]})
                case "leave":
                  if(!currentlyPlaying[message.author.id]) return message.channel.send("You are not in a game.")
                  if(gameInfo[currentlyPlaying[message.author.id]].players.length == 1 && gameInfo[currentlyPlaying[message.author.id]].list[message.author.id].player) {
                    message.channel.send("The game has now been disbanded.")
                    gameInfo[currentlyPlaying[message.author.id]] = null;
                    currentlyPlaying[message.author.id] = null;
                  } else {
                    let nu = gameInfo[currentlyPlaying[message.author.id]].players.findIndex((user) => message.author.id == user.id);
                    gameInfo[currentlyPlaying[message.author.id]].players.splice(nu, 1)
                    nu = gameInfo[currentlyPlaying[message.author.id]].viewers.findIndex((user) => message.author.id == user.id);
                    gameInfo[currentlyPlaying[message.author.id]].viewers.splice(nu, 1)
                    nu = gameInfo[currentlyPlaying[message.author.id]].specs.findIndex((user) => message.author.id == user.id);
                    gameInfo[currentlyPlaying[message.author.id]].specs.splice(nu, 1)
                    currentlyPlaying[message.author.id] = null;
                    message.channel.send("You have left the game.")
                  }
                  break;
                case "disband":
                  if(!gameInfo[message.guild.id]) return message.channel.send("The game does not exist yet, please use `" + host.prefix + "fraud create` to create it.")
                  if(gameInfo[message.guild.id].players[0].id != message.author.id) return message.channel.send("You are not the host, so you may not disband the lobby.")
                  if(gameInfo[message.guild.id].started) return message.channel.send("The game has been started, therefore it may not be disbanded.")
                  message.channel.send("The game has now been disbanded.")
                  for(viewer of gameInfo[message.guild.id].viewers) {
                    currentlyPlaying[viewer.id] = null;
                  }
                  gameInfo[message.guild.id] = null;
                  currentlyPlaying[message.author.id] = null;
                  return;
                case "settings":
                  if(!gameInfo[message.guild.id]) return message.channel.send("The game does not exist yet, please use `" + host.prefix + "fraud create` to create it.")
                  if(!multiargs[1]) multiargs[1] = "n/a"
                  switch(multiargs[1].toLowerCase()) {
                    case "gm":
                      if(!multiargs[2]) {
                        let modeList = "";
                        client.fraudModes.each(mode => {
                          modeList = modeList + mode.help.name + "\n";
                        })
                        let embed = new MessageEmbed()
                        .setTitle("Fraud #" + gameInfo[message.guild.id].id + " >> Settings >> Game Modes | " + message.guild.name)
                        .addField("Game Modes", modeList)
                        .setColor(host.color)
                        .setFooter({text: "Fraud v" + fraudVer})
                        return message.channel.send({embeds: [embed]})
                      } else {
                        let mode = client.fraudModes.get(multiargs[2].toLowerCase());
                        if(mode) {
                          gameInfo[message.guild.id].mode = mode.help.name
                          return message.channel.send("Okay, I've changed the game mode to `" + mode.help.name + "`.")
                        } else {
                          return message.channel.send("Sorry, but this mode doesn't exist. Please use `" + host.prefix + "fraud settings gm` to see the list of game modes!")
                        }
                      }
                  }
                  let embedd = new MessageEmbed()
                  .setTitle("Fraud #" + gameInfo[message.guild.id].id + " >> Settings | " + message.guild.name)
                  .addField("Game Mode (gm)", gameInfo[message.guild.id].mode)
                  .setColor(host.color)
                  .setFooter({text: "Fraud v" + fraudVer})
                  return message.channel.send({embeds: [embedd]})
              }
        }
    },
    ver: "3.0.0",
    cat: "Fun",
    prereqs: {
        dm: false,
        owner: false,
        user: [],
        bot: []
    },
    unloadable: true
}

module.exports = command;