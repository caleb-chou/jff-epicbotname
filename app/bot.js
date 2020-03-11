// Gets json for authentication with APIs
const auth= require('./auth.json');
const Discord = require('discord.js');

// Init APIs
const bot = new Discord.Client();

// Read/Write
const fs = require('fs');

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

// Get configuration file
const config = require('./config.json');

// Prefix to communicate with bot
const prefix = config.prefix;

// Channel IDs 
const channel_ids = config.channel_ids;

// Commands- Key is command, value is help
const commands = require('./commands.json');

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
                    message.channel.send(commands[args[1]]); // If command exists
                } else {
                    message.channel.send('That command does not exist.'); // If command doesn't exist
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
            

            case 'force_end_mafia':
                var mafia = read('mafia/mafia.json');
                mafia.ingame = false;
                write(mafia, 'mafia/mafia.json');
                await message.channel.send(`${message.author} says "<@${mafia.master}> sucks!!!"`);
                break;
            
                // Mafia
            case 'mafia':

                // Read data
                'use strict';
                var mafia = read('mafia/mafia.json');

                // Check if game is going on
                if(mafia.ingame) {
                    await message.channel.send('A game is already going on!');
                    return;
                } else {
                    // Set up mafia
                    mafia = {"ingame":true, "master":"", "players":[],"dead":[],"mafia":[],"detectives":[],"citizens":[],"healers":[]}

                    // Master is person who starts mafia
                    mafia.master = message.member.user.id;
                    var master_name = message.member.user.tag.substring(0, message.member.user.tag.length - 5);
                    mafia.players.push(mafia.master)

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
                        if (reaction.emoji.name == '➕' && !mafia.players.includes(user.id)) {
                            message.channel.send(`${user.username} has joined the game!`)
                            mafia.players.push(user.id)
                            return true;
                        }
                        if (reaction.emoji.name == '✅' && user.id == mafia.master) {
                            message.channel.send(`${user.username} has begun the game!`)
                            return true;
                        }
                        return false;
                    };
            
                    const start_collector = game_msg.createReactionCollector(filter, { time: time });
            
                    start_collector.on('collect', (reaction, reactionCollector) => {
                        if(reaction.emoji.name == '✅') {
                            start_collector.stop();
                        }
                    });
                    start_collector.on('end', async collected => {
                        if(mafia.players.length <= 2) {
                            await message.channel.send('There must be at least 3 players!');
                        } else {
                            var player_names = "";
                            for(var i = 0; i < mafia.players.length; i++) {
                                if(i == mafia.players.length - 1) {
                                    player_names += "and <@" + mafia.players[i] + ">";
                                } else {
                                    player_names += "<@" + mafia.players[i] + ">, ";
                                }
                            }

                            await message.channel.send(`${player_names} are playing mafia!`);
                            write(mafia, 'mafia/mafia.json')

                            // CHOOSE ROLES IN MAFIA --------------------------------------------------------------------------
                            var players = mafia.players;
                            var users = [];

                            roles = read('mafia/roles.json')

                            for(var i = 0; i < players.length; i++) {
                                users.push(get_user(players[i]));
                            }

                            var choose_roles = [];
                            for (var role in roles) {
                                if(role != 'Mafia' && role != 'Detective' && role != 'Citizen') {
                                    choose_roles.push(role);
                                }
                            }

                            var emoji_roll = {}
                            var role_names = "";
                            for(var i = 0; i < choose_roles.length; i++) {
                                emoji_roll[roles[choose_roles[i]][0]] = choose_roles[i];
                                role_names += "\n" + roles[choose_roles[i]][0] + ": " + choose_roles[i];
                            }
                            
                            var choice_msg = await message.channel.send(`<@${mafia.master}>, Choose the roles to play! Mafia, Detective, and Citizen will always be included.` + role_names);
                            for(var i = 0; i < choose_roles.length; i++) {
                                await choice_msg.react(roles[choose_roles[i]][0]);
                            }
                            await choice_msg.react('✅')

                            var chosen_roles = ['Mafia', 'Detective', 'Citizen']

                            const filter = (reaction, user) => {
                                return user.id == mafia.master;
                            };

                            const start_collector = choice_msg.createReactionCollector(filter, { time: time });
                            
                            start_collector.on('collect', (reaction, reactionCollector) => {
                                if(reaction.emoji.name == '✅') {
                                    start_collector.stop();
                                }
                            });
                            start_collector.on('end', async collected => {
                                for(const [emoji, data] of collected.entries()) {
                                    if(emoji != '✅' && data.users.has(mafia.master)) {
                                        chosen_roles.push(emoji_roll[emoji]);
                                    }
                                }

                                var roles_included = "";
                                for(var i = 0; i < chosen_roles.length; i++) {
                                    if(i == chosen_roles.length - 1) {
                                        roles_included += "and " + chosen_roles[i];
                                    } else {
                                        roles_included += chosen_roles[i] + ", ";
                                    }
                                }

                                await message.channel.send(`<@${mafia.master}> has chosen these roles: ${roles_included}`);
                                
                                // SET UP GAME --------------------------------------------------------------------
                                // Choose mafia/detective num
                                var mafia_num = Math.ceil(mafia.players.length * 0.16);
                                if(args.length > 1) {
                                    mafia_num = parseInt(args[1])
                                }

                                var detective = false; 
                                if(mafia.players.length > 4) {
                                    detective = true;
                                }

                                if(mafia_num == 1) {
                                    await message.channel.send(`There will be 1 mafia member!`)
                                } else {
                                    await message.channel.send(`There will be ${mafia_num} mafia members!`)
                                }
                                
                                if(detective) {
                                    await message.channel.send(`There will be a detective!`)
                                } else {
                                    await message.channel.send(`There will be no detectives!`)
                                }
                                
                                
                                

                                // Randomizer
                                var game_roles = [];
                                for(var i = 0; i < mafia_num; i++) {
                                    game_roles.push('Mafia');
                                }
                                if(detective) {
                                    game_roles.push('Detective')
                                }
                                for(var i = 3; i < chosen_roles.length; i++) {
                                    game_roles.push(chosen_roles[i]);
                                }
                                for(var i = game_roles.length; i < mafia.players.length; i++) {
                                    game_roles.push('Citizen');
                                }

                                if(game_roles.length > mafia.players.length) {
                                    game_roles.slice(0, mafia.players.length - game_roles.length);
                                }
                                
                                shuffle(game_roles);

                                var player_roles = {};
                                for(var i = 0; i < game_roles.length; i++) {
                                    player_roles[mafia.players[i]] = game_roles[i];
                                    switch(game_roles[i]) {
                                        case "Mafia": mafia.mafia.push(mafia.players[i]); break;
                                        case "Detective": mafia.detectives.push(mafia.players[i]); break;
                                        case "Citizen": mafia.citizens.push(mafia.players[i]); break;
                                        case "Healer": mafia.healers.push(mafia.players[i]); break;
                                        default: console.log("ERROR: PLAYER ROLE NOT HERE"); break;
                                    }
                                }

                                // Setup Channels
                                // Mafia
                                var mafia_channel = await message.guild.createChannel('Mafia', 'text');

                                await mafia_channel.overwritePermissions(message.guild.defaultRole, {
                                    VIEW_CHANNEL: false,
                                    SEND_MESSAGES: false
                                })

                                for(var i = 0; i < mafia.mafia.length; i++) {
                                    message.guild.client.fetchUser(mafia.mafia[i])
                                    .then(user => mafia_channel.overwritePermissions(user, {
                                        VIEW_CHANNEL: true,
                                        SEND_MESSAGES: true
                                    }));
                                }

                                await mafia_channel.send(roles['Mafia'][1]);

                                // Town
                                var main = await message.guild.createChannel('Town', 'text');
                                var member_names = '';
                                for(var i = 0; i < mafia.players.length; i++) {
                                    if(i == mafia.players.length - 1) {
                                        member_names += ' and <@' + mafia.players[i] + '>';
                                    } else {
                                        member_names += '<@' + mafia.players[i] + '>, ';
                                    }
                                }

                                // Detective
                                var detective_channel = '0';
                                if(mafia.detectives.length != 0) {
                                    detective_channel = await message.guild.createChannel('Detective', 'text');
                                    
                                    await detective_channel.overwritePermissions(message.guild.defaultRole, {
                                        VIEW_CHANNEL: false,
                                        SEND_MESSAGES: false
                                    })
                                    message.guild.client.fetchUser(mafia.detectives[0])
                                    .then(user => detective_channel.overwritePermissions(user, {
                                    VIEW_CHANNEL: true,
                                    SEND_MESSAGES: true
                                    }));
    
                                    await detective_channel.send(roles['Detective'][1]);
                                }
                                
                                // Healer
                                var healer_channel = '0';
                                if(mafia.healers.length != 0) {
                                    healer_channel = await message.guild.createChannel('Healers', 'text');
                                    await healer_channel.overwritePermissions(message.guild.defaultRole, {
                                        VIEW_CHANNEL: false,
                                        SEND_MESSAGES: false
                                    })
                                    for(var i = 0; i < mafia.healers.length; i++) {
                                        message.guild.client.fetchUser(mafia.healers[i])
                                        .then(user => healer_channel.overwritePermissions(user, {
                                            VIEW_CHANNEL: true,  
                                            SEND_MESSAGES: true
                                        }));
                                    }
                                    
                                    await healer_channel.send(roles['Healer'][1]);
                                }
                                

                                var town_name = get_random(read("mafia/town_names.json"));
                                await main.send(`${member_names}, welcome to the town of ${town_name}! Every day (which will last 30 seconds), you will all vote to execute someone. Every night (which will last 30 seconds), you will go to sleep. Beware, however, as mafia members will be trying to kill you each night! Use your hidden channel to conduct actions. Good luck!`)
                                
                                write(mafia, 'mafia/mafia.json');
                                // GAME START!!!! ##################################################################
                                await main.send('The first night is coming upon us...')
                                setTimeout(nighttime, daytime_time, mafia, main, mafia_channel, detective_channel, healer_channel);
                            });
                        }
                    });
                }

                break;
            
            case 'timeout':
                var admin_role = config.roles.admin; //"674476313343557632";
                var timeout = config.roles.timeout; //"686438951354892290";
                var role = message.guild.roles.get(timeout);

                if(message.member.roles.has(admin_role)) {
                    var member = message.mentions.members.first();
                    if(member.roles.has(timeout)) {
                        member.removeRole(role).catch(console.error);
                        message.channel.send(`Removed ${member} from timeout`)
                    } else {
                        member.addRole(role).catch(console.error);
                        message.channel.send(`Sent ${member} to timeout`)
                        if(args.length == 3) {
                            setTimeout(function(){member.removeRole(role).catch(console.error);
                                message.channel.send(`Removed ${member} from timeout after ${args[2]} seconds...`)}, args[2] * 1000);
                        }
                    }
                    
                } else {
                    message.member.addRole(role).catch(console.error);
                    message.channel.send(`Nice try ${message.member}, go to timeout loser`);
                }
                break;
            case 'id':
                message.channel.send(`@${message.member.user.tag}`);
                console.log(message.member.user.tag);
                break;
            
            case 'perms':
                console.log(message.channel.permissionsFor(message.member).serialize(false))
                break;
                    
            case 'test':
                break;

            // Handle invalid commands
            default: message.channel.send(`'${cmd}' is not a valid command.`); break;

            
        }
    }
});

var daytime_time = 30000; // ms
var voting = daytime_time - 5000;
var nighttime_time = daytime_time; // ms


// actions -> [mafia, healer]
async function daytime(mafia, main, mafia_channel, detective_channel, healer_channel, actions) {
    if(!mafia.ingame) {
        return;
    }

    if(mafia.detectives.length != 0) {
        await detective_channel.send("It is now time to return to the town...");
    }
    if(mafia.healers.length != 0) {
        await healer_channel.send("It is now time to return to the town...");
    }
    await mafia_channel.send("It is now time to return to the town...");
    
    write(mafia, 'mafia/maifa.json');
    console.log('Daytime!');
    console.log(actions);
    await main.overwritePermissions(main.guild.defaultRole, {
        VIEW_CHANNEL: true,
        SEND_MESSAGES: false
    })

    // Actions
    var msg = '';

    if(actions[0] == '0') {
        var mafia_no_attack = get_random(read("mafia/mafia_no_attack.json"));
        msg += mafia_no_attack;
    } else {
        var first_msg = get_random(read("mafia/daytime_msgs.json"));
        msg += first_msg;

        var attack = get_random(read("mafia/attack.json")).split("*").join("<@" + actions[0] + ">");
        msg += '\n\n' + attack;

        if(actions[1] != '0') {
            if(actions[0] == actions[1]) {
                var healer_true = get_random(read("mafia/healer_true.json")).split("*").join("<@" + actions[0] + ">");
                msg += '\n\n' + healer_true;
                msg += '\n\n<@' + actions[0] + '> was saved!';
            } else {
                mafia_kill(actions[0], mafia, main, mafia_channel,detective_channel, healer_channel);
                var healer_false = get_random(read("mafia/healer_false.json")).split("*").join("<@" + actions[0] + ">");
                msg += '\n\n' + healer_false;
                msg += '\n\n<@' + actions[0] + '> died!';
            }
        } else {
            mafia_kill(actions[0], mafia, main, mafia_channel,detective_channel, healer_channel);
            msg += '\n\n<@' + actions[0] + '> died!';
        }
    }

    // Check win
    if(mafia.mafia.length == 0) {
        mafia_end(mafia, main, true, mafia_channel, detective_channel, healer_channel);
        return;
    }
    if(mafia.mafia.length >= Math.ceil(mafia.players.length / 2)) {
        mafia_end(mafia, main, false, mafia_channel, detective_channel, healer_channel);
        return;
    }

    await main.send(msg);

    // Voting
    await main.send(`\n\nIt is now time to vote! Everyone will now type in chat the person (@user) they will vote for.`);

    for(var i = 0; i < mafia.players.length; i++) {
        if(!mafia.dead.includes(mafia.players[i])) {
            main.guild.client.fetchUser(mafia.players[i])
                .then(user => main.overwritePermissions(user, {
                    VIEW_CHANNEL: true,
                    SEND_MESSAGES: true
                }));
        }
    }

    var voted = [];
    var votes = [];
    const collector = new Discord.MessageCollector(main, m => !voted.includes(m.author.id), { time: voting });
        
    collector.on('collect', async message => {
        var re = new RegExp("^<@!*[0-9]+>$");
        if(re.test(message.content)) {
            var vote = message.content.substring(3, message.content.length - 1);
            if(mafia.players.includes(vote)) {
                voted.push(message.author.id);
                votes.push(vote);
                await message.delete(0);
                await main.send(`${message.content} has been voted for!`);
            } else {
                await message.delete(0);
                await main.send(`<@${message.author.id}>, you cannot vote for ${message.content}`);
            }
        }
    })

    collector.on('end', async collected => {
        if(votes.length == 0) {
            await main.send('No one has voted! Looks like everyone is safe...');
        } else {
            var voted = mode(votes);
            mafia_kill(voted, mafia, main, mafia_channel,detective_channel, healer_channel);
            await main.send(`The citizens have voted! <@${voted}> has been chosen!\n<@${voted}> was executed!`);
        }
    });

    write(mafia, 'mafia/mafia.json');
    setTimeout(nighttime, daytime_time, mafia, main, mafia_channel, detective_channel, healer_channel);
}

async function nighttime(mafia, main, mafia_channel, detective_channel, healer_channel) { //---------------------------NIGHT
    if(!mafia.ingame) {
        return;
    }

    write(mafia, 'mafia/maifa.json');
    console.log('Nighttime!');

    // Check win
    if(mafia.mafia.length == 0) {
        mafia_end(mafia, main, true, mafia_channel, detective_channel, healer_channel);
        return;
    }
    if(mafia.mafia.length >= Math.ceil(mafia.players.length / 2)) {
        mafia_end(mafia, main, false, mafia_channel, detective_channel, healer_channel);
        return;
    }


    // Block main channel
    var nighttime_msg = get_random(read('mafia/nighttime_msgs.json'));
    await main.send(nighttime_msg);
    await main.overwritePermissions(main.guild.defaultRole, {
        VIEW_CHANNEL: true,
        SEND_MESSAGES: false
    })


    var actions = ['0', '0'];
    // Mafia!
    var mafia_msg = get_random(read("mafia/mafia_msgs.json"));
    await mafia_channel.send(mafia_msg);
    await mafia_channel.send('The last vote (@user) sent will be the one to die tonight!');

    var choices = "";
    for(var i = 0; i < mafia.players.length; i++) {
        if(!mafia.mafia.includes(mafia.players[i])) {
            choices += "\n<@" + mafia.players[i] + ">";
        }
    }

    await mafia_channel.send('Your choices are (Right click and press mention):' + choices);
    const mafia_collector = new Discord.MessageCollector(mafia_channel, m => true, { time: voting });

    var mafia_voted = "0";
    mafia_collector.on('collect', async message => {
        var re = new RegExp("^<@!*[0-9]+>$");
        if(re.test(message.content)) {
            var vote = message.content.substring(3, message.content.length - 1);
            if(mafia.players.includes(vote) && !mafia.mafia.includes(vote)) {
                mafia_voted = vote;
                await message.delete(0);
                await mafia_channel.send(`<@${message.author.id}> has voted for ${message.content}!`);
            } else {
                await message.delete(0);
                await mafia_channel.send(`<@${message.author.id}>, you cannot vote for ${message.content}`);
            }
        }
    })

    mafia_collector.on('end', async collected => {
        if(mafia_voted == "0") {
            await mafia_channel.send('No one has voted! Looks like everyone is safe...');
        } else {
            actions[0] = mafia_voted;
            await mafia_channel.send(`You have chosen to kill <@${mafia_voted}>!`);
        }
    });

    // Detective!
    if(mafia.detectives.length != 0) {

        var detective_msg = get_random(read("mafia/detective_msgs.json"));
        await detective_channel.send(detective_msg);
        await detective_channel.send('The first vote (@user) will be who you will investigate!');

        var choices = "";
        for(var i = 0; i < mafia.players.length; i++) {
            if(!mafia.detectives.includes(mafia.players[i])) {
                choices += "\n<@" + mafia.players[i] + ">";
            }
        }

        await detective_channel.send('Your choices are (Right click and press mention):' + choices);

        const detective_collector = new Discord.MessageCollector(detective_channel, m => true, { time: voting });

        var investigated = false;
        detective_collector.on('collect', async message => {
            var re = new RegExp("^<@!*[0-9]+>$");
            if(re.test(message.content)) {
                if(investigated) {
                    await message.delete(0);
                    await detective_channel.send(`You can only investigate one person per night!`);
                }
                var vote = message.content.substring(3, message.content.length - 1);
                if(mafia.players.includes(vote) && !mafia.detectives.includes(vote)) {
                    await message.delete(0);
                    if(mafia.mafia.includes(vote)) {
                        await detective_channel.send(`${message.content} is a mafia member!`);
                    } else {
                        await detective_channel.send(`${message.content} is NOT a mafia member!`);
                    }
                    investigated = true;
                    collector.stop();
                } else {
                    await message.delete(0);
                    await detective_channel.send(`<@${message.author.id}>, you cannot investigate yourself!`);
                }
            }
        })

        detective_collector.on('end', async collected => {
            if(!investigated) {
                await detective_channel.send('You have failed your duty...');
            }
        });
    }

    // Healer!
    if(mafia.healers.length != 0) {

        var healer_msg = get_random(read("mafia/healer_msgs.json"));
        await healer_channel.send(healer_msg);
        await healer_channel.send('The last vote (@user) sent will be the one to save!');

        var choices = "";
        for(var i = 0; i < mafia.players.length; i++) {
            choices += "\n<@" + mafia.players[i] + ">";
        }

        await healer_channel.send('Your choices are (Right click and press mention):' + choices);

        const healer_collector = new Discord.MessageCollector(healer_channel, m => true, { time: voting });

        var healer_voted = "0";
        healer_collector.on('collect', async message => {
            var re = new RegExp("^<@!*[0-9]+>$");
            if(re.test(message.content)) {
                var vote = message.content.substring(3, message.content.length - 1);
                if(mafia.players.includes(vote)) {
                    healer_voted = vote;
                    await message.delete(0);
                    await healer_channel.send(`<@${message.author.id}> has voted for ${message.content}!`);
                } else {
                    await message.delete(0);
                    await healer_channel.send(`<@${message.author.id}>, you cannot vote for ${message.content}`);
                }
            }
        })

        healer_collector.on('end', async collected => {
            if(healer_voted == "0") {
                await healer_channel.send('No one has voted! You have all failed your duty...');
            } else {
                actions[1] = healer_voted;
                await healer_channel.send(`You have chosen to save <@${healer_voted}>!`);
            }
        });
    }
    
    setTimeout(daytime, nighttime_time, mafia, main, mafia_channel, detective_channel, healer_channel, actions);
}

function mode(array)
{
    if(array.length == 0)
        return 0;
    var modeMap = {};
    var maxEl = array[0], maxCount = 1;
    for(var i = 0; i < array.length; i++)
    {
        var el = array[i];
        if(modeMap[el] == null)
            modeMap[el] = 1;
        else
            modeMap[el]++;
        if(modeMap[el] >= maxCount)
        {
            maxEl = el;
            maxCount = modeMap[el];
        }
    }

    var votes = [];
    for(var el in modeMap) {
        if(modeMap[el] == maxCount) {
            votes.push(el);
        }
    }

    if(votes.length == 1) {
        return maxEl;
    }
    return get_random(votes);
}

// result true = citizen win
async function mafia_end(mafia, main, result, mafia_channel, detective_channel, healer_channel) {
    mafia.ingame = false;
    write(mafia, 'mafia/mafia.json');
    mafia_channel.delete();
    if(detective_channel != '0') {
        detective_channel.delete();
    }
    if(healer_channel != '0') {
        healer_channel.delete();
    }
    if(result) {
        var citizen_win = get_random(read("mafia/citizen_win.json"));
        await main.send(citizen_win);
    } else {
        var mafia_win = get_random(read("mafia/mafia_win.json"));
        await main.send(mafia_win);
    }
    var end_msg = await main.send(`<@${mafia.master}>, react with ❌ to delete this channel.`);
    await end_msg.react('❌');

    const end_filter = (reaction, user) => {
        return user.id == mafia.master;
    };


    const end_collector = end_msg.createReactionCollector(end_filter, { time: 60000 });
                            
    end_collector.on('collect', (reaction, reactionCollector) => {
        if(reaction.emoji.name == '❌') {
            end_collector.stop();
        }
    });
    end_collector.on('end', async collected => {
        main.delete();
    });
}

async function mafia_kill(user_id, mafia, main, mafia_channel,detective_channel, healer_channel) {
    var voted = mode(user_id);
    mafia.dead.push(user_id);
    main.guild.client.fetchUser(user_id)
    .then(user => main.overwritePermissions(user, {
        VIEW_CHANNEL: true,
        SEND_MESSAGES: false
    }));
    if(mafia.mafia.includes(user_id)) {
        mafia_channel.guild.client.fetchUser(user_id)
        .then(user => main.overwritePermissions(user, {
            VIEW_CHANNEL: true,
            SEND_MESSAGES: false
        }));
    }
    if(mafia.detectives.includes(user_id)) {
        detective_channel.guild.client.fetchUser(user_id)
        .then(user => main.overwritePermissions(user, {
            VIEW_CHANNEL: true,
            SEND_MESSAGES: false
        }));
    }
    if(mafia.healers.includes(user_id)) {
        healer_channel.guild.client.fetchUser(user_id)
        .then(user => main.overwritePermissions(user, {
            VIEW_CHANNEL: true,
            SEND_MESSAGES: false
        }));
    }
    remove_val(mafia.players, user_id);
    remove_val(mafia.mafia, user_id);
    remove_val(mafia.detectives, user_id);
    remove_val(mafia.healers, user_id);
    remove_val(mafia.citizens, user_id);
}

function create_hidden_channel(message, user, channel_name, read, write) {
    message.guild.createChannel(channel_name, 'text')
        .then(async function (channel) {
            await channel.overwritePermissions(user, {
                VIEW_CHANNEL: read,
                SEND_MESSAGES: write
            })
            await channel.overwritePermissions(user.guild, {
                VIEW_CHANNEL: read,
                SEND_MESSAGES: write
            })
        }
    )
}

function remove_val(arr, val) {
    for(var i = arr.length - 1; i >= 0; i--) {
        if (arr[i] == val) {
            arr.splice(i, 1);
            i--;
        }
    }
}

function get_random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function get_user(id) {
    return bot.fetchUser(id);
}

function read(filename) {
    'use strict';
    var rawdata = fs.readFileSync(filename);
    return JSON.parse(rawdata);
}

function write(data, filename) {
    'use strict';
    var d = JSON.stringify(data);
    fs.writeFileSync(filename, d);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
}