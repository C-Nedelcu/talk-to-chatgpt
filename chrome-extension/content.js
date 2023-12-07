// TALK TO CHATGPT
// ---------------
// Author		: C. NEDELCU
// Version		: 2.9.0 (03/12/2023)
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

// Indicate whether the bot should describe emojis out loud or say the word "emoji" instead or ignore them altogether
var CN_SPEAK_EMOJIS = true;

// Determine which word will cause this scrip to stop.
var CN_SAY_THIS_WORD_TO_STOP = "stop";

// Determine which word will cause this script to temporarily pause
var CN_SAY_THIS_WORD_TO_PAUSE = "pause";

// Do we keep listening even when paused, so that we can resume by a vocal command?
var CN_KEEP_LISTENING = true;

// Determine whether messages are sent immediately after speaing
var CN_AUTO_SEND_AFTER_SPEAKING = true;

// Determine whether commas should be ignored as sentence separators
var CN_IGNORE_COMMAS = false;

// Determine which word(s) will cause this script to send the current message (if auto-send disabled)
var CN_SAY_THIS_TO_SEND = "send message now";

// Indicate "locale-voice name" (the possible values are difficult to determine, you should just ignore this and use the settings menu instead)
var CN_WANTED_VOICE_NAME = "";

// Ignore code blocks - anything contained in <pre>
var CN_IGNORE_CODE_BLOCKS = false;

// Use ElevenLabs for TTS
var CN_TTS_ELEVENLABS = false;

// ElevenLabs API key
var CN_TTS_ELEVENLABS_APIKEY = "";

// ElevenLabs voice
var CN_TTS_ELEVENLABS_VOICE = "";

// Statically list ElevenLabs models (easier than to request from API)
var CN_TTS_ELEVENLABS_MODELS = {
	"eleven_monolingual_v1": "English only",
	"eleven_multilingual_v2": "Multi-language (autodetect) V2",
	"eleven_multilingual_v1": "Multi-language (autodetect) V1",
	"eleven_english_sts_v2": "Eleven English v2",
	"eleven_turbo_v2": "Eleven Turbo v2"
};

// Other ElevenLabs settings
var CN_TTS_ELEVENLABS_STABILITY = "";
var CN_TTS_ELEVENLABS_SIMILARITY = "";

// ----------------------------
var CN_TTS_AZURE = false; 
var CN_TTS_AZURE_APIKEY = "";
var CN_TTS_AZURE_REGION = "";
var CN_TTS_AZURE_VOICE = "";
var CN_TTS_AZURE_QUEUE = [];
var CN_IS_CONVERTING_AZURE = false;
var CN_IS_PLAYING_AZURE = false;

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
var CN_CONVERSATION_SUSPENDED = false;
var CN_BAR_COLOR_FLASH_GREY = false;
var CN_TTS_ELEVENLABS_QUEUE = [];
var CN_IS_CONVERTING = false;
var CN_ELEVENLABS_PLAYING = false;
var CN_ELEVENLABS_SOUND_INDEX = 0;

// reusable function to set the value of the status bar
function setStatusBarBackground(color) {
	$("#CNStatusBar").css("background", color);
}

// This function checks if a character is an emoji
function isEmoji(char) {
	const emojiRegExp =
		/\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu;
	return char.match(emojiRegExp);
}

// This function replaces emojis in a string with nothing
function ignoreEmojis(text) {
	let processedText = "";
	for (let char of text) {
		if (isEmoji(char)) {
			processedText += "";
		} else {
			processedText += char;
		}
	}
	console.log("Processed Text: " + processedText);
	return processedText;
}

// This function will say the given text out loud using the browser's speech synthesis API, or send the message to the ElevenLabs conversion stack
function CN_SayOutLoud(text) {
        // If TTS is disabled and there's nothing to say, ensure speech recognition is started
        if (!text || CN_SPEAKING_DISABLED) {
            if (CN_SPEECH_REC_SUPPORTED && CN_SPEECHREC && !CN_IS_LISTENING && !CN_PAUSED && !CN_SPEECHREC_DISABLED && !CN_IS_READING) {
                // Check if speech recognition is already running to avoid error
                try {
                    console.log("Attempting to start SpeechRecognition");
                    CN_SPEECHREC.start();
                    CN_IS_LISTENING = true; // Ensure this flag is set to true here
                } catch (error) {
                    console.error("Failed to start SpeechRecognition:", error);
                }
            } else {
                //console.log("Not starting SpeechRecognition because CN_IS_LISTENING is", CN_IS_LISTENING);
            }
            clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
            CN_TIMEOUT_KEEP_SPEECHREC_WORKING = setTimeout(CN_KeepSpeechRecWorking, 100);
            return;
        }

        // If we are about to speak, stop speech recognition
        if (CN_SPEECHREC && text && !CN_SPEAKING_DISABLED) {
            clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
            console.log("Stopping SpeechRecognition");
            CN_SPEECHREC.stop();
            CN_IS_LISTENING = false; // Ensure this flag is set to false here
        }

	// What is the TTS method?
	if (CN_TTS_ELEVENLABS) {
		// We are using ElevenLabs, so push message to queue
		CN_SayOutLoudElevenLabs(text);
		return;
	}

	if (CN_TTS_AZURE) {
		// console.log("[AZURE] Saying out loud: " + text);
		CN_SayOutLoudAzure(text); // Implement this function to use Azure TTS
		return;
	}
	
	// Let's speak out loud with the browser's text-to-speech API
	console.log("[BROWSER] Saying out loud: " + text);
	var msg = new SpeechSynthesisUtterance();
	msg.text = text;
	
	if (CN_WANTED_VOICE) msg.voice = CN_WANTED_VOICE;
	msg.rate = CN_TEXT_TO_SPEECH_RATE;
	msg.pitch = CN_TEXT_TO_SPEECH_PITCH;
	msg.onstart = () => {
		// Make border green
		setStatusBarBackground("green");
		
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

// Function to perform text-to-speech using Azure
function CN_SayOutLoudAzure(text) {

	// Make border green
	setStatusBarBackground("green");

	 // Add the text to the queue
	 CN_TTS_AZURE_QUEUE.push({
        text: text,
        audio: null,
        converted: false,
        played: false
    });

    // If the TTS conversion task isn't running, run it
    if (!CN_IS_CONVERTING_AZURE) {
        processAzureTTSQueue();
    }
}


// Function to process the next item in the queue
async function processAzureTTSQueue() {
    if (CN_TTS_AZURE_QUEUE.length === 0) {
        // No more items in the queue
        return;
    }

    // Identify next message to be converted
    let obj = null;
    let objIndex = null;
    for(let i in CN_TTS_AZURE_QUEUE) {
        if (!CN_TTS_AZURE_QUEUE[i].converted) {
            obj = CN_TTS_AZURE_QUEUE[i];
            objIndex = i;
            break;
        }
    }

    // If we didn't find an object to convert, then we are done
    if (obj === null) {
        CN_IS_CONVERTING_AZURE = false;
        return;
    }

    // Start converting TTS
    CN_IS_CONVERTING_AZURE = true;

	let lang, gender, name;
	// console.log("CN_TTS_AZURE_VOICE: " + CN_TTS_AZURE_VOICE);
	if (CN_TTS_AZURE_VOICE) {
		let parts = CN_TTS_AZURE_VOICE.split(", ");
		lang = parts[0];
		gender = parts[1];
		name = parts[2];
	} else {
		// Default values
		lang = 'en-US';
		gender = 'Male';
		name = 'en-US-TonyNeural';
	}
	
	// Create the request body
	const body = `<speak version='1.0' xml:lang='${lang}'><voice xml:lang='${lang}' xml:gender='${gender}' name='${name}'>${obj.text}</voice></speak>`;
	 // Send the request
	 const response = await fetch(`https://${CN_TTS_AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
            'Ocp-Apim-Subscription-Key': CN_TTS_AZURE_APIKEY,
            'User-Agent': 'your_resource_name'
        },
        body: body
    });


	const audioData = await response.arrayBuffer();

    // The response is the audio data in a binary format
    // Use the Web Audio API to play the audio data
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const buffer = await audioContext.decodeAudioData(audioData);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);

    // Save the audio source to the queue
    CN_TTS_AZURE_QUEUE[objIndex].audio = source;
    CN_TTS_AZURE_QUEUE[objIndex].converted = true;

    // Start audio playback if not already
    if (!CN_IS_PLAYING_AZURE) {
        processAzurePlaybackQueue();
    }

    // Continue conversions if any
    processAzureTTSQueue();


}




// Process the next item in the audio queue
function processAzurePlaybackQueue() {
    // Identify next message to be played
    var obj = null;
    var objIndex = null;
    for (var i in CN_TTS_AZURE_QUEUE) {
        if (CN_TTS_AZURE_QUEUE[i].converted && !CN_TTS_AZURE_QUEUE[i].played) {
            obj = CN_TTS_AZURE_QUEUE[i];
            objIndex = i;
            break;
        }
    }

    // If we didn't find an object to play, then we are done
    if (obj === null) {
        // If there are no more sentences left in the queue, call CN_AfterSpeakOutLoudFinished
        if (!CN_TTS_AZURE_QUEUE.some(item => !item.played)) {
            CN_AfterSpeakOutLoudFinished();
        }
        return;
    }

    // Play and set on-ended function
    CN_IS_PLAYING_AZURE = true;
    obj.audio.start(0);
    obj.audio.onended = function() {
        // Mark as played so it doesn't play twice
        CN_TTS_AZURE_QUEUE[objIndex].played = true;

        // What's next?
        CN_IS_PLAYING_AZURE = false;
		// setStatusBarBackground("red"); // Set status bar color to red when a text finishes playing
        processAzurePlaybackQueue();
    };
}

function getAzureVoices(apikey, region) {
	if (!region) return;
	if (!apikey) return;
	
    // Define the endpoint
    var endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`;

    // Define the request options
    var options = {
        method: "GET",
        headers: {
            "Ocp-Apim-Subscription-Key": apikey,
            "Content-Type": "application/x-www-form-urlencoded"
        }
    };

    // Make the request and return the promise
    return fetch(endpoint, options)
        .then(response => response.json())
		.then(data => data.map(voice => {
			// Extract the language, gender, and name
			let lang = voice.Locale;
			let gender = voice.Gender;
			let name = voice.ShortName;
			return {lang: lang, gender: gender, name: name};
            // return {name: name, id: name};
        }))
		.catch(error => alert("Error: " + error));
}


// Say a message out loud using ElevenLabs
function CN_SayOutLoudElevenLabs(text) {
	// Make border green
	setStatusBarBackground("green");
	
	// Push message into queue (sequentially)
	CN_TTS_ELEVENLABS_QUEUE.push({
		index: CN_TTS_ELEVENLABS_QUEUE.length, // message index
		text: text, // message text
		audio: null, // message blob / audio URL to be played
		converted: false, // has it been converted to audio yet?
		played: false // has it been played yet?
	});
	
	// If the TTS conversion task isn't running, run it
	if (!CN_IS_CONVERTING) CN_ConvertTTSElevenLabs();
}

// Process next item in conversion queue
function CN_ConvertTTSElevenLabs() {
	// Start converting TTS
	CN_IS_CONVERTING = true;
	
	// Identify next message to be converted
	var obj = null;
	var objIndex = null;
	for(var i in CN_TTS_ELEVENLABS_QUEUE) {
		if (!CN_TTS_ELEVENLABS_QUEUE[i].converted) {
			obj = CN_TTS_ELEVENLABS_QUEUE[i];
			objIndex = i;
			break;
		}
	}
	
	// If we didn't find an object to convert, then we are done
	if (obj === null) {
		CN_IS_CONVERTING = false;
		return;
	}
	
	// Get model and voice ID
	var parts = CN_TTS_ELEVENLABS_VOICE.split(".");
	var model = parts[0];
	var voiceId = typeof parts[1] == "undefined" ? "" : parts[1];
	
	// Tell the console for debugging
	console.log("[ELEVENLABS] Converting following text segment to audio using model " + model + " and voice " + voiceId + ": " + obj.text);
	
	// We found an object to convert
	// Prepare request and headers
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "https://api.elevenlabs.io/v1/text-to-speech/" + voiceId);
	xhr.setRequestHeader("Accept", "audio/mpeg");
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.setRequestHeader("xi-api-key", CN_TTS_ELEVENLABS_APIKEY)
	xhr.responseType = "arraybuffer";
	
	// Prepare request body
	var body = {
		text: obj.text,
		model_id: model,
	};
	
	// Set voice settings
	if (CN_TTS_ELEVENLABS_STABILITY != "" || CN_TTS_ELEVENLABS_SIMILARITY != "") {
		// Prepare voice settings
		var voice_settings = {
			"stability": 0,
			"similarity_boost": 0
		};
		try {
			voice_settings["stability"] = parseFloat(CN_TTS_ELEVENLABS_STABILITY);
			voice_settings["similarity_boost"] = parseFloat(CN_TTS_ELEVENLABS_SIMILARITY);
		} catch (e) {
			voice_settings = {
				"stability": 0,
				"similarity_boost": 0
			};
		}
		
		// Control values
		if (voice_settings["stability"] === null || voice_settings["stability"] < 0 || voice_settings["stability"] > 1 || isNaN(voice_settings["stability"])) voice_settings["stability"] = 0;
		if (voice_settings["similarity_boost"] === null || voice_settings["similarity_boost"] < 0 || voice_settings["similarity_boost"] > 1 || isNaN(voice_settings["similarity_boost"])) voice_settings["similarity_boost"] = 0;
		
		// Set values into body
		body["voice_settings"] = voice_settings;
	}
	
	// What happens when we get the response
	xhr.onreadystatechange = function () {
		if (xhr.readyState === XMLHttpRequest.DONE) {
			
			try {
				var status = xhr.status;
				//console.log("Received status from ElevenLabs: "+ status);
				
				// Read response and see what's inside
				var resp = this.response;
				
				// Was there an error?
				try {
					if (status !== 200) {
						// Decode the arrayBuffer into text
						var decoder = new TextDecoder('utf-8');
						var responseText = decoder.decode(resp);
						
						// Parse the JSON data
						var result = JSON.parse(responseText);
						
						// Problem?
						if (typeof result.detail != "undefined" && typeof result.detail.status != "undefined") {
							// Error! But what is it?
							if (result.detail.status == "too_many_concurrent_requests") {
								// Try again after 1 second
								setTimeout(function () {
									console.log("[ELEVENLABS] Too many concurrent requests, waiting a bit");
									CN_ConvertTTSElevenLabs();
								}, 500);
								return;
							} else {
								// Show error and stop everything
								CN_IS_CONVERTING = false;
								CN_IS_READING = false;
								CN_TTS_ELEVENLABS_QUEUE = [];
								alert("[1] ElevenLabs API error: " + result.detail.message);
								CN_AfterSpeakOutLoudFinished();
								return;
							}
						}
						else {
							CN_IS_CONVERTING = false;
							CN_IS_READING = false;
							CN_TTS_ELEVENLABS_QUEUE = [];
							alert("[2] ElevenLabs API error: " + responseText);
							CN_AfterSpeakOutLoudFinished();
							return;
						}
					}
				} catch (e) {
					CN_IS_CONVERTING = false;
					CN_IS_READING = false;
					CN_TTS_ELEVENLABS_QUEUE = [];
					alert("[3] ElevenLabs API error: " + e.toString());
					CN_AfterSpeakOutLoudFinished();
					return;
				}
				
				// No error. So we have blob data, we can make an audio file
				var blob = new Blob([resp], {"type": "audio/mpeg"});
				var audioURL = window.URL.createObjectURL(blob);
				
				// Has the queue been reset? (if we clicked Skip, or if we stopped audio playback)
				if (CN_TTS_ELEVENLABS_QUEUE.length == 0) return;
				
				// Put into queue
				CN_TTS_ELEVENLABS_QUEUE[objIndex].audio = audioURL;
				CN_TTS_ELEVENLABS_QUEUE[objIndex].converted = true;
				
				// What's next?
				setTimeout(function() {
					// Start audio playback if not already
					CN_ContinueElevenLabsPlaybackQueue("after-conversion");
					
					// Continue conversions if any
					CN_ConvertTTSElevenLabs();
				}, 100);
				
				
			} catch (e) {
				alert("Error with ElevenLabs API text-to-speech conversion: " + e.toString());
			}
		}
	};
	
	// Sending to TTS API
	xhr.send(JSON.stringify(body));
}

// Process the next item in the audio queue
function CN_ContinueElevenLabsPlaybackQueue(situation) {
	// Currently playing? ignore, try again later
	if (CN_ELEVENLABS_PLAYING) {
		setTimeout(function() {
			CN_ContinueElevenLabsPlaybackQueue("try-again");
		}, 100);
		return;
	}
	
	// Identify next message to be played
	var obj = null;
	var objIndex = null;
	var hasPendingConversion = false;
	for (var i in CN_TTS_ELEVENLABS_QUEUE) {
		if (CN_TTS_ELEVENLABS_QUEUE[i].converted && !CN_TTS_ELEVENLABS_QUEUE[i].played) {
			obj = CN_TTS_ELEVENLABS_QUEUE[i];
			objIndex = i;
			break;
		}
		if (!CN_TTS_ELEVENLABS_QUEUE[i].converted) {
			hasPendingConversion = true;
		}
	}
	
	// If we didn't find an object to play, then we are done
	if (obj === null) {
		// Anything that needs converting?
		if (hasPendingConversion) {
			setTimeout(function() {
				CN_ContinueElevenLabsPlaybackQueue("pending-conversion");
			}, 100);
			return;
		}
		
		// Current audio stack complete
		console.log("[ELEVENLABS] Current stack of audio messages complete");
		
		// If there is no longer anything to convert or to play, we can resume listening
		var canResumeListening = true;
		for(var i in CN_TTS_ELEVENLABS_QUEUE) {
			if (!CN_TTS_ELEVENLABS_QUEUE[i].played || !CN_TTS_ELEVENLABS_QUEUE[i].converted) {
				canResumeListening = false;
				break;
			}
		}
		
		// Finished playing
		if (canResumeListening) {
			setTimeout(function () {
				CN_AfterSpeakOutLoudFinished();
			}, 150);
		}
		
		return;
	}
	
	
	// Play and set on-ended function
	console.log("[ELEVENLABS] [situation: " + situation + "] Playback of message " + objIndex + ": " + obj.text);
	CN_ELEVENLABS_PLAYING = true;
	CN_PlaySound(obj.audio, "elevenlabs", obj.text);
	
	// Mark as played so it doesn't play twice
	CN_TTS_ELEVENLABS_QUEUE[objIndex].played = true;
	CN_TTS_ELEVENLABS_QUEUE[objIndex].audio = null; // Erase audio from memory*/
}



// Occurs when speaking out loud is finished
function CN_AfterSpeakOutLoudFinished() {
	if (CN_SPEECHREC_DISABLED) return;
	
	// Make border grey again
	setStatusBarBackground("grey");
	
	if (CN_FINISHED) return;
	
	// Finished speaking
	clearTimeout(CN_TIMEOUT_KEEP_SYNTHESIS_WORKING);
	console.log("[BROWSER] Finished speaking out loud");
	
	// restart listening
	CN_IS_READING = false;
	setTimeout(function() {
		if (!window.speechSynthesis.speaking) {
			if (CN_SPEECH_REC_SUPPORTED && CN_SPEECHREC && !CN_IS_LISTENING && !CN_PAUSED && !CN_SPEECHREC_DISABLED && !CN_IS_READING) {
				try {
					CN_SPEECHREC.start();
				} catch(e) {
					// Already started ? Ignore
				}
			}
			clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
			CN_TIMEOUT_KEEP_SPEECHREC_WORKING = setTimeout(CN_KeepSpeechRecWorking, 100);
		}
	}, 250);
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

	// Preprocess text to remove emojis if needed
	if (!CN_SPEAK_EMOJIS) {
		text = ignoreEmojis(text);
	}
	var sentences = [];
	var currentSentence = "";

	// Use temporary placeholders to prevent splitting inside numbers
	text = text.replace(/(\d),(\d)/g, '$1†$2');
	text = text.replace(/(\d)\.(\d)/g, '$1‡$2');

	for (var i = 0; i < text.length; i++) {
		var currentChar = text[i];

		// Add character to current sentence
		currentSentence += currentChar;

		// is the current character a delimiter? if so, add current part to array and clear
		if (
			// Latin punctuation
			currentChar == (CN_IGNORE_COMMAS ? '.' : ',') ||
			currentChar == (CN_IGNORE_COMMAS ? '.' : ':') ||
			currentChar == '.' ||
			currentChar == '!' ||
			currentChar == '?' ||
			currentChar == (CN_IGNORE_COMMAS ? '.' : ';') ||
			currentChar == '…' ||
			// Chinese/Japanese punctuation
			currentChar == (CN_IGNORE_COMMAS ? '.' : '、') ||
			currentChar == (CN_IGNORE_COMMAS ? '.' : '，') ||
			currentChar == '。' ||
			currentChar == '．' ||
			currentChar == '！' ||
			currentChar == '？' ||
			currentChar == (CN_IGNORE_COMMAS ? '.' : '；') ||
			currentChar == (CN_IGNORE_COMMAS ? '.' : '：')
		) {
			// when the text is a part such as "It is 3." (-> "It is 3.14"), should not split
			// when text[i] is a dot comma, and text[i-1] and text[i+1] are numbers, then it is a decimal number, so continue
			// but text[i+1] is " ", then it is not a decimal number, so not continue

			if (i > 0 && i < text.length - 1) {
				// when this conditions include  && text[i + 1] !== " ", "It is 3.14, however," will be split into "It is 3.14," and "however,"
				if (currentChar == (CN_IGNORE_COMMAS ? '.' : ',') && !isNaN(text[i - 1]) && !isNaN(text[i + 1])) {
					//console.log("PASSING NOW")
					continue;
				}
			}
			if (currentSentence.trim() !== "") {
				// Replace placeholders back to original strings
				currentSentence = currentSentence.replace(/†/g, ',').replace(/‡/g, '.');
				sentences.push(currentSentence.trim());
			}
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
		console.log("New message detected! current message count: " + currentMessageCount);
		CN_MESSAGE_COUNT = currentMessageCount;
		CN_CURRENT_MESSAGE = jQuery(".text-base:last").find(".items-start");
		CN_CURRENT_MESSAGE_SENTENCES = []; // Reset list of parts already spoken
		CN_CURRENT_MESSAGE_SENTENCES_NEXT_READ = 0;
	}
	
	// Split current message into parts
	if (CN_CURRENT_MESSAGE && CN_CURRENT_MESSAGE.length) {
		var currentText = jQuery(".text-base:last").find(".items-start").text()+"";
		////console.log("currentText:" + currentText);
		
		// Remove code blocks?
		if (CN_IGNORE_CODE_BLOCKS) {
			currentText = jQuery(".text-base:last").find(".items-start").find(".markdown").contents().not("pre").text();
			////console.log("[CODE] currentText:" + currentText);
		}
		
		var newSentences = CN_SplitIntoSentences(currentText);
		if (newSentences != null && newSentences.length != CN_CURRENT_MESSAGE_SENTENCES.length) {
			////console.log("[NEW SENTENCES] newSentences:" + newSentences.length);
			
			// There is a new part of a sentence!
			var nextRead = CN_CURRENT_MESSAGE_SENTENCES_NEXT_READ;
			for (let i = nextRead; i < newSentences.length; i++) {
				CN_CURRENT_MESSAGE_SENTENCES_NEXT_READ = i+1;

				var lastPart = newSentences[i];
				////console.log("Will say sentence out loud: "+lastPart);
				CN_SayOutLoud(lastPart);
			}
			CN_CURRENT_MESSAGE_SENTENCES = newSentences;
		}
	}
	
	setTimeout(CN_CheckNewMessages, 100);
}

// Send a message to the bot (will simply put text in the textarea and simulate a send button click)
function CN_SendMessage(text) {
        // Find the textarea within the specific class container
        var textarea = jQuery(".overflow-hidden textarea");

        // Ensure the textarea is found
        if (!textarea.length) {
                console.error("Textarea not found");
                return;
        }

        // Focus on the textarea and simulate typing
        textarea.focus();
        var existingText = textarea.val();
        var fullText = existingText ? existingText + " " + text : text;
        var event = new Event('input', { bubbles: true });
        textarea.val(fullText)[0].dispatchEvent(event);

        // Adjust the height of the textarea
        var rows = Math.ceil(fullText.length / 88);
        var height = rows * 24;
        textarea.css("height", height + "px");

        // Find the send button
        var sendButton = textarea.closest(".overflow-hidden").find("button[data-testid='send-button']");

        // Remove 'disabled' attribute and class, if present
        sendButton.removeAttr('disabled').removeClass('disabled');

        // Send the message, if autosend is enabled
        if (CN_AUTO_SEND_AFTER_SPEAKING) {
                sendButton[0].click();

                // Additional logic for speech recognition, if applicable
                if (CN_SPEECHREC) {
                        clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
                        CN_SPEECHREC.stop();
                }
        } else {
                // Continue speech recognition
                clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
                CN_TIMEOUT_KEEP_SPEECHREC_WORKING = setTimeout(CN_KeepSpeechRecWorking, 100);
        }
}

// Flash the red bar
function CN_FlashRedBar() {
	clearTimeout(CN_TIMEOUT_FLASHBAR);
	
	// Conversation no longer suspended?
	if (!CN_CONVERSATION_SUSPENDED) {
		return;
	}
	
	// Is it green? don't do anything
	if (CN_IS_READING) {
		// Ignore
	} else if (CN_BAR_COLOR_FLASH_GREY) {
		// Grey? switch to red
		setStatusBarBackground("red");
		CN_BAR_COLOR_FLASH_GREY = false;
	} else {
		// Anything else? switch to grey
		setStatusBarBackground("grey");
		CN_BAR_COLOR_FLASH_GREY = true;
	}
	
	// Set another timeout
	CN_TIMEOUT_FLASHBAR = setTimeout(function () {
		CN_FlashRedBar();
	}, 500);
}

// Resume after suspension
function CN_ResumeAfterSuspension() {
	// Make a beep sound
	setTimeout(function () {
		// Credits: https://freesound.org/people/plasterbrain/sounds/419493/
		CN_PlaySound("data:audio/mpeg;base64,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OQAgKNwAUMrdjVn1//OEZAwMVMMuzzeyLxHJgoZeFqaKXlFPKH3UMEIXmJkbmIQPBAIr2eWTvwzssgYujuBheiNzev18A/vV3Uykchs5KYpgqPhuSTYDLClSJGqR76///U0oi4f/dkhmhs/9vb//////////9x9YDhAAgG0ww//XnAJD4T4sMIgNrH/1nBBpYAe8/smSK1LMKiaJlRsA4YHzothuz/b239X+ZFP/9ZASr/kf/89////2kPav/7UCA4AG4HH79MuS+HHL//OEZA0LqMEmKzeSPBKRhkweF06YToGhUdYqBxYqmGwIgqy6BYHYYDQiYHIphYALNgadtc7yGv/DPCNgAAiQEb4qAAwiizA9WA9kPgGXJgvmiD////of/y6e//////////T///oAVGoA/N+cFTtYMdQkDi8aFO26SVt0KgPmXUghAYBwAuNFabHLmv/+dsLLRLdVN0EDwa+DYnNBM1d1vvP///+d9vsgDgz//u+7/pUCALwAMAh/94V5RDbgICwA//OEZBAKoMEoLyuzLhW5hkmeFwSYFRljARjmBJeptYtO2rLlGRALmCgIsGh2mxyx7S/+9bmniU1cpUxgUKJjMOYLpFGJErHnX////R229bKHKKv////////rIQAwCyAbDtjc85A8YWOaOSBiQRphP7LqWedkCggwt3DDgXCAMy2HqW1S2pfrHWOVKXORGa6jyYHPR61vlrmuxql7////+/pqf0/aAjf6P/////27UcXSEhQeba6OwHOP+0xPswiC//OEZA8LbGsaBjRdBRNJglG+ByBcM15o02rHgw+BcDAklaxZghd8wQDA1XoozXCp44lXrb19b//WcsGQFFgDb1KcwMIg5aFhJx04hXqA+7/9dmQKu//1//////01//+uUSBAAIANsOAN4V6lPEGBiAKGB5oaTArBpbTXaSG1uGXUaAi04tNjlvLcs/+Z6rrtaZRvABRWYDSgDWMwX0E0P///tX9/raUm6v//9fVamiwBCuAYYAu/I84hTxhw05AC//N0ZBEK7MEivxe1OBMQ0lGWDvJqD5k85ZigASar9RmagNfAqEJgLGJiICCFLrS21ikyvUYhgYR8QURyACRAOkoULNEBLyKSf9Tf/+r7/W05///+39wr////vUEgBBfgAT+eAeFPLH7SxOr4ThSwHArEn9lVDBCO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");
	}, 50);
	
	// Finish alternating colors, reset to grey
	clearTimeout(CN_TIMEOUT_FLASHBAR);
	setStatusBarBackground("grey");
	
	// Hide suspend area
	jQuery("#CNSuspendedArea").hide();
	
	// Say OK and resume conversation
	CN_PAUSED = false;
	CN_CONVERSATION_SUSPENDED = false;
	
	// Stop speech rec
	try {
		if (CN_SPEECHREC) CN_SPEECHREC.stop();
	} catch (e) {
	}
	
	// Resume
	setTimeout(function() {
		// Restart
		CN_StartSpeechRecognition();
		
	}, 50);
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
		setStatusBarBackground("red");
		
		CN_IS_LISTENING = true;
		console.log("[SPEECH-REC] I'm listening");
	};
	CN_SPEECHREC.onend = () => {
		// Make border grey again
		setStatusBarBackground("grey");
		
		CN_IS_LISTENING = false;
		console.log("[SPEECH-REC] I've stopped listening");
	};
	CN_SPEECHREC.onerror = () => {
		CN_IS_LISTENING = false;
		console.log("[SPEECH-REC] Error while listening");
	};
	CN_SPEECHREC.onresult = (event) => {
		var final_transcript = "";
		for (let i = event.resultIndex; i < event.results.length; ++i) {
			if (event.results[i].isFinal)
				final_transcript += event.results[i][0].transcript;
		}
		
		console.log("[SPEECH-REC] Voice recognition transcript: '"+ (final_transcript)+"'");
		
		// Empty? https://github.com/C-Nedelcu/talk-to-chatgpt/issues/72
		if (final_transcript.trim() == "") {
			console.log("[SPEECH-REC] Empty sentence detected, ignoring");
			return;
		}
		
		if (CN_RemovePunctuation(final_transcript) == CN_SAY_THIS_WORD_TO_STOP.toLowerCase().trim()) {
			
			if (CN_CONVERSATION_SUSPENDED) {
				console.log("[SPEECH-REC] Conversation is currently suspended, voice command ignored. Use the pause word to resume conversation.");
				return;
			}
			
			console.log("[SPEECH-REC] [STOP-WORD] You said '"+ CN_SAY_THIS_WORD_TO_STOP+"'. Conversation ended");
			CN_FINISHED = true;
			CN_PAUSED = false;
			CN_SPEECHREC.stop();
			CN_SayOutLoud("Bye bye");
			alert("Conversation ended. Click the Start button to resume");
			
			// Show start button, hide action buttons
			jQuery(".CNStartZone").show();
			jQuery(".CNActionButtons").hide();
			
			return;
		} else if (CN_RemovePunctuation(final_transcript) == CN_SAY_THIS_WORD_TO_PAUSE.toLowerCase().trim()
			|| // Below: allow to say the pause word twice
			CN_RemovePunctuation(final_transcript) == (CN_SAY_THIS_WORD_TO_PAUSE.toLowerCase().trim()+" "+ CN_SAY_THIS_WORD_TO_PAUSE.toLowerCase().trim())
		) {
			
			// Conversation was suspended: resume it
			if (CN_CONVERSATION_SUSPENDED) {
				console.log("[SPEECH-REC] [PAUSE-WORD] You said '" + CN_SAY_THIS_WORD_TO_PAUSE + "' - Conversation resumed");
				CN_ResumeAfterSuspension();
				return;
			}
			
			// Conversation wasn't suspended;
			console.log("[SPEECH-REC] [PAUSE-WORD] You said '"+ CN_SAY_THIS_WORD_TO_PAUSE+"' - Conversation paused");
			
			// Make a beep sound
			setTimeout(function() {
				// Credits: https://freesound.org/people/BeezleFM/sounds/512135/
				CN_PlaySound("data:audio/mpeg;base64,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");
			}, 50);
			
			// Do we keep listening?
			if (CN_KEEP_LISTENING) {
				
				// Yes, don't stop mic, just stop conversation
				CN_CONVERSATION_SUSPENDED = true;
				CN_TIMEOUT_FLASHBAR = setTimeout(function() {
					CN_FlashRedBar();
				}, 500);
				
				// Show suspend area
				jQuery("#CNSuspendedArea").show();
				
				return;
				
			} else {
				// No, stop mic, resume when OK button is clicked
				console.log("[PAUSED] Conversation paused");
				CN_PAUSED = true;
				if (CN_SPEECHREC) CN_SPEECHREC.stop();
				alert("Conversation paused, the browser is no longer listening. Click OK to resume");
				CN_PAUSED = false;
				console.log("[UNPAUSED] Conversation resumed");
			}
			
			return;
		} else if (CN_RemovePunctuation(final_transcript) == CN_SAY_THIS_TO_SEND.toLowerCase().trim() && !CN_AUTO_SEND_AFTER_SPEAKING) {
			
			if (CN_CONVERSATION_SUSPENDED) {
				console.log("[SEND-WORD] [SUSPENDED] Conversation is currently suspended, voice command ignored. Use the pause word to resume conversation.");
				return;
			}
			
			console.log("[SEND-WORD] You said '"+ CN_SAY_THIS_TO_SEND+"' - the message will be sent");
			
			// Click button
			jQuery("#prompt-textarea").closest("div").find("button:last").click();
		
			// Stop speech recognition until the answer is received
			if (CN_SPEECHREC) {
				clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
				CN_SPEECHREC.stop();
			}
			
			return;
		}
		
		// Are we speaking?
		if (CN_CONVERSATION_SUSPENDED) {
			console.log("[IGNORED] Conversation is currently suspended, voice command ignored. Use the pause word to resume conversation.");
			return;
		}
		
		// Send the message
		CN_SendMessage(final_transcript);
	};
	if (!CN_IS_LISTENING && CN_SPEECH_REC_SUPPORTED && !CN_SPEECHREC_DISABLED && !CN_IS_READING) {
		try {
			CN_SPEECHREC.start();
		} catch (e) {
			// Already started ? Ignore
		}
	}
	clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
	CN_TIMEOUT_KEEP_SPEECHREC_WORKING = setTimeout(CN_KeepSpeechRecWorking, 100);
}

// Make sure the speech recognition is turned on when the bot is not speaking
function CN_KeepSpeechRecWorking() {
	if (CN_FINISHED) return; // Conversation finished
	clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
	CN_TIMEOUT_KEEP_SPEECHREC_WORKING = setTimeout(CN_KeepSpeechRecWorking, 100);
	if (!CN_IS_READING && !CN_IS_LISTENING && !CN_PAUSED) {
		if (!CN_SPEECHREC && !CN_IS_READING)
			CN_StartSpeechRecognition();
		else {
			if (!CN_IS_LISTENING) {
				try {
					if (CN_SPEECH_REC_SUPPORTED && !window.speechSynthesis.speaking && !CN_SPEECHREC_DISABLED && !CN_IS_READING)
						CN_SPEECHREC.start();
				} catch(e) { }
			}
		}
	}
}

// Function definitions for different button actions
const buttonActions = {
	settings: CN_OnSettingsIconClick,
	micon: function() { toggleMicrophone(this, 'micoff', true); },
	micoff: function() { toggleMicrophone(this, 'micon', false); },
	speakon: function() { toggleSpeaking(this, 'speakoff', true); },
	speakoff: function() { toggleSpeaking(this, 'speakon', false); },
	skip: skipMessage
  };
  
  // Toggle button clicks: settings, pause, skip...
  function CN_ToggleButtonClick() {
	const action = $(this).data("cn");
	const handler = buttonActions[action];
	if (handler) handler.call(this);
  }
  
  function toggleMicrophone(element, targetIcon, isDisabled) {
	$(element).css("display", "none");
	$(`.CNToggle[data-cn=${targetIcon}]`).css("display", "");
  
	CN_SPEECHREC_DISABLED = isDisabled;
  
	if (CN_SPEECHREC && CN_IS_LISTENING) {
	  CN_SPEECHREC.stop();
	}
  
	if (!isDisabled && CN_SPEECHREC && !CN_IS_LISTENING && !CN_IS_READING) {
	  try {
		CN_SPEECHREC.start();
	  } catch (e) {
		// Handle error, if needed
	  }
	}
  }
  
  function toggleSpeaking(element, targetIcon, isDisabled) {
	$(element).css("display", "none");
	$(`.CNToggle[data-cn=${targetIcon}]`).css("display", "");
  
	CN_SPEAKING_DISABLED = isDisabled;
	clearAndStopReading();
  }
  
  function skipMessage() {
	clearAndStopReading();
  
	if (!CN_SPEECHREC_DISABLED) {
	  setTimeout(() => {
		CN_AfterSpeakOutLoudFinished();
	  }, 100);
	}
  }
  
  function clearAndStopReading() {
	if (CN_TTS_ELEVENLABS_QUEUE.length) {
	  CN_TTS_ELEVENLABS_QUEUE = [];
	  if (CN_ELEVENLABS_PLAYING) CN_PlaySound("", "", "stop");
	  CN_ELEVENLABS_PLAYING = false;
	  CN_IS_READING = false;
	  CN_IS_CONVERTING = false;
	}
  
	try {
	  window.speechSynthesis.pause();
	  window.speechSynthesis.cancel();
	} catch(e) {
	  // Handle error, if needed
	}
  
	CN_CURRENT_MESSAGE = null;
  }

// Declare descriptor caches and textarea element outside of any function to cache them.
let textareaDescriptorCache = null;
let prototypeDescriptorCache = null;
const textarea = jQuery("#prompt-textarea")[0];

// Moved setNativeValue out of CN_SetTextareaValue to avoid re-defining it.
function setNativeValue(element, value) {
  if (!textareaDescriptorCache || !prototypeDescriptorCache) {
    textareaDescriptorCache = Object.getOwnPropertyDescriptor(element, 'value') || {};
    const prototype = Object.getPrototypeOf(element);
    prototypeDescriptorCache = Object.getOwnPropertyDescriptor(prototype, 'value') || {};
  }

  const { set: valueSetter } = textareaDescriptorCache;
  const { set: prototypeValueSetter } = prototypeDescriptorCache;

  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else if (valueSetter) {
    valueSetter.call(element, value);
  } else {
    throw new Error('The given element does not have a value setter');
  }
}

// The main function that sets the textarea value and triggers an input event
function CN_SetTextareaValue(text) {
  setNativeValue(textarea, text);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}


function CN_PlaySound(audioData, onEnded, transcript) {
	//console.log("PlaySound - "+onEnded);
	chrome.runtime.sendMessage({
		type: "playSound",
		target: 'offscreen',
		data: {
			"audio": audioData,
			"onEnded": typeof onEnded == "undefined" ? "" : onEnded,
			"transcript": transcript,
			"messageId" : CN_ELEVENLABS_SOUND_INDEX
		}
	});
	CN_ELEVENLABS_SOUND_INDEX++;
}

// Before starting - the first time...
function CN_StartTTGPT_Prompt() {
	// Have we seen this message before?
	var TTGPT_PROMPT_ALREADY_SHOWN = "shown4";
	try {
		TTGPT_PROMPT_ALREADY_SHOWN = localStorage.getItem("TTGPT_PROMPT_ALREADY_SHOWN");
	} catch(e) {
	}
	
	// Already shown prompt before?
	if (TTGPT_PROMPT_ALREADY_SHOWN == "shown4") {
		// Start right away
		CN_StartTTGPT();
	}
	else {
		// Never shown before. Show prompt
		if (confirm("TALK-TO-CHATGPT - COMPATIBILITY INFO - PLEASE NOTE:\n" +
			"1) This extension will only work properly in Google Chrome Desktop or Microsoft Edge Desktop. " +
			"It will NOT work on Brave, Opera, or mobile browsers. " +
			"That's because it requires specific APIs/mechanisms which are NOT available in most browsers, " +
			"(including Chromium-based browsers such as Brave or Opera!).\n" +
			"2) You may need to tweak the settings and select the proper language and options to obtain the desired result.\n" +
			"3) If you try this in any other browser, and that it happens to work properly, feel free to drop us a message and we will update this list :-)\n" +
			"This message will not appear again. Enjoy!"
		)) {
			try {
				localStorage.setItem("TTGPT_PROMPT_ALREADY_SHOWN", "shown4");
			} catch(e) { }
			
			// Do start
			CN_StartTTGPT();
		}
	}
}

// Start Talk-to-ChatGPT (Start button)
function CN_StartTTGPT() {
	// Add listener for ElevenLabs
	chrome.runtime.onMessage.addListener(
		function (message) {
			if (message.type === "continueElevenLabs") {
				// The audio player is telling us it's finished playing and wants to continue
				CN_ELEVENLABS_PLAYING = false;
				CN_ContinueElevenLabsPlaybackQueue("after-playback");
			}
		}
	);
	
	// Play sound & start
	CN_PlaySound("data:audio/mpeg;base64,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");
	
	// Reset
	CN_FINISHED = false;
	
	// Hide start button, show action buttons
	jQuery(".CNStartZone").hide();
	jQuery(".CNActionButtons").show();
	
	setTimeout(function() {
		// Start speech rec
		CN_StartSpeechRecognition();
		
		// Make sure message count starts from last; we don't want to read the latest message
		var currentMessageCount = jQuery(".text-base").length;
		if (currentMessageCount > CN_MESSAGE_COUNT) {
			// New message!
			CN_MESSAGE_COUNT = currentMessageCount;
			CN_CURRENT_MESSAGE = null; // Set current message to null
		}
		
		// Check for new messages
		CN_CheckNewMessages();
	}, 150);
}

// Check we are on the correct page
function CN_CheckCorrectPage() {
	console.log("[STARTUP] Checking we are on the correct page...");
	var wrongPage = jQuery("#prompt-textarea").length === 0; // no textarea... login page?
	
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
	if (typeof jQuery === 'undefined') {
		jQuery = $;
	}
	
	var warning = "";
	if ('webkitSpeechRecognition' in window) {
		console.log("[STARTUP] Speech recognition API supported");
		CN_SPEECH_REC_SUPPORTED = true;
	} else {
		console.log("[STARTUP] Speech recognition API UNSUPPORTED");
		CN_SPEECH_REC_SUPPORTED = false;
		warning = "\n\nWARNING: speech recognition (speech-to-text) is only available in Chromium-based browsers - desktop version at the moment. If you are using another browser, you will not be able to dictate text, but you can still listen to the bot's responses.";
		alert(warning);
	}
	
	// Restore settings
	CN_RestoreSettings();
	
	// Wait on voices to be loaded before fetching list
	window.speechSynthesis.onvoiceschanged = function () {
		if (!CN_WANTED_VOICE_NAME){
			console.log("[STARTUP] Reading with default browser voice");
		} else {
			speechSynthesis.getVoices().forEach(function (voice) {
				//console.log("[STARTUP] Found matching voice: " + voice.name + " (" + voice.lang + ")");
				if (voice.lang + "-" + voice.name == CN_WANTED_VOICE_NAME) {
					CN_WANTED_VOICE = voice;
					console.log("[STARTUP] I will read using voice " + voice.name + " (" + voice.lang + ")");
					return false;
				}
			});
			if (!CN_WANTED_VOICE) console.log("[STARTUP] No voice found for '" + CN_WANTED_VOICE_NAME + "', reading with default browser voice");
		}
	};
	
	// Add icons on the top right corner
	jQuery("body").append(
		"<div style='position: fixed; top: 50px; right: 16px; display: inline-block; " +
			"background: #41464cDD; color: white; padding: 0; font-size: 14px; border-radius: 4px; text-align: center;" +
			"cursor: move; font-weight: bold; z-index: 1111;' id='TTGPTSettings'>" +
		
			// Logo / title
			"<div style='padding: 4px 30px; border-bottom: 1px solid grey;'>" +
				"<a href='https://github.com/C-Nedelcu/talk-to-chatgpt' " +
					"style='display: inline-block; font-size: 16px; line-height: 80%; padding: 4px 0;' " +
					"target=_blank title='Visit project website'>TALK-TO-ChatGPT<br />" +
					"<div style='text-align: right; font-size: 11px; color: grey'>V2.9.0</div>" +
				"</a>" +
			"</div>" +
			
			// Below logo
			"<div>" +
				
				// Start button
				"<div style='font-size: 14px; padding: 6px;' class='CNStartZone'>" +
					"<button style='border: 2px solid grey; padding: 3px 30px; margin: 4px; border-radius: 4px; opacity: 0.7;' id='CNStartButton' title='ALT+SHIFT+S'><i class=\"fa-solid fa-play\"></i>&nbsp;&nbsp;Start</button>"+
				"</div>"+
		
				// Action buttons
				"<div style='font-size: 16px; padding: 8px 4px; padding-bottom: 0px; display:none;' class='CNActionButtons'>" +
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
		
					// Pause bar - click button to resume
					"<div style='padding-top: 12px; padding-bottom: 12px; display: none;' id='CNSuspendedArea'>" +
						"<div style='font-size: 11px; color: grey;'><b>CONVERSATION PAUSED</b><br />Click button below or speak the pause word to resume</div>" +
						"<div style='padding: 10px;'>" +
							"<button style='font-size: 13px; border: 2px solid grey; padding: 6px 40px; margin: 6px; border-radius: 6px; opacity: 0.7;' id='CNResumeButton'><i class=\"fa-solid fa-play\"></i>&nbsp;&nbsp;RESUME</button>" +
						"</div>" +
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
		jQuery("#CNStartButton").on("click", CN_StartTTGPT_Prompt);
		jQuery("#CNResumeButton").on("click", CN_ResumeAfterSuspension);
		
		// Make icons change opacity on hover
		jQuery(".CNToggle, #CNStartButton, #CNResumeButton").on("mouseenter", function() { jQuery(this).css("opacity", 1); });
		jQuery(".CNToggle, #CNStartButton, #CNResumeButton").on("mouseleave", function() { jQuery(this).css("opacity", 0.7); });
		jQuery(document).on("mouseenter", ".TTGPTSave, .TTGPTCancel", function() { jQuery(this).css("opacity", 1); } );
		jQuery(document).on("mouseleave", ".TTGPTSave, .TTGPTCancel", function() { jQuery(this).css("opacity", 0.7); } );
		
		// Make TTGPTSettings draggable
		jQuery("#TTGPTSettings").mousedown(function(e) {
			window.my_dragging = {};
			my_dragging.pageX0 = e.pageX;
			my_dragging.pageY0 = e.pageY;
			my_dragging.elem = this;
			my_dragging.offset0 = $(this).offset();
			function handle_dragging(e) {
				var left = my_dragging.offset0.left + (e.pageX - my_dragging.pageX0);
				var top = my_dragging.offset0.top + (e.pageY - my_dragging.pageY0);
				jQuery(my_dragging.elem).css('right', '');
				jQuery(my_dragging.elem)
					.offset({top: top, left: left});
			}
			function handle_mouseup(e) {
				jQuery('body')
					.off('mousemove', handle_dragging)
					.off('mouseup', handle_mouseup);
			}
			jQuery('body')
				.on('mouseup', handle_mouseup)
				.on('mousemove', handle_dragging);
		});
	}, 100);
	
	// Start key detection
	jQuery(document).on('keydown', function (e) {
		// Conversation suspended? don't do anything
		if (CN_CONVERSATION_SUSPENDED) return;
		
		// ALT+SHIFT+S: Start
		if (e.altKey && e.shiftKey && e.which === 83) {
			console.log('[KEY] ALT+SHIFT+S pressed, starting Talk-To-ChatGPT');
			CN_StartTTGPT();
		}
		
		// ALT+SHIFT+H: Hush
		if (e.altKey && e.shiftKey && e.which === 72) {
			// Is the current mode 'micon' or 'micoff'?
			var wantMicOff = jQuery(".CNToggle[data-cn=micon]").css("display") == "none";
			if (wantMicOff) {
				// Turn off bot voice
				console.log('[KEY] ALT+SHIFT+H pressed, turning off speech recognition');
				jQuery(".CNToggle[data-cn=micoff]").click();
			} else {
				// Turn on bot voice
				console.log('[KEY] ALT+SHIFT+H pressed, turning on speech recognition');
				jQuery(".CNToggle[data-cn=micon]").click();
			}
		}
		
		// ALT+SHIFT+V: suspend bot Voice
		if (e.altKey && e.shiftKey && e.which === 86) {
			// Is the current mode 'speakon' or 'speakoff'?
			var wantSpeakOff = jQuery(".CNToggle[data-cn=speakon]").css("display") == "none";
			if (wantSpeakOff) {
				// Turn off bot voice
				console.log('[KEY] ALT+SHIFT+V pressed, turning bot voice off');
				jQuery(".CNToggle[data-cn=speakoff]").click();
			} else {
				// Turn on bot voice
				console.log('[KEY] ALT+SHIFT+V pressed, turning bot voice on');
				jQuery(".CNToggle[data-cn=speakon]").click();
			}
		}
		
		// ALT+SHIFT+L: skip current message
		if (e.altKey && e.shiftKey && e.which === 76) {
			console.log('[KEY] ALT+SHIFT+L pressed, skipping current message');
			jQuery(".CNToggle[data-cn=skip]").click();
		}
	});
}

// Open settings menu
function CN_OnSettingsIconClick() {
	console.log("[MENU] Opening settings menu");
	
	// Stop listening
	CN_PAUSED = true;
	if (CN_SPEECHREC) CN_SPEECHREC.stop();
	
	// A short text at the beginning
	var desc = "<div style='text-align: left; margin: 8px;'>" +
		"<a href='https://github.com/C-Nedelcu/talk-to-chatgpt/wiki/Status-page' target=_blank style='font-size: 16px; color: orange;'>If something doesn't appear to work, click here for status and troubleshooting</a>." +
		"<br />Thank you for not instantly posting a 1-star review on the extension store if something doesn't work as expected :-) This is a free program I do in my spare time and I appreciate constructive criticism. Make sure to tell me what's wrong and I will look into it." +
		"</div>";
	
	// Prepare settings row
	var rows = "<h2>Language and speech settings</h2>";
	rows += "<table width='100%' cellpadding=6 cellspacing=2 style='margin-top: 15px;'>";
	
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
	
	rows += "<tr class='CNBrowserTTS' id='CNBrowserTTS0'><td style='white-space: nowrap'>AI voice and language:</td><td><select id='TTGPTVoice' style='width: 250px; padding: 2px; color: black'>" + voices + "</select></td></tr>";
	
	// 2. AI talking speed
	rows += "<tr class='CNBrowserTTS' id='CNBrowserTTS1'><td style='white-space: nowrap'>AI talking speed (speech rate):</td><td><input type=number step='.1' id='TTGPTRate' style='color: black; padding: 2px; width: 100px;' value='" + CN_TEXT_TO_SPEECH_RATE + "' /></td></tr>";
	
	// 3. AI voice pitch
	rows += "<tr class='CNBrowserTTS' id='CNBrowserTTS2'><td style='white-space: nowrap'>AI voice pitch:</td><td><input type=number step='.1' id='TTGPTPitch' style='width: 100px; padding: 2px; color: black;' value='" + CN_TEXT_TO_SPEECH_PITCH + "' /></td></tr>";

	// 4. ElevenLabs
	rows += "<tr><td style='white-space: nowrap'>ElevenLabs text-to-speech:</td><td><input type=checkbox id='TTGPTElevenLabs' " + (CN_TTS_ELEVENLABS ? "checked=checked" : "") + " /> <label for='TTGPTElevenLabs'> Use ElevenLabs API for text-to-speech (tick this to reveal additional settings)</label></td></tr>";
	
	// 5. ElevenLabs API key
	rows += "<tr class='CNElevenLabs' style='display: none;'><td style='white-space: nowrap'>ElevenLabs API Key:</td><td><input type=text style='width: 250px; padding: 2px; color: black;' id='TTGPTElevenLabsKey' value=\"" + (CN_TTS_ELEVENLABS_APIKEY) + "\" /></td></tr>";
	
	// 6. ElevenLabs voice
	rows += "<tr class='CNElevenLabs' style='display: none;'><td style='white-space: nowrap'>ElevenLabs voice:</td><td><select id='TTGPTElevenLabsVoice' style='width: 250px; padding: 2px; color: black;' >" + "</select> <span style='cursor: pointer; text-decoration: underline;' id='TTGPTElevenLabsRefresh' title='This will refresh the list of voices using your API key'>Refresh list</span></span></td></tr>";
	
	// 7. ElevenLabs settings
	rows += "<tr class='CNElevenLabs' style='display: none;'><td style='white-space: nowrap'>ElevenLabs settings:</td>" +
		"<td>" +
		"Stability: <input type=number style='width: 100px; padding: 2px; color: black;' step='0.01' min='0' max='1' id='TTGPTElevenLabsStability' value=\"" + (CN_TTS_ELEVENLABS_STABILITY) + "\" />" +
		"Similarity: <input type=number style='width: 100px; padding: 2px; color: black;' step='0.01' min='0' max='1' id='TTGPTElevenLabsSimilarity' value=\"" + (CN_TTS_ELEVENLABS_SIMILARITY) + "\" />" +
		"<br />Leave blank for default, or set a number between 0 and 1 (example: 0.75)"
		"</td></tr>";
	
	// 7. ElevenLabs warning
	rows += "<tr class='CNElevenLabs' style='display: none;'><td colspan=2>Warning: the ElevenLabs API is experimental. It doesn't work with every language, make sure you check the list of supported language from their website. We will keep up with ElevenLabs progress to ensure all ElevenLabs API functionality is available in Talk-to-ChatGPT.</td></tr>";

	// Azure text-to-speech
	rows += "<tr><td style='white-space: nowrap'>Azure text-to-speech:</td><td><input type=checkbox id='TTGPTAzureTTS' " + (CN_TTS_AZURE ? "checked=checked" : "") + " /> <label for='TTGPTAzureTTS'> Use Azure API for text-to-speech (tick this to reveal additional settings)</label></td></tr>";

	// Azure voice with refresh button
	rows += "<tr class='CNAzureTTS' style='display: none;'><td style='white-space: nowrap'>Azure voice:</td><td><select id='TTGPTAzureVoice' style='width: 250px; padding: 2px; color: black;' ></select> <span style='cursor: pointer; text-decoration: underline;' id='TTGPTAzureRefresh' title='This will refresh the list of voices using your API key'>Refresh list</span></span></td></tr>";


	// Azure API Key
	rows += "<tr class='CNAzureTTS' style='display: none;'><td style='white-space: nowrap'>Azure API Key:</td><td><input type=text style='width: 250px; padding: 2px; color: black;' id='TTGPTAzureAPIKey' value=\"" + CN_TTS_AZURE_APIKEY + "\" /></td></tr>";

	// Azure Region
	rows += "<tr class='CNAzureTTS' style='display: none;'><td style='white-space: nowrap'>Azure Region:</td><td><input type=text style='width: 250px; padding: 2px; color: black;' id='TTGPTAzureRegion' value=\"" + CN_TTS_AZURE_REGION + "\" /></td></tr>";

	// Prepare save/close buttons
	rows += "<tr><td colspan=2 style='text-align: center'><br />" +
		"<button class='TTGPTSave' style='border: 2px solid grey; border-radius: 4px; padding: 6px 24px; font-size: 18px; font-weight: bold; opacity: 0.7;'>✓ Save</button>&nbsp;" +
		"<button class='TTGPTCancel' style='border: 2px solid grey; border-radius: 4px; padding: 6px 24px; margin-left: 40px; font-size: 18px; opacity: 0.7;'>✗ Cancel</button></td></tr></table>";
	
	// Header - vocal commands
	rows += "</table><br /><h2>Voice control</h2><b>PLEASE NOTE! </b> These commands only work when the microphone is actively listening / when the speech-to-text functionality is active (indicated by a red bar). "+
		"The system <i>cannot</i> listen to voice commands while the bot is speaking (green bar or grey bar) otherwise, it would be listening to itself and create an infinite feedback loop.<br />";
	rows += "<table width='100%' cellpadding=6 cellspacing=2 style='margin-top: 15px;'>";
	
	// 5. 'Stop' word
	rows += "<tr><td style='white-space: nowrap'>'Stop' word:</td><td><input type=text id='TTGPTStopWord' style='width: 100px; padding: 2px; color: black;' value='"+CN_SAY_THIS_WORD_TO_STOP+"' /></td></tr>";
	
	// 6. 'Pause' word
	rows += "<tr><td style='white-space: nowrap'>'Pause' word:</td><td><input type=text id='TTGPTPauseWord' style='width: 100px; padding: 2px; color: black;' value='"+CN_SAY_THIS_WORD_TO_PAUSE+"' /></td></tr>";

	// 7. Keep listening until resume
	rows += "<tr><td style='white-space: nowrap'>Keep listening when paused:</td><td><input type=checkbox id='TTGPTKeepListening' " + (CN_KEEP_LISTENING ? "checked=checked" : "") + " /> <label for='TTGPTKeepListening'>When paused, keep the microphone open, and resume conversation when the 'pause' word (defined above) is spoken</label></td></tr>";
	
	// 8. Autosend
	rows += "<tr><td style='white-space: nowrap'>Automatic send:</td><td><input type=checkbox id='TTGPTAutosend' "+(CN_AUTO_SEND_AFTER_SPEAKING?"checked=checked":"")+" /> <label for='TTGPTAutosend'>Automatically send message to ChatGPT after speaking</label></td></tr>";
	
	// 9. Manual send word
	rows += "<tr><td style='white-space: nowrap'>Manual send word(s):</td><td><input type=text id='TTGPTSendWord' style='width: 250px; padding: 2px; color: black;' value='" + CN_SAY_THIS_TO_SEND + "' /><span style='font-size: 10px;'>If 'automatic send' is disabled, you can trigger the sending of the message by saying this word (or sequence of words)</span></td></tr>";

	// Prepare save/close buttons
	rows += "<tr><td colspan=2 style='text-align: center'><br />" +
		"<button class='TTGPTSave' style='border: 2px solid grey; border-radius: 4px; padding: 6px 24px; font-size: 18px; font-weight: bold; opacity: 0.7;'>✓ Save</button>&nbsp;" +
		"<button class='TTGPTCancel' style='border: 2px solid grey; border-radius: 4px; padding: 6px 24px; margin-left: 40px; font-size: 18px; opacity: 0.7;'>✗ Cancel</button></td></tr></table>";
	
	// Header - advanced options
	rows += "</table><br /><h2>Advanced settings</h2>";
	rows += "<table width='100%' cellpadding=6 cellspacing=2 style='margin-top: 15px;'>";
	
	// 10. Split sentences with commas
	rows += "<tr><td style='white-space: nowrap'>Punctuation in sentences:</td><td><input type=checkbox id='TTGPTIgnoreCommas' " + (CN_IGNORE_COMMAS ? "checked=checked" : "") + " /> <label for='TTGPTIgnoreCommas'>Don't use commas/semicolons/etc. to break down replies into sentences</label></td></tr>";
	
	// 11. Ignore code blocks
	rows += "<tr><td style='white-space: nowrap'>Ignore code blocks:</td><td><input type=checkbox id='TTGPTIgnoreCode' " + (CN_IGNORE_CODE_BLOCKS ? "checked=checked" : "") + " /> <label for='TTGPTIgnoreCode'>Don't read blocks of code out loud (ignore them altogether)</label></td></tr>";
	
	// 12. AI Speak Emojis or not
	rows += "<tr><td style='white-space: nowrap'>AI Speak Emojis:</td><td><input type=checkbox id='TTGPTSpeakEmojis' " + (CN_SPEAK_EMOJIS ? "checked=checked" : "") + " /> <label for='TTGPTSpeakEmojis'> Allow the bot to describe emojis (e.g. 'smiling face with heart eyes')</label> <span style='font-size: 10px;'>This setting doesn't apply if you have the ElevenLabs text-to-speech enabled (ElevenLabs ignores emojis)</span></td></tr>";

	// Keyboard shortcuts
	rows += "<tr><td style='white-space: nowrap'>Keyboard shortcuts:</td><td><ul>" +
		"<li>ALT+SHIFT+S: <u>S</u>tart Talk-To-ChatGPT</li>" +
		"<li>ALT+SHIFT+H: suspend/resume speech recognition (<u>H</u>ush)</li>" +
		"<li>ALT+SHIFT+V: suspend/resume bot's voice (<u>V</u>oice)</li>" +
		"<li>ALT+SHIFT+L: skip current message (<u>L</u>eap)</li>" +
		"</ul></td></tr>";
	
	// Prepare save/close buttons
	rows += "<tr><td colspan=2 style='text-align: center'><br />" +
		"<button class='TTGPTSave' style='border: 2px solid grey; border-radius: 4px; padding: 6px 24px; font-size: 18px; font-weight: bold; opacity: 0.7;'>✓ Save</button>&nbsp;" +
		"<button class='TTGPTCancel' style='border: 2px solid grey; border-radius: 4px; padding: 6px 24px; margin-left: 40px; font-size: 18px; opacity: 0.7;'>✗ Cancel</button></td></tr></table>";
	
	// Add donations frame
	var donations = "<br/><h2>Support the project</h2><p style='font-size: 15px; margin-top: 15px;'>Are you enjoying Talk-To-ChatGPT and want me to continue improving it? \n" +
		"\t\t<b>You can help by making a donation to the project.</b> \n" +
		"\t\tPlease click the button below to proceed.</p><br />\n" +
		"\t\t<center><a target=_blank href='https://www.paypal.com/donate/?business=BZ43BM7XSSKKW&no_recurring=0&item_name=Are+you+enjoying+Talk-To-ChatGPT?+If+so%2C+consider+making+a+donation+to+keep+the+project+going%2C+and+I%27ll+continue+improving+it%21&currency_code=EUR'>\n" +
		"\t\t\t<img src='https://edunext.com.sg/paypal.png' alt='' height=80 style='height: 80px;' />\n" +
		"\t\t</a></center>";
	
	// Open a whole screenful of settings
	jQuery("body").append("<div style='background: rgba(0,0,0,0.8); position: absolute; overflow-y: auto; top: 0; right: 0; left: 0; bottom: 0; z-index: 999999; padding: 20px; color: white; font-size: 13px;' id='TTGPTSettingsArea'>" +
		"<div style='width: 600px; margin-left: auto; margin-right: auto; overflow-y: auto;'><h1>⚙️ Talk-to-ChatGPT settings</h1>"+desc+rows+donations+"</div></div>");
	
	// Assign events
	setTimeout(function() {
		jQuery(".TTGPTSave").on("click", CN_SaveSettings);
		jQuery(".TTGPTCancel").on("click", CN_CloseSettingsDialog);
		
		// When the ElevenLabs option is changed
		jQuery("#TTGPTElevenLabs").on("change", function() {
			if (jQuery(this).prop("checked")) {
				jQuery("#TTGPTAzureTTS").prop("checked", false).trigger("change");
				jQuery(".CNElevenLabs").show();
				jQuery(".CNBrowserTTS").hide();
				CN_RefreshElevenLabsVoiceList(true);
			}
			else {
				jQuery(".CNElevenLabs").hide();
				jQuery(".CNBrowserTTS").show();
			}
		});
		
		// When the 'Refresh list' button is clicked
		jQuery("#TTGPTElevenLabsRefresh").on("click", function() {
			CN_RefreshElevenLabsVoiceList(true);
		});
		
		// When the API key is changed
		jQuery("#TTGPTElevenLabsKey").on("change", function () {
			CN_RefreshElevenLabsVoiceList(true);
		});

		
		if (CN_TTS_AZURE) {
			// Enable Azure feature
			jQuery(".CNAzureTTS").show();
			refreshAzureVoices()

		} else {
			// Disable Azure feature
			jQuery(".CNAzureTTS").hide();
		}

		$("#azureCheckbox").on("change", function() {
			CN_TTS_AZURE = this.checked;
		});

		jQuery("#TTGPTAzureVoice").on("change", function() {
			CN_TTS_AZURE_VOICE = this.value;
			console.log("CN_TTS_AZURE_VOICE: " + CN_TTS_AZURE_VOICE);
		});

		$("#azureCheckbox").prop('checked', CN_TTS_AZURE);

		// When the Azure TTS option is changed
		jQuery("#TTGPTAzureTTS").on("change", function() {
			if (jQuery(this).prop("checked")) {
				jQuery("#TTGPTElevenLabs").prop("checked", false).trigger("change");
				jQuery(".CNAzureTTS").show();
				jQuery(".CNBrowserTTS").hide();
				jQuery(".CNElevenLabs").hide(); // Hide ElevenLabs settings if Azure is selected
				refreshAzureVoices();
			} else {
				jQuery(".CNAzureTTS").hide();
				jQuery(".CNBrowserTTS").show();
			}
		});

		// When the 'Refresh list' button for Azure is clicked
		jQuery("#TTGPTAzureRefresh").on("click", function() {
			refreshAzureVoices();
		});

		// When the Azure API key is changed
		jQuery("#TTGPTAzureAPIKey").on("change", function () {
			refreshAzureVoices();
		});

		jQuery("#TTGPTAzureRegion").on("change", function () {
			refreshAzureVoices();
		});
		
		// Is ElevenLabs enabled? toggle visibility, refresh voice list
		setTimeout(function() {
			$("#TTGPTElevenLabs").trigger("change");
			$("#TTGPTAzureTTS").trigger("change");
		}, 50);
	}, 100);
}


function refreshAzureVoices() {
    var azureVoiceDropdown = jQuery("#TTGPTAzureVoice");

    // Clear the dropdown
    azureVoiceDropdown.empty();


	// var useKeyFromTextField = CN_TTS_AZURE_APIKEY == "" ? true : false;
	var useKeyFromTextField = true;
    let apikey = useKeyFromTextField ? jQuery("#TTGPTAzureAPIKey").val() : CN_TTS_AZURE_APIKEY;
    let region = useKeyFromTextField ? jQuery("#TTGPTAzureRegion").val() : CN_TTS_AZURE_REGION;
	

	console.log("Using API key: " + apikey);
	console.log("Using region: " + region);


    // Repopulate the dropdown
    getAzureVoices(apikey, region).then(azureVoices => {
        azureVoices.forEach(function(voice) {
            let optionText = `${voice.lang}, ${voice.gender}, ${voice.name}`;
            azureVoiceDropdown.append(new Option(optionText, optionText));
        });
        // Set the selected voice
        azureVoiceDropdown.val(CN_TTS_AZURE_VOICE);

		console.log("Using voice: " + CN_TTS_AZURE_VOICE);
    }).catch(error => {
        console.error("Error:", error);
    });
}

// Save settings and close dialog box
function CN_SaveSettings() {
	
	// Save settings
	try {
		// AI voice settings: voice/language, rate, pitch
		var wantedVoiceIndex = jQuery("#TTGPTVoice").val();
		var allVoices = speechSynthesis.getVoices();
		CN_WANTED_VOICE = allVoices[wantedVoiceIndex];
		CN_WANTED_VOICE_NAME = CN_WANTED_VOICE ? CN_WANTED_VOICE.lang+"-"+CN_WANTED_VOICE.name : "";
		CN_TEXT_TO_SPEECH_RATE = Number( jQuery("#TTGPTRate").val() );
		CN_TEXT_TO_SPEECH_PITCH = Number( jQuery("#TTGPTPitch").val() );
		
		// Speech recognition settings: language, stop, pause
		CN_WANTED_LANGUAGE_SPEECH_REC = jQuery("#TTGPTRecLang").val();
		CN_SAY_THIS_WORD_TO_STOP = CN_RemovePunctuation( jQuery("#TTGPTStopWord").val() );
		CN_SAY_THIS_WORD_TO_PAUSE = CN_RemovePunctuation( jQuery("#TTGPTPauseWord").val() );
		CN_KEEP_LISTENING = jQuery("#TTGPTKeepListening").prop("checked");
		CN_AUTO_SEND_AFTER_SPEAKING = jQuery("#TTGPTAutosend").prop("checked");
		CN_SAY_THIS_TO_SEND = CN_RemovePunctuation( jQuery("#TTGPTSendWord").val() );
		CN_IGNORE_COMMAS = jQuery("#TTGPTIgnoreCommas").prop("checked");
		CN_IGNORE_CODE_BLOCKS = jQuery("#TTGPTIgnoreCode").prop("checked");
		CN_SPEAK_EMOJIS = jQuery("#TTGPTSpeakEmojis").prop("checked");
		
		// ElevenLabs
		CN_TTS_ELEVENLABS = jQuery("#TTGPTElevenLabs").prop("checked");
		CN_TTS_ELEVENLABS_APIKEY = CN_RemovePunctuation(jQuery("#TTGPTElevenLabsKey").val()+"");
		CN_TTS_ELEVENLABS_VOICE = jQuery("#TTGPTElevenLabsVoice").val()+"";
		CN_TTS_ELEVENLABS_STABILITY = jQuery("#TTGPTElevenLabsStability").val();
		CN_TTS_ELEVENLABS_SIMILARITY = jQuery("#TTGPTElevenLabsSimilarity").val();
		

		// Inside the CN_SaveSettings function
		CN_TTS_AZURE = jQuery("#TTGPTAzureTTS").prop("checked");
		CN_TTS_AZURE_APIKEY = jQuery("#TTGPTAzureAPIKey").val();
		CN_TTS_AZURE_REGION = jQuery("#TTGPTAzureRegion").val();
		CN_TTS_AZURE_VOICE = jQuery("#TTGPTAzureVoice").val();



		// If ElevenLabs is active, and that there is no voice, error out
		if (CN_TTS_ELEVENLABS && !CN_TTS_ELEVENLABS_VOICE) {
			alert("To enable ElevenLabs support, you must select a voice in the dropdown list. Click the Refresh List button. If no voice appears in the list, check your API key. If you are 100% sure your API key is valid, please report the issue on the Github project page, on the Issues tab.");
			return;
		}
		
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
			CN_IGNORE_COMMAS?1:0,
			CN_KEEP_LISTENING?1:0,
			CN_IGNORE_CODE_BLOCKS?1:0,
			CN_TTS_ELEVENLABS?1:0,
			CN_TTS_ELEVENLABS_APIKEY,
			CN_TTS_ELEVENLABS_VOICE,
			CN_TTS_ELEVENLABS_STABILITY,
			CN_TTS_ELEVENLABS_SIMILARITY,
			CN_SPEAK_EMOJIS?1:0,
			CN_TTS_AZURE?1:0,
			CN_TTS_AZURE_APIKEY,
			CN_TTS_AZURE_REGION,
			CN_TTS_AZURE_VOICE
		];
		CN_SetCookie("CN_TTGPT", JSON.stringify(settings));
	} catch(e) { alert('Invalid settings values. '+e.toString()); return; }
	
	// Close dialog
	console.log("[MENU] Closing settings dialog");
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
			console.log("[COOKIE] Reloading settings from cookie: "+settings);
			CN_WANTED_VOICE_NAME = settings[0];
			CN_TEXT_TO_SPEECH_RATE = settings[1];
			CN_TEXT_TO_SPEECH_PITCH = settings[2];
			CN_WANTED_LANGUAGE_SPEECH_REC = settings[3];
			CN_SAY_THIS_WORD_TO_STOP = settings[4];
			CN_SAY_THIS_WORD_TO_PAUSE = settings[5];
			if (settings.hasOwnProperty(6)) CN_AUTO_SEND_AFTER_SPEAKING = settings[6] == 1;
			if (settings.hasOwnProperty(7)) CN_SAY_THIS_TO_SEND = settings[7];
			if (settings.hasOwnProperty(8)) CN_IGNORE_COMMAS = settings[8] == 1;
			if (settings.hasOwnProperty(9)) CN_KEEP_LISTENING = settings[9] == 1;
			if (settings.hasOwnProperty(10)) CN_IGNORE_CODE_BLOCKS = settings[10] == 1;
			if (settings.hasOwnProperty(11)) CN_TTS_ELEVENLABS = settings[11] == 1;
			if (settings.hasOwnProperty(12)) CN_TTS_ELEVENLABS_APIKEY = settings[12];
			if (settings.hasOwnProperty(13)) CN_TTS_ELEVENLABS_VOICE = settings[13];
			if (settings.hasOwnProperty(14)) CN_TTS_ELEVENLABS_STABILITY = settings[14];
			if (settings.hasOwnProperty(15)) CN_TTS_ELEVENLABS_SIMILARITY = settings[15];
			if (settings.hasOwnProperty(16)) CN_SPEAK_EMOJIS = settings[16] == 1;
			if (settings.hasOwnProperty(17)) CN_TTS_AZURE = settings[17] == 1;
			if (settings.hasOwnProperty(18)) CN_TTS_AZURE_APIKEY = settings[18];
			if (settings.hasOwnProperty(19)) CN_TTS_AZURE_REGION = settings[19];
			if (settings.hasOwnProperty(20)) CN_TTS_AZURE_VOICE = settings[20];
			
		}
	} catch (ex) {
		console.error(ex);
	}
}

// Close dialog: remove area altogether
function CN_CloseSettingsDialog() {
	console.log("[MENU] Closing settings dialog");
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

// Refresh ElevenLabs voice list using current API key
function CN_RefreshElevenLabsVoiceList(useKeyFromTextField) {
	// Show loading thingy
	jQuery("#TTGPTElevenLabsRefresh").html("...");
	
	// Prepare headers & request
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "https://api.elevenlabs.io/v1/voices");
	xhr.setRequestHeader("Accept", "application/json");
	xhr.setRequestHeader("Content-Type", "application/json");
	var apikey = useKeyFromTextField ? jQuery("#TTGPTElevenLabsKey").val() : CN_TTS_ELEVENLABS_APIKEY;
	if (apikey) xhr.setRequestHeader("xi-api-key", apikey);
	
	// What happens when we receive the server response
	xhr.onreadystatechange = function () {
		var optionList = "<option value=''></option>";
		if (xhr.readyState === XMLHttpRequest.DONE) {
			jQuery("#TTGPTElevenLabsRefresh").html("Refresh list");
			
			var result = null;
			try {
				result = JSON.parse(xhr.responseText);
			} catch (e) {
				jQuery("#TTGPTElevenLabsRefresh").html("Refresh list");
				alert("Error retrieving ElevenLabs voice list: "+e.toString()+". Please ensure you have a valid API key and try clicking Refresh List again.");
				return;
			}
			
			// Check result type?
			if (typeof result.voices == "undefined") {
				if (typeof result.detail != "undefined" && typeof result.detail.message != "undefined") {
					// {"detail":{"status":"invalid_api_key","message":"Invalid API key: 'apikey'"}}
					alert("ElevenLabs returned the following while refreshing the voice list: "+result.detail.message);
					return;
				}
				// Other
				alert("Unexpected response from ElevenLabs API: "+JSON.stringify(result));
				return;
			}
			
			// Build list of models
			var found = false;
			var modelIndex = 0;
			for(var modelId in CN_TTS_ELEVENLABS_MODELS) {
				modelIndex++;
				var modelName = CN_TTS_ELEVENLABS_MODELS[modelId];
				optionList += "<optgroup label=\""+modelName+"\">";
				for (var i = 0; i < result.voices.length; i++) {
					var name = result.voices[i].name;
					var id = modelId+"."+result.voices[i].voice_id;
					var sel = id == CN_TTS_ELEVENLABS_VOICE ? "selected=selected" : ""; // Restore selected voice
					if (sel) found = true;
					
					// Add to proper list
					var isMultiling = typeof result.voices[i].high_quality_base_model_ids == "object" ?
						result.voices[i].high_quality_base_model_ids.length : 0;
					var isCloned = result.voices[i].category == "cloned";
					if (!isCloned) {
						// Cloned voices can be used with all models
						if (modelIndex == 1 && isMultiling) continue;
						if (modelIndex > 1 && !isMultiling) continue;
					}
					optionList += "<option value='" + id + "' " + sel + ">" + name + "</option>";
				}
				optionList += "</optgroup>";
			}
			jQuery("#TTGPTElevenLabsVoice").html(optionList);
			
			// The voice previously selected no longer seems to exist
			if (CN_TTS_ELEVENLABS_VOICE && !found)
				alert("The voice previously selected in the settings doesn't seem to be available in your ElevenLabs account anymore. Please select a new voice in the settings to restore ElevenLabs support. Voice ID: "+CN_TTS_ELEVENLABS_VOICE);
		}
	};
	
	// Let's go
	xhr.send();
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
