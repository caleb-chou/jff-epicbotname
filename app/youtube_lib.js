const auth = require('./auth.json');
const googleapis  = require('googleapis');
const ytdl     = require('ytdl-core');
const Discord  = require('discord.js');

var youtube = googleapis.youtube({
    version: 'v3',
    auth: auth.youtube_key
 });
 
 youtube.search.list({
    part: 'snippet',
    q: 'your search query'
  }, function (err, data) {
    if (err) {
      console.error('Error: ' + err);
    }
    if (data) {
      console.log(data)
    }
  });

module.exports = {
    
}