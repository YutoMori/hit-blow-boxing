const clova = require('@line/clova-cek-sdk-nodejs');
const express = require('express');
const bodyParser = require('body-parser');

var att = {
  answer: 'none'
}

const clovaSkillHandler = clova.Client
    .configureSkill()
    // スキルの起動リクエスト
    .onLaunchRequest(responseHelper => {
      // TODO
      responseHelper.setSessionAttributes(att)

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
      let att_info = responseHelper.getSessionAttributes();
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
          
          // TODO: remove deploy
          responseHelper.setSessionAttributes(att)

          // 正解を決める
          let r;
          let valid_answer = "";
          let number_list = "0123456789";
          for(let i=0; i<3; i++){
              r = Math.floor(Math.random() * number_list.length);
              valid_answer += number_list[r];
              number_list = number_list.slice(0,r) + number_list.slice(r+1);
          }

          att_info.answer = valid_answer;
          responseHelper.setSessionAttributes(att_info)

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
          // TODO change mp3 url
          const start_match_mp31 = process.env.START_MATCH_MP3;
          const slots = responseHelper.getSlots();
          var ask_ans = slots.number;
          let att_ans = att_info.answer;
          var numHit = 0;
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
          }
          responseHelper.setSessionAttributes(att_info)

          if(numHit <= 2){ // 2hit 以下
            responseHelper.setSpeechList([
              {
                type: "URL",
                lang: "" ,
                value: start_match_mp31
              }, {
                lang: 'ja',
                type: 'PlainText',
                value: numHit + "ヒット、" + numBlow + "ブロー"
              }
            ]);
          } else { // 3hit
            responseHelper.setSpeechList([
              {
                type: "URL",
                lang: "" ,
                value: start_match_mp31
              }, {
                lang: 'ja',
                type: 'PlainText',
                value: "3ヒットです。おめでとうございます。"
              }
            ]);
            responseHelper.endSession();
          }
          break;

        default:
          speech = {
            lang: 'ja',
            type: 'PlainText',
            // TODO
            value: `想定しないインテントです。`
          }
          responseHelper.setSimpleSpeech(speech)
          break;
        }
      })

    //終了時
    .onSessionEndedRequest(responseHelper => {
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
    