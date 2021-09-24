const { SlashCommandBuilder } = require('@discordjs/builders');
const path = require("path");

const { sendReply, sendReplyError } = require(path.resolve(__dirname, `../lib/send.js`));

module.exports = {

	data: new SlashCommandBuilder()
	.setName('ask')
	.setDescription('Ask and Davyd shall answer')
    .addStringOption(option =>
    	option.setName('question')
    		.setDescription('Ask Davy what you want to know')
    		.setRequired(true)),

	async execute(message) {
		let answers = ["Yes!", "My outlook is pretty positive", "No way", "Nope", "Perhaps", "Who knows?",  "Idk fam", "My outlook isn't good", "I don't like it"];
		let chosenAnswer = Math.floor(Math.random() * (answers.length - 1));
		let response = "You asked: " + message.options.getString('question') + "\nI answer: " + answers[chosenAnswer];
		return sendReply(message, response);
	},
};
