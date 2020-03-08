// Gets json for authentication with APIs
const auth= require('./auth.json');
const Discord = require('discord.js');

// Init APIs
const alpha  = require('alphavantage')({key: auth.alpha_vantage_key});
const bot = new Discord.Client();

const channel_ids = {
    'poll' : '686017506041004055'
}

bot.login(auth.discord_token);
bot.on('ready', async () => {
    console.log(`${bot.user.username} is online.`);
    bot.user.setActivity(
        `ssp is obese | ${prefix}help`
    ).then(
        presence => console.log(`Activity set to ${presence.game ? presence.game.name : 'none'}`)
    ).catch(console.error);
});

const prefix = '&';

// Commands- Key is command, value is help
var commands = {
    'help': 'Returns a list of commands.',
    'check': 'Returns stock data for the argument. Usage: `check <SYMBOL>`',
    'roll' : 'Returns a random number from 0 to <param> or <param1> to <param2> inclusive. Usage: `roll <MAX>` or `roll <MIN> <MAX>`',
    'poll' : 'Creates a poll with the provided arguments as options'
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
    var content = message.content;

    if(content.substring(0,1) == prefix) {
        var args = content.substring(1).split(' ');
        var cmd  = args[0];

        console.log(`Executed ${cmd} with parameter(s): ${args}`);

        switch(cmd) {
            case 'help' : 
            if(args.length < 2) {
                var response = '';
                var keys = Object.keys(commands);
                for(var i = 0; i < keys.length; i++) {
                    response += keys[i] + '\n';
                }
                message.channel.send(`Valid commmands are:\n${response}`);
            } else {
                message.channel.send(commands[args[1]]);
            }
                 break;
            case 'roll':
                if(args.length < 3) {
                    message.channel.send(`Rolled: ${Math.trunc(Math.random() * parseInt(args[1])) + 1}`);
                }
                else {
                    message.channel.send(`Rolled: ${Math.trunc(Math.random() * (parseInt(args[2]) - parseInt(args[1]) + 1)) + parseInt(args[1])}`);
                }
                break;
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
            case 'poll': 
                var poll = args[1];
                let poll_msg = await bot.channels.get(channel_ids['poll']).send(poll);
                for(var i = 2; i < args.length; i++) {
                    await poll_msg.react(args[i]);
                }
            break;
            default: message.channel.send(`'${cmd}' is not a valid command.`); break;
        }
    }
});