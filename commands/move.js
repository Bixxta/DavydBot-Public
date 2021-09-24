const path = require("path");

const { SlashCommandBuilder } = require('@discordjs/builders');

const { sendEdit, sendEditError } = require(path.resolve(__dirname, `../lib/send.js`));
const musicFunctions = require(path.resolve(__dirname, "../lib/musicqueue.js"));

module.exports = {

	data: new SlashCommandBuilder()
	.setName('move')
	.setDescription(`Move a song from it's current position to somewhere else in queue`)
	.addStringOption(option =>
    	option.setName('song_position')
    		.setDescription('The position in queue of the song you want to move')
    		.setRequired(true))
	.addStringOption(option =>
		option.setName('new_position')
			.setDescription('The new position of the song in the queue')
			.setRequired(true)),

	async execute(message, globalQueue) {
		var elligible = await musicFunctions.checkElligible(message);

		if (!elligible) {
			return;
		}

		var queue = await globalQueue.get(message.guild.id);
		if (!queue) {
			return sendReplyError(message, `The bot is not currently in voice.`);
		}

		//Check if there are as many items in queue as the two numbers chosen
		var pos1 = message.options.getString('song_position');
		var pos2 = message.options.getString('new_position');
		var posReg = /^([1-9]\d*)$/;
		if (!pos1 || !pos2|| !posReg.exec(pos1) || !posReg.exec(pos2)) { //make sure there is an argument ; we only care about the first one
			return sendReplyError(message, `I need integer inputs for both original position and new position.`);
		}
		pos1 = parseInt(pos1, 10);
		pos2 = parseInt(pos2, 10);

		if (!musicFunctions.swapSpots(queue.songs, pos1, pos2)) {
			return;
		}

		return sendReply(message, `Moved ${queue.songs[pos2].title} to position ${pos2}.`);

	},
};
