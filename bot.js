console.log("The bot is starting");
var Twit = require('twit');
var config = require('./config')
var T = new Twit(config);
const {Translate} = require('@google-cloud/translate').v2;
require('dotenv').config();

// Google translate service account credentials
const CREDENTIALS = JSON.parse(process.env.CREDENTIALS);

// Configuration for the client
const translate = new Translate({
    credentials: CREDENTIALS,
    projectId: CREDENTIALS.project_id
});

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

lastIdTranslated = null

// Searches for all posts with @AXYTranslateBot every min and translates the post to French
executeTask()
// setInterval(executeTask, 1000*60)

function executeTask() {
    var query = null

    if (lastIdTranslated) {
        query = '@AXYTranslateBot since_id:' + lastIdTranslated;
    } else {
        var date = new Date();
        date.setDate(date.getDate() - 1);
        query = '@AXYTranslateBot since:'+ date.toISOString().split('T')[0];
    }
    
    function makeTranslation(err, data, response){
        var tweets = data.statuses;
        for (var i=0; i < tweets.length; i++){
            var msg = tweets[i].text;
            var id = tweets[i].id_str;
            // var lang = getTargetLang(msg.slice(0));
            var lang = 'French';
            tweetTranslation(msg, id, supportedLang[lang]);
        }
    }

    function tweetTranslation(msg, id, lang) {

        function postTweet(err, data, response) {
            if (err) {
                console.log("Error code: " + err.code)
                console.log(err.message)
            } else {
                console.log(data);
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

    T.get('search/tweets', {q: query}, makeTranslation);
    
}

// Expects target language to be a substring '(->language)' where the language can be in two words
function getTargetLang(msg) {
    var substring = msg;
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
        var content = substring.slice(openBrac, closeBrac+1);
        if ((content.slice(0,2) == "->") && (content.slice(2) in supportedLang)){
            targetLanguage = content.slice(2);
            break;
        } else {
            substring = substring.slice(openBrac+1);
        }
    }
    if (targetLanguage == null) {
        const detectLanguage = async (text) => {
            try {
                let response = await translate.detect(text);
                return response[0].language;
            } catch (error) {
                console.log(`Error at detectLanguage --> ${error}`);
                return 0;
            }
        }
        
        detectLanguage(msg)
            .then((res) => {
                console.log(res);
                console.log(msg);
                if (res === 'en') {
                    return 'French';
                } else {
                    return 'English';
                }
            })
            .catch((err) => {
                console.log(error);
                return 'English'
            });
    } else {
        return targetLanguage
    }
}
