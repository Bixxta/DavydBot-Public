const path = require("path");

const { SlashCommandBuilder } = require('@discordjs/builders');

const { sendEdit, sendEditError } = require(path.resolve(__dirname, `../lib/send.js`));
const musicFunctions = require(path.resolve(__dirname, "../lib/musicqueue.js"));

module.exports = {

	data: new SlashCommandBuilder()
	.setName('leave')
	.setDescription('Causes DavydBot to immediately delete the playlist and leave the call'),

	async execute(message, globalQueue) {
		var elligible = await musicFunctions.checkElligible(message);

		if (!elligible) {
			return;
		}

		var queue = await globalQueue.get(message.guild.id);
		if (!queue) {
			return sendReplyError(message, `The bot is not currently in voice.`);
		}

		musicFunctions.leaveQueue(message.guild, globalQueue);
		return sendReply(message, `Well ima head out!`);
	},
};
