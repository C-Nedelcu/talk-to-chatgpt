Talk-to-ChatGPT is a new javascript program that allows users to interact with the ChatGPT AI using their voice, rather than just by typing. With this tool, users can speak to the AI and receive spoken responses, making the interaction feel more natural and conversational. This could be useful in a variety of settings where it would be helpful to have a more human-like interaction with an AI. (Note: the AI itself wrote this sentence after I explained it what my code does).

Now, with my own words. Talk-To-ChatGPT is a simple javascript snippet that will turn on voice recognition (also known as speech-to-text) so that you can actually speak to ChatGPT. When you receive a reply, the reply will be read out loud using text-to-speech.

The code is simple and uses standard Google Chrome APIs. It needs to be loaded through the javascript console in Google Chrome, but you can also create a bookmarklet to enable it in a simpler way.

There are several settings you can tweak, these are found at the top of the javascript file.

**How to use**
Open ChatGPT: https://chat.openai.com/chat?
Open the javascript console (right-click anywhere on the page, click Inspect, then open the 'Console' tab).
Paste the javascript file into the console and press Enter.
If you want to have fun with over an extended period of time, I recommend creating a bookmarklet.

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