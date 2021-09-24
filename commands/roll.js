const path = require("path");

const { SlashCommandBuilder } = require('@discordjs/builders');

const { sendReply, sendReplyError } = require(path.resolve(__dirname, `../lib/send.js`));

module.exports = {

  	data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Rolls a specified number of die')
    .addStringOption(option =>
    	option.setName('type')
    		.setDescription('(# dice)d[integer](+/-)(integer)')
    		.setRequired(true)),

	async execute(message) {
		var rollReg = /^([1-9]?)([d])([1-9][0-9]*)([\\+\\-]?)([0-9]*)$/i;
		if (!message.options.getString('type')) {
			return sendReplyError(message, `Correct Usage: /roll (optional:[num dice])d[integer](optional:[+/-][integer])`);
		}
		var checkString = rollReg.exec(message.options.getString('type'));
		if (!checkString) {
			return sendReplyError(message, `Correct Usage: /roll (optional:[num dice])d[integer](optional:[+/-][integer])`);
		}
		var diceType = (Number)(checkString[3]);
		var numDice = 1;
		if (checkString[1]) {
			numDice = (Number)(checkString[1]);
		}
		var diceRolls = [];
		var finalRoll = 0;
		var modifier = 0;
		for (var i = 0; i < numDice; i++) {
			diceRolls[i] = Math.ceil(Math.random() * (diceType)); //roll a random number between 1 and diceType
			finalRoll += (Number)(diceRolls[i]);
		}
		if (checkString[4]) { //don't need to check if we had this and the actual num after, because both are needed for valid regex
			var modifyType = checkString[4];
			modifier = (Number)(checkString[5]);
			if (modifyType == `+`) {
				finalRoll += modifier;
			} else { //no need to check for `-` because only + and - are possible with regex
				finalRoll -= modifier;
			}
		}
		//Final roll determined, provide feedback
		var messageToSend = ``;
		if (checkString[1] && numDice > 1) { //add a summary of each roll for multiple die
			messageToSend = messageToSend + `Summary of dice rolled:\n`;
			for (var j = 0; j < numDice; j++) {
				messageToSend = messageToSend + `Dice ` + (j + 1) + ` rolled a ` + diceRolls[j] + `.\n`;
			}
		}
		messageToSend = messageToSend + `On a ` + checkString[0] + `, you rolled a ` + finalRoll + `.`;
		if (finalRoll == 1 * numDice + modifier) {
			messageToSend = messageToSend + ' Ouch, my dude.';
		} else if (finalRoll == checkString[3] * numDice + modifier) {
			messageToSend = messageToSend + ' That is mint!';
		}
		return sendReplyError(message, messageToSend);
		//d6, d20, d12, d8, d4. d100, d10
	},
};
