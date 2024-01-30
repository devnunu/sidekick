const dotenv = require('dotenv');
const {App} = require('@slack/bolt');
const {WebClient} = require('@slack/web-api');
const express = require('express');
const bodyParser = require('body-parser');
dotenv.config()


/**
 * 슬랙
 * */
const token = process.env.SLACK_BOT_TOKEN;
const web = new WebClient(token);

const slackApp = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN,
    // Socket Mode doesn't listen on a port, but in case you want your app to respond to OAuth,
    // you still need to listen on some port!
    port: process.env.PORT || 3000
});

// Listens to incoming messages that contain "hello"
slackApp.message('hello', async ({message, say}) => {
    // say() sends a message to the channel where the event was triggered
    await say(`Hey there <@${message.user}>!`);
});

// 슬랙 채널에 메시지 보내는 함수
async function sendSlackMessage(channelId, message) {
    try {
        await slackApp.client.chat.postMessage({
            token: process.env.SLACK_BOT_TOKEN,
            channel: channelId,
            blocks: message
        });
        console.log('Message sent successfully');
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

function getMessageUsingFormat(userId, summary, description, url) {
    return [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "사이드 프로젝트가 생성되었어요! :fire:",
                "emoji": true
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `*제목*\n${summary}`
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `*내용*\n${description}`
            }
        },
        {
            "type": "section",
            "text": {
                "type": "plain_text",
                "text": "자세한 내용은 여기에서 확인해보세요 :point_right:",
                "emoji": true
            },
            "accessory": {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "사이드프로젝트 보기",
                    "emoji": true
                },
                "value": "button_issue",
                "url": url,
                "action_id": "button-action"
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `<@${userId}>`
            }
        },
    ]
}

async function findUserIdByUsername(username) {
    try {
        const response = await web.users.list();

        const user = response.members.find(member => {
            const realName = member.real_name
            if(realName === undefined) {
                return false
            }else {
                const trimName = realName.replace(" ","").trim()
                console.log("trimName:", trimName)
                return trimName.includes(username)
            }
        });
        return user ? user.id : null;
    } catch (error) {
        console.error('Error finding user ID:', error);
    }
}

(async () => {
    // Start your app
    await slackApp.start();

    console.log('⚡️ Bolt app is running!');
})();


/**
 * 지라 웹훅
 * */
const app = express();

app.use(express.json());

app.post('/', (req, res) => {
    const userName = req.body.user.displayName
    findUserIdByUsername(userName).then(userId => {
            const fields = req.body.issue.fields
            const summary = fields.summary
            const description = fields.description
            const url = "http://www.finda.co.kr"
            message = getMessageUsingFormat(userId, summary, description, url)
            sendSlackMessage("C06FE2EDQTU", message)
        }
    )

    // Jira 웹훅 처리 로직
    res.status(200).send('Jira Webhook Received');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Jira Webhook Server running on port ${PORT}`);
});
