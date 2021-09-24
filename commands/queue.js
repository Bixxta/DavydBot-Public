const path = require("path");

const { SlashCommandBuilder } = require('@discordjs/builders');

const { sendEdit, sendEditError } = require(path.resolve(__dirname, `../lib/send.js`));
const musicFunctions = require(path.resolve(__dirname, "../lib/musicqueue.js"));

module.exports = {

  	data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Displays the first 10 songs in queue'),

	async execute(message, globalQueue) {
		var elligible = await musicFunctions.checkElligible(message);

		if (!elligible) {
			return;
		}

		var queue = await globalQueue.get(message.guild.id);
		if (!queue) {
			return sendReplyError(message, `The bot is not currently in voice.`);
		}

		songList = musicFunctions.showQueue(message.guild, queue);
		return sendReply(message, songList);
	},
};
