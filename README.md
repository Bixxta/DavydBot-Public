# Intro
## REQUIRES NODE & NPM
Davydbot is a simple bot made to play music, roll dice, and fetch fake cards, among other fun things.

# Running
<ul>
<li>Place the extracted files together in a directory</li>
<li>Type 'npm install' in this directory</li>
<li>Create your bot at https://discord.com/developers/applications and copy the token ID into the 'token' field in token.json</li>
<li>Visit this site: https://developers.google.com/sheets/api/quickstart/nodejs, follow step 1, to download your credentials.json file</li>
<li>Place the credentials.json file in the /resources/refresh directory, from the root of the project</li>
<li>Right click your bot in discord with developer mode on and copy its id into the clientId field in config.json</li>
<li>Right click the server you want to test your commands in and copy its id into the guildId field in config.json</li>
<li>Run 'node index.js' from the root directory, following any instructions given in the program</li>
<li>After running once, it should always start up without needing any special extra steps</li>
</ul>
