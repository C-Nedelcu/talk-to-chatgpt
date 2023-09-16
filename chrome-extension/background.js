
const OFFSCREEN_DOCUMENT_PATH = '/offscreen.html';

async function sendMessageToOffscreenDocument(type, data) {
  // Create an offscreen document if one doesn't exist yet
  if (!(await hasDocument())) {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
      justification: 'This will play the audio requested by the user, such as notification sounds, or text-to-speech API sounds'
    });
  }
  
  // Now that we have an offscreen document, we can dispatch the message.
  chrome.runtime.sendMessage({
    type,
    target: 'offscreen',
    data
  });
}

chrome.runtime.onMessage.addListener(handleMessages);

// This function performs basic filtering and error checking on messages before
// dispatching the message to a more specific message handler.
async function handleMessages(message) {
	//console.log('background.js: Received message: '+message.type);
	
	if (message.type == "playSound") {
		// Forward to offscreen document
		sendMessageToOffscreenDocument(
			'playSound',
			message.data
		);
	}
	else if (message.type == "continueElevenLabs") {
		
		//console.log('background.js: Sending to active tab');
		chrome.tabs.query({}, function(tabs) {
			//let activeTab = tabs[0];
			//if (activeTab) 
			for(var i in tabs) {
				let activeTab = tabs[i];
				try {
					chrome.tabs.sendMessage(activeTab.id, {"type": "continueElevenLabs"});
				} catch(e) {
					// Ignore
				}
			}
		});
		
	}
	
}


async function closeOffscreenDocument() {
  if (!(await hasDocument())) {
    return;
  }
  await chrome.offscreen.closeDocument();
}

async function hasDocument() {
  // Check all windows controlled by the service worker if one of them is the offscreen document
  const matchedClients = await clients.matchAll();
  for (const client of matchedClients) {
    if (client.url.endsWith(OFFSCREEN_DOCUMENT_PATH)) {
      return true;
    }
  }
  return false;
}