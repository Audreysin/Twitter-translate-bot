# Twitter-translate-bot
Twitter translate bot implemented in JavaScript using Node.js

The bot translates all tweets with mention @AXYTranslateBot to any language supported by Google Translate services

The desired language should be included within brackets in the original tweet

The bot uses the Twit api and the Google api


**Tweet examples:**
* @AXYTranslateBot Hello, I'm a translate bot!
* @AXYTranslateBot (Dutch) What can I translate for you?
* I can respond to tweets with mention and language in any order @AXYTranslateBot (Korean) 
* @AXYTranslateBot 这是一个新的测试!

**Sample Reply:**
* Bonjour, je suis un robot de traduction!
* Wat kan ik voor u vertalen?
* 순서에 상관없이 멘션과 언어로 트윗에 응답 할 수 있습니다.
* This is a new test!