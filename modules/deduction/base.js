let fs = require('fs')
const { MessageEmbed } = require('discord.js');

const roles = require('../../data/tm.json');

                     // 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
const majorityCounts = [0, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7]

function roleRevealResults(role, death) {
  if(!death) {
    // Citizen, Merchant, Saboteur, or Outcast
    // Detective, Agent, or Psychopath
    // Hunter, Interrogator, or Hitman 
    // Doctor, Framer, or Serial Killer
    switch(role.toLowerCase()) {
      case "citizen":
      case "merchant":
      case "saboteur":
      case "outcast":
        return "Citizen, Merchant, Saboteur, or Outcast";
      case "detective":
      case "agent":
      case "psychopath":
        return "Detective, Agent, or Psychopath";
      case "hunter":
      case "interrogator":
      case "hitman":
        return "Hunter, Interrogator, or Hitman";
      case "doctor":
      case "framer":
      case "serial killer":
        return "Doctor, Framer, or Serial Killer";
    }
  } else {
    switch(role) {

    }
  }
}

function dayCycle(guID) {
  // phases:
  // 0 = discussion
  // 1 = voting
  // 2 = rest
  // 3 = justice
  // 8 = revoting
  let phase = new MessageEmbed();
  switch(gameInfo[guID].phase) {
    case -2: // begin day
      gameInfo[guID].phase = 0;
      sendMessage("**The sun begins to rise.**", gameInfo[guID].viewers)
      setTimeout(dayCycle, 5000, guID);
      break;
    case -1: // if there are deaths, announce them
    case 0: // begin discussion phase
      gameInfo[guID].phase++;
      let timer;
      if(gameInfo[guID].day == 0) { // first discussion phase is shorter
        timer = "10s";
        gameInfo[guID].phase = 2; // skip voting on first day
        setTimeout(dayCycle, 10000, guID);
      } else {
        timer = "45s";
        setTimeout(dayCycle, 45000, guID);
      }
      phase.setTitle("Day " + (gameInfo[guID].day + 1) + " - Discussion Phase - " + timer)
      phase.setColor("GREEN")
      if(gameInfo[guID].day == 0) {
        phase.setDescription("Nothing's happened, have a quick chat!")
      } else {
        phase.setDescription("Figure out who the Spies are!")
      }
      sendMessage({embeds: [phase]}, gameInfo[guID].viewers)
      break;
    case 1: // begin voting phase
      gameInfo[guID].phase++;
      phase.setTitle("Day " + (gameInfo[guID].day + 1) + " - Voting Phase - 30s")
      phase.setDescription("Vote for who you think the Spies are with `!vote`! You don't even have to type their full name!")
      phase.setColor("YELLOW")
      sendMessage({embeds: [phase]}, gameInfo[guID].viewers)
      setTimeout(dayCycle, 30000, guID)
      break;
    case 2: // begin rest phase
      gameInfo[guID].guilties = [];
      gameInfo[guID].innocents = [];
      gameInfo[guID].phase = 6;
      gameInfo[guID].trials = 2;
      gameInfo[guID].votesAgainst = {};
      for(player of gameInfo[guID].players) {
        gameInfo[guID].votesAgainst[player.id] = [];
        gameInfo[guID].list[player.id].votedFor = null;
      }
      phase.setTitle("Day " + (gameInfo[guID].day + 1) + " - Night - 40s")
      phase.setColor("BLUE")
      phase.setDescription("Use your night abilities! `!target` is how most roles will perform. (you'll see a message otherwise.)")
      sendMessage({embeds: [phase]}, gameInfo[guID].viewers)
      setTimeout(dayCycle, 40000, guID)
      gameInfo[guID].day++;
      break;
    case 6:
      for(user of gameInfo[guID].viewers) { // first priority
        if(!gameInfo[guID].list[viewer.id].player) return;
        if(!gameInfo[guID].queued[viewer.id] && gameInfo[guID].list[viewer.id].role.name != "Outcast") return user.send("You did not perform your night ability.") // outcasts do not have a night ability
        switch(gameInfo[guID].list[viewer.id].role) {
          case roles.properties.spies.saboteur:
            gameInfo[guID].list[gameInfo[guID].queued[viewer.id]].saboteured = true;
            break;
          case roles.properties.spies.framer:
            gameInfo[guID].list[gameInfo[guID].queued[viewer.id]].framed = true;
            break;
        }
      }
      for(user of gameInfo[guID].viewers) { // second priority
        if(!gameInfo[guID].list[viewer.id].player) return;
        switch(gameInfo[guID].list[viewer.id].role) {
          case roles.properties.city.detective:
            if(gameInfo[guID].list[gameInfo[guID].queued[viewer.id]].saboteured) return user.send(gameInfo[guID].queued[viewer.id].username + "'s doorknob was completely broken off! You decide to return home.")
            let results = roleRevealResults(gameInfo[guID].list[gameInfo[guID].queued[viewer.id].id].role.name)
            if(gameInfo[guID].list[gameInfo[guID].queued[viewer.id].id].framed) results = roleRevealResults("Framer");
            user.send("You have concluded that " + gameInfo[guID].queued[viewer.id].username + " could be a **" + results + "**.")
            break;
          case roles.properties.city.doctor:
            if(gameInfo[guID].list[gameInfo[guID].queued[viewer.id]].saboteured) return user.send(gameInfo[guID].queued[viewer.id].username + "'s doorknob was completely broken off! You decide to return home.")
            gameInfo[guID].list[gameInfo[guID].queued[viewer.id]].healed = true;
            gameInfo[guID].list[gameInfo[guID].queued[viewer.id]].attackers = 0;
            break;
          case roles.properties.spies.agent:
            user.send("You have determined that " + gameInfo[guID].queued[viewer.id].username + " is a **" + gameInfo[guID].list[gameInfo[guID].queued[viewer.id].id].role.name + "**.")
            break;
        }
      }
      for(user of gameInfo[guID].viewers) { // third priority
        if(!gameInfo[guID].list[viewer.id].player) return;
        switch(gameInfo[guID].list[viewer.id].role) {
          case roles.properties.spies.hitman:
            gameInfo[guID].list[gameInfo[guID].queued[viewer.id]].attackers++;
            gameInfo[guID].list[gameInfo[guID].queued[viewer.id]].methods.push("shot by a gun");
            break;
          case roles.properties.neutral.serialkiller:
            if(gameInfo[guID].list[gameInfo[guID].queued[viewer.id]].saboteured) return user.send(gameInfo[guID].queued[viewer.id].username + "'s doorknob was completely broken off! You decide to return home.")
            gameInfo[guID].list[gameInfo[guID].queued[viewer.id]].attackers++;
            gameInfo[guID].list[gameInfo[guID].queued[viewer.id]].methods.push("stabbed with a knife");
            break;
          case roles.properties.city.hunter:
            if(gameInfo[guID].list[gameInfo[guID].queued[viewer.id]].marked) {
              gameInfo[guID].list[gameInfo[guID].queued[viewer.id]].attackers++;
              gameInfo[guID].list[gameInfo[guID].queued[viewer.id]].methods.push("shot by a gun");
            } else {
              if(gameInfo[guID].list[gameInfo[guID].queued[viewer.id]].saboteured) return user.send(gameInfo[guID].queued[viewer.id].username + "'s doorknob was completely broken off! You decide to return home.")
              gameInfo[guID].list[gameInfo[guID].queued[viewer.id]].marked = true;
              user.send(gameInfo[guID].queued[viewer.id].username + " has successfully been marked for death.")
            }
            break;
        }
      }
      gameInfo[guID].phase = -2;
      setTimeout(dayCycle, 5000, guID)
      break;
    case 8: // secondary voting
      gameInfo[guID].guilties = [];
      gameInfo[guID].innocents = [];
      gameInfo[guID].phase = 2;
      gameInfo[guID].votesAgainst = {};
      for(player of gameInfo[guID].players) {
        gameInfo[guID].votesAgainst[player.id] = [];
        gameInfo[guID].list[player.id].votedFor = null;
      }
      phase.setTitle("Day " + (gameInfo[guID].day + 1) + " - Voting Phase - 15s")
      phase.setDescription("Vote for who you think the Spies are with `!vote`! You don't even have to type their full name!")
      phase.setColor("ORANGE")
      sendMessage({embeds: [phase]}, gameInfo[guID].viewers)
      setTimeout(dayCycle, 15000, guID)
      break;
  }
}

function win(guID, team) {
  gameInfo[guID].started = false;
  switch(team) {
    case 0: // fuck all lmao
    case 1:
    case 2:
      return sendMessage("**WIN!**", gameInfo[guID].viewers);
  }
}

function transitionTrial(guID) {
  // 3 = defense
  // 4 = judgement
  // 5 = death
  switch(gameInfo[guID].phase) {
    case 3:
      gameInfo[guID].phase++;
      setTimeout(transitionTrial, 45000, guID)
      break;
    case 4:
      gameInfo[guID].phase++;
      sendMessage("**The fate of " + gameInfo[guID].trial.username + " lies in our hands.**\n\n`!guilty` - provides a guilty vote\n`!innocent` - provides an innocent vote\n`!cancel` - cancels any vote you submitted", gameInfo[guID].viewers)
      setTimeout(transitionTrial, 15000, guID)
      break;
    case 5:
      if(gameInfo[guID].guilties.length > gameInfo[guID].innocents.length) {
        sendMessage("**GUILTY!** " + gameInfo[guID].trial.username + " has been executed by a vote of " + gameInfo[guID].guilties.length + "-" + gameInfo[guID].innocents.length + ".", gameInfo[guID].viewers)
        gameInfo[guID].dead.push(gameInfo[guID].trial)
        gameInfo[guID].list[gameInfo[guID].trial.id].dead = true;
        gameInfo[guID].aliveCount = gameInfo[guID].aliveCount - 1;
        sendMessage("**" + gameInfo[guID].trial.username + "'s role was " + gameInfo[guID].list[gameInfo[guID].trial.id].role.name + ".**", gameInfo[guID].viewers)
        gameInfo[guID].phase = 2
        setTimeout(dayCycle, 5000, guID)
        return;
      } else {
        if(gameInfo[guID].trials == 1) gameInfo[guID].phase = 8;
        if(gameInfo[guID].trials == 0) gameInfo[guID].phase = 2;
        setTimeout(dayCycle, 5000, guID)
        return sendMessage("**INNOCENT!** " + gameInfo[guID].trial.username + " has been pardoned by a vote of " + gameInfo[guID].innocents.length + "-" + gameInfo[guID].guilties.length + ".", gameInfo[guID].viewers)
      }
  }
}

function startGame(viewers, guildID) {
  gameInfo[guildID].day = 0;
  gameInfo[guildID].phase = -2;
  gameInfo[guildID].spies = [];
  //gameInfo[guildID].dead = gameInfo[guildID].specs;
  gameInfo[guildID].dead = [];
  gameInfo[guildID].queued = {};
  for (viewer of gameInfo[guildID].viewers) {
    if (!gameInfo[guildID].list[viewer.id].player) {
      gameInfo[guildID].dead.push(viewer)
      gameInfo[guildID].list[viewer.id].dead = true;
    } else {
      gameInfo[guildID].list[viewer.id].dead = false;
    }
  }
  gameInfo[guildID].trial = null;
  gameInfo[guildID].aliveCount = gameInfo[guildID].players.length;
  gameInfo[guildID].trials = 2;
  gameInfo[guildID].votesAgainst = {};
  let rolesToAssign = lists[String(gameInfo[guildID].players.length)];
  for(player of viewers) { // assign roles!
    gameInfo[guildID].votesAgainst[player.id] = [];
    gameInfo[guildID].queued[player.id] = null;
    gameInfo[guildID].list[player.id].methods = []
    if(!gameInfo[guildID].list[player.id].dead) {
      let rng = Math.floor(Math.random() * rolesToAssign.length)
      gameInfo[guildID].list[player.id].role = rolesToAssign[rng];
      log(gameInfo[guildID].list[player.id].role, logging.warn, "test")
      let embedd = new MessageEmbed()
      .setTitle(gameInfo[guildID].list[player.id].role.name)
      switch(gameInfo[guildID].list[player.id].role.alignment.split(" ")[0].toLowerCase()) {
        case "city":
          embedd.setColor(roles.properties.city.color)
          embedd.addField("Goal", roles.properties.city.goal, true)
          break;
        case "spy":
          embedd.setColor(roles.properties.spies.color)
          embedd.addField("Goal", roles.properties.spies.goal, true)
          gameInfo[guildID].spies.push(player)
          break;
        case "neutral":
          embedd.setColor(gameInfo[guildID].list[player.id].role.color)
          embedd.addField("Goal", gameInfo[guildID].list[player.id].role.goal, true)
          break;
      }
      embedd.addField("Alignment", gameInfo[guildID].list[player.id].role.alignment, true)
      embedd.addField("Abilities", gameInfo[guildID].list[player.id].role.abilities)
      embedd.addField("Artifacts", gameInfo[guildID].list[player.id].role.artifacts)
      player.send({embeds: [embedd]})
      rolesToAssign.splice(rng, 1)
    } else {
      let embedd = new MessageEmbed()
      .setTitle("Spectator")
      .setColor("GRAY")
      .addField("Goal", "Enjoy the show.", true)
      .addField("Alignment", "Neutral", true)
      .addField("Abilities", "- You are able to talk with other spectators.")
      .addField("Artifacts", "- You are unable to interact with the game.\n- You may talk with the other dead.")
      player.send({embeds: [embedd]})
    }
  }
  dayCycle(guildID)
}
module.exports.startGame = startGame;

client.on('messageCreate', function(message) {
  if(message.author.id == client.user.id) return;
  if(message.guild) return;
  if(!currentlyPlaying[message.author.id]) return;
  let currentGame = gameInfo[currentlyPlaying[message.author.id].id];
  if(currentGame.mode != "Base") return;
  if(!currentGame.started) {
    let prefix = "!";
    if(message.content.startsWith(prefix)) {
      let command = message.content.slice(prefix.length)
      switch(command) {
        case "help":
          return message.channel.send("Hello! Here are a quick few commands you can run in the lobby:\n\nhelp - see the list of commands\nlist - see the player list")
        case "list":
          playerList(message)
          return;
        case "start":
          if(!currentlyPlaying[message.author.id].public) return message.channel.send("You may only vote to start the game in public lobbies.")
          if(currentGame.players.length < 4) return message.channel.send("You may not vote to start the game with under 4 players.")
          if(getTextInput(message.author.id, currentGame.votes, 2)) return message.channel.send("You've already voted to start the game early.")
          currentGame.votes.push(message.author.id)
          sendMessage("**" + message.author.username + " has voted to start the game early.** " + (majorityCounts[currentGame.players.length] - currentGame.votes.length) + " more votes to start the game.", currentGame.viewers);
          if(majorityCounts[currentGame.players.length] - currentGame.votes.length == 0) {
            startGame(gameInfo[currentlyPlaying[message.author.id].id].viewers, currentlyPlaying[message.author.id].id)
            gameInfo[currentlyPlaying[message.author.id].id].started = true;
          }
          return;
      }
    }
    sendMessage("**" + message.author.username + "**: " + message.content, currentGame.viewers);
    return;
  }
  if(currentGame.list[message.author.id].dead) return sendMessage("*" + message.author.username + ": " + message.content + "*", currentGame.dead)
  switch(currentGame.phase) {
    case -2:
    case -1:
    case 0:
      return;
    case 2:
    case 8:
      if(message.content.startsWith("!vote ")) {
        let target = message.content.toLowerCase().slice(6)
        let submitted = false;
        for(user of currentGame.viewers) {
          if(user.name.toLowerCase().includes(target)) {
            //if(message.author.id == user.id) return; // cant vote for yourself
            for(let i = 0; i < currentGame.votesAgainst[user.id].length; i++) {
              if(currentGame.votesAgainst[user.id][i] == message.author.id) return; // dont allow votes again
            }
            if(getTextInput(user, currentGame.dead, 2)) return; // don't allow votes for dead/spectators
            if(currentGame.list[message.author.id].votedFor) {
              let n = currentGame.votesAgainst[currentGame.list[message.author.id].votedFor].findIndex((userID) => message.author.id == userID);
              currentGame.votesAgainst[currentGame.list[message.author.id].votedFor].splice(n, 1)
            }
            currentGame.votesAgainst[user.id].push(message.author.id) // submit vote
            submitted = true;
          }
          if(submitted) break;
        }
        if(!submitted) break;
        if(!currentGame.list[message.author.id].votedFor) {
          sendMessage("**" + message.author.username + " has voted against " + user.name + ".** " + (majorityCounts[currentGame.aliveCount] - currentGame.votesAgainst[user.id].length) + " more votes to get them on trial.", currentGame.viewers)
        } else {
          sendMessage("**" + message.author.username + " has changed their vote to " + user.name + ".** " + (majorityCounts[currentGame.aliveCount] - currentGame.votesAgainst[user.id].length) + " more votes to get them on trial.", currentGame.viewers)
        }
        currentGame.list[message.author.id].votedFor = user.id;
        if((majorityCounts[currentGame.aliveCount] - currentGame.votesAgainst[user.id].length) <= 0) {
          currentGame.phase = 3;
          currentGame.trial = user;
          currentGame.trials = currentGame.trials - 1;
          sendMessage("**The majority have elected to put " + user.username + " on trial.** You have forty-five seconds to provide a defense for your actions.", currentGame.viewers)
          transitionTrial(currentlyPlaying[message.author.id].id); // begin the trial!
        }
      } else {
        break;
      }
      return;
    case 4:
      if(message.author.id != currentGame.trial.id) return; // since they cant take over, are they the one on trial?
      break;
    case 5:
      if(message.author.id == currentGame.trial.id) return; // since they cant take over, are they the one on trial?
      if(message.content == "!guilty") {
        if(getTextInput(message.author.id, currentGame.guilties)) return; //they've already voted!
        let nu = currentGame.innocents.findIndex((userID) => message.author.id == userID);
        currentGame.guilties.push(message.author.id);
        if(nu != -1) {
          currentGame.innocents.splice(nu, 1)
          return sendMessage(message.author.username + " has changed their vote.", currentGame.viewers)
        } else {
          return sendMessage(message.author.username + " has voted.", currentGame.viewers)
        }
      } else if(message.content == "!innocent") {
        if(getTextInput(message.author.id, currentGame.innocents)) return; //they've already voted!
        let nu = currentGame.guilties.findIndex((userID) => message.author.id == userID);
        currentGame.innocents.push(message.author.id);
        if(nu != -1) {
          currentGame.guilties.splice(nu, 1)
          return sendMessage(message.author.username + " has changed their vote.", currentGame.viewers)
        } else {
          return sendMessage(message.author.username + " has voted.", currentGame.viewers)
        }
      } else if(message.content == "!cancel") {
        if(getTextInput(message.author.id, currentGame.innocents)) {
          let nu = currentGame.innocents.findIndex((userID) => message.author.id == userID);
          currentGame.innocents.splice(nu, 1)
          return sendMessage(message.author.username + " has cancelled their vote.", currentGame.viewers)
        } else if(getTextInput(message.author.id, currentGame.guilties)) {
          let nu = currentGame.guilties.findIndex((userID) => message.author.id == userID);
          currentGame.guilties.splice(nu, 1)
          return sendMessage(message.author.username + " has cancelled their vote.", currentGame.viewers)
        }
      }
      break;
    case 6:
      if(message.content.startsWith("!target ")) {
        let target = message.content.toLowerCase().slice(8)
        for(user of currentGame.viewers) {
          if(user.username.toLowerCase().includes(target)) {
            switch(currentGame.list[message.author.id].role) {
              case roles.properties.city.detective:
                //if(message.author.id == user.id) return message.channel.send("Well, you're certainly not the brightest detective, huh?")
                currentGame.queued[message.author.id] = user
                return message.channel.send("You have decided to investigate " + user.username + " tonight.")
              case roles.properties.spies.doctor:
                if(message.author.id == user.id) return message.channel.send("HA! You wish you could heal yourself!")
                if(getTextInput(user, currentGame.dead, 2)) return message.channel.send("Unfortunately, you are not trained in revival.")
                currentGame.queued[message.author.id] = user
                return message.channel.send("You have decided to heal " + user.username + " tonight.")
            }
          }
        }
      }
      if(getTextInput(message.author, currentGame.spies, 2)) {
        return sendMessage("**" + message.author.username + "**: " + message.content, currentGame.spies)
      }
      return message.channel.send("Don't talk! The Spies may overhear!")
  }
  sendMessage("**" + message.author.username + "**: " + message.content, currentGame.viewers)
})

module.exports.help = {
  name: "Base",
  typename: "base",
  game: "The Migration",
  minPlayers: 1
}