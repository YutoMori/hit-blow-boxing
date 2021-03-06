const clova = require('@line/clova-cek-sdk-nodejs');
const express = require('express');
const bodyParser = require('body-parser');

var att = {
  answer: 'none'
}

const clovaSkillHandler = clova.Client
    .configureSkill()
    .onLaunchRequest(responseHelper => {
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
      responseHelper.setSimpleSpeech({
          lang: 'ja',
          type: 'PlainText',
          value: 'ゲームを始めたいときは、スタート、と言ってくれ。'
                 + 'ゲームのルールがわからないときは、ルールを教えて、と言ってくれ。'
        }, true);
    })

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
                                    + 'よくわからない場合は、Clovaスキルストアのナンバーパンチ説明欄を確認してくれ。'
                                    + 'さあ、「スタート」と言ってゲームを始めよう。';
          responseHelper.setSimpleSpeech({
            lang: 'ja',
            type: 'PlainText',
            value: DESCRIPTION_MESSAGE
          });
          responseHelper.setSimpleSpeech({
              lang: 'ja',
              type: 'PlainText',
              value: 'もう一度、説明を聞きたいときは、「ルールを教えて」と言ってくれ。'
                     + 'ゲームを始めたいときは、「スタート」と言ってくれ。'
            }, true);
          break;

        case 'StartIntent':
          const start_match_mp3 = process.env.START_MATCH_MP3;
          
          responseHelper.setSessionAttributes(att)

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
              lang: 'ja',
              type: 'PlainText',
              value: 'それじゃあ、開始するぞ。３つの数字を言ってくれ。ファイト。'
            },
            {
              type: "URL",
              lang: "" ,
              value: start_match_mp3
            }
          ]);
          responseHelper.setSimpleSpeech({
              lang: 'ja',
              type: 'PlainText',
              value: '例えば、１、２、３、のように言うんだ。それじゃあ、３つの数字を言ってくれ。'
            }, true);
          break;

        case 'HitIntent':
          const swing_mp3 = process.env.SWING_MP3;
          const blow_mp3 = process.env.BLOW_MP3;
          const hit_mp3 = process.env.HIT_MP3;
          const hit3_mp3 = process.env.HIT3_MP3;
          const down_mp3 = process.env.DOWN_MP3;
          const victory_mp3 = process.env.VICTORY_MP3;

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

          var hit_array = {
            type: "URL",
            lang: "" ,
            value: hit_mp3
          }
          var blow_array = {
            type: "URL",
            lang: "" ,
            value: blow_mp3
          }
          var speech_array = {
            lang: 'ja',
            type: 'PlainText',
            value: numHit + "ヒット、" + numBlow + "ブローです。"
          }

          var array_speechlist = []
          for (let i = 0; i < numHit; i++){
            array_speechlist.push(hit_array)
          }
          for (let i = 0; i < numBlow; i++){
            array_speechlist.push(blow_array)
          }
          array_speechlist.push(speech_array)


          if (numHit == 0 && numBlow == 0){
            responseHelper.setSpeechList([
              {
                type: "URL",
                lang: "" ,
                value: swing_mp3
              }, {
                lang: 'ja',
                type: 'PlainText',
                value: " 0ヒット、０ブローです。ファイトです。"
              }
            ]);
          } else if (numHit == 3){
            responseHelper.setSpeechList([
              {
                type: "URL",
                lang: "" ,
                value: hit_mp3
              }, {
                type: "URL",
                lang: "" ,
                value: hit_mp3
              }, {
                type: "URL",
                lang: "" ,
                value: hit3_mp3
              }, {
                type: "URL",
                lang: "" ,
                value: down_mp3
              }, {
                lang: 'ja',
                type: 'PlainText',
                value: "3ヒットです。おめでとうございます。"
              }, {
                type: "URL",
                lang: "" ,
                value: victory_mp3
              }, {
                lang: 'ja',
                type: 'PlainText',
                value: "もう一度遊ぶときは、「スタート」と言ってくれ。ゲームを終了したいときは、「終了する」と言ってくれ"
              }
            ]);
          } else {
            responseHelper.setSpeechList(array_speechlist);
          }

          responseHelper.setSimpleSpeech(
            {
              lang: 'ja',
              type: 'PlainText',
              value: '例えば、１、２、３、のように言うんだ。それじゃあ、３つの数字を言ってくれ。'
            }, true);

          break;

        default:
          speech = {
            lang: 'ja',
            type: 'PlainText',
            value: "ごめんなさい。聞き取れませんでした。もう一度、言ってください。"
          }
          responseHelper.setSimpleSpeech(speech)

          responseHelper.setSimpleSpeech({
              lang: 'ja',
              type: 'PlainText',
              value: 'もう一度、言ってくれ。'
            }, true);
          break;
        }
      })

    .onSessionEndedRequest(responseHelper => {
    })
    .handle();

    const app = new express();
    const clovaMiddleware = clova.Middleware({
      applicationId: process.env.APPLICATION_ID
    });
    app.post('/clova', clovaMiddleware, clovaSkillHandler);
    
    app.post('/clova', bodyParser.json(), clovaSkillHandler);
    
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server running on ${port}`);
    });
    