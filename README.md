**Talk-to-ChatGPT** is a javascript snippet that allows users to talk with the ChatGPT AI using their voice (speech recognition), and listen to the bot's answer with a voice (text-to-speech), rather than just by typing. With this tool, users can speak to the AI and receive spoken responses, making the interaction feel more natural and conversational. This could be useful in a variety of settings where it would be helpful to have a more human-like interaction with an AI.

**Talk-to-ChatGPT also comes as a Google Chrome extension. It is currently under review before it can be found on the Chrome extension store. If you want to use it as extension right now, you can download the chrome-extension folder on your computer and load it in Developer mode.**

Talk-to-ChatGPT displays a menu on the top right corner of the page where users can access settings (such as voice, language, and more), skip the current message, toggle voice recognition on or off, and toggle text-to-speech on or off.

The code is simple and uses standard Google Chrome APIs. It needs to be loaded through the javascript console in Google Chrome, but you can also create a bookmarklet to turn it on more easily.

![Talk-to-GPT Menu](/images/menu.png?raw=true "Talk-to-GPT Menu")

The settings menu can be seen below. Settings are saved in a cookie and reloaded automatically each time you activate the script.

![Settings dialog](/images/settings.png?raw=true "Settings dialog")


**How to use**

1. Open ChatGPT: https://chat.openai.com/chat?
2. Open the javascript console (right-click anywhere on the page, click Inspect, then open the 'Console' tab).
3. Paste the javascript file into the console and press Enter.
4. If you want to have fun with this script over an extended period of time, I recommend installing it as bookmarklet.

If you need further help, a Youtube video explains the process: https://www.youtube.com/watch?v=gOagK0r5syM Please note my recording software didn't properly record my voice during the tutorial, you can barely hear it. Watch the demos below for a clearer conversation.

Demo (English+French) v1.5: https://www.youtube.com/watch?v=vr-6L7Ix9FM

Demo (English) v1.2: https://www.youtube.com/watch?v=qccxC--9r3A

Demo (French) v1.2: https://www.youtube.com/watch?v=Agz5cLDqst8


**FAQ**

**Q: Which web browsers are currently supported?** 
A: The script fully works in Google Chrome (desktop). In other browsers, unfortunately, voice recognition/dictation doesn't work, due to API differences and some browsers not supporting
this API properly. So if you don't use Google Chrome (desktop) you will only get text-to-speech functionality, in other words, you can listen to the bot's responses, but you can't speak to it.

**Q: Are you going to make a Google Chrome extension?** 
A: Yes, there is a Google Chrome extension. It is currently under review before it can be found on the Chrome extension store. If you want to use it as extension right now, you can download the chrome-extension folder on your computer and load it in Developer mode. I will update this with the link to the extension on the store when it is published.

**Q: Can you make it speak faster or in a different voice or language?** A: Yes, use the settings menu. You can select a variety of settings among which the speech rate, voice type, and language.

**Q: What is the purpose of this project?**
A: Fun, and nothing else. This AI is mind-bogglingly intelligent and I had a deep desire to converse with it orally, to make it more interesting. It's merely a proof of concept. Surely OpenAI themselves will make a proper version of this in the future, at which point my project will be completely useless.

**Q: Is it safe to use?**
A: It's simple javascript code that will execute only in the context of the ChatGPT webpage. As soon as you navigate away, everything is cleared. The javascript code is open source, so feel free to check out what it does.

**Q: Will it always work?**
A: it might not work indefinitely, and here's why. The code is based on the current HTML structure of the ChatGPT page. If OpenAI change the HTML code, this project will likely stop working. It will probably keep updating it to maintain compatibility, but I'm not sure I'll be doing that forever. If you want to contribute to the project you are more than welcome to submit your own changes through Github.

**Q: I have an error or a problem...**
A: Feel free to update the javascript yourself and propose changes on Github, or simply report the issue if you aren't a programmer.

**Q: Can I make changes to your code?**
A: Yes, feel free to make changes, and do whatever you want, commit, fork, just have fun.

**Q: How do I know what languages are supported?**
A: this is entirely based on the Google Chrome APIs, so you need to ask Google, I cannot provide an up-to-date answer. I've only tested it with English and French. The languages in the settings menu are the same ones found on the Google demos.
