const Discord = require('discord.js');
const bot = new Discord.Client();

bot.on('ready', () => {
	console.log('Loaded Jaggy');
});

bot.login('Njg4NDgxNTk0MDc1MjUwNzUy.Xm0-lQ.NU7thx_TdNb3fPNJzgUWkpaJ4no'); 

var activeGame = false;  var timeLeft = 60; var pts = 0;

bot.on('message', function (user, userID, channelID, message, evt) {
    if(activeGame){
    	var sz = 5; var brd = new Array(sz); var vis = new Array(sz); var valids =[];
    	var vowels = ['A','E','I','O','U'];
    	subTime(){
    		timeLeft--;
    		if(timeLeft == 0)activeGame = false;
    	}
    	printBoard(){
    		const embed = new MessageEmbed()
     		.setTitle('TIME LEFT: ' + timeLeft)
      		.setColor(0x0099ff)
      		.setDescription(sz + ' by ' + sz + ' board - answer with xywasdqezc or numpad' );
      		for(var i = 0; i<sz; i++){
      			for(var j = 0; j<sz; j++){
      				embed.addField((i+1) + ', ' + (j+1), brd[i][j], true);	
      			}
      		}
    		bot.sendMessage({
    			to: channelID;
    			message: embed;
    		});
    	};
    	memset(){
    		for(var i = 0; i<sz; i++){
    			for(var j = 0; j<sz; j++){
    				vis[i][j] = false;
    			}
    		}
    	}
    	dfs(x,y,cur){
    		vis[x][y] = true;
    		cur+=brd[x][y];
    		if(valid(cur))valids.push(cur);
    		for(var i = 0; i<9; i++){
    			if(x+dx[i]< sz && x+dx[i]>=0){
    				if(y+dy[i]<sz && y+dy[i]>=0){
    					if(!v[x+dx[i]][y+dy[i]]){
    						dfs(x+dx[i],y+dy[i],cur);
    					}
    				}
    			}
    		}
    	}
    	for(var i = 0; i<sz; i++){
    		brd[i] = new Array(sz);
    		vis[i] = new Array(sz);
    	}
    	for(var i = 0; i<sz; i++){
    		for(var j = 0; j<sz; j++){
    			if(j%3==0 || i%3==0)brd[i][j] = vowels[Math.floor(Math.random()*5)];
    			else brd[i][j] = String.fromCharCode(Math.floor(Math.random()*27)+65);
    		}
    	}
    	var args = message;
    	if(args === 'I AM OBESE')activeGame=false;
    	else {
    		if(args === 'plz help I need ze aimbot'){
	    		for(var i = 0; i<sz; i++){
	    			for(var j = 0; j<sz; j++){
	    				memset();
	    				dfs(i,j,'');
	    			}
	    		}
    		}
    		else {args+='5';}
	    	var sx; var sy; var fr ='';
	    	printBoard();
	    	setInterval(subTime, 1000);
	    	var dx = [-1,0,1,-1,0,1,-1,0,1];
	    	var dy = [-1,-1,-1,0,0,0,1,1,1];
	    	for(var ate = 2; ate<args.length; ate++){
	    		if(sx+dx[args[ate]]>=0 && sx+dx[args[ate]]<sz){
	    			if(sy+dy[args[ate]]>=0 && sy+dy[args[ate]]<sz){
	    				fr+=brd[sx][sy];
	    				sx+=dx[args[ate]-1];
	    				sy+=dy[args[ate]-1];
	    			}
	    		}
	    	}
	    	bot.sendMessage({
    			to: channelID;
    			message: 'YOU CHOSE THE WORD: ' + fr;
    		});
	    	if(valid(fr)){
	    		pts+=fr.length*100;
	    		bot.sendMessage({
    				to: channelID;
    				message: 'YOU GAINED ' + fr.length*100 + ' points';
    			});
    			bot.sendMessage({
    				to: channelID;
    				message: 'YOU NOW HAVE ' + pts + ' points';
    			});

	    	}
	    }
    }
    else if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
        args = args.splice(1);
        switch(cmd) {
            case 'whoObese':
                bot.sendMessage({
                    to: channelID,
                    reply: ' is obese'
                });
            break;
            case 'rap':
            	bot.sendMessage({
            		to: channelID,
            		message: 'God Damn! I feel like the man! Freshman of the year I woke up like the man! Never popping xans cuz they killing me damn! When you got that money they be tryna be your friend! OK! This a lame ass beat! Walk up on ur bitch my dick 8 feet deep.'
            	})
            case 'cunt':
            	bot.sendMessage({
                    to: channelID,
                    reply: ' CUNT GAME IS ACTIVE, say "I AM OBESE" or wait for game to stop to stop game'
                });
                activeGame = true; timeLeft = 60; pts =0;
                break;
         }
     }
});