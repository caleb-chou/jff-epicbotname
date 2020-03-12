// Gets json for authentication with APIs
const auth= require('./auth.json');
const Discord = require('discord.js');

// Import dlz_utils
const dlz_utils = require('./dlz_utils');

var daytime_time = dlz_utils.read('mafia/mafia_config.json')['daytime_time'];
var voting = daytime_time - dlz_utils.read('mafia/mafia_config.json')['voting_msg_time'];
var nighttime_time = daytime_time;

module.exports = {
    start_mafia: async function(message, args) {
        // Read data
        'use strict';
        var mafia = dlz_utils.read('mafia/mafia.json');
    
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
            Once you add yourself, you cannot leave the game! 😈
            The game will start in ${Math.floor(dlz_utils.read('mafia/mafia_config.json')['daytime_time'] / 1000)} seconds or when ${master_name} reacts to start!
            `);
            await game_msg.react("➕");
            await game_msg.react("✅");
            
            // Collect Reactions
            const time = dlz_utils.read('mafia/mafia_config.json')['queue_game_time'];
    
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
                    dlz_utils.write(mafia, 'mafia/mafia.json')
    
                    // CHOOSE ROLES IN MAFIA --------------------------------------------------------------------------
                    var players = mafia.players;
                    var users = [];
    
                    var roles = dlz_utils.read('mafia/roles.json')
    
                    for(var i = 0; i < players.length; i++) {
                        message.guild.client.fetchUser(players[i])
                            .then(user => users.push(user));
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
                        
                        dlz_utils.shuffle(game_roles);
    
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
                        await main.overwritePermissions(message.guild.defaultRole, {
                            VIEW_CHANNEL: true,
                            SEND_MESSAGES: false
                        })

                        for(var i = 0; i < mafia.players.length; i++) {
                            if(i == mafia.players.length - 1) {
                                member_names += ' and <@' + mafia.players[i] + '>';
                            } else {
                                member_names += '<@' + mafia.players[i] + '>, ';
                            }
                            message.guild.client.fetchUser(mafia.players[i])
                            .then(user => main.overwritePermissions(user, {
                            VIEW_CHANNEL: true,
                            SEND_MESSAGES: true
                            }));
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
                        
    
                        var town_name = dlz_utils.get_random(dlz_utils.read("mafia/town_names.json"));
                        await main.send(`${member_names}, welcome to the town of ${town_name}! Every day (which will last ${Math.floor(daytime_time / 1000)} seconds), you will all vote to execute someone. Every night (which will also last ${Math.floor(daytime_time / 1000)} seconds), you will go to sleep. Beware, however, as mafia members will be trying to kill you each night! Use your hidden channel to conduct actions. Good luck!`)
                        
                        dlz_utils.write(mafia, 'mafia/mafia.json');
    
                        // GAME START!!!!
                        await main.send('The first night is coming upon us...')
                        setTimeout(nighttime, daytime_time, mafia, main, mafia_channel, detective_channel, healer_channel);
                    });
                }
            });
        }
    },
    force_end_mafia: async function(message) {
        var mafia = dlz_utils.read('mafia/mafia.json');
        mafia.ingame = false;
        dlz_utils.write(mafia, 'mafia/mafia.json');
        await message.channel.send(`${message.member} says "<@${mafia.master}> sucks!!!"`);

        // Delete channels
        message.guild.channels.find(r => r.name == 'town').delete().catch(console.error);
        message.guild.channels.find(r => r.name == 'mafia').delete().catch(console.error);
        message.guild.channels.find(r => r.name == 'healer').delete().catch(console.error);
        message.guild.channels.find(r => r.name == 'detective').delete().catch(console.error);
    }
}
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
    
    dlz_utils.write(mafia, 'mafia/maifa.json');
    console.log('Daytime!');
    console.log("actions: " + actions);
    await main.overwritePermissions(main.guild.defaultRole, {
        VIEW_CHANNEL: true,
        SEND_MESSAGES: false
    })

    // Actions
    var msg = '';

    if(actions[0] == '0') {
        var mafia_no_attack = dlz_utils.get_random(dlz_utils.read("mafia/mafia_no_attack.json"));
        msg += mafia_no_attack;
    } else {
        var first_msg = dlz_utils.get_random(dlz_utils.read("mafia/daytime_msgs.json"));
        msg += first_msg;

        var attack = dlz_utils.get_random(dlz_utils.read("mafia/attack.json")).split("*").join("<@" + actions[0] + ">");
        msg += '\n\n' + attack;

        if(actions[1] != '0') {
            if(actions[0] == actions[1]) {
                var healer_true = dlz_utils.get_random(dlz_utils.read("mafia/healer_true.json")).split("*").join("<@" + actions[0] + ">");
                msg += '\n\n' + healer_true;
                msg += '\n\n<@' + actions[0] + '> was saved!';
            } else {
                mafia_kill(actions[0], mafia, main, mafia_channel,detective_channel, healer_channel);
                var healer_false = dlz_utils.get_random(dlz_utils.read("mafia/healer_false.json")).split("*").join("<@" + actions[0] + ">");
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
            var voted = dlz_utils.mode(votes);
            mafia_kill(voted, mafia, main, mafia_channel,detective_channel, healer_channel);
            await main.send(`The citizens have voted! <@${voted}> has been chosen!\n<@${voted}> was executed!`);
        }
    });

    dlz_utils.write(mafia, 'mafia/mafia.json');
    setTimeout(nighttime, daytime_time, mafia, main, mafia_channel, detective_channel, healer_channel);
}

async function nighttime(mafia, main, mafia_channel, detective_channel, healer_channel) { //---------------------------NIGHT
    if(!mafia.ingame) {
        return;
    }

    dlz_utils.write(mafia, 'mafia/maifa.json');
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
    var nighttime_msg = dlz_utils.get_random(dlz_utils.read('mafia/nighttime_msgs.json'));
    await main.send(nighttime_msg);
    await main.overwritePermissions(main.guild.defaultRole, {
        VIEW_CHANNEL: true,
        SEND_MESSAGES: false
    })


    var actions = ['0', '0'];
    // Mafia!
    var mafia_msg = dlz_utils.get_random(dlz_utils.read("mafia/mafia_msgs.json"));
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

        var detective_msg = dlz_utils.get_random(dlz_utils.read("mafia/detective_msgs.json"));
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

        var healer_msg = dlz_utils.get_random(dlz_utils.read("mafia/healer_msgs.json"));
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

// result true = citizen win
async function mafia_end(mafia, main, result, mafia_channel, detective_channel, healer_channel) {
    mafia.ingame = false;
    dlz_utils.write(mafia, 'mafia/mafia.json');
    mafia_channel.delete();
    if(detective_channel != '0') {
        detective_channel.delete();
    }
    if(healer_channel != '0') {
        healer_channel.delete();
    }
    if(result) {
        var citizen_win = dlz_utils.get_random(dlz_utils.read("mafia/citizen_win.json"));
        await main.send(citizen_win);
    } else {
        var mafia_win = dlz_utils.get_random(dlz_utils.read("mafia/mafia_win.json"));
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

// kills a person
async function mafia_kill(user_id, mafia, main, mafia_channel,detective_channel, healer_channel) {
    console.log("Killing: " + user_id)
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
    dlz_utils.remove_val(mafia.players, user_id);
    dlz_utils.remove_val(mafia.mafia, user_id);
    dlz_utils.remove_val(mafia.detectives, user_id);
    dlz_utils.remove_val(mafia.healers, user_id);
    dlz_utils.remove_val(mafia.citizens, user_id);
}