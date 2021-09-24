const path = require("path");

const { SlashCommandBuilder } = require('@discordjs/builders');

const { sendEdit, sendEditError } = require(path.resolve(__dirname, `../lib/send.js`));
const musicFunctions = require(path.resolve(__dirname, "../lib/musicqueue.js"));

module.exports = {

	data: new SlashCommandBuilder()
	.setName('shuffle')
	.setDescription(`Shuffles every song in the queue`),

	async execute(message, globalQueue) {
		var elligible = await musicFunctions.checkElligible(message);

		if (!elligible) {
			return;
		}

		var queue = await globalQueue.get(message.guild.id);
		if (!queue) {
			return sendReplyError(message, `The bot is not currently in voice.`);
		}

		if (!musicFunctions.shuffleQueue(queue.songs)) {
			return;
		}

		return sendReply(message, `Shuffled the queue.`);

	},
};
