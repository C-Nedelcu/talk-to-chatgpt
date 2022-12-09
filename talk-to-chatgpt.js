// TALK TO CHATGPT
// ---------------
// Author		: C. NEDELCU
// Version		: 1.0
// Git repo 	: https://github.com/C-Nedelcu/talk-to-chatgpt
// Chat GPT URL	: https://chat.openai.com/chat
// How to use   : A Youtube video URL will be inserted here when it's ready

// ----------------------------
// SETTINGS (FEEL FREE TO EDIT)
// ----------------------------

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

// ----------------------------


// -------------------
// CODE (DO NOT ALTER)
// -------------------
var CN_MESSAGE_COUNT = 0;
var CN_SPEECHREC = null;
var CN_IS_READING = false;
var CN_IS_LISTENING = false;
var CN_FINISHED = false;
var CN_PAUSED = false;
var CN_WANTED_VOICE = null;
var CN_TIMEOUT_KEEP_SYNTHESIS_WORKING = null;
var CN_TIMEOUT_KEEP_SPEECHREC_WORKING = null;


// This function will say the given text out loud using the browser's speech synthesis API
function CN_SayOutLoud(text) {
	var msg = new SpeechSynthesisUtterance();
	msg.text = text;
	
	if (CN_WANTED_VOICE) msg.voice = CN_WANTED_VOICE;
	msg.rate = CN_TEXT_TO_SPEECH_RATE;
	msg.pitch = CN_TEXT_TO_SPEECH_PITCH;
	msg.onstart = () => {
		if (CN_FINISHED) return;
		CN_TIMEOUT_KEEP_SYNTHESIS_WORKING = setTimeout(CN_KeepSpeechSynthesisActive, 5000);
	};
	msg.onend = () => {
		if (CN_FINISHED) return;
		
		// Finished speaking
		clearTimeout(CN_TIMEOUT_KEEP_SYNTHESIS_WORKING);
		console.log("Finished speaking out loud");
		
		// restart listening
		CN_IS_READING = false;
		if (CN_SPEECHREC && !CN_IS_LISTENING) CN_SPEECHREC.start();
		clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
		CN_TIMEOUT_KEEP_SPEECHREC_WORKING = setTimeout(CN_KeepSpeechRecWorking, 100);
	}
	CN_IS_READING = true;
	window.speechSynthesis.speak(msg);
}

// This will read the bot's latest message
function CN_ReadLatestMessage() {
	// Turn off speech recognition so that it doesn't talk to itself
	if (CN_SPEECHREC) {
		try {
			CN_SPEECHREC.stop();
		} catch(e) { }
	}
	var text = $(".text-base:last").find("p").text();
	console.log("New message found, I will read this: " + text);
	CN_SayOutLoud(text);
}

// This is a workaround for Chrome's bug in the speech synthesis API (https://stackoverflow.com/questions/21947730/chrome-speech-synthesis-with-longer-texts)
function CN_KeepSpeechSynthesisActive() {
	console.log("Keeping speech synthesis active...");
	window.speechSynthesis.pause();
	window.speechSynthesis.resume();
	CN_TIMEOUT_KEEP_SYNTHESIS_WORKING = setTimeout(CN_KeepSpeechSynthesisActive, 5000);
}

// Check for new messages the bot has sent. If a new message is found, it will be read out loud
function CN_CheckNewMessages() {
	
	// Is streaming? wait 0.1 second and try again
	if ($(".result-streaming").length) {
		setTimeout(CN_CheckNewMessages, 50);
		return;
	}
	
	// Any new messages? // TODO: éviter les erreurs
	var currentMessageCount = $(".text-base").length;
	if (currentMessageCount > CN_MESSAGE_COUNT) {
		CN_MESSAGE_COUNT = currentMessageCount;
		CN_ReadLatestMessage();
	}
	setTimeout(CN_CheckNewMessages, 50);
}

// Send a message to the bot (will simply put text in the textarea and simulate a send button click)
function CN_SendMessage(text) {
	// Send the message
	$("textarea").val(text);
	$("textarea").closest("div").find("button").click();
	
	// Stop speech recognition until the answer is received
	if (CN_SPEECHREC) {
		clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
		CN_SPEECHREC.stop();
	}
}

// Start speech recognition using the browser's speech recognition API
function CN_StartSpeechRecognition() {
	if (CN_IS_READING) {
		clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
		CN_TIMEOUT_KEEP_SPEECHREC_WORKING = setTimeout(CN_KeepSpeechRecWorking, 100);
		return;
	}
	
	CN_SPEECHREC = new webkitSpeechRecognition();
	CN_SPEECHREC.continuous = true;
	CN_SPEECHREC.lang = CN_WANTED_LANGUAGE_SPEECH_REC;
	CN_SPEECHREC.onstart = () => {
		CN_IS_LISTENING = true;
		console.log("I'm listening");
	};
	CN_SPEECHREC.onend = () => {
		CN_IS_LISTENING = false;
		console.log("I've stopped listening");
	};
	CN_SPEECHREC.onerror = () => {
		CN_IS_LISTENING = false;
		console.log("Error while listening");
	};
	CN_SPEECHREC.onresult = (event) => {
		var final_transcript = "";
		for (let i = event.resultIndex; i < event.results.length; ++i) {
			if (event.results[i].isFinal)
				final_transcript += event.results[i][0].transcript;
		}
		console.log("You have said the following words: "+final_transcript);
		if (final_transcript.toLowerCase() == CN_SAY_THIS_WORD_TO_STOP) {
			console.log("You said '"+ CN_SAY_THIS_WORD_TO_STOP+"'. Conversation ended");
			CN_FINISHED = true;
			CN_PAUSED = false;
			CN_SPEECHREC.stop();
			CN_SayOutLoud("Bye bye");
			alert("Conversation ended. Reload the script to restart conversation");
			return;
		} else if (final_transcript.toLowerCase() == CN_SAY_THIS_WORD_TO_PAUSE) {
			console.log("You said '"+ CN_SAY_THIS_WORD_TO_PAUSE+"' Conversation paused");
			CN_PAUSED = true;
			if (CN_SPEECHREC) CN_SPEECHREC.stop();
			alert("Conversation paused, the browser is no longer listening. Click OK to resume");
			CN_PAUSED = false;
			console.log("Conversation resumed");
			return;
		}
		
		CN_SendMessage(final_transcript);
	};
	if (!CN_IS_LISTENING) CN_SPEECHREC.start();
	clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
	CN_TIMEOUT_KEEP_SPEECHREC_WORKING = setTimeout(CN_KeepSpeechRecWorking, 100);
}

// Make sure the speech recognition is turned on when the bot is not speaking
function CN_KeepSpeechRecWorking() {
	if (CN_FINISHED) return; // Conversation finished
	clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
	CN_TIMEOUT_KEEP_SPEECHREC_WORKING = setTimeout(CN_KeepSpeechRecWorking, 100);
	if (!CN_IS_READING && !CN_IS_LISTENING && !CN_PAUSED) {
		if (!CN_SPEECHREC)
			CN_StartSpeechRecognition();
		else {
			if (!CN_IS_LISTENING) {
				try {
					CN_SPEECHREC.start();
				} catch(e) { }
			}
		}
	}
}

// SCRIPT INITIALIZATION
// Load jQuery, start reading aloud, start speech recognition
(function () {
	const script = document.createElement("script");
	script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js';
	script.type = 'text/javascript';
	script.addEventListener('load', () => {
		console.log("jQuery loaded");
		
		// Alert message on start
		alert("After you press OK, I will start listening to your audio. To stop the script, just say the word '"+ CN_SAY_THIS_WORD_TO_STOP+"'. To pause, say 'pause'.");
		
		// Wait on voices to be loaded before fetching list
		window.speechSynthesis.onvoiceschanged = function () {
			if (!CN_WANTED_LANGUAGE_TEXT_TO_SPEECH) console.log("Reading with default browser voice");
			else {
				speechSynthesis.getVoices().forEach(function (voice) {
					//console.log("Found possible voice: " + voice.name + " (" + voice.lang + ")");
					if (voice.lang.substring(0, 2) == CN_WANTED_LANGUAGE_TEXT_TO_SPEECH) {
						CN_WANTED_VOICE = voice;
						console.log("I will read using voice " + voice.name + " (" + voice.lang + ")");
						return false;
					}
				});
				if (!CN_WANTED_VOICE)
					console.log("No voice found for '"+ CN_WANTED_LANGUAGE_TEXT_TO_SPEECH+"', reading with default browser voice");
			}
		};
		
		// Try and get voices
		speechSynthesis.getVoices();
		
		setTimeout(function() {
			// Check for new messages
			CN_CheckNewMessages();
			
			// Start speech rec
			CN_StartSpeechRecognition();
		}, 100);
	});
	document.head.appendChild(script);
})();
