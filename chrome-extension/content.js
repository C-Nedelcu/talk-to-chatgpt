// TALK TO CHATGPT
// ---------------
// Author		: C. NEDELCU
// Version		: 2.1.0
// Git repo 	: https://github.com/C-Nedelcu/talk-to-chatgpt
// Chat GPT URL	: https://chat.openai.com/chat
// How to use   : https://www.youtube.com/watch?v=VXkLQMEs3lA
// Credits		: C. NEDELCU (code), pixelsoda (GUI), S. James (GUI)

// ----------------------------
// SETTINGS (FEEL FREE TO EDIT)
// ----------------------------
// These are the default settings. Since v1.3, a 'settings' menu allows to change most of the below values in the UI
// Since v1.4, these settings are saved. So there is no need to edit them out anymore.

// Settings for the text-to-speech functionality (the bot's voice)
var CN_TEXT_TO_SPEECH_RATE = 1; // The higher the rate, the faster the bot will speak
var CN_TEXT_TO_SPEECH_PITCH = 1; // This will alter the pitch for the bot's voice

// Indicate a locale code such as 'fr-FR', 'en-US', to use a particular language for the speech recognition functionality (when you speak into the mic)
// If you leave this blank, the system's default language will be used
var CN_WANTED_LANGUAGE_SPEECH_REC = ""; //"fr-FR";

// Determine which word will cause this scrip to stop.
var CN_SAY_THIS_WORD_TO_STOP = "stop";

// Determine which word will cause this script to temporarily pause
var CN_SAY_THIS_WORD_TO_PAUSE = "pause";

// Determine whether messages are sent immediately after speaing
var CN_AUTO_SEND_AFTER_SPEAKING = true;

// Determine whether commas should be ignored as sentence separators
var CN_IGNORE_COMMAS = false;

// Determine which word(s) will cause this script to send the current message (if auto-send disabled)
var CN_SAY_THIS_TO_SEND = "send message now"; 

// Indicate "locale-voice name" (the possible values are difficult to determine, you should just ignore this and use the settings menu instead)
var CN_WANTED_VOICE_NAME = "";

// ----------------------------


// -------------------
// CODE (DO NOT ALTER)
// -------------------
var CN_MESSAGE_COUNT = 0;
var CN_CURRENT_MESSAGE = null;
var CN_CURRENT_MESSAGE_SENTENCES = [];
var CN_CURRENT_MESSAGE_SENTENCES_NEXT_READ = 0;
var CN_SPEECHREC = null;
var CN_IS_READING = false;
var CN_IS_LISTENING = false;
var CN_FINISHED = false;
var CN_PAUSED = false;
var CN_WANTED_VOICE = null;
var CN_TIMEOUT_KEEP_SYNTHESIS_WORKING = null;
var CN_TIMEOUT_KEEP_SPEECHREC_WORKING = null;
var CN_SPEECH_REC_SUPPORTED = false;
var CN_SPEAKING_DISABLED = false;
var CN_SPEECHREC_DISABLED = false;

// This function will say the given text out loud using the browser's speech synthesis API
function CN_SayOutLoud(text) {
	if (!text || CN_SPEAKING_DISABLED) {
		if (CN_SPEECH_REC_SUPPORTED && CN_SPEECHREC && !CN_IS_LISTENING && !CN_PAUSED && !CN_SPEECHREC_DISABLED) CN_SPEECHREC.start();
		clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
		CN_TIMEOUT_KEEP_SPEECHREC_WORKING = setTimeout(CN_KeepSpeechRecWorking, 100);
		return;
	}
	
	// Are we speaking?
	if (CN_SPEECHREC) {
		clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
		CN_SPEECHREC.stop();
	}
	
	// Let's speak out loud
	console.log("Saying out loud: "+text);
	var msg = new SpeechSynthesisUtterance();
	msg.text = text;
	
	if (CN_WANTED_VOICE) msg.voice = CN_WANTED_VOICE;
	msg.rate = CN_TEXT_TO_SPEECH_RATE;
	msg.pitch = CN_TEXT_TO_SPEECH_PITCH;
	msg.onstart = () => {
		// Make border green
		$("#CNStatusBar").css("background", "green");
		
		// If speech recognition is active, disable it
		if (CN_IS_LISTENING) CN_SPEECHREC.stop();
		
		if (CN_FINISHED) return;
		CN_IS_READING = true;
		clearTimeout(CN_TIMEOUT_KEEP_SYNTHESIS_WORKING);
		CN_TIMEOUT_KEEP_SYNTHESIS_WORKING = setTimeout(CN_KeepSpeechSynthesisActive, 5000);
	};
	msg.onend = () => {
		CN_AfterSpeakOutLoudFinished();
	}
	CN_IS_READING = true;
	window.speechSynthesis.speak(msg);
}

// Occurs when speaking out loud is finished
function CN_AfterSpeakOutLoudFinished() {
	// Make border grey again
	$("#CNStatusBar").css("background", "grey");
	
	if (CN_FINISHED) return;
	
	// Finished speaking
	clearTimeout(CN_TIMEOUT_KEEP_SYNTHESIS_WORKING);
	console.log("Finished speaking out loud");
	
	// restart listening
	CN_IS_READING = false;
	setTimeout(function() {
		if (!window.speechSynthesis.speaking) {
			if (CN_SPEECH_REC_SUPPORTED && CN_SPEECHREC && !CN_IS_LISTENING && !CN_PAUSED && !CN_SPEECHREC_DISABLED) CN_SPEECHREC.start();
			clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
			CN_TIMEOUT_KEEP_SPEECHREC_WORKING = setTimeout(CN_KeepSpeechRecWorking, 100);
		}
	}, 500);
}

// This is a workaround for Chromium's bug in the speech synthesis API (https://stackoverflow.com/questions/21947730/chrome-speech-synthesis-with-longer-texts)
function CN_KeepSpeechSynthesisActive() {
	console.log("Keeping speech synthesis active...");
	window.speechSynthesis.pause();
	window.speechSynthesis.resume();
	CN_TIMEOUT_KEEP_SYNTHESIS_WORKING = setTimeout(CN_KeepSpeechSynthesisActive, 5000);
}

// Split the text into sentences so the speech synthesis can start speaking as soon as possible
function CN_SplitIntoSentences(text) {
	var sentences = [];
	var currentSentence = "";
	
	for(var i=0; i<text.length; i++) {
		//
		var currentChar = text[i];
		
		// Add character to current sentence
		currentSentence += currentChar;
		
		// is the current character a delimiter? if so, add current part to array and clear
		if (
			// Latin punctuation
		       currentChar == (CN_IGNORE_COMMAS?'.':',')
			|| currentChar == (CN_IGNORE_COMMAS ? '.' : ':')
			|| currentChar == '.' 
			|| currentChar == '!' 
			|| currentChar == '?' 
			|| currentChar == (CN_IGNORE_COMMAS ? '.' : ';')
			|| currentChar == '…'
			// Chinese/japanese punctuation
			|| currentChar == (CN_IGNORE_COMMAS ? '.' : '、')
			|| currentChar == (CN_IGNORE_COMMAS ? '.' : '，')
			|| currentChar == '。'
			|| currentChar == '．'
			|| currentChar == '！'
			|| currentChar == '？'
			|| currentChar == (CN_IGNORE_COMMAS ? '.' : '；')
			|| currentChar == (CN_IGNORE_COMMAS ? '.' : '：')
			) {
			if (currentSentence.trim() != "") sentences.push(currentSentence.trim());
			currentSentence = "";
		}
	}
	
	return sentences;
}

// Check for new messages the bot has sent. If a new message is found, it will be read out loud
function CN_CheckNewMessages() {
	// Any new messages?
	var currentMessageCount = jQuery(".text-base").length;
	if (currentMessageCount > CN_MESSAGE_COUNT) {
		// New message!
		CN_MESSAGE_COUNT = currentMessageCount;
		CN_CURRENT_MESSAGE = jQuery(".text-base:last").find(".items-start");
		CN_CURRENT_MESSAGE_SENTENCES = []; // Reset list of parts already spoken
		CN_CURRENT_MESSAGE_SENTENCES_NEXT_READ = 0;
	}
	
	// Split current message into parts
	if (CN_CURRENT_MESSAGE && CN_CURRENT_MESSAGE.length) {
		var currentText = CN_CURRENT_MESSAGE.text()+"";
		var newSentences = CN_SplitIntoSentences(currentText);
		if (newSentences != null && newSentences.length != CN_CURRENT_MESSAGE_SENTENCES.length) {
			// There is a new part of a sentence!
			var nextRead = CN_CURRENT_MESSAGE_SENTENCES_NEXT_READ;
			for (i = nextRead; i < newSentences.length; i++) {
				CN_CURRENT_MESSAGE_SENTENCES_NEXT_READ = i+1;

				var lastPart = newSentences[i];
				CN_SayOutLoud(lastPart);
			}
			CN_CURRENT_MESSAGE_SENTENCES = newSentences;
		}
	}
	
	setTimeout(CN_CheckNewMessages, 100);
}

// Send a message to the bot (will simply put text in the textarea and simulate a send button click)
function CN_SendMessage(text) {
	// Put message in textarea
	jQuery("textarea.w-full").focus();
	var existingText = jQuery("textarea.w-full").val();
	
	// Is there already existing text?
	if (!existingText) jQuery("textarea.w-full").val(text);
	else jQuery("textarea.w-full").val(existingText+" "+text);
	
	// Change height in case
	var fullText = existingText+" "+text;
	var rows = Math.ceil( fullText.length / 88);
	var height = rows * 24;
	jQuery("textarea.w-full").css("height", height+"px");
	
	// Send the message, if autosend is enabled
	jQuery("textarea.w-full").closest("div").find("button").prop("disabled", false);
	if (CN_AUTO_SEND_AFTER_SPEAKING) {
		jQuery("textarea.w-full").closest("div").find("button").click();
		
		// Stop speech recognition until the answer is received
		if (CN_SPEECHREC) {
			clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
			CN_SPEECHREC.stop();
		}
	} else {
		// No autosend, so continue recognizing
		clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
		CN_TIMEOUT_KEEP_SPEECHREC_WORKING = setTimeout(CN_KeepSpeechRecWorking, 100);
	}
}

// Start speech recognition using the browser's speech recognition API
function CN_StartSpeechRecognition() {
	if (CN_IS_READING) {
		clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
		CN_TIMEOUT_KEEP_SPEECHREC_WORKING = setTimeout(CN_KeepSpeechRecWorking, 100);
		return;
	}
	if (!CN_SPEECH_REC_SUPPORTED) return;
	CN_SPEECHREC = ('webkitSpeechRecognition' in window) ? new webkitSpeechRecognition() : new SpeechRecognition();
	CN_SPEECHREC.continuous = true;
	CN_SPEECHREC.lang = CN_WANTED_LANGUAGE_SPEECH_REC;
	CN_SPEECHREC.onstart = () => {
		// Make bar red
		$("#CNStatusBar").css("background", "red");
		
		CN_IS_LISTENING = true;
		console.log("I'm listening");
	};
	CN_SPEECHREC.onend = () => {
		// Make border grey again
		$("#CNStatusBar").css("background", "grey");
		
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
		
		console.log("Voice recognition: '"+ (final_transcript)+"'");
		if (CN_RemovePunctuation(final_transcript) == CN_SAY_THIS_WORD_TO_STOP.toLowerCase().trim()) {
			console.log("You said '"+ CN_SAY_THIS_WORD_TO_STOP+"'. Conversation ended");
			CN_FINISHED = true;
			CN_PAUSED = false;
			CN_SPEECHREC.stop();
			CN_SayOutLoud("Bye bye");
			alert("Conversation ended. Click the Start button to resume");
			
			// Show start button, hide action buttons
			jQuery(".CNStartZone").show();
			jQuery(".CNActionButtons").hide();
			
			return;
		} else if (CN_RemovePunctuation(final_transcript) == CN_SAY_THIS_WORD_TO_PAUSE.toLowerCase().trim()) {
			console.log("You said '"+ CN_SAY_THIS_WORD_TO_PAUSE+"' Conversation paused");
			CN_PAUSED = true;
			if (CN_SPEECHREC) CN_SPEECHREC.stop();
			alert("Conversation paused, the browser is no longer listening. Click OK to resume");
			CN_PAUSED = false;
			console.log("Conversation resumed");
			return;
		} else if (CN_RemovePunctuation(final_transcript) == CN_SAY_THIS_TO_SEND.toLowerCase().trim() && !CN_AUTO_SEND_AFTER_SPEAKING) {
			console.log("You said '"+ CN_SAY_THIS_TO_SEND+"' - the message will be sent");
			
			// Click button
			jQuery("textarea.w-full").closest("div").find("button").click();
		
			// Stop speech recognition until the answer is received
			if (CN_SPEECHREC) {
				clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
				CN_SPEECHREC.stop();
			}
			
			return;
		}
		
		CN_SendMessage(final_transcript);
	};
	if (!CN_IS_LISTENING && CN_SPEECH_REC_SUPPORTED && !CN_SPEECHREC_DISABLED) CN_SPEECHREC.start();
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
					if (CN_SPEECH_REC_SUPPORTED && !window.speechSynthesis.speaking && !CN_SPEECHREC_DISABLED)
						CN_SPEECHREC.start();
				} catch(e) { }
			}
		}
	}
}

// Toggle button clicks: settings, pause, skip...
function CN_ToggleButtonClick() {
	var action = $(this).data("cn");
	switch(action) {
	
		// Open settings menu
		case "settings":
			CN_OnSettingsIconClick();
			return;
		
		// The microphone is on. Turn it off
		case "micon":
			// Show other icon and hide this one
			$(this).css("display", "none");
			$(".CNToggle[data-cn=micoff]").css("display", "");
			
			// Disable speech rec
			CN_SPEECHREC_DISABLED = true;
			if (CN_SPEECHREC && CN_IS_LISTENING) CN_SPEECHREC.stop();
			
			return;
		
		// The microphone is off. Turn it on
		case "micoff":
			// Show other icon and hide this one
			$(this).css("display", "none");
			$(".CNToggle[data-cn=micon]").css("display", "");
			
			// Enable speech rec
			CN_SPEECHREC_DISABLED = false;
			if (CN_SPEECHREC && !CN_IS_LISTENING && !CN_IS_READING) CN_SPEECHREC.start();
			
			return;
		
		// The bot's voice is on. Turn it off
		case "speakon":
			// Show other icon and hide this one
			$(this).css("display", "none");
			$(".CNToggle[data-cn=speakoff]").css("display", "");
			CN_SPEAKING_DISABLED = true;
			
			// Stop current message (equivalent to 'skip')
			window.speechSynthesis.pause(); // Pause, and then...
			window.speechSynthesis.cancel(); // Cancel everything
			CN_CURRENT_MESSAGE = null; // Remove current message
			return;
		
		// The bot's voice is off. Turn it on
		case "speakoff":
			// Show other icon and hide this one
			$(this).css("display", "none");
			$(".CNToggle[data-cn=speakon]").css("display", "");
			CN_SPEAKING_DISABLED = false;
			
			return;
		
		// Skip current message being read
		case "skip":
			window.speechSynthesis.pause(); // Pause, and then...
			window.speechSynthesis.cancel(); // Cancel everything
			CN_CURRENT_MESSAGE = null; // Remove current message
			
			// Restart listening maybe?
			CN_AfterSpeakOutLoudFinished();
			return;
	}
}

// Start Talk-to-ChatGPT (Start button)
function CN_StartTTGPT() {
	CN_SayOutLoud("OK");
	CN_FINISHED = false;
	
	// Hide start button, show action buttons
	jQuery(".CNStartZone").hide();
	jQuery(".CNActionButtons").show();
	
	setTimeout(function() {
		// Start speech rec
		CN_StartSpeechRecognition();
		
		// Check for new messages
		CN_CheckNewMessages();
	}, 1000);
}

// Check we are on the correct page
function CN_CheckCorrectPage() {
	console.log("Checking we are on the correct page...");
	var wrongPage = jQuery("textarea.w-full").length == 0; // no textarea... login page?
	
	if (wrongPage) {
		// We are on the wrong page, keep checking
		setTimeout(CN_CheckCorrectPage, 1000);
	} else {
		// We are on the right page, let's go!
		CN_InitScript();
	}
}

// Perform initialization after jQuery is loaded
function CN_InitScript() {
	if (typeof $ === null || typeof $ === undefined) $ = jQuery;
	
	var warning = "";
	if ('webkitSpeechRecognition' in window) {
		console.log("Speech recognition API supported");
		CN_SPEECH_REC_SUPPORTED = true;
	} else {
		console.log("speech recognition API not supported.");
		CN_SPEECH_REC_SUPPORTED = false;
		warning = "\n\nWARNING: speech recognition (speech-to-text) is only available in Chromium-based browsers - desktop version at the moment. If you are using another browser, you will not be able to dictate text, but you can still listen to the bot's responses.";
	}
	
	// Restore settings
	CN_RestoreSettings();
	
	// Wait on voices to be loaded before fetching list
	window.speechSynthesis.onvoiceschanged = function () {
		if (!CN_WANTED_VOICE_NAME){
			console.log("Reading with default browser voice");
		} else {
			speechSynthesis.getVoices().forEach(function (voice) {
				//console.log("Found possible voice: " + voice.name + " (" + voice.lang + ")");
				if (voice.lang + "-" + voice.name == CN_WANTED_VOICE_NAME) {
					CN_WANTED_VOICE = voice;
					console.log("I will read using voice " + voice.name + " (" + voice.lang + ")");
					return false;
				}
			});
			if (!CN_WANTED_VOICE)
				console.log("No voice found for '" + CN_WANTED_VOICE_NAME + "', reading with default browser voice");
		}
		
		// Voice OK
		setTimeout(function() {
			//CN_SayOutLoud("OK");
		}, 1000);
	};
	
	// Add icons on the top right corner
	jQuery("body").append(
		"<div style='position: fixed; top: 8px; right: 16px; display: inline-block; " +
			"background: #41464c; color: white; padding: 0; font-size: 16px; border-radius: 8px; text-align: center;" +
			"font-weight: bold; z-index: 1111;' id='TTGPTSettings'>" +
		
			// Logo / title
			"<div style='padding: 4px 40px; border-bottom: 1px solid grey;'>" +
				"<a href='https://github.com/C-Nedelcu/talk-to-chatgpt' " +
					"style='display: inline-block; font-size: 20px; line-height: 80%; padding: 8px 0;' " +
					"target=_blank title='Visit project website'>TALK-TO-ChatGPT<br />" +
					"<div style='text-align: right; font-size: 12px; color: grey'>V2.1.0</div>" +
				"</a>" +
			"</div>" +
			
			// Below logo
			"<div>" +
				
				// Start button
				"<div style='font-size: 16px; padding: 8px;' class='CNStartZone'>" +
					"<button style='border: 2px solid grey; padding: 6px 40px; margin: 6px; border-radius: 6px; opacity: 0.7;' id='CNStartButton' title='ALT+SHIFT+S'><i class=\"fa-solid fa-play\"></i>&nbsp;&nbsp;START</button>"+
				"</div>"+
		
				// Action buttons
				"<div style='font-size: 20px; padding: 12px 8px; padding-bottom: 0px; display:none;' class='CNActionButtons'>" +
					"<table width='100%' cellpadding=0 cellspacing=0><tr>" +
						"<td width='24%' style='text-align: center;'>" +
							"<span class='CNToggle' title='Voice recognition enabled. Click to disable. (Shortcut: ALT+SHIFT+H)' data-cn='micon' style='opacity: 0.7;'><i class=\"fa-solid fa-microphone\"></i></span>" + // Microphone enabled
							"<span class='CNToggle' title='Voice recognition disabled. Click to enable. (Shortcut: ALT+SHIFT+H)' style='display:none; color: red; opacity: 0.7;' data-cn='micoff'><i class=\"fa-solid fa-microphone-slash\"></i></span>" + // Microphone disabled
						"</td>"+
						"<td width='1%' style='border-left: 1px solid grey; padding-left: 0 !important; padding-right: 0 !important; font-size: 1px; width: 1px;'>&nbsp;</td>"+
						"<td width='24%' style='text-align: center;'>" +
							"<span class='CNToggle' title='Text-to-speech (bot voice) enabled. Click to disable. This will skip the current message entirely. (Shortcut: ALT+SHIFT+V)' data-cn='speakon' style='opacity: 0.7;'><i class=\"fa-solid fa-volume-high\"></i></span>" + // Speak out loud
							"<span class='CNToggle' title='Text-to-speech (bot voice) disabled. Click to enable. (Shortcut: ALT+SHIFT+V)' style='display:none; color: red; opacity: 0.7;' data-cn='speakoff'><i class=\"fa-solid fa-volume-xmark\"></i></span>  " + // Mute
						"</td>"+
						"<td width='1%' style='border-left: 1px solid grey; padding-left: 0 !important; padding-right: 0 !important; font-size: 1px; width: 1px;'>&nbsp;</td>" +
						"<td width='24%' style='text-align: center;'>" +
							"<span class='CNToggle' title='Skip the message currently being read by the bot. (Shortcut: ALT+SHIFT+L)' data-cn='skip' style='opacity: 0.7;'><i class=\"fa-solid fa-angles-right\"></i></span>" + // Skip
						"</td>"+
						"<td width='1%' style='border-left: 1px solid grey; padding-left: 0 !important; padding-right: 0 !important; font-size: 1px; width: 1px;'>&nbsp;</td>" +
						"<td width='24%' style='text-align: center;'>" +
							"<span class='CNToggle' title='Open settings menu to change bot voice, language, and other settings' data-cn='settings' style='opacity: 0.7;'><i class=\"fa-solid fa-sliders\"></i></span>" + // Settings
						"</td>"+
					"</tr></table>" +
					
					// Colored bar - transparent by default, red when mic on, green when bot speaks
					"<div style='padding-top: 12px; padding-bottom: 6px;'>" +
						"<div id='CNStatusBar' style='background: grey; width: 100%; height: 8px; border-radius: 4px; overflow: hidden;'>&nbsp;</div>" +
					"</div>" +
				"</div>" +
			"</div>" +
		"</div>"
	);
	
	setTimeout(function () {
		// Try and get voices
		speechSynthesis.getVoices();

		// Make icons clickable
		jQuery(".CNToggle").css("cursor", "pointer");
		jQuery(".CNToggle").on("click", CN_ToggleButtonClick);
		jQuery("#CNStartButton").on("click", CN_StartTTGPT);
		
		// Make icons change opacity on hover
		jQuery(".CNToggle, #CNStartButton").on("mouseenter", function() { jQuery(this).css("opacity", 1); });
		jQuery(".CNToggle, #CNStartButton").on("mouseleave", function() { jQuery(this).css("opacity", 0.7); });
	}, 100);
	
	// Start key detection
	jQuery(document).on('keydown', function (e) {
		// ALT+SHIFT+S: Start
		if (e.altKey && e.shiftKey && e.which === 83) {
			console.log('ALT+SHIFT+S pressed, starting Talk-To-ChatGPT');
			CN_StartTTGPT();
		}
		
		// ALT+SHIFT+H: Hush
		if (e.altKey && e.shiftKey && e.which === 72) {
			// Is the current mode 'micon' or 'micoff'?
			var wantMicOff = jQuery(".CNToggle[data-cn=micon]").css("display") == "none";
			if (wantMicOff) {
				// Turn off bot voice
				console.log('ALT+SHIFT+H pressed, turning off speech recognition');
				jQuery(".CNToggle[data-cn=micoff]").click();
			} else {
				// Turn on bot voice
				console.log('ALT+SHIFT+H pressed, turning on speech recognition');
				jQuery(".CNToggle[data-cn=micon]").click();
			}
		}
		
		// ALT+SHIFT+V: suspend bot Voice
		if (e.altKey && e.shiftKey && e.which === 86) {
			// Is the current mode 'speakon' or 'speakoff'?
			var wantSpeakOff = jQuery(".CNToggle[data-cn=speakon]").css("display") == "none";
			if (wantSpeakOff) {
				// Turn off bot voice
				console.log('ALT+SHIFT+V pressed, turning bot voice off');
				jQuery(".CNToggle[data-cn=speakoff]").click();
			} else {
				// Turn on bot voice
				console.log('ALT+SHIFT+V pressed, turning bot voice on');
				jQuery(".CNToggle[data-cn=speakon]").click();
			}
		}
		
		// ALT+SHIFT+L: skip current message
		if (e.altKey && e.shiftKey && e.which === 76) {
			console.log('ALT+SHIFT+L pressed, skipping current message');
			jQuery(".CNToggle[data-cn=skip]").click();
		}
	});
}


// Open settings menu
function CN_OnSettingsIconClick() {
	console.log("Opening settings menu");
	
	// Stop listening
	CN_PAUSED = true;
	if (CN_SPEECHREC) CN_SPEECHREC.stop();
	
	// Prepare settings row
	var rows = "";
	
	// 1. Bot's voice
	var voices = "";
	var n = 0;
	speechSynthesis.getVoices().forEach(function (voice) {
		var label = `${voice.name} (${voice.lang})`;
		if (voice.default) label += ' — DEFAULT';
		var SEL = (CN_WANTED_VOICE && CN_WANTED_VOICE.lang == voice.lang && CN_WANTED_VOICE.name == voice.name) ? "selected=selected": "";
		voices += "<option value='"+n+"' "+SEL+">"+label+"</option>";
		n++;
	});
	rows += "<tr><td style='white-space: nowrap'>AI voice and language:</td><td><select id='TTGPTVoice' style='width: 250px; padding: 2px; color: black'>"+voices+"</select></td></tr>";
	
	// 2. AI talking speed
	rows += "<tr><td style='white-space: nowrap'>AI talking speed (speech rate):</td><td><input type=number step='.1' id='TTGPTRate' style='color: black; padding: 2px; width: 100px;' value='"+CN_TEXT_TO_SPEECH_RATE+"' /></td></tr>";
	
	// 3. AI voice pitch
	rows += "<tr><td style='white-space: nowrap'>AI voice pitch:</td><td><input type=number step='.1' id='TTGPTPitch' style='width: 100px; padding: 2px; color: black;' value='"+CN_TEXT_TO_SPEECH_PITCH+"' /></td></tr>";
	
	// 4. Speech recognition language CN_WANTED_LANGUAGE_SPEECH_REC
	var languages = "<option value=''></option>";
	for(var i in CN_SPEECHREC_LANGS) {
		var languageName = CN_SPEECHREC_LANGS[i][0];
		for(var j in CN_SPEECHREC_LANGS[i]) {
			if (j == 0) continue;
			var languageCode = CN_SPEECHREC_LANGS[i][j][0];
			var SEL = languageCode == CN_WANTED_LANGUAGE_SPEECH_REC ? "selected='selected'": "";
			languages += "<option value='"+languageCode+"' "+SEL+">"+languageName+" - "+languageCode+"</option>";
		}
	}
	rows += "<tr><td style='white-space: nowrap'>Speech recognition language:</td><td><select id='TTGPTRecLang' style='width: 250px; padding: 2px; color: black;' >"+languages+"</select></td></tr>";
	
	// 5. 'Stop' word
	rows += "<tr><td style='white-space: nowrap'>'Stop' word:</td><td><input type=text id='TTGPTStopWord' style='width: 100px; padding: 2px; color: black;' value='"+CN_SAY_THIS_WORD_TO_STOP+"' /></td></tr>";
	
	// 6. 'Pause' word
	rows += "<tr><td style='white-space: nowrap'>'Pause' word:</td><td><input type=text id='TTGPTPauseWord' style='width: 100px; padding: 2px; color: black;' value='"+CN_SAY_THIS_WORD_TO_PAUSE+"' /></td></tr>";
	
	// 7. Autosend
	rows += "<tr><td style='white-space: nowrap'>Automatic send:</td><td><input type=checkbox id='TTGPTAutosend' "+(CN_AUTO_SEND_AFTER_SPEAKING?"checked=checked":"")+" /> <label for='TTGPTAutosend'>Automatically send message to ChatGPT after speaking</label></td></tr>";
	
	// 8. Manual send word
	rows += "<tr><td style='white-space: nowrap'>Manual send word(s):</td><td><input type=text id='TTGPTSendWord' style='width: 250px; padding: 2px; color: black;' value='" + CN_SAY_THIS_TO_SEND + "' /><span style='font-size: 10px;'>If 'automatic send' is disabled, you can trigger the sending of the message by saying this word (or sequence of words)</span></td></tr>";
	
	// 9. Split sentences with commas
	rows += "<tr><td style='white-space: nowrap'>Punctuation in sentences:</td><td><input type=checkbox id='TTGPTIgnoreCommas' " + (CN_IGNORE_COMMAS ? "checked=checked" : "") + " /> <label for='TTGPTIgnoreCommas'>Don't use commas/semicolons/etc. to break down replies into sentences</label></td></tr>";
	
	// Keyboard shortcuts
	rows += "<tr><td style='white-space: nowrap'>Keyboard shortcuts:</td><td><ul>" +
		"<li>ALT+SHIFT+S: <u>S</u>tart Talk-To-ChatGPT</li>" +
		"<li>ALT+SHIFT+H: suspend/resume speech recognition (<u>H</u>ush)</li>" +
		"<li>ALT+SHIFT+V: suspend/resume bot's voice (<u>V</u>oice)</li>" +
		"<li>ALT+SHIFT+L: skip current message (<u>L</u>eap)</li>" +
		"</ul></td></tr>";
	
	// Prepare save/close buttons
	var closeRow = "<tr><td colspan=2 style='text-align: center'><br /><button id='TTGPTSave' style='font-size: 18px; font-weight: bold;'>✓ Save</button>&nbsp;<button id='TTGPTCancel' style='margin-left: 40px; font-size: 18px;'>✗ Cancel</button></td></tr>";
	
	// Prepare settings table
	var table = "<table cellpadding=6 cellspacing=2 style='margin-top: 30px;'>"+rows+closeRow+"</table>";
	
	// A short text at the beginning
	var desc = "<div style='text-align: justify; margin: 8px;'>Please note: some the voices and speech recognition languages do not appear to work. If the one you select doesn't work, try reloading the page. " +
		"If it still doesn't work after reloading the page, please try selecting another voice or language. " +
		"Also, sometimes the text-to-speech API takes time to kick in, give it a few seconds to hear the bot speak. <b>Remember this is an experimental extension created just for fun.</b> " +
		"Check out the <a href='https://github.com/C-Nedelcu/talk-to-chatgpt' target=_blank style='text-decoration: underline'>project page</a> to get the source code." +
		"</div>";
	
	// Open a whole screenful of settings
	jQuery("body").append("<div style='background: rgba(0,0,0,0.7); position: absolute; overflow-y: auto; top: 0; right: 0; left: 0; bottom: 0; z-index: 999999; padding: 20px; color: white; font-size: 13px;' id='TTGPTSettingsArea'>" +
		"<div style='width: 600px; margin-left: auto; margin-right: auto; overflow-y: auto;'><h1>⚙️ Talk-to-ChatGPT settings</h1>"+desc+table+"</div></div>");
	
	// Assign events
	setTimeout(function() {
		jQuery("#TTGPTSave").on("click", CN_SaveSettings);
		jQuery("#TTGPTCancel").on("click", CN_CloseSettingsDialog);
	}, 100);
}

// Save settings and close dialog box
function CN_SaveSettings() {
	
	// Save settings
	try {
		// AI voice settings: voice/language, rate, pitch
		var wantedVoiceIndex = jQuery("#TTGPTVoice").val();
		var allVoices = speechSynthesis.getVoices();
		CN_WANTED_VOICE = allVoices[wantedVoiceIndex];
		CN_WANTED_VOICE_NAME = CN_WANTED_VOICE.lang+"-"+CN_WANTED_VOICE.name;
		CN_TEXT_TO_SPEECH_RATE = Number( jQuery("#TTGPTRate").val() );
		CN_TEXT_TO_SPEECH_PITCH = Number( jQuery("#TTGPTPitch").val() );
		
		// Speech recognition settings: language, stop, pause
		CN_WANTED_LANGUAGE_SPEECH_REC = jQuery("#TTGPTRecLang").val();
		CN_SAY_THIS_WORD_TO_STOP = jQuery("#TTGPTStopWord").val();
		CN_SAY_THIS_WORD_TO_PAUSE = jQuery("#TTGPTPauseWord").val();
		CN_AUTO_SEND_AFTER_SPEAKING = jQuery("#TTGPTAutosend").prop("checked");
		CN_SAY_THIS_TO_SEND = jQuery("#TTGPTSendWord").val();
		CN_IGNORE_COMMAS = jQuery("#TTGPTIgnoreCommas").prop("checked");
		
		// Apply language to speech recognition instance
		if (CN_SPEECHREC) CN_SPEECHREC.lang = CN_WANTED_LANGUAGE_SPEECH_REC;
		
		// Save settings in cookie
		var settings = [
			CN_WANTED_VOICE_NAME,
			CN_TEXT_TO_SPEECH_RATE,
			CN_TEXT_TO_SPEECH_PITCH,
			CN_WANTED_LANGUAGE_SPEECH_REC,
			CN_SAY_THIS_WORD_TO_STOP,
			CN_SAY_THIS_WORD_TO_PAUSE,
			CN_AUTO_SEND_AFTER_SPEAKING?1:0,
			CN_SAY_THIS_TO_SEND,
			CN_IGNORE_COMMAS?1:0
		];
		CN_SetCookie("CN_TTGPT", JSON.stringify(settings));
	} catch(e) { alert('Invalid settings values'); return; }
	
	// Close dialog
	console.log("Closing settings dialog");
	jQuery("#TTGPTSettingsArea").remove();
	
	// Resume listening
	CN_PAUSED = false;
}

// Restore settings from cookie
function CN_RestoreSettings() {
	var settingsRaw = CN_GetCookie("CN_TTGPT");
	try {
		var settings = JSON.parse(settingsRaw);
		if (typeof settings == "object" && settings != null) {
			console.log("Reloading settings from cookie: "+settings);
			CN_WANTED_VOICE_NAME = settings[0];
			CN_TEXT_TO_SPEECH_RATE = settings[1];
			CN_TEXT_TO_SPEECH_PITCH = settings[2];
			CN_WANTED_LANGUAGE_SPEECH_REC = settings[3];
			CN_SAY_THIS_WORD_TO_STOP = settings[4];
			CN_SAY_THIS_WORD_TO_PAUSE = settings[5];
			if (settings.hasOwnProperty(6)) CN_AUTO_SEND_AFTER_SPEAKING = settings[6] == 1;
			if (settings.hasOwnProperty(7)) CN_SAY_THIS_TO_SEND = settings[7];
			if (settings.hasOwnProperty(8)) CN_IGNORE_COMMAS = settings[8] == 1;
		}
	} catch (ex) {
		console.error(ex);
	}
}

// Close dialog: remove area altogether
function CN_CloseSettingsDialog() {
	console.log("Closing settings dialog");
	jQuery("#TTGPTSettingsArea").remove();
	
	// Resume listening
	CN_PAUSED = false;
}

// Remove punctuation in a sentence. This function was written by ChatGPT on the 9th of April 2023. Thanks Chatty!
function CN_RemovePunctuation(str) {
	const regexPonctuation = /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-./:;<=>?@\[\]^_`{|}~]/g;
	str = str.replace(regexPonctuation, '')+"";
	return str.toLowerCase().trim();
}

// Sets a cookie
function CN_SetCookie(name, value) {
	var days = 365;
	var date = new Date();
	date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
	var expires = "; expires=" + date.toGMTString();
	document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; path=/";
}

// Reads a cookie
function CN_GetCookie(name) {
	var nameEQ = encodeURIComponent(name) + "=";
	var ca = document.cookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) === ' ')
			c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) === 0)
			return decodeURIComponent(c.substring(nameEQ.length, c.length));
	}
	return null;
}

// MAIN ENTRY POINT
// Load jQuery, then run initialization function
(function () {
	
	setTimeout(function() {
		typeof jQuery == "undefined" ?
			alert("[Talk-to-ChatGPT] Sorry, but jQuery was not able to load. The script cannot run. Try using Google Chrome or Edge on Windows 11") :
			CN_CheckCorrectPage();
	}, 500);
	
})();

// List of languages for speech recognition - Pulled from https://www.google.com/intl/en/chrome/demos/speech.html
var CN_SPEECHREC_LANGS =
[['Afrikaans',       ['af-ZA']],
 ['አማርኛ',           	 ['am-ET']],
 ['Azərbaycanca',    ['az-AZ']],
 ['বাংলা',            	 ['bn-BD', 'বাংলাদেশ'],
                     ['bn-IN', 'ভারত']],
 ['Bahasa Indonesia',['id-ID']],
 ['Bahasa Melayu',   ['ms-MY']],
 ['Català',          ['ca-ES']],
 ['Čeština',         ['cs-CZ']],
 ['Dansk',           ['da-DK']],
 ['Deutsch',         ['de-DE']],
 ['English',         ['en-AU', 'Australia'],
                     ['en-CA', 'Canada'],
                     ['en-IN', 'India'],
                     ['en-KE', 'Kenya'],
                     ['en-TZ', 'Tanzania'],
                     ['en-GH', 'Ghana'],
                     ['en-NZ', 'New Zealand'],
                     ['en-NG', 'Nigeria'],
                     ['en-ZA', 'South Africa'],
                     ['en-PH', 'Philippines'],
                     ['en-GB', 'United Kingdom'],
                     ['en-US', 'United States']],
 ['Español',         ['es-AR', 'Argentina'],
                     ['es-BO', 'Bolivia'],
                     ['es-CL', 'Chile'],
                     ['es-CO', 'Colombia'],
                     ['es-CR', 'Costa Rica'],
                     ['es-EC', 'Ecuador'],
                     ['es-SV', 'El Salvador'],
                     ['es-ES', 'España'],
                     ['es-US', 'Estados Unidos'],
                     ['es-GT', 'Guatemala'],
                     ['es-HN', 'Honduras'],
                     ['es-MX', 'México'],
                     ['es-NI', 'Nicaragua'],
                     ['es-PA', 'Panamá'],
                     ['es-PY', 'Paraguay'],
                     ['es-PE', 'Perú'],
                     ['es-PR', 'Puerto Rico'],
                     ['es-DO', 'República Dominicana'],
                     ['es-UY', 'Uruguay'],
                     ['es-VE', 'Venezuela']],
 ['Euskara',         ['eu-ES']],
 ['Filipino',        ['fil-PH']],
 ['Français',        ['fr-FR']],
 ['Basa Jawa',       ['jv-ID']],
 ['Galego',          ['gl-ES']],
 ['ગુજરાતી',           	 ['gu-IN']],
 ['Hrvatski',        ['hr-HR']],
 ['IsiZulu',         ['zu-ZA']],
 ['Íslenska',        ['is-IS']],
 ['Italiano',        ['it-IT', 'Italia'],
                     ['it-CH', 'Svizzera']],
 ['ಕನ್ನಡ',              ['kn-IN']],
 ['ភាសាខ្មែរ',            ['km-KH']],
 ['Latviešu',        ['lv-LV']],
 ['Lietuvių',        ['lt-LT']],
 ['മലയാളം',           ['ml-IN']],
 ['मराठी',               ['mr-IN']],
 ['Magyar',          ['hu-HU']],
 ['ລາວ',              ['lo-LA']],
 ['Nederlands',      ['nl-NL']],
 ['नेपाली भाषा',        	 ['ne-NP']],
 ['Norsk bokmål',    ['nb-NO']],
 ['Polski',          ['pl-PL']],
 ['Português',       ['pt-BR', 'Brasil'],
                     ['pt-PT', 'Portugal']],
 ['Română',          ['ro-RO']],
 ['සිංහල',          	 ['si-LK']],
 ['Slovenščina',     ['sl-SI']],
 ['Basa Sunda',      ['su-ID']],
 ['Slovenčina',      ['sk-SK']],
 ['Suomi',           ['fi-FI']],
 ['Svenska',         ['sv-SE']],
 ['Kiswahili',       ['sw-TZ', 'Tanzania'],
                     ['sw-KE', 'Kenya']],
 ['ქართული',         ['ka-GE']],
 ['Հայերեն',         ['hy-AM']],
 ['தமிழ்',              ['ta-IN', 'இந்தியா'],
                     ['ta-SG', 'சிங்கப்பூர்'],
                     ['ta-LK', 'இலங்கை'],
                     ['ta-MY', 'மலேசியா']],
 ['తెలుగు',             ['te-IN']],
 ['Tiếng Việt',      ['vi-VN']],
 ['Türkçe',          ['tr-TR']],
 ['اُردُو',            ['ur-PK', 'پاکستان'],
                     ['ur-IN', 'بھارت']],
 ['Ελληνικά',        ['el-GR']],
 ['български',       ['bg-BG']],
 ['Pусский',         ['ru-RU']],
 ['Српски',          ['sr-RS']],
 ['Українська',      ['uk-UA']],
 ['한국어',            ['ko-KR']],
 ['中文',             ['cmn-Hans-CN', '普通话 (中国大陆)'],
                     ['cmn-Hans-HK', '普通话 (香港)'],
                     ['cmn-Hant-TW', '中文 (台灣)'],
                     ['yue-Hant-HK', '粵語 (香港)']],
 ['日本語',           ['ja-JP']],
 ['हिन्दी',               ['hi-IN']],
 ['ภาษาไทย',         	 ['th-TH']]];
