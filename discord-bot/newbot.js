const Discord = require('discord.js');
const auth = require('./auth.json');
const ytdl = require('ytdl-core');
const getJSON = require('get-json');

const bot = new Discord.Client();
bot.login(auth.token);

bot.on('ready', async () => {
    console.log(`${bot.user.username} is online!`);
    bot.user.setActivity('coolcatcoding! | `help');
});

bot.on('message', function (message) {
    if (message.content.substring(0, 1) == '`') {
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];

        args = args.splice(1);
        switch (cmd) {
            case 'ping':
                message.channel.send('pong');
                break;
            case 'help':
                message.channel.send('Commands:\n' +
                    'play\nstop\nskip\nfuckyou\n'
                );
                break;
            case 'play':
                message.channel.send('[play placeholder]');
                if (!args[0]) {
                    message.channel.send('Please provide a link');
                    return;
                }
                if (!message.member.voiceChannel) {
                    message.channel.send('You must be in a VC to listen');
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
                    var id = args[0].match(/^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/)[1];
                    getJSON('https://www.googleapis.com/youtube/v3/videos?part=id%2Csnippet&id=' + id + '&key=' + auth.apikey, function (error, data) {
                        console.log('Now playing: ' + data.items[0].snippet.localized.title);
                        message.channel.send('**Now playing:** *' + data.items[0].snippet.localized.title + '.*');
                    });
                    play(connection, message);
                });
                break;
            case 'pause':
                message.channel.send('[pause placeholder]');
                break;
            case 'stop':
                message.channel.send('[clear placeholder]');
                var server = servers[message.guild.id];
                if (message.guild.voiceConnection) {
                    for (var i = server.queue.length - 1; i >= 0; i--)
                        server.queue.splice(i, 1);
                    server.dispatcher.end();
                }
                console.log('Stopped Playing')
                break;
            case 'skip':
                message.channel.send('[skip placeholder]');
                var server = servers[message.guild.id];
                if (server.dispatcher) server.dispatcher.end();
                console.log('Skipped');
                break;
            case 'fuckyou':
                message.channel.send('what time?');
                break;
            default:
                message.channel.send('Invalid Command');
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