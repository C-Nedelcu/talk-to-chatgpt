**Talk-to-ChatGPT** is a new javascript program that allows users to interact with the ChatGPT AI using their voice, rather than just by typing. With this tool, users can speak to the AI and receive spoken responses, making the interaction feel more natural and conversational. This could be useful in a variety of settings where it would be helpful to have a more human-like interaction with an AI. (Note: the AI itself wrote this sentence after I explained it what my code does).

Now, with my own words. Talk-To-ChatGPT is a simple javascript snippet that will turn on voice recognition (also known as speech-to-text) so that you can actually speak to ChatGPT. When you receive a reply, the reply will be read out loud using text-to-speech.

The code is simple and uses standard Google Chrome APIs. It needs to be loaded through the javascript console in Google Chrome, but you can also create a bookmarklet to enable it in a simpler way.

There are several settings you can tweak, these are found at the top of the javascript file.

**How to use**

1. Open ChatGPT: https://chat.openai.com/chat?
2. Open the javascript console (right-click anywhere on the page, click Inspect, then open the 'Console' tab).
3. Paste the javascript file into the console and press Enter.
4. If you want to have fun with over an extended period of time, I recommend creating a bookmarklet.


**Settings**

The following settings are found at the top of the script. Edit them locally before you load the script.
```
// Indicate a country code such as 'fr', 'en', or others, to use a particular language for the text-to-speech functionality (reading the bot's messages out loud)
// If you leave this blank, the system's default voice will be used
var CN_WANTED_LANGUAGE_TEXT_TO_SPEECH = ""; // "fr";

// Indicate a locale code such as 'fr-FR', 'en-US', to use a particular language for the speech recognition functionality (when you speak into the mic)
// If you leave this blank, the system's default language will be used
var CN_WANTED_LANGUAGE_SPEECH_REC = ""; // "fr-FR";

// Settings for the text-to-speech functionality (the bot's voice)
var CN_TEXT_TO_SPEECH_RATE = 1.2; // The higher the rate, the faster the bot will speak
var CN_TEXT_TO_SPEECH_PITCH = 1; // This will alter the pitch for the bot's voice

// Determine which word will cause this scrip to stop.
var CN_SAY_THIS_WORD_TO_STOP = "stop";

// Determine which word will cause this script to temporarily pause
var CN_SAY_THIS_WORD_TO_PAUSE = "pause";
```


**FAQ**

* **Q: What is the purpose of this project?**
* A: Fun, and nothing else. This AI is mind-bogglingly intelligent and I had a deep desire to converse with it orally, to make it more interesting. It's merely a proof of concept. Surely OpenAI themselves will make a proper version of this in the future, at which point my project will be completely useless.

* **Q: Is it safe to use?**
* A: It's simple javascript code that will execute only in the context of the ChatGPT webpage. As soon as you navigate away, everything is cleared. The javascript code is open source, so feel free to check out what it does.

* **Q: Will it always work?**
* A: it will probably not work for very long. The code is based on the current HTML structure of the ChatGPT page. If the authors change the HTML code, this project will likely stop working. It could be updated to maintain compatibility, but I'm not sure I'll be doing that.

* **Q: I have an error or a problem...**
* A: Feel free to update the javascript yourself and propose changes on Github. I'm not really interested in maintaining this because it's a simple proof of concept, just for fun. It took me about 2 or 3 hours to write, but I don't intend to spend any more time on it.

* **Q: Can I make changes to your code?**
* A: Yes, feel free to make changes, and do whatever you want, commit, fork, just have fun.

* **Q: How do I know what languages are supported?**
* A: this is entirely based on the Google Chrome APIs, so you need to ask Google, I cannot provide an up-to-date answer. I've only tested it with english and french.
