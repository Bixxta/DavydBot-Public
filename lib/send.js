const Discord = require('discord.js');

	async function sendReply(interaction, message) {
		await interaction.reply(message);
	}

	async function sendMessage(channel, message) {
		await channel.send(message);
	}

	async function sendEdit(interaction, message) {
		await interaction.editReply(message);
	}

	async function sendEditError(interaction, message) {
		await interaction.editReply({content: message, ephemeral: true});
	}

	async function sendReplyError(interaction, message) {
		await interaction.reply({content: message, ephemeral: true});
	}

	async function sendFollowUp(interaction, message) {
		await interaction.followUp(message);
	}

	async function sendFollowUpError(interaction, message) {
		await interaction.followUp({content: message, ephemeral: true});
	}

module.exports = {sendReply, sendMessage, sendEdit, sendEditError, sendReplyError, sendFollowUp, sendFollowUpError}
