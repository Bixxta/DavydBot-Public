const fs = require('fs');
const path = require("path");

const {joinVoiceChannel, createAudioResource, AudioPlayerStatus, demuxProbe, StreamType, createAudioPlayer } = require('@discordjs/voice');

const ytdl = require('ytdl-core');
const ffmpeg = require('ffmpeg-static');

const {sendReply, sendReplyError, sendMessage} = require(path.resolve(__dirname, `send.js`));

async function createQueue(message, globalQueue) {
	const queueConstruct = {
		textChannel: message.channel,
		connection: null,
		audioPlayer: null,
		currentSong: null,
		songs: [],
		volume: 5,
		playing: false,
		leaveTimer: null
	};
	const voiceChannel = message.member.voice.channel; //check if the person who sent a message is in a voice channels
	try {
		// Here we try to join the voicechat and save our connection into our object.
		const connection = joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: voiceChannel.guild.id,
			adapterCreator: voiceChannel.guild.voiceAdapterCreator,
		});
		let player = createAudioPlayer();
		connection.subscribe(player);

		queueConstruct.audioPlayer = player;
		queueConstruct.connection = connection;

		// Setting the queue using our contract in current server
		globalQueue.set(message.guild.id, queueConstruct);

		//Call watchqueue to start listening for the queue becoming idle
		watchQueue(queueConstruct, message.guild, globalQueue);

		// Pushing the song to our songs array
	} catch (err) {
		// Printing the error message if the bot fails to join the voicechat
		console.log(err);
		queue.delete(message.guild.id);
		queueConstruct = null;
	}
	return queueConstruct;
}

async function getSongInfo(youtubeLink) {
	try {
		songInfo = await ytdl.getInfo(youtubeLink);
	} catch (e) {
		console.log(e);
		return null;
	}

	//Create a timestamp
	let totalSeconds = songInfo.videoDetails.lengthSeconds
	let songHours = Math.floor(totalSeconds / 3600).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
	let songMinutes = Math.floor((totalSeconds / 60) % 60).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
	let songSeconds = (totalSeconds % 60).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
	let timeStamp = songHours + ":" + songMinutes + ":" + songSeconds;

	const song = {
		title: songInfo.videoDetails.title,
		url: songInfo.videoDetails.video_url,
		length: timeStamp,
	};
	return song;
}

async function watchQueue(serverQueue, guild, globalQueue) {
	serverQueue.audioPlayer.on(AudioPlayerStatus.Idle, () => {
		console.log('i slep');
		//Stop the current song
		serverQueue.playing = false;
		serverQueue.currentSong = serverQueue.songs.shift(); //Move the first item in the queue into currentSong
		serverQueue.audioPlayer.stop(); //Stop audio

		if (serverQueue.currentSong) { //if there's something in the queue
			playSong(guild, globalQueue); //play another song
		} else {
			console.log(`queue empty`);
			let timePass = Date.now();
			serverQueue.leaveTimer = setTimeout(function() {
				console.log(`leavingQueue, time passed: ${Date.now()-timePass}`);
				leaveAFK(guild, globalQueue);
			}, 20*1000);
		}
		});
	serverQueue.audioPlayer.on("error", error => console.error(error));
}

async function playSong(guild, globalQueue) {
	const serverQueue = globalQueue.get(guild.id);
	if (serverQueue.currentSong) {
		song = serverQueue.currentSong;

		try {
			clearTimeout(serverQueue.leaveTimer);
		} catch (err) {
			//nothing
		}
		const youtubeStream = await ytdl(song.url, {
										requestOptions: {
											headers: {
												cookie: COOKIE
											}
										},
										quality: 'highestaudio',
										filter: 'audioonly'
									});

		const resource = await createAudioResource(youtubeStream, {inputType: StreamType.Arbitrary});

		serverQueue.audioPlayer.play(resource);
		serverQueue.playing = true;
		return sendMessage(serverQueue.textChannel, `Now playing: ${song.title}\t[${song.length}]`);
	} else {
		return sendMessage(serverQueue.textChannel, `Something went wrong.`);
	}
}

function leaveQueue(guild, queue) {
	const serverQueue = queue.get(guild.id);
	serverQueue.audioPlayer.stop();
	serverQueue.connection.destroy();
	queue.delete(guild.id);
}

function skipAll(guild, queue) {
	if (queue && guild && queue.get(guild.id)) {
		let guildQueue = queue.get(guild.id);
		guildQueue.songs = [];
	}
}

function skipCurrent(guild, queue) {
	const serverQueue = queue.get(guild.id);
	serverQueue.audioPlayer.stop();
}

function leaveAFK(guild, queue) {
	const serverQueue = queue.get(guild.id);
	if (serverQueue && serverQueue.songs.length === 0 && !serverQueue.playing) {
		serverQueue.connection.destroy();
		queue.delete(guild.id);
		return sendMessage(serverQueue.textChannel, `Bot left due to inactivity.`);
	}
	return;
}

function showQueue(guild, serverQueue) {
	let songList = ``;
	const currSong = serverQueue.currentSong;
	const songQueue = serverQueue.songs;
	if (currSong) {
		songList = `\`\`\`Now playing: ${currSong.title}\t[${currSong.length}]\n`;
		if (songQueue.length > 0) {
			for (let i = 0; (i < songQueue.length) && i < 20; i++) {
				songList = songList + `${i+1}) ${songQueue[i].title}\t[${songQueue[i].length}]\n`;
			}
			if (songQueue.length > 20) {
				songList = songList + `${songQueue.length - 20} more queue items not shown`;
			}
		}
		songList = songList + `\`\`\``;
	} else {
		songList = `The queue is empty and nothing is playing.`;
	}
	return songList;
}

function swapSpots(songList, fromIndex, toIndex) {
	if (songList.length <= 1 || (fromIndex > songList.length) || (toIndex > songList.length)) {
		sendReplyError(message, `Those values don't correspond to any song in queue.`);
		return null;
	}
	fromIndex -= 1;
	toIndex -=1;

	let songsNew = songList;
	//Taken from array-move
	songsNew = [...songsNew];
	const startIndex = fromIndex < 0 ? songsNew.length + fromIndex : fromIndex;

	if (startIndex >= 0 && startIndex < songsNew.length) {
		const endIndex = toIndex < 0 ? songsNew.length + toIndex : toIndex;

		const [item] = songsNew.splice(fromIndex, 1);
		songsNew.splice(endIndex, 0, item);
	}

	songList = songsNew;
	return songsNew;
}

function shuffleQueue(songList) {
	//Check if there are currently items in the queue
	if (queue.songs.length == 0) {
		sendReplyError(message, `There is nothing to shuffle.`);
		return null;
	}
	//Using a fisher-yates shuffle...
	let currentIndex = array.length,  randomIndex;

	while (currentIndex != 0) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [
		array[randomIndex], array[currentIndex]];
	}

  	return array;
}

async function checkElligible(message) { //Checks if the user performing the music command can actually use it before proceeding
	if (!message.channel.guild) { //If message was sent in a chat
		sendReplyError(message, `You can only use song commands in a server.`);
		return false;
	}
	const voiceChannel = message.member.voice.channel; //check if the person who sent a message is in a voice channels
	if (!voiceChannel) {
		sendReplyError(message, `You can only use song commands while in a voice channel.`);
		return false;
	}
	const permissions = voiceChannel.permissionsFor(message.client.user);
	if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
		sendReplyError(message, `You can only use song commands if Davydbot has Connect and Speak permissions.`);
		return false;
	}
	return true;
}

module.exports = { playSong, leaveQueue, skipCurrent, skipAll, getSongInfo, watchQueue, showQueue, createQueue, swapSpots, checkElligible}
