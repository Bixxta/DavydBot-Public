const fs = require('fs');

const path = require("path");

const { spreadsheetID } = require(path.resolve(__dirname, `../config.json`));

/*************GOOGLE RELATED***************/
const readline = require('readline');
const {google} = require('googleapis');
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.resolve(__dirname, `../resources/refresh/token.json`);
/**************GOOGLE RELATED**************/

const { sendReply, sendReplyError } = require(path.resolve(__dirname, `../lib/send.js`));
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
	.setName('cardfetcher')
	.setDescription('Fetches cards from the provided spreadsheet')
	.addStringOption(option =>
    	option.setName('cardname')
    		.setDescription('The name of the card')
    		.setRequired(true)),

	async execute(message) {
		getCardLibrary(message);

	},
};

function getCardLibrary(message) {

    fs.readFile(path.resolve(__dirname, `../resources/refresh/credentials.json`), (err, content) => {

      if (err) {
        return console.log('Error loading client secret file:', err)
      }

      // Authorize a client with credentials, then call the Google Sheets API.
      let credentials = JSON.parse(content);
      // Check if we have previously stored a token.
      const {client_secret, client_id, redirect_uris} = credentials.installed;
      const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

      fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) {
          const authUrl = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES });
          console.log('Authorize this app by visiting this url:', authUrl);
          const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
          rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            oAuth2Client.getToken(code, (err, token2) => {
              if (err) {
                reject(console.error('Error while trying to retrieve access token', err));
              }
              // Store the token to disk for later program executions
              fs.writeFile(TOKEN_PATH, JSON.stringify(token2), (err) => {
                if (err) {
                  reject(console.error(err));
                }
                console.log('Token stored to', TOKEN_PATH);
                oAuth2Client.setCredentials(JSON.parse(JSON.stringify(token2)));

                const sheets = google.sheets({version: 'v4', auth: oAuth2Client});
                sheets.spreadsheets.values.get({ spreadsheetId: spreadsheetID, range: 'A2:B' }, (err, res) => {
                  if (err) {
                    reject(console.log('The API returned an error: ' + err));
                  }
                  const rows = res.data.values;
                  if (!rows.length) {
                    reject(console.log('No data found.'));
                  }
                  let sortedRows = [];
                  //format
                  if (rows) {
                    for (row of rows) {
                      let formattedRow = [];
                      formattedRow[0] = row[0].toLowerCase().replace(/[^a-z0-9]+/g, "");
                      formattedRow[1] = row[1];
                      sortedRows.push(formattedRow);
                    }
                  }
                  //sort
                  sortedRows.sort(compareCards);
                  displayFinal(sortedRows, message);
                });
              });
            });
          });
        } else {

          oAuth2Client.setCredentials(JSON.parse(token));

          const sheets = google.sheets({version: 'v4', auth: oAuth2Client});
          sheets.spreadsheets.values.get({ spreadsheetId: spreadsheetID, range: 'A2:B' }, (err, res) => {
            if (err) {
              reject(console.log('The API returned an error: ' + err));
              return;
            }
            const rows = res.data.values;
            if (!rows.length) {
              reject(console.log('No data found.'));
              return;
            }
            let sortedRows = [];
            //format
            if (rows) {
              for (row of rows) {
                let formattedRow = [];
                formattedRow[0] = row[0].toLowerCase().replace(/[^a-z0-9]+/g, "");
                formattedRow[1] = row[1];
                sortedRows.push(formattedRow);
              }
            }
            //sort
            sortedRows.sort(compareCards);
            displayFinal(sortedRows, message);
          });
        }

      });

    });
    return null;
}


function displayFinal(cardLibrary, message) {
	let cardname = message.options.getString('cardname');
	cardname = cardname.toLowerCase().replace(/[^a-z0-9]+/g, "");
	let url = recursiveSearch(cardLibrary, cardname, 0, cardLibrary.length - 1);
	if (url) {
		return sendReply(message, url);
	} else {
		return sendReplyError(message, `Couldn't find that card.`);
	}
}

//search the sorted array recursively
function recursiveSearch(arr, x, start, end) {
	if (start > end) {
    if (arr[end+1]) {
      return arr[end+1][1];
    }
    return null;
  }
	let mid = Math.floor((start + end) / 2);
	if (arr[mid][0] === x) return arr[mid][1];
	if (arr[mid][0] > x) {
		return recursiveSearch(arr, x, start, mid - 1);
	} else {
		return recursiveSearch(arr, x, mid + 1, end);
	}
}


function compareCards(card1, card2) {
	if (card1 && card1[0] && card2 && card2[0]) {
		return card1[0].localeCompare(card2[0]);
	}
}
