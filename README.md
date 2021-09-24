# Intro
## REQUIRES NODE & NPM
Davydbot is a simple bot made to play music, roll dice, and fetch fake cards, among other fun things.

# Running
<ul>
<li>Place the extracted files together in a directory</li>
<li>Type 'npm install' in this directory</li>
<li>Create your bot at https://discord.com/developers/applications and copy the token ID into the 'token' field in token.json</li>
<li>Follow the discord developer website instructions to add your bot to your test server of choice</li>
<li>Visit this site: https://developers.google.com/workspace/guides/create-credentials, follow the "Create a OAuth client ID credential" steps to download your credentials file</li>
<li>Rename the downloaded file to 'credentials.json'</li>
<li>Place the credentials.json file in the /resources/refresh directory, from the root of the project</li>
<li>Right click your bot in discord with developer mode on and copy its id into the clientId field in config.json</li>
<li>Right click the server you want to test your commands in and copy its id into the guildId field in config.json</li>
<li>Find the id of your public google spreadsheet and copy it into the spreadsheetID field in config.json</li>
<li>Run 'node index.js' from the root directory, following any instructions given in the program</li>
<li>After using the cardfetcher command once, and following the given instructions, it should always start up without needing any special extra steps</li>
</ul>
