const fs = require('fs');
const https = require('https');
const path = require("path");

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageAttachment } = require('discord.js');

const seedrandom = require('seedrandom');
const Canvas = require('canvas');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const { sendEditError, sendEdit, sendFollowUp, sendFollowUpError } = require(path.resolve(__dirname, `../lib/send.js`));

const PICS_PATH = path.resolve(__dirname, '../bin/pics.txt');
const BACKGROUND_PATH = path.resolve(__dirname, `../resources/background.png`);

const ORIGINAL_IMAGE_PATH = path.resolve(__dirname, `../bin/original`);
const GRAPH_PATH = path.resolve(__dirname, `../bin/graph`);
const FINAL_IMAGE_PATH = path.resolve(__dirname, `../bin/finalrating.png`);

module.exports = {

  data: new SlashCommandBuilder()
  .setName('rate')
  .setDescription('Rates an image\'s power level')
  .addStringOption(option =>
    option.setName('url')
      .setDescription(`An image URL or the word 'attachment' to rate an attached image`)
      .setRequired(true)),

	async execute(message) {
    await message.deferReply();
    let imageURL = message.options.getString('url');
    if (imageURL == `attachment`) {
      message.editReply('Please upload an image.').then(() => {
        const filter = m => message.user.id === m.author.id;

        message.channel.awaitMessages({ filter, time: 60000, max: 1, errors: ['time'] })
          .then(messages => {
            let replyMessage = messages.first();
            if (replyMessage.attachments.length <= 0) {
              return sendFollowUpError(message, `You need to attach an image to use the attach feature.`);
            }
            if (replyMessage.attachments.length > 1) {
              return sendFollowUpError(message, `You must attach only one image to use this feature.`);
            }
            if (!replyMessage.attachments.first()) {
              return sendFollowUpError(message, `Couldn't find any attachments.`);
            }
            download(replyMessage.attachments.first().url, calculateImage, message, 1);
          })
          .catch(() => {
            sendFollowUpError(message, `You did not enter any input!`);
          });
      });

    } else {
      download(imageURL, calculateImage, message);
    }
	},
};

function getURL(message, imageList) {
  let chosenPic = Math.floor(Math.random() * (imageList.length - 1)); //-1 because of the newline at the end
  download(imageList[chosenPic], calculateImage, message);
}

function download(url, cb, message, isFollowUp) {
  let file = fs.createWriteStream(ORIGINAL_IMAGE_PATH);
  let request = https.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      cb(message, isFollowUp);  // close() is async, call cb after close completes.
    });
  }).on('error', function(err) { // Handle errors
    fs.unlink(ORIGINAL_IMAGE_PATH, (err) => {
      if (err) {
        console.log(err.message);
      }
    }); // Delete the file async. (But we don't check the result)
    if (isFollowUp == 1) {
      return sendFollowUpError(message, 'Something went wrong trying to process that image.');
    } else {
      return sendEditError(message, 'Something went wrong trying to process that image.');
    }
  });
};

async function calculateImage(message, isFollowUp){
    fs.readFile(ORIGINAL_IMAGE_PATH, 'base64', function(err, data) {
      if (data) {
        let halfString = Math.ceil(data.length / 2);
        let rng1 = seedrandom(data.substring(0, halfString));
        let rng2 = seedrandom(data.substring(halfString, data.length));
        let random1 = 0, random2 = 0;
        while(random1 === 0) random1 = rng1(); //Converting [0,1) to (0,1)
        while(random2 === 0) random2 = rng2();
        let finalRating = Math.sqrt( -2.0 * Math.log( random1 ) ) * Math.cos( 2.0 * Math.PI * random2 );
        finalRating = finalRating / 10.0 + 0.5;
        finalRating = Math.pow(finalRating, 1.5);
        finalRating *= 16;
        finalRating = Math.round(finalRating * 10) / 10;
        let allRatings = [finalRating];
        for (let n = 0; n < 5; n++) {
          allRatings.push((rng1() * 5));
        }
        chart(message, allRatings, isFollowUp);
      } else {
        if (isFollowUp == 1) {
          return sendFollowUpError(message, 'Something went wrong trying to process that image.');
        } else {
          return sendEditError(message, 'Something went wrong trying to process that image.');
        }
      }
    });
}

async function chart(message, finalRating, isFollowUp) {

  const chartCallback = (ChartJS) => {

      // Global config example: https://www.chartjs.org/docs/latest/configuration/
      ChartJS.defaults.global.elements.rectangle.borderWidth = 2;
      ChartJS.defaults.global.legend.display = false;
      ChartJS.defaults.radar.scale.pointLabels = {padding: 20, display: true, font: {family: `impact`, size: 24, weight: `900`, style:`italic`}};
      ChartJS.defaults.radar.scale.ticks = {display: false, maxTicksLimit: 6};
      ChartJS.defaults.global.defaultColor = `rgba(0,0,0,1)`;
      ChartJS.defaults.global.defaultFontFamily = 'impact';

  };

  const width = 350;
  const height = 250;
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, chartCallback });

  chartJSNodeCanvas.registerFont(path.resolve(__dirname, '../resources/impact.ttf'), {family: 'impact'});

  const config = {
    type: 'radar',
    data: {
          labels: ['STRENGTH', 'MANPOWER', 'FLYING', 'INTELLIGENCE', 'POTENTIAL'],
          datasets: [{
              label: 'Power Level',
              data: [finalRating[1], finalRating[2], finalRating[3], finalRating[4], finalRating[5]],
              fill: true,
              borderColor: 'rgb(255, 159, 64)',
              pointBackgroundColor: 'rgb(255, 99, 132)',
              pointBorderColor: 'rgb(255, 122, 0)',
              borderWidth:2,
              beginAtZero:true,
          }]
    },
    options: {
    },
  };
  const graph = await chartJSNodeCanvas.renderToBuffer(config);

  downloadGraph(graph, display, message, finalRating, isFollowUp);

}

function downloadGraph(graphURL, callback, message, finalRating, isFollowUp) {

  fs.writeFile(GRAPH_PATH, graphURL,
  {
    encoding: "base64",
    flag: "w",
    mode: 0o666
  },
  (err) => {
    if (err) {
      console.log(err.message);
      if (isFollowUp == 1) {
        return sendFollowUpError(message, 'Something went wrong trying to process that image.');
      } else {
        return sendEditError(message, 'Something went wrong trying to process that image.');
      }
    }
    else {
      callback(message, finalRating, isFollowUp);
    }
  });
}

  async function display(message, finalRating, isFollowUp){

    const width = 1024;
    const height = 612;

    try {

      const ratedGraph = await Canvas.loadImage(GRAPH_PATH);
      const background = await Canvas.loadImage(BACKGROUND_PATH);

      Canvas.loadImage(ORIGINAL_IMAGE_PATH).then(ratedImage => {

        const canvas = Canvas.createCanvas(width, height); //Using 4:3
        const context = canvas.getContext('2d');

        context.drawImage(background, 0, 0, width, height);

        //Draw the graph background then the graph
        context.fillStyle = `rgb(255, 255, 255)`;
        context.fillRect(width*0.05, width*0.15, width*0.45, width*0.30); //place the rectangle slightly bigger
        context.drawImage(ratedGraph, width*0.05, width*0.15, width*0.45, width*0.30);

        //Draw the rating bar background then the text
        let fontSize = width / 18;
        context.font =`${fontSize}px impact`;
        context.fillStyle = `rgb(255, 255, 255)`;
        context.strokeStyle = `rbg(0, 0, 0)`;
        context.lineWidth = width * 0.003;
        context.fillText(`POWER LEVEL: ${finalRating[0]}`, width*0.59, width*0.11);
        context.strokeText(`POWER LEVEL: ${finalRating[0]}`, width*0.59, width*0.11);


        //Draw the image itself
        context.fillStyle = `rgb(255, 255, 255)`;
        context.fillRect(width*0.55, width*0.15, width*0.40, width*0.40);
        context.drawImage(ratedImage, width*0.5525, width*0.1525, width*0.395, width*0.395);

        canvas.toBuffer((err, bufferedImage) => {
          if (err) {
            throw console.log(err.message);
            if (isFollowUp == 1) {
              return sendFollowUpError(message, 'Something went wrong trying to process that image.');
            } else {
              return sendEditError(message, 'Something went wrong trying to process that image.');
            }
          } else {
            attachment = new MessageAttachment(bufferedImage, FINAL_IMAGE_PATH);
            if (isFollowUp == 1) {
              return sendFollowUp(message, { files: [attachment] }).catch(err => (console.log(err.message)));
            } else {
              return sendEdit(message, { files: [attachment] }).catch(err => (console.log(err.message)));
            }
          }
        });

        fs.unlink(ORIGINAL_IMAGE_PATH, (err) => {
          if (err) throw err;
        });

        fs.unlink(GRAPH_PATH, (err) => {
          if (err) throw err;
        });
      })
      .catch(err => {

        console.log(err.message);
        if (isFollowUp == 1) {
          return sendFollowUpError(message, `Your link must be a valid image url.`);
        } else {
          return sendEditError(message, `Your link must be a valid image url.`);
        }
      });

    } catch(err) {
      console.log(err.message);
      if (isFollowUp == 1) {
        return sendFollowUpError(message, 'Something went wrong trying to process that image.');
      } else {
        return sendEditError(message, 'Something went wrong trying to process that image.');
      }

    }



  }
