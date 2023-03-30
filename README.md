# UPDATE 30/03/2023: breaking changes have been introduced to the ChatGPT UI rendering this extension unusable at the moment. We are working on a fix. 

# -

# -

# - 

# -

# -

# -

# -

# -

# -

# -

**Talk-to-ChatGPT** is a Google Chrome extension that allows users to talk with the ChatGPT AI using their voice (speech recognition), and listen to the bot's answer with a voice (text-to-speech), rather than just by typing. With this tool, users can speak to the AI and receive spoken responses, making the interaction feel more natural and conversational. This could be useful in a variety of settings where it would be helpful to have a more human-like interaction with an AI.

**The Talk-to-ChatGPT Google Chrome extension can be downloaded from the Chrome Web store here:** https://chrome.google.com/webstore/detail/talk-to-chatgpt/hodadfhfagpiemkeoliaelelfbboamlk

After installing the Google Chrome extension, open or reload the ChatGPT page ( https://chat.openai.com/chat ) and you should be seeing a 'Start' button on the top right corner of the page. After you click Start, you will be asked for permission to use your Microphone. This is required to enable voice recognition.

![Talk-to-GPT Menu](/images/menu.png?raw=true "Talk-to-GPT Menu")

Once started, Talk-to-ChatGPT displays a menu on the top right corner of the page where users can access settings (such as voice, language, and more), skip the current message, toggle voice recognition on or off, and toggle text-to-speech on or off.

The settings menu can be seen below. Settings are saved in a cookie and reloaded automatically each time you activate the script.

![Settings dialog](/images/settings.png?raw=true "Settings dialog")

Demo (English+French) v1.6: https://www.youtube.com/watch?v=VXkLQMEs3lA

# FAQ

**Q: Can you make it speak faster or in a different voice or language?** A: Yes, use the settings menu. You can select a variety of settings among which the speech rate, voice type, and language.

**Q: What is the purpose of this project?**
A: Fun, and nothing else. This AI is mind-bogglingly intelligent and I had a deep desire to converse with it orally, to make it more interesting. It's merely a proof of concept. Surely OpenAI themselves will make a proper version of this in the future, at which point my project will be completely useless.

**Q: Is it safe to use?**
A: It's simple javascript code that will execute only in the context of the ChatGPT webpage. As soon as you navigate away, everything is cleared. The javascript code is open source, so feel free to check out what it does.

**Q: Will it always work?**
A: it might not work indefinitely, and here's why. The code is based on the current HTML structure of the ChatGPT page. If OpenAI change the HTML code, this project will likely stop working. I will probably keep updating it to maintain compatibility, but I'm not sure I'll be doing that forever. If you want to contribute to the project you are more than welcome to submit your own changes through Github.

**Q: I have an error or a problem...**
A: Feel free to update the javascript yourself and propose changes on Github, or simply report the issue if you aren't a programmer.

**Q: Can I make changes to your code?**
A: Yes, feel free to make changes, and do whatever you want, commit, fork, just have fun.

**Q: How do I know what languages are supported?**
A: this is entirely based on the Google Chrome APIs, so you need to ask Google, I cannot provide an up-to-date answer. I've only tested it with English and French. The languages in the settings menu are the same ones found on the Google demos.

# Press coverage

Talk-to-ChatGPT has been receiving press coverage since its release. It is currently featured on the following sites:

* JustGeek - https://www.justgeek.fr/talk-to-chatgpt-discuter-a-voix-haute-avec-chatgpt-103657/
* Comment Ca Marche - https://www.commentcamarche.net/informatique/technologies/27295-application-et-extension-vocale-chatgpt-de-nouveaux-outils-pour-l-ia/#talk-to-chatgpt--discuter-a-haute-voix-avec-lia
* GBAtemp - https://gbatemp.net/threads/talk-to-chatgpt-actual-vocal-discussion-with-an-ai-using-voice-recognition-and-text-to-speech-in-chrome.622942/
* This list will be updated over time.
