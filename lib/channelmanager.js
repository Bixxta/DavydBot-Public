const fs = require('fs');
const path = require("path");

const { sendReply, sendReplyError } = require(path.resolve(__dirname, `../lib/send.js`));

function createFile(channel, filePath) {
  fs.writeFile(filePath, '', function (err) {
    if (err) {
      console.error('Failed to create new davy file');
    } else {
      /*fetch most recent message*/
      var prevId = 0
      channel.messages.fetch({ limit: 1 })
        .then(messages => {
          for (message of messages) {//this is exactly 1 message long
            prevId = message[0];
            getMessages(channel, addMessage, prevId, filePath);
            addMessage(message[1], filePath);
          }
        })
        .catch(console.error);
    }
  });
}

function getMessages(davyHome, callback, prevId, filePath) {

  davyHome.messages.fetch({limit: 100, before: prevId })
    .then(messages =>  {
      var lowestTimestamp = Number.MAX_SAFE_INTEGER; //find the earliest message
      for (message of messages) {

        if (message[1].createdTimestamp < lowestTimestamp) { //check the timestamp of each message, find the one with the earliest timestamp (first up)
          prevId = message[0];
          lowestTimestamp = message[1].createdTimestamp;
        }

        callback(message[1], filePath); //we still need to process the most recent 100 messages eventually

      }
      if (messages.size == 100) { //if we read in 100 messages, try again because there are more to read
        getMessages(davyHome, callback, prevId, filePath); //recur this function with the new previd to find the next 100 messages up
      }
    })
    .catch(console.error);
}

function addMessage(message, filePath) {
	var messageToAdd = message.content + '\n'; //check if the message is just a picture url (which is valid; if so, just grab that)
	if (messageToAdd === '\n') { //it's attachment(s) instead, so add them all by url
		messageToAdd = ''; //reset this string because it's currently a newline
		for (attachment of message.attachments) {
			messageToAdd += attachment[1].proxyURL + '\n'; //for each attachment, get the proxyurl and add it to the string with a newline
		}
	}
	fs.appendFile(filePath, messageToAdd, function (err) { //just add the most recent thought by way of appending it
	if (err) {
	  console.error('Failed to write new davy thought to file');
	}
	});
}

//function that searches the given list of thoughts for a specific one and sends it as a message
function openFile(message, filePath) {
  fs.readFile(filePath, function(err, data) {
    if (err) {
      console.log(err);
      return sendReplyError(message, `Uh oh, something went wrong.`);
    }
    var thoughts = data.toString().split('\n');
 	return sendReply(message, thoughts[Math.floor(Math.random() * (thoughts.length - 1))]);
  });
}

module.exports = { createFile, openFile, addMessage }
