// Gets json for authentication with APIs
const auth= require('./auth.json');
const Discord = require('discord.js');

// Init APIs
const bot = new Discord.Client();

// Channel IDs 
const channel_ids = {
    'poll' : '686017506041004055'
}

// Authetication with discord
bot.login(auth.discord_token);
bot.on('ready', async () => {
    console.log(`${bot.user.username} is online.`);
    // Set bot activity
    bot.user.setActivity(
        `ssp is obese | ${prefix}help`
    ).then(
        presence => console.log(`Activity set to ${presence.game ? presence.game.name : 'none'}`)
    ).catch(console.error);
});

// Prefix to communicate with bot
const prefix = '&';

// Commands- Key is command, value is help
var commands = {
    'help' : 'Returns a list of commands.',
    'check': 'Returns stock data for the argument. Usage: `check <SYMBOL>`',
    'roll' : 'Returns a random number from 0 to <param> or <param1> to <param2> inclusive. Usage: `roll <MAX>` or `roll <MIN> <MAX>`',
    'poll' : 'Creates a poll with the provided arguments as options. Usage: `poll "question" :emoji1: :emoji2:`',
    'trim' : 'Deletes specified number of messages. Usage: `trim <# of messages>`'
};

// Gets formats date in YYYY-MM-DD
function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

// Bot responds to messages
bot.on('message', async message => {
    // Message Content
    var content = message.content;

    // If it matches the prefix, treat is as commands
    if(content.substring(0,1) == prefix) {

        // Gets arguments
        var args = content.substring(1).split(/\s+/);
        var cmd  = args[0];

        console.log(`Executed ${cmd} with parameter(s): ${args}`);

        // Execute based on commands
        switch(cmd) {

            // Help command
            case 'help' : 

            // no arguments
            if(args.length < 2) {
                var response = '';
                var keys = Object.keys(commands);
                for(var i = 0; i < keys.length; i++) {
                    response += keys[i] + '\n';
                }
                message.channel.send(`Valid commmands are:\n${response}`);
            } else { // get help for specific command
                var keys = Object.keys(commands);
                if(keys.includes(args[1])) {
                    message.channel.send(commands[args[1]]);
                } else {
                    message.channel.send('That command does not exist.');
                }
            }
                 break;
            // Roll command

            case 'roll':
                // 1 argument
                if(args.length < 3) {
                    message.channel.send(`Rolled: ${Math.trunc(Math.random() * parseInt(args[1])) + 1}`);
                }
                else { // More arguments
                    message.channel.send(`Rolled: ${Math.trunc(Math.random() * (parseInt(args[2]) - parseInt(args[1]) + 1)) + parseInt(args[1])}`);
                }
                break;
            // Check command
                case 'check': alpha.data.quote(args[1]).then(data => {
                // var today = formatDate(Date.now());
                console.log(data);
                data = data['Global Quote'];
                var response = '';
                var keys = Object.keys(data);
                for(var i = 0; i < keys.length; i ++) {
                    response += `${keys[i].split('. ')[1]} : ${data[keys[i]]}\n`;
                }
                message.channel.send(response);
            }); break;

            // Poll in current channel
            case 'pollhere': 
                var poll = content.match(/".+"/)[0].replace(/"/g,''); // Gets poll question
                var poll_msg = await message.channel.send(poll); // Sends message
                var reactions = content.replace(/".+"/, '').split(/\s+/); // Gets arguments 
                for(var i = 1; i < reactions.length; i++) {
                    await poll_msg.react(reactions[i]); // Adds reactions
                }
            break;
            
            // Poll in poll channel
            case 'poll': 
                var poll = content.match(/".+"/)[0].replace(/"/g,''); // Gets poll question
                var poll_msg = await bot.channels.get(channel_ids['poll']).send(poll); // sends
                var reactions = content.replace(/".+"/, '').split(/\s+/); // gets arguemnts
                for(var i = 1; i < reactions.length; i++) {
                    await poll_msg.react(reactions[i]); // adds reaction
                }
            break;

            // Trim command
            case 'trim':
                var amount = args[1]; // Argument passed for # of messages to delete
                message.channel.bulkDelete(amount).then(() => { // Bulk deletes messages
                    message.channel.send(`Deleted ${amount} message(s)`); // Sends message that messages have been deleted
                });
                break;
            

            // Mafia
            case 'mafia':

                // Read data
                'use strict';
                const fs = require('fs');
                let rawdata = fs.readFileSync('mafia.json');
                let mafia = JSON.parse(rawdata);

                // Check if game is going on
                if(mafia.ingame) {
                    await message.channel.send('A game is already going on!');
                } else {
                    // Set up mafia
                    mafia = {"ingame":false, "master":"", "players":[]}

                    // Master is person who starts mafia
                    mafia.master = message.member.user.tag;
                    var master_name = mafia.master.substring(0, mafia.master.length - 5);

                    // Send game message to react to
                    var game_msg = await message.channel.send(
                    `${master_name} has started a mafia match!
                     Please react with a + to add yourself to the game!
                     Message &leave to leave the game!
                     The game will start in 60 seconds or when ${master_name} reacts to start!
                    `);
                    await game_msg.react("➕");
                    await game_msg.react("✅");
                    
                    // Collect Reactions
                    const time = 60000; // 1minute

                    const filter = (reaction, user) => {
                        if (reaction.emoji.name == '➕' && !mafia.players.includes(user.tag)) {
                            message.channel.send(`${user.username} has joined the game!`)
                            mafia.players.push(user.tag)
                            return true;
                        }
                        if (reaction.emoji.name == '✅' && user.tag == mafia.master) {
                            message.channel.send(`${user.username} has begun the game!`)
                            return true;
                        }
                        return false;
                    };
            
                    const collector = game_msg.createReactionCollector(filter, { time: time });
            
                    collector.on('collect', (reaction, reactionCollector) => {
                        if(reaction.emoji.name == '✅') {
                            collector.stop();
                        }
                    });
                    collector.on('end', collected => {
                        if(mafia.players.length > 2) {
                            message.channel.send('There must be at least 3 players!');
                        } else {
                            mafia.ingame = false;
                            var player_names = "";
                            for(var i = 0; i < mafia.players.length; i++) {
                                var player_name = mafia.players[i];
                                player_names += player_name.substring(0, player_name.length - 5) + ", "
                            }

                            message.channel.send(`${player_names.substring(0, player_names.length - 2)} are playing mafia!`);


                            'use strict';
                            const fs = require('fs');
                            let data = JSON.stringify(mafia);
                            fs.writeFileSync('mafia.json', data);
                        }
                    });
                }
                break;
            

            
            case 'id':
                message.channel.send(`@${message.member.user.tag}`);
                console.log(message.member.user.tag);
                break;
            // Handle invalid commands
            default: message.channel.send(`'${cmd}' is not a valid command.`); break;
        }
    }
});


function set_up_mafia(mafia) {
    players = mafia.players

}