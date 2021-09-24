const path = require("path");

const { SlashCommandBuilder } = require('@discordjs/builders');

const ytdl = require('ytdl-core');

const { sendEdit, sendEditError } = require(path.resolve(__dirname, `../lib/send.js`));
const musicFunctions = require(path.resolve(__dirname, "../lib/musicqueue.js"));

module.exports = {

	data: new SlashCommandBuilder()
	.setName('play')
	.setDescription('Adds the selected video to the play queue')
	.addStringOption(option =>
    	option.setName('link')
    		.setDescription('Youtube video link')
    		.setRequired(true)),

	async execute(message, globalQueue) {
		var elligible = await musicFunctions.checkElligible(message);

		if (!elligible) {
			return;
		}

		if (!message.options.getString('link') || !ytdl.validateURL(message.options.getString('link'))) { //make sure there is an argument ; we only care about the first one
			return sendReplyError(message, `Invalid link. Correct Usage: /play [youtubelink]`);
		}

		await message.deferReply();

		//Parse the song
		var song = await musicFunctions.getSongInfo(message.options.getString('link'));
		if (!song) {
			return sendEditError(message, `That video cannot be played. (Most likely age restricted or private)`);
		}

		//add video to queue - check if this server has a queue
		var queue = globalQueue.get(message.guild.id);

		//If there's no music queue make one
		if (!queue) {
			// Creating the contract for our queue
			queue = await musicFunctions.createQueue(message, globalQueue);
			if (!queue) {
				return sendEdit(message, `Something went wrong creating the queue.`);
			}
		}
		if (!queue.currentSong) {

			queue.currentSong = song;
			musicFunctions.playSong(message.guild, globalQueue);

		} else {
			queue.songs.push(song);
		}
		return sendEdit(message, `Added ${song.title}\t[${song.length}] to the queue.`);

	},
};
