console.log("The bot is starting");
var Twit = require('twit');
const fs = require('fs');
var config = require('./config');
var T = new Twit(config);
const {Translate} = require('@google-cloud/translate').v2;
require('dotenv').config();
'use strict';

// Google translate service account credentials
const CREDENTIALS = JSON.parse(process.env.CREDENTIALS);

// Configuration for the client
const translate = new Translate({
    credentials: CREDENTIALS,
    projectId: CREDENTIALS.project_id
});

// Dictionary of languages supported by Google translate and their corresponding language code
const supportedLang = {
    "Afrikaans": "af",
    "Albanian": "sq",
    "Amharic": "am",
    "Arabic": "ar",
    "Armenian": "hy",
    "Azerbaijani": "az",
    "Basque": "eu",
    "Belarusian": "be",
    "Bengali": "bn",
    "Bosnian": "bs",
    "Bulgarian": "bg",
    "Catalan": "ca",
    "Cebuano": "ceb",
    "Chinese": "zh-CN",
    "Corsican": "co",
    "Croatian": "hr",
    "Czech": "cs",
    "Danish": "da",
    "Dutch": "nl",
    "English": "en",
    "Esperanto": "eo",
    "Estonian": "et",
    "Finnish": "fi",
    "French": "fr",
    "Frisian": "fy",
    "Galician": "gl",
    "Georgian": "ka",
    "German": "de",
    "Greek": "el",
    "Gujarati": "gu",
    "Haitian Creole": "ht",
    "Hausa": "ha",
    "Hawaiian": "haw",
    "Hebrew": "he",
    "Hindi": "hi",
    "Hmong": "hmn",
    "Hungarian": "hu",
    "Icelandic": "is",
    "Igbo": "ig",
    "Indonesian": "id",
    "Irish": "ga",
    "Italian": "it",
    "Japanese": "ja",
    "Javanese": "jv",
    "Kannada": "kn",
    "Kazakh": "kk",
    "Khmer": "km",
    "Kinyarwanda": "rw",
    "Korean": "ko",
    "Kurdish": "ku",
    "Kyrgyz": "ky",
    "Lao": "lo",
    "Latin": "la",
    "Latvian": "lv",
    "Lithuanian": "lt",
    "Luxembourgish": "lb",
    "Macedonian": "mk",
    "Malagasy": "mg",
    "Malay": "ms",
    "Malayalam": "ml",
    "Maltese": "mt",
    "Maori": "mi",
    "Marathi": "mr",
    "Mongolian": "mn",
    "Myanmar": "my",
    "Nepali": "ne",
    "Norwegian": "no",
    "Nyanja": "ny",
    "Odia": "or",
    "Pashto": "ps",
    "Persian": "fa",
    "Polish": "pl",
    "Portuguese": "pt",
    "Punjabi": "pa",
    "Romanian": "ro",
    "Russian": "ru",
    "Samoan": "sm",
    "Scots Gaelic": "gd",
    "Serbian": "sr",
    "Sesotho": "st",
    "Shona": "sn",
    "Sindhi": "sd",
    "Sinhala": "si",
    "Slovak": "sk",
    "Slovenian": "sl",
    "Somali": "so",
    "Spanish": "es",
    "Sundanese": "su",
    "Swahili": "sw",
    "Swedish": "sv",
    "Tagalog": "tl",
    "Tajik": "tg",
    "Tamil": "ta",
    "Tatar": "tt",
    "Telugu": "te",
    "Thai": "th",
    "Turkish": "tr",
    "Turkmen": "tk",
    "Ukrainian": "uk",
    "Urdu": "ur",
    "Uyghur": "ug",
    "Uzbek": "uz",
    "Vietnamese": "vi",
    "Welsh": "cy",
    "Xhosa": "xh",
    "Yiddish": "yi",
    "Yoruba": "yo",
    "Zulu": "zu",
}

// executeTask queries for 
function executeTask() {
    let jsonData = require('./translated_tweets.json');
    var translated_tweets = jsonData['translated'];
    console.log(translated_tweets);
    var query = null

    var searchDate = new Date();
    // searchDate.setDate(searchDate.getDate() - 1);
    query = '@AXYTranslateBot since:'+ searchDate.toISOString().split('T')[0];
    console.log(query);
    
    async function makeTranslation(err, data, response){
        var tweets = data.statuses;
        for (const tweet of tweets){
            var msg = tweet.text;
            var id = tweet.id_str;
            msg = msg.replace(/@AXYTranslateBot/g, "");
            if (translated_tweets.includes(id)) {
                console.log(id + " " + msg + " is already translated");
                continue;
            }
            await getTargetLang(msg).then((lang) => {
                console.log(id + " " + msg + " gets translated");
                tweetTranslation(msg, id, supportedLang[lang]);
            });
            translated_tweets.push(id);
        }
        let jsonStr = JSON.stringify({"translated":translated_tweets}, null, 2);
        await fs.writeFile('translated_tweets.json', jsonStr, (err) => {
            if (err) {
                console.log(err);
            }
        });
    }
    T.get('search/tweets', {q: query}, makeTranslation);
}

function tweetTranslation(msg, id, lang) {

    function postTweet(err, data, response) {
        if (err) {
            console.log("Error code: " + err.code)
            console.log(err.message)
        } else {
            console.log("Translated " + data.text);
        }
    }

    const translateText = async (text, targetLanguage) => {
        try {
            let [response] = await translate.translate(text, targetLanguage);
            return response;
        } catch (error) {
            console.log(`Error at translateText --> ${error}`);
            return 0;
        }
    };
    
    translateText(msg, lang)
        .then((res) => {
            var tweet = {
                status: res,
                in_reply_to_status_id: id
            }
            T.post('statuses/update', tweet, postTweet) 
        })
        .catch((err) => {
            console.log(err);
        });   
}

// Expects target language to be a substring '(->language)' where the language can be in two words
async function getTargetLang(msg) {
    var substring = msg.slice(0);
    var targetLanguage = null;
    while (substring.length > 0) {
        var openBrac = substring.indexOf('(');
        if (openBrac === -1) {
            break;
        }
        var closeBrac = substring.indexOf(')', openBrac);
        if (closeBrac === -1) {
            break;
        }
        var content = substring.slice(openBrac+1, closeBrac);
        console.log(content);
        if (content in supportedLang){
            targetLanguage = content;
            break;
        } else {
            substring = substring.slice(openBrac+1);
        }
    }
    if (targetLanguage == null) {
        try {
            let response = await translate.detect(msg);
            if (response[0].language === 'en') {
                return 'French';
            } else {
                return 'English';
            }
        } catch (error) {
            console.log('Error at detectLanguage --> ${error}');
            return 'English';
        }
    } else {
        return targetLanguage
    }
}

// Searches for all posts with @AXYTranslateBot every min and translates the tweet
executeTask();
setInterval(executeTask, 1000*60);
