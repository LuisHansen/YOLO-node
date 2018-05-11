const TelegramBot = require('node-telegram-bot-api');
var https = require('https');
var fs = require('fs');
const darknet = require('@moovel/yolo');
var app = require('express')();

const token = process.env.TOKEN;
var port = process.env.PORT || 8443;
const bot = new TelegramBot(token, {polling: true});
var port = process.env.PORT || 8080;
var io = require('socket.io').listen(app.listen(port));


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
  if (msg.chat.id === msg.from.id) { // Only forward messages from real people
      // Send the photo to the group
      // bot.sendPhoto(chatId, msg.photo[msg.photo.length-1].file_id);
      bot.sendMessage(chatId, "Analisando foto...");
      let id = Math.floor(Math.random()*100000);
      var file = fs.createWriteStream("file"+id+".jpg");
      var request = https.get("https://api.telegram.org/bot"+token+"/getFile?file_id="+msg.photo[msg.photo.length-1].file_id, function(res) {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(rawData);
            let path = parsedData.result.file_path;
            console.log(path);
            https.get('https://api.telegram.org/file/bot'+token+'/'+path, function(response) {
                // console.log(response);
                response.pipe(file);
                darknet.detectImage({
                  cfg: './cfg/yolo.cfg',
                  weights: './yolo.weights',
                  data: './cfg/coco.data',
                  image: './file'+id+'.jpg',
                  thresh: 0.24, // optional, default: 0.24
                  hierThresh: 0.5, // optional, default: 0.5,
                }, function(modified, original, detections, dimensions) {
                  console.log(detections);
                  let people = 0;
                  detections.forEach((obj) => {
                    if (obj.name === 'person' && obj.prob >= 0.4) {
                      people ++;
                    }
                  });
                  fs.writeFileSync('data.modified'+id+'.raw', modified);
                  bot.sendMessage(chatId, "Encontrei "+people+" pessoas!");
                  console.log("Encontrei "+people+" pessoas!");
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
