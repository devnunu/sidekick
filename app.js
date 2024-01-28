const dotenv = require('dotenv');
const { App } = require('@slack/bolt');

dotenv.config()

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  // Socket Mode doesn't listen on a port, but in case you want your app to respond to OAuth,
  // you still need to listen on some port!
  port: process.env.PORT || 3000
});

// Listens to incoming messages that contain "hello"
app.message('hello', async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  await say(`Hey there <@${message.user}>!`);
});

// 슬랙 채널에 메시지 보내는 함수
async function sendSlackMessage(channelId, message) {
    try {
      await app.client.chat.postMessage({
        token: process.env.SLACK_BOT_TOKEN,
        channel: channelId,
        text: message
      });
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
  

(async () => {
  // Start your app
  await app.start();

  console.log('⚡️ Bolt app is running!');
})();