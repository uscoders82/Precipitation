var command = {
    name: "list",
    desc: "Pick from a list of items.",
    args: "**(save | pick | view)** (**what to save** | custom unsaved list)",
    parameters: "",
    execute: {
        discord: function(message, args) {
            let cArg = args.split(" ")
            if(!config.users[message.author.id]) config.users[message.author.id] = {};
            switch(cArg[0]) {
                case "save":
                if(!cArg[1]) return message.channel.send("You must input a list, separated by commas.")
                let list = args.slice(5).split(",");
                if(!list[1]) return message.channel.send("You must have at least 2 arguments for the list.")
                if(getTextInput(args.slice(5), host.slurs)) return message.channel.send("Sorry, but I will not include offensive text in a list.")
                config.users[message.author.id].list = args.slice(5)
                return message.channel.send("Your list has been saved.")
                case "pick":
                if(args.toLowerCase() == "pick") {
                    if(!config.users[message.author.id].list) return message.channel.send("You must first save a list.")
                    let listt = config.users[message.author.id].list.split(",");
                    let rng = Math.floor(Math.random() * listt.length)
                    let item = listt[rng]
                    message.channel.send(item)
                } else {
                    let listt = args.slice(5).split(",");
                    let rng = Math.floor(Math.random() * listt.length)
                    let item = listt[rng]
                    message.channel.send(item)
                }
                break;
                case "view":
                if(!config.users[message.author.id].list) return message.channel.send("You must first save a list.")
                return message.channel.send(config.users[message.author.id].list);
                default:
                return message.channel.send("That is not a valid argument for this command.")
            }
        }
    },
    ver: "3.0.0",
    cat: "Miscellaneous",
    prereqs: {
        dm: true,
        owner: false,
        user: [],
        bot: []
    },
    unloadable: true
}

module.exports = command;