"use strict";

const fs = require("fs");

const covertToTimeStamp = (slackTS) => slackTS * 1000000;

// Array of channel names and message message archive reference
// the one that shows up in the URL when you copy a message from that channel
const arrayOfChannels = [
  {
    name: "test-channel",
    messagesArchive: "ABCDEFGHIJKLMNOPQRST",
  },
];

// This is the list of channels you have
arrayOfChannels.forEach(({ name, messagesArchive }) => {
  //Base url for messages link like
  //https://dany.slack.com/archives/${messagesArchive}/p

  //TODO: change this to your own workspace url
  const baseURL = `https://dany.slack.com/archives/${messagesArchive}/p`;
  const folderPath = `./${name}/`;

  const fileList = fs.readdirSync(folderPath);
  let jsonData = [];

  //Get all files in this folder
  for (const file of fileList) {
    //Read files
    let rawdata = fs.readFileSync(folderPath + file);
    let parsedRawData = JSON.parse(rawdata);

    //We need just the messages not the files
    parsedRawData = parsedRawData.filter(
      (parsedData) => parsedData.type == "message" && !parsedData.subtype
    );

    //Map data to the needed format
    parsedRawData = parsedRawData.map((parsedData) => {
      let title = parsedData.user_profile
        ? parsedData.user_profile.real_name
        : parsedData.user;

      //Give more context about the messages is it a a message? or a reply on a thread?
      let messageType = "message";
      if (parsedData.replies?.length) {
        messageType = "thread";
        title += " wrote";
      } else if (parsedData.thread_ts) {
        messageType = "reply";
        title += " replied";
      }

      // building the link for the message
      let link = "";
      const messageTimeStamp = parsedData.ts
        ? covertToTimeStamp(parsedData.ts)
        : null;

      const threadTimeStamp = parsedData.thread_ts
        ? covertToTimeStamp(parsedData.thread_ts)
        : null;

      if (messageTimeStamp && threadTimeStamp) {
        link = baseURL + messageTimeStamp + "?thread_ts=" + threadTimeStamp;
      } else if (messageTimeStamp) {
        link = baseURL + messageTimeStamp;
      }

      //We extract only those data from all files
      return {
        link,
        content: parsedData.text || null,
        messageType,
        title,
        ts: messageTimeStamp,
      };
    });
    console.log({ parsedRawData });

    jsonData.push(...parsedRawData);
  }

  fs.writeFile(`./${name}-parsed.json`, JSON.stringify(jsonData), (err) => {
    if (err) throw err;
    console.log("Data written to file");
  });
});
