const path = require("path");

const { SlashCommandBuilder } = require('@discordjs/builders');

const { sendEdit, sendEditError } = require(path.resolve(__dirname, `../lib/send.js`));
const musicFunctions = require(path.resolve(__dirname, "../lib/musicqueue.js"));

module.exports = {

  	data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Causes DavydBot to move to the next song in queue'),

	async execute(message, globalQueue) {
		var elligible = await musicFunctions.checkElligible(message);

		if (!elligible) {
			return;
		}

		var queue = await globalQueue.get(message.guild.id);
		if (!queue) {
			return sendReplyError(message, `The bot is not currently in voice.`);
		}

		if (!queue.playing) {
			return sendReplyError(message, `There's nothing currently playing.`);
		}

		var current = queue.currentSong;
		musicFunctions.skipCurrent(message.guild, globalQueue);
		return sendReply(message, `Skipping ${current.title}\t[${current.length}].`);

	},
};
