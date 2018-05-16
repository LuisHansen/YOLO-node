const TelegramBot = require('node-telegram-bot-api');
var https = require('https');
require('dotenv').config();
var fs = require('fs');
const darknet = require('@moovel/yolo');
var app = require('express')();

const token = process.env.TOKEN;
var port = process.env.PORT || 8443;
const bot = new TelegramBot(token, {polling: true});
var port = process.env.PORT || 8080;

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"
  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
});

// Listen for 'photos'.
bot.on('photo', (msg) => {  
  const chatId = msg.chat.id; // Chat ID;
  console.log(msg.photo[msg.photo.length-1]);

  let width = msg.photo[msg.photo.length-1].width;
  let height = msg.photo[msg.photo.length-1].height;

  if (msg.chat.id === msg.from.id) { // Only forward messages from real people
      // Send the photo to the group
      // bot.sendPhoto(chatId, msg.photo[msg.photo.length-1].file_id);
      bot.sendMessage(chatId, "Analisando foto...");
      let id = Math.floor(Math.random()*100000);

      // Check for directories existence

      if (!fs.existsSync("./photos")){
          fs.mkdirSync("./photos");
      }

      if (!fs.existsSync("./photos/modified")){
          fs.mkdirSync("./photos/modified");
      }      

      var file = fs.createWriteStream("./photos/file"+id+".jpg");
      var request = https.get("https://api.telegram.org/bot"+token+"/getFile?file_id="+msg.photo[msg.photo.length-1].file_id, function(res) {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(rawData);
            let path = parsedData.result.file_path;
            // console.log(path);
            https.get('https://api.telegram.org/file/bot'+token+'/'+path, function(response) {
                // console.log(response);
                response.pipe(file);
                darknet.detectImage({
                  cfg: './cfg/yolo.cfg',
                  weights: './yolo.weights',
                  data: './cfg/coco.data',
                  image: './photos/file'+id+'.jpg',
                  thresh: 0.24, // optional, default: 0.24
                  hierThresh: 0.5, // optional, default: 0.5,
                }, function(modified, original, detections, dimensions) {
                  // console.log(detections);
                  let people = 0;
                  detections.forEach((obj) => {
                    if (obj.name === 'person' && obj.prob >= 0.4) {
                      people ++;
                    }
                  });
                  // fs.writeFileSync('data.modified'+id+'.raw', modified);


                  // console.log("Modified data: ", modified);

                  // CONVERSÃO

                  try {
                    var jpeg = require('jpeg-js');
                    var i = 0;
                    // console.log("Primeiro byte: ", modified.toString('hex',0,1));
                    let blue, green, red, alpha;
                    var l = 0;
                    var rawDataJPG = [];
                    modified2 = JSON.parse(JSON.stringify(modified));
                    // console.log("JSON: ", modified2);
                    while (l < modified2.data.length) {
                      blue = modified2.data[l++];
                      green = modified2.data[l++];
                      red = modified2.data[l++];
                      alpha = 0XFF;
                      rawDataJPG.push(red);
                      rawDataJPG.push(green);
                      rawDataJPG.push(blue);
                      rawDataJPG.push(alpha);
                    }
                    // console.log("Teste: ", teste);
                    var frameData = Buffer.from(rawDataJPG);
                    // while (i < frameData.length) {
                    //   blue = modified.toString('hex',i,i++);
                    //   green = modified.toString('hex',i,i++);
                    //   red = modified.toString('hex',i,i++);
                    //   frameData[i-3] = blue; // red
                    //   frameData[i-2] = green; // green
                    //   frameData[i-1] = red; // blue
                    //   frameData[i] = 0xFF; // alpha - ignored in JPEGs
                    // }
                    // console.log("Frame data: ", frameData);
                    var rawImageData = {
                      data: frameData,
                      width: width,
                      height: height
                    };
                    var jpegImageData = jpeg.encode(rawImageData, 50);
                    // console.log("JPEG: ", jpegImageData);
                    
                    fs.writeFile('./photos/modified/data.modified'+id+'.jpg',jpegImageData.data,'base64', () => {
                        fs.readFile('./photos/modified/data.modified'+id+'.jpg', (err, data) => {
                          console.log("Encontrei "+people+" pessoas!");
                          // console.log("JPG: ", data);
                          // bot.sendMessage(chatId, "Encontrei "+people+" pessoas!");
                          bot.sendPhoto(chatId, data, {caption: "Encontrei "+people+" pessoas!"})
                            .catch((error) => {
                              console.log(error);
                              bot.sendMessage(chatId, "Encontrei "+people+" pessoas!");
                            })
                        });
                      });
                  } catch (error) {
                    console.log(error);
                    bot.sendMessage(chatId, "Encontrei "+people+" pessoas!");
                  }

                  // CONVERSÃO



                  
                  // fs.writeFile('./file'+Math.floor(Math.random()*10000)+'.png', modified, (ok) => { return; });
                  // fs.unlink('./file.jpg', (ok) => {
                  //   // console.log("Removido!");
                  // })
                });
              });
          } catch (e) {
            console.error(e.message);
          }
        });
      });
  }
});

// // Listen for 'videos'.
// bot.on('video', (msg) => {  
//   const chatId = process.env.CHATID; // Group ID;
//   if (msg.chat.id === msg.from.id) { // Only forward messages from real people
//     bot.sendVideo(chatId, msg.video.file_id);
//   }
// });