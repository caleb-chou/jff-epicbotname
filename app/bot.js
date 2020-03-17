// Gets json for authentication with APIs
const auth= require('./auth.json');
const Discord = require('discord.js');

// Authentication with SteamAPI
const SteamAPI = require('steamapi');
const steam = new SteamAPI(auth.steamapi);

// Init APIs
const bot = new Discord.Client();

// Import Mafia
const mafia_lib = require('./mafia_lib.js');

// Import dlz_utils
const dlz_utils = require('./dlz_utils.js');

// Get configuration file
const config = require('./config.json');

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
const prefix = config.prefix;

// Channel IDs 
const channel_ids = config.channel_ids;

// Commands- Key is command, value is help
const commands = require('./commands.json');

var admin_role = config.roles.admin; //"674476313343557632";
var timeout = config.roles.timeout; //"686438951354892290";

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

    if(message.content.match(/!hunt.*/)) {
        message.channel.send('I AM OBESE');
    }
    //if(message.member.user.username.match(/.*jjdsjk.*/)) {
    //    message.channel.send('🚨 TIMEOUT! 🚨');
    //}

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
                if(message.member.roles.has(admin_role)) {
                    var amount = args[1]; // Argument passed for # of messages to delete
                    message.channel.bulkDelete(amount).then(() => { // Bulk deletes messages
                        message.channel.send(`Deleted ${amount} message(s)`); // Sends message that messages have been deleted
                    });
                } else {
                    message.channel.send('You do not have permissions to do this!');
                }
                break;
            

            case 'force_end_mafia':
                mafia_lib.force_end_mafia(message);
                break;
            
                // Mafia
            case 'mafia':
                mafia_lib.start_mafia(message, args);
                break;
            
            case 'timeout':
                var role = message.guild.roles.get(timeout);
                if(message.member.roles.has(admin_role)) {
                    var member = message.mentions.members.first();
                    if(member.roles.has(timeout)) {
                        // Remove timeout role
                        member.removeRole(role).catch(console.error);
                        message.channel.send(`Removed ${member} from timeout`)

                        var timeout_roles = dlz_utils.read('timeout.json');
                        for(var i = 0; i < timeout_roles[member.id].length; i++) {
                            member.addRole(timeout_roles[member.id][i]).catch(console.error);
                        }
                    } else {
                        // Save roles before timeout (excluding everyone)
                        var timeout_roles = dlz_utils.read('timeout.json');
                        var roles = [];
                        for(let [k, v] of member.roles) {
                            if(k != config.roles.everyone) {
                                roles.push(k);
                            }
                        }
                        timeout_roles[member.id] = roles;
                        dlz_utils.write(timeout_roles, 'timeout.json');
                        for(var i = 0; i < roles.length; i++) {
                            member.removeRole(roles[i]).catch(console.error);
                        }

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
                    setTimeout(function(){message.member.removeRole(role).catch(console.error);
                        message.channel.send(`${message.member} is obese.`)}, 30 * 1000);
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
            
            case 'csgostats':
                if(args.length < 2) {
                    message.channel.send('Not enough arguments.');
                } else {
                    steam.getUserStats(args[1],'730').then(data => {
                        console.log(data.stats);
                        var stats = data.stats;
                        console.log(stats);
                        message.channel.send(`\`\`\`md\n# ${args[2]}\n- KDR: \t\t\t${stats.total_kills/stats.total_deaths}\n- Accuracy:\t\t${stats.total_shots_hit/stats.total_shots_fired}\`\`\``)
                        .catch(console.error);
                    });
                }
                break;
            case 'whoObese':
                message.channel.send('ERNEST LU');
            break;

            case 'didiask':
                message.channel.send('ɴᴏᴡ ᴘʟᴀʏɪɴɢ:\nWho asked (Feat: No one) ───────────⚪── ◄◄⠀▐▐ ⠀►► 5:12/ 7:𝟻𝟼 ───○ 🔊⠀ ᴴᴰ  ⚙️');
                break;
            // Handle invalid commands
            default: message.channel.send(`'${cmd}' is not a valid command.`); break;
        }
    }
});