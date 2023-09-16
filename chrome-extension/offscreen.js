var MESSAGES_PLAYED = [];
var AUDIO_PLAYER = null;

// Listen for messages from the extension
chrome.runtime.onMessage.addListener(msg => {
	if (msg.type == "playSound" && 'data' in msg) 
		playAudio(msg.data);
});

// Play sound with access to DOM APIs
function playAudio(source) {
	// Did we already play this message? (eliminate duplicate bug)
	var messageId = source.messageId+source.onEnded;
	if (MESSAGES_PLAYED.indexOf(messageId) != -1) {
		console.log('offscreen.js: Message '+messageId+' already played once');
		return;
	}
	
	// Save ID to avoid replaying it
	MESSAGES_PLAYED.push(messageId);
	console.log('offscreen.js: Going to play the following message (#'+messageId+'): '+source.transcript);
	
	if (AUDIO_PLAYER === null) AUDIO_PLAYER = new Audio();
	else {
		// Remove onended
		try {
			AUDIO_PLAYER.onended = null;
		} catch(e) { }
		
		// Stop playback
		try {
			AUDIO_PLAYER.stop();
		} catch(e) { }
	}
	
	// Set source
	AUDIO_PLAYER.src = source.audio;
	AUDIO_PLAYER.volume = 1;
	
	if (source.onEnded == "elevenlabs") {
		AUDIO_PLAYER.onended = function () {
			// Start audio playback if not already
			console.log('offscreen.js: playback #'+messageId+' ended, sending message to continueElevenLabs. Transcript = '+source.transcript);
			chrome.runtime.sendMessage({
				type: 'continueElevenLabs',
				target: 'ttgpt',
				data: {
					transcript: source.transcript
				}
			});
		};
	}
	
	// Do play
    AUDIO_PLAYER.play();
	
	// Play another dummy sound
	//playDummySound();
}


// We need to play a sound every 5 seconds or else Chrome will shut this down
/*function playDummySound() {
	console.log("Playing dummy sound to keep chrome active");
	var dummy = new Audio();
	dummy.src = "data:audio/mpeg;base64,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";
	dummy.volume = 0.01;
	dummy.play();
	
	setTimeout(function() {
		playDummySound();
	}, 5000);
}
*/