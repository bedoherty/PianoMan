import config from './settings/config.json';
import Discord from 'discord.js';

const client = new Discord.Client();

client.on('ready', () => {
  console.log('Bot running');
});

client.on('message', message => {
    if (message.content[0] !== config.commandPrefix)
    {
        return;
    }

    //  Filter out our message string
    var command = message.content.substring(1);

    //  Get our sender
    var sender = message.member;

    executeMeme(sender, command);

    //    Commands after this line cannot be whispered
    if (!message.guild) return;
});

function executeMeme(sender, command)
{
    console.log("Searching meme: " + command);
    //  Filter our meme commands to see if it's a known configured meme
    var possibleMemes = config.memes.filter((meme) => {return meme.command === command});
    console.log(config.memes);
    console.log(possibleMemes);

    if (possibleMemes.length >= 1)
    {
        var meme = possibleMemes[0];
        console.log("Executing meme: " + meme.command);
        if (sender.voiceChannel)
        {
            sender.voiceChannel.join()
            .then(connection => {
                const dispatcher = connection.playFile(meme.file);
                dispatcher.on('end', function(){
                    connection.disconnect();
                });
            });
        }
    }
}

//  Init bot login
client.login(config.botToken);