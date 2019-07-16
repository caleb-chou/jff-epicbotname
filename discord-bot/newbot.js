// Imports
const Discord = require('discord.js');
const auth = require('./auth.json');
const ytdl = require('ytdl-core');
const YouTube = require('simple-youtube-api');

const bot = new Discord.Client();
const yt = new YouTube(auth.apikey);


// Authenticate for bot
bot.login(auth.token);
bot.on('ready', async () => {
    console.log(`${bot.user.username} is online!`);
    bot.user.setActivity('coolcatcoding! | `help');
});

// Get commands
bot.on('message', async message => {
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
                console.log(args[0]);
                if (!args[0]) {
                    message.channel.send('Please provide a link');
                    return;
                }
                if (!message.member.voiceChannel) {
                    message.channel.send('You must be in a VC to listen');
                    return;
                }
                if (args[0].match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
                    const playlist = await yt.getPlaylist(args[0]);
                    const videos = await playlist.getVideos();
                    for (const video of Object.values(videos)) {
                        const vid = await yt.getVideoByID(video.id);
                        await handle(vid, message);
                    }
                    message.channel.send(`Added Playlist:${playlist.title} to the queue`);
                } else if (args[0].match(/^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/)) {
                    var video = await yt.getVideo(args[0]);
                    await handle(video, message);
                } else {
                    message.channel.send(`${args[0]} is not a valid url.`);
                }
                
                break;
            case 'pause':
                message.channel.send('[pause placeholder]');
                break;
            case 'stop':
                message.channel.send('Stopped playing and cleared queue.');
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
            case 'volume':
                message.channel.send(`[volume placeholder]`);
                if(!args[1]) message.channel.send
            case 'fuckyou':
                message.channel.send('what time?');
                break;
            default:
                message.channel.send('Invalid Command');
                break;
        }
    }
});
// Functions for processing songs
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
async function handle(video, message) {
    const song = {
        id: video.id,
        title: video.title,
        url: `https://www.youtube.com/watch?v=${video.id}`
    };
    if (!servers[message.guild.id]) {
        servers[message.guild.id] = {
            queue: []
        };
    }
    var server = servers[message.guild.id];
    server.queue.push(video.url);
    if (!message.guild.voiceConnection) message.member.voiceChannel.join().then(function (connection) {
        console.log(`Now playing: ${song.title}`);
        message.channel.send(`**Now playing:** ${song.title}.`);
        play(connection, message);
    });
}