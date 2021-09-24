const path = require("path");

const { SlashCommandBuilder } = require('@discordjs/builders');

const { sendEdit, sendEditError } = require(path.resolve(__dirname, `../lib/send.js`));
const musicFunctions = require(path.resolve(__dirname, "../lib/musicqueue.js"));

module.exports = {

  	data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clears the music queue'),

	async execute(message, globalQueue) {
		if (message.channel.guild) { //If message was sent in a chat
			queue = globalQueue.get(message.guild.id)
			if (queue) { //if there is a current queue
				musicFunctions.skipAll(message.guild, globalQueue);
				return sendReply(message, "Cleared the queue.");
			} else {
				return sendReply(message, "I'm not in voice.");
			}
		}
		return;
	},
};
