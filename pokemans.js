const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
var Servers;
var pokemans;
try {
	// 'key.txt' : a file containing the discord token
	var key = fs.readFileSync('key.txt').toString();
	console.log(key);
}
catch {
	console.log("missing bot token in 'key.txt'");
	process.exit(1);
}


client.on('ready', () => {
    console.log("Connected as " + client.user.tag);
	var data;
	try
	{
		data = fs.readFileSync('servers.pkmn');
		Servers = JSON.parse(data);
	}
	catch
	{
		Servers = {"date":0,"servers":{}};
	}
	try
	{
		data = fs.readFileSync('pokemans.txt');
		pokemans = JSON.parse(data);
		console.log("loaded pokemans.txt (" + pokemans.length + ")");
	}
	catch(e)
	{
		throw e;
	}
});


process.on('exit', (code) => {
  console.log(`About to exit with code: ${code}`);
});

process.on('pokemon', (msg) => {
	var server = msg.guild.id;
	var user = msg.author.id;
	var pkmn = {};
	var filename = 'data/' + server + '/' + user + '.pkmn';
	fs.readFile(filename, (err, data) => {
		if (err)
		{
			pkmn.caught = 0;
			pkmn.catchable = 6;
			pkmn.chips = 1000;
			pkmn.count = 0
			pkmn.pokemon = {};
		}
		else
		{
			pkmn = JSON.parse(data);
		}
		if (pkmn.caught < pkmn.catchable)
		{
			pkmn.caught++;
			pkmn.count++;
			var rr = ~~(Math.random() * pokemans.length);
			if (pkmn.pokemon[pokemans[rr]])
			{
				pkmn.pokemon[pokemans[rr]]++;
			}
			else
			{
				pkmn.pokemon[pokemans[rr]] = 1;
			}
			fs.mkdir('data/' + server, {recursive: true}, (errr) => {
				fs.writeFile(filename, JSON.stringify(pkmn), (errrr) => {
					console.log(errrr);
				});
				if (Servers.servers[server] != 2)
				{
					Servers.servers[server] = 2;
					fs.writeFile('servers.pkmn', JSON.stringify(Servers), (err) => {
						if (err) console.log(err);
					});
				}
			});
			msg.channel.send('**'+msg.member.nickname+'**, You caught a **'+pokemans[rr]+'**! Pokemon caught today : '+pkmn.caught+'/'+pkmn.catchable);
			
		}
		else
		{
			msg.channel.send('**'+msg.member.nickname+'**, You have no catches left today. You have caught '+pkmn.caught+'/'+pkmn.catchable+' today.');
		}
	});
});

process.on('balance', (ss) => {
	var options = {};
	options.withFileTypes = true;
	try
	{
		var server = fs.readdirSync('data/'+ss, options);
		server.forEach((y) => {
			var rex = /.pkmn$/ig;
			if (rex.test(y.name))
			{
				console.log('b '+y.name);
				var user = fs.readFileSync('data/'+ss+'/'+y.name);
				var pkmn = JSON.parse(user);
				pkmn.caught = 0;
				user = JSON.stringify(pkmn);
				fs.writeFileSync('data/'+ss+'/'+y.name, user);
			}
		});
		console.log("balanced "+ss);
	}
	catch
	{
		console.log("oops");
	}
});

client.on('message', (receivedMessage) => {
	// Prevent bot from responding to its own messages
    var metaban = receivedMessage.author == client.user;
	if (metaban) return;
	
	// Stop bot early when message is not a usercode
	var msg = receivedMessage.content;
	if (msg.charAt(0) != ']') return;
	
	var usercode = /^] */i;
	
	// mebbeh do this a little earlier
	if (Servers.date < ~~(receivedMessage.createdTimestamp/86400000))
	{
		if (Servers.date != 0)
		{
			for (var ss in Servers.servers)
			{
				// ss is the index
				if (Servers.servers[ss] > 0)
				{
					process.emit('balance', ss);
					Servers.servers[ss]--;
				}
			}
		}
		Servers.date = ~~(receivedMessage.createdTimestamp/86400000);
	}
	
	if (receivedMessage.channel.type == 'text')
	{
		var admin = receivedMessage.guild.ownerID == receivedMessage.author.id;
		msg = msg.replace(usercode, "");
		var usercommand = msg.split(/\s+/);
		console.log(usercommand[0]+usercommand.length);
		switch(usercommand[0])
		{
		case "balance":
			console.log(receivedMessage.guild.ownerID + " - " + receivedMessage.author.id);
			if (admin)
			{
				receivedMessage.channel.send("helOwO");
				process.emit('balance', receivedMessage.guild.id);
			}
			break;
		case "pokemon":
			process.emit('pokemon', receivedMessage);
			break;
		case "":
			console.log("ooOOOOps");
			break;
		default:
			break;
		}
	}
});

client.login(key);