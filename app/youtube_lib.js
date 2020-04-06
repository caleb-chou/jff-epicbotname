const auth = require('./auth.json');
const googleapis  = require('googleapis');
const ytdl     = require('ytdl-core');
const Discord  = require('discord.js');

var youtube = googleapis.youtube({
    version: 'v3',
    auth: auth.youtube_key
 });
 
module.exports = {

}