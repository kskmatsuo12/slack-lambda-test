const { App, AwsLambdaReceiver, ExpressReceiver } = require('@slack/bolt');

/* 
This sample slack application uses SocketMode
For the companion getting started setup guide, 
see: https://slack.dev/bolt-js/tutorial/getting-started 
*/

// カスタムのレシーバーを初期化します
const awsLambdaReceiver = new AwsLambdaReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: 'my-state-secret',
  scopes: [
    'channels:read',
    'groups:read',
    'channels:manage',
    'chat:write',
    'incoming-webhook'
  ],
  installationStore: {
    storeInstallation: async installation => {
      // 実際のデータベースに保存するために、ここのコードを変更
      if (
        installation.isEnterpriseInstall &&
        installation.enterprise !== undefined
      ) {
        // OrG 全体へのインストールに対応する場合
        return await database.set(installation.enterprise.id, installation);
      }
      if (installation.team !== undefined) {
        // 単独のワークスペースへのインストールの場合
        return await database.set(installation.team.id, installation);
      }
      throw new Error('Failed saving installation data to installationStore');
    },
    fetchInstallation: async installQuery => {
      // 実際のデータベースから取得するために、ここのコードを変更
      if (
        installQuery.isEnterpriseInstall &&
        installQuery.enterpriseId !== undefined
      ) {
        // OrG 全体へのインストール情報の参照
        return await database.get(installQuery.enterpriseId);
      }
      if (installQuery.teamId !== undefined) {
        // 単独のワークスペースへのインストール情報の参照
        return await database.get(installQuery.teamId);
      }
      throw new Error('Failed fetching installation');
    },
    deleteInstallation: async installQuery => {
      // 実際のデータベースから削除するために、ここのコードを変更
      if (
        installQuery.isEnterpriseInstall &&
        installQuery.enterpriseId !== undefined
      ) {
        // OrG 全体へのインストール情報の削除
        return await myDB.delete(installQuery.enterpriseId);
      }
      if (installQuery.teamId !== undefined) {
        // 単独のワークスペースへのインストール情報の削除
        return await myDB.delete(installQuery.teamId);
      }
      throw new Error('Failed to delete installation');
    }
  }
});

// Initializes your app with your bot token and app token
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  // receiver: awsLambdaReceiver
  receiver

  // socketMode: true,
  // appToken: process.env.SLACK_APP_TOKEN
});

// Listens to incoming messages that contain "hello"
app.message('hello', async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  await say({
    blocks: [
      {
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': `Hey there <@${message.user}>!`
        },
        'accessory': {
          'type': 'button',
          'text': {
            'type': 'plain_text',
            'text': 'Click Me'
          },
          'action_id': 'button_click'
        }
      }
    ],
    text: `Hey there <@${message.user}>!`
  });
  message.status(200).send('success');
});

app.action('button_click', async ({ body, ack, say }) => {
  // Acknowledge the action
  await ack();
  await say(`<@${body.user.id}> clicked the button`);
});

// Lambda 関数のイベントを処理します
module.exports.handler = async (event, context, callback) => {
  const handler = await awsLambdaReceiver.start();
  return handler(event, context, callback);
};

// (async () => {
//   // Start your app
//   await app.start(process.env.PORT || 3000);

//   console.log('⚡️ Bolt app is running!');
// })();
