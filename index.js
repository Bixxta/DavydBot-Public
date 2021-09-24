const fs = require(`fs`);
const { Client, Collection, Intents } = require(`discord.js`);

const path = require("path");

//Get important authentication token
const { token } = require(path.resolve(__dirname, `./token.json`));

//Get send library functions
const { sendReplyError } = require (path.resolve(__dirname, `./lib/send.js`));

// create a new instance of a discord client
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES]});

client.commands = new Collection();

const commandFiles = fs.readdirSync(path.resolve(__dirname, `./commands/`)).filter(file => file.endsWith(`.js`));

const globalQueue = new Map();

for (const file of commandFiles) {
	const command = require(path.resolve(__dirname, `./commands/${file}`));
	//set a new item in the collection using commandname and value respectively
	client.commands.set(command.data.name, command);
}

// log username in log once when the client is ready
client.once(`ready`, () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on(`ready`, () => {
	client.user.setActivity(`you`, { type: `WATCHING`});
});

// listen for interaction and echo them
client.on('interactionCreate', async interaction => {

	if (!interaction.isCommand()) return;

	const { commandName } = interaction;

	const command = client.commands.get(interaction.commandName);

	if (command) {
		//console.log(interaction);
		try {
			await command.execute(interaction, globalQueue);
		} catch (error) {
			console.error(error);
			try {
				sendReplyError(interaction, 'There was an error while executing this command!');
			} catch (error) {
				console.error(error);
			}
		}
	}


});

// log in with token - should probably get this from a txt TODO
client.login(token);
