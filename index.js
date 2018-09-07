const clova = require('@line/clova-cek-sdk-nodejs');
const express = require('express');
const bodyParser = require('body-parser');

const clovaSkillHandler = clova.Client
    .configureSkill()
    // スキルの起動リクエスト
    .onLaunchRequest(responseHelper => {
      // TODO
      responseHelper.responseObject.sessionAttributes.answer = 0;

      const launch_mp3 = process.env.LAUNCH_MP3;
      const LAUNCH_MESSAGE = '数字推測、ボクシングゲーム、ナンバーパンチに、ようこそ！'
                           + 'ゲームを始めたいときは、スタート、と言ってくれ。'
                           + 'ゲームのルールがわからないときは、ルールを教えて、と言ってくれ。';
      responseHelper.setSpeechList([
        {
          type: "URL",
          lang: "" ,
          value: launch_mp3
        }, {
          lang: 'ja',
          type: 'PlainText',
          value: LAUNCH_MESSAGE
        }
      ]);
    })

    // カスタムインテント or ビルトインインテント
    .onIntentRequest(async responseHelper => {
      const intent = responseHelper.getIntentName();
      // const sessionId = responseHelper.getSessionId();
      let speech;
      switch (intent) {
        case 'DescriptionIntent':
          const DESCRIPTION_MESSAGE = 'ナンバーパンチのルールを説明するぞ。'
                                    + 'このゲームは3つの数字を当てるゲームだ。'
                                    + '君の回答に、ヒットとブローの数で答えるぞ。'
                                    + 'ヒットは数字も位置も同じで、ブローは数字は当たっているけど位置が違うんだ。'
                                    + '数字に重複はないから気をつけてくれ。'
                                    + 'よくわからない場合は、検索サイトで、ヒット&ブロー ルール、で検索してくれ。'
                                    + 'さあ、「スタート」と言ってゲームを始めよう。';
          responseHelper.setSimpleSpeech({
            lang: 'ja',
            type: 'PlainText',
            value: DESCRIPTION_MESSAGE
          });
          break;

        case 'StartIntent':
          const start_match_mp3 = process.env.START_MATCH_MP3;
          responseHelper.responseObject.sessionAttributes.answer = 0;

          // 正解を決める
          var r;
          var valid_answer = [];
          const number_list = [0,1,2,3,4,5,6,7,8,9];
          for(var i=0; i<3; i++){
            r = Math.floor(Math.random() * number_list.length);
            valid_answer[i] = number_list[r];
            number_list.splice(r, 1);
          }
          responseHelper.responseObject.sessionAttributes.answer = valid_answer;
          responseHelper.setSpeechList([
            {
              type: "URL",
              lang: "" ,
              value: start_match_mp3
            }, {
              lang: 'ja',
              type: 'PlainText',
              value: 'スタートインテントが起動しました。'
            }
          ]);
          break;

        case 'HitIntent':
          var att_ans = Number(responseHelper.responseObject.sessionAttributes.answer);
          // TODO change mp3 url
          const start_match_mp31 = process.env.START_MATCH_MP3;
          const slots = responseHelper.getSlots();
          var ask_ans = slots.number;
          /*var numHit = 0;
          var numBlow = 0;

          for(var i=0; i<3; i++){
            for(var j=0; j<3; j++){
              if(att_ans[i] == ask_ans[j]){
                if(i == j){
                  numHit++;
                } else {
                  numBlow++;
                }
              }
            }
          }*/
          responseHelper.setSpeechList([
            {
              type: "URL",
              lang: "" ,
              value: start_match_mp31
            }, {
              lang: 'ja',
              type: 'PlainText',
              value: `${att_ans}, ${ask_ans}`
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
    