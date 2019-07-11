const Discord = require('discord.js');
const auth = require('./auth.json');
const ytdl = require('ytdl-core');

const bot = new Discord.Client();
bot.login(auth.token);

bot.on('message', function (message) {
    if (message.content.substring(0, 1) == '`') {
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];

        args = args.splice(1);
        switch (cmd) {
            case 'ping':
                message.channel.sendMessage('pong');
                break;
            case 'play':
                message.channel.sendMessage('[play placeholder]');
                if (!args[0]) {
                    message.channel.sendMessage('Please provide a link');
                    return;
                }
                if (!message.member.voiceChannel) {
                    message.channel.sendMessage('You must be in a VC to listen');
                    return;
                }
                if (!servers[message.guild.id]) {
                    servers[message.guild.id] = {
                        queue: []
                    }
                }
                var server = servers[message.guild.id];
                server.queue.push(args[0]);
                if (!message.guild.voiceConnection) message.member.voiceChannel.join().then(function (connection) {
                    play(connection, message);
                });
                break;
            case 'pause':
                message.channel.sendMessage('[pause placeholder]');
                break;
            case 'stop':
                message.channel.sendMessage('[clear placeholder]');
                var server = servers[message.guild.id];
                if (message.guild.voiceConnection) message.guild.voiceConnection.disconnect;
                break;
            case 'skip':
                message.channel.sendMessage('[skip placeholder]');
                var server = servers[message.guild.id];
                if (server.dispatcher) server.dispatcher.end();
                break;
            case 'fuckyou':
                message.channel.sendMessage('what time?');
                break;
            default:
                message.channel.sendMessage('Invalid Command');
        }
    }
});
var servers = {};
function play(connection, message) {
    var server = servers[message.guild.id];
    server.dispatcher = connection.playStream(ytdl(server.queue[0], { filter: "audioonly" }));
    server.queue.shift();
    server.dispatcher.on('end', function () {
        if (server.queue[0]) play(connection, message);
        else connection.disconnect();
    });
}