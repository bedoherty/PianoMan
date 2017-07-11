import config from '../settings/config.json';
import Discord from 'discord.js';
import ytdl from 'ytdl-core';
import youtube from 'youtube-node';

//  Prep youtube search
var ytSearch = new youtube();
ytSearch.setKey(config.youtubeKey);

export default class PianoMan {
    constructor()
    {
        //  Init bot and login
        this.client = new Discord.Client();
        this.client.login(config.botToken);
        this.client.on('message', this.handleMessage);
        this.queue = config.defaultQueue;
    }

    handleMessage = (message) => {
        if (message.content[0] !== config.commandPrefix)
        {
            return;
        }

        //  Filter out our message string
        var command = message.content.split(" ")[0].substring(1);

        //  Filter out our parameters
        var params = message.content.split(" ").slice(1);

        //  Get our sender
        var sender = message.member;

        //    Commands after this line cannot be whispered
        if (!message.guild) return;

        //  Switch case on known commands
        switch(command)
        {
            case "vol":
                console.log("Volume: " + params[0]);
                config.volume = parseFloat(params[0]);
                sender.voiceChannel.connection.dispatcher.setVolume(parseFloat(params[0]));
                break;
            case "resume":
                if (sender.voiceChannel.connection)
                {
                    sender.voiceChannel.connection.dispatcher.resume();
                }
                else if (this.queue.length !== 0)
                {

                }
                break;
            case "pause":
                if (sender.voiceChannel.connection)
                {
                    sender.voiceChannel.connection.dispatcher.pause();
                }
                break;
            case "skip":
                if (sender.voiceChannel.connection)
                {
                    sender.voiceChannel.connection.dispatcher.end();
                }
                break;
            case "play":
                ytSearch.search(params.join(" "), 1, (error, result) => {
                    if (error)
                    {
                        console.log(error);
                    }
                    else
                    {
                        console.log(result.items[0].id.videoId);
                        var songId = result.items[0].id.videoId;
                        var songName = result.items[0].snippet.title;
                        if (sender.voiceChannel.connection && sender.voiceChannel.connection.speaking)
                        {
                            this.queue.push(songId);
                            message.channel.send("Added " + songName + " to the song queue.  Position: " + this.queue.length.toString());
                        }
                        else
                        {
                            this.playSong(sender, songId);
                        }
                    }
                });
                break;
            default:
                this.executeMeme(sender, command);
                break;
        }
    }



    playSong = (sender, songId) => {
        var ytstream = ytdl("https://www.youtube.com/watch?v=" + songId);
        if (sender.voiceChannel)
        {
            sender.voiceChannel.join()
            .then(connection => {
                console.log(connection.speaking);
                if (!connection.speaking)
                {
                    const dispatcher = connection.playStream(ytstream, {volume: config.volume, passes: 3});
                    dispatcher.on('end', () => {
                        if (this.queue.length == 0)
                        {
                            console.log("Song over, all songs finished");
                            connection.disconnect();
                        }
                        else
                        {
                            console.log("Song over, playing next song");
                            this.playSong(sender, this.queue.pop());
                        }
                    });

                    dispatcher.on('error', (error) => {
                        console.log(error);
                    });
                }
            });
        }
    }

    executeMeme = (sender, command) =>
    {
        console.log("Searching meme: " + command);
        //  Filter our meme commands to see if it's a known configured meme
        var possibleMemes = config.memes.filter((meme) => {return meme.command === command});

        if (possibleMemes.length >= 1)
        {
            var meme = possibleMemes[0];
            console.log("Executing meme: " + meme.command);
            if (sender.voiceChannel)
            {
                sender.voiceChannel.join()
                .then(connection => {
                    console.log(connection.speaking);
                    if (!connection.speaking)
                    {
                        const dispatcher = connection.playFile(meme.file, {volume: config.volume});
                        dispatcher.on('end', function(){
                            connection.disconnect();
                        });
                    }
                });
            }
        }
    }
}