let MESSAGES_PLAYED = new Set();
let AUDIO_PLAYER = null;

// Listen for messages from the extension
chrome.runtime.onMessage.addListener(msg => {
  if (msg.type === "playSound" && 'data' in msg) 
    playAudio(msg.data);
});

// Play sound with access to DOM APIs
function playAudio(source) {
  const messageId = `${source.messageId}${source.onEnded}`;
  
  if (MESSAGES_PLAYED.has(messageId)) {
    console.log(`offscreen.js: Message ${messageId} already played once`);
    return;
  }

  // Save ID to avoid replaying it
  MESSAGES_PLAYED.add(messageId);
  console.log(`offscreen.js: Going to play the following message (#${messageId}): ${source.transcript}`);

  if (AUDIO_PLAYER === null) {
    AUDIO_PLAYER = new Audio();
  } else {
    try {
      AUDIO_PLAYER.onended = null;
      AUDIO_PLAYER.stop();
    } catch (e) {
      console.log(e);
    }
  }

  // Set source and attributes
  AUDIO_PLAYER.src = source.audio;
  AUDIO_PLAYER.volume = 1;

  if (source.onEnded === "elevenlabs") {
    AUDIO_PLAYER.onended = function () {
      console.log(`offscreen.js: playback #${messageId} ended, sending message to continueElevenLabs. Transcript = ${source.transcript}`);
      chrome.runtime.sendMessage({
        type: 'continueElevenLabs',
        target: 'ttgpt',
        data: {
          transcript: source.transcript
        }
      });
    };
  }
  
  AUDIO_PLAYER.play();
}
