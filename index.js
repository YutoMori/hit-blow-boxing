const clova = require('@line/clova-cek-sdk-nodejs');
const express = require('express');
const bodyParser = require('body-parser');

const LAUNCH_MESSAGE = '数字推測、ボクシングゲーム、ヒット&ブロー、へようこそ。'
                     + 'ゲームを始めたいときは、スタート、と言ってくれ。'
                     + 'ゲームのルールがわからないときは、ルールを教えて、と言ってくれ。';

const clovaSkillHandler = clova.Client
    .configureSkill()
    // スキルの起動リクエスト
    .onLaunchRequest(responseHelper => {
      // TODO
      responseHelper.responseObject.sessionAttributes.count = 0;
      responseHelper.setSimpleSpeech({
        lang: 'ja',
        type: 'PlainText',
        value: LAUNCH_MESSAGE
      });
    })

    // カスタムインテント or ビルトインインテント
    .onIntentRequest(async responseHelper => {
        const intent = responseHelper.getIntentName();
        responseHelper.responseObject.sessionAttributes.count = 1;
        // const sessionId = responseHelper.getSessionId();
        let speech;
        switch (intent) {
          case 'StartIntent':
            const start_match_mp3 = process.env.START_MATCH_MP3;
            responseHelper.setSpeechList([
              {
                type: "URL",
                lang: "" ,
                value: start_match_mp3
              }, {
                lang: 'ja',
                type: 'PlainText',
                value: 'スタートインテントが起動しました。',
              }
            ]);
            break;

          default:
            speech = {
              lang: 'ja',
              type: 'PlainText',
              // TODO
              value: `${responseHelper.responseObject.sessionAttributes.count}想定しないインテントです。カスタムインテントの名前が正しいかご確認ください。`
            }
            responseHelper.setSimpleSpeech(speech)
            break;
          }
        })

    //終了時
    .onSessionEndedRequest(responseHelper => {
      // const sessionId = responseHelper.getSessionId();
    })
    .handle();

    const app = new express();
    const clovaMiddleware = clova.Middleware({
      applicationId: process.env.APPLICATION_ID
    });
    app.post('/clova', clovaMiddleware, clovaSkillHandler);
    
    // リクエストの検証を行わない
    app.post('/clova', bodyParser.json(), clovaSkillHandler);
    
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server running on ${port}`);
    });
    