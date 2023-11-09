const OFFSCREEN_DOCUMENT_PATH = '/offscreen.html';

async function sendMessageToOffscreenDocument(type, data) {
  try {
    if (!(await hasDocument())) {
      await chrome.offscreen.createDocument({
        url: OFFSCREEN_DOCUMENT_PATH,
        reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
        justification: 'This will play the audio requested by the user, such as notification sounds, or text-to-speech API sounds'
      });
    }
    chrome.runtime.sendMessage({
      type,
      target: 'offscreen',
      data
    });
  } catch (error) {
    console.error(`Error in sendMessageToOffscreenDocument: ${error}`);
  }
}

chrome.runtime.onMessage.addListener(handleMessages);

async function handleMessages(message) {
    if (message.type === "playSound") {
      return await sendMessageToOffscreenDocument('playSound', message.data);
    } else if (message.type === "changeVolume") {
      return await sendMessageToOffscreenDocument("changeVolume", message.data);
    } else if (message.type === "continueElevenLabs") {
        return await handleElevenLabs();
    }
}

async function handleElevenLabs() {
    try {
      const tabs = await chrome.tabs.query({});
      for (const activeTab of tabs) {
        chrome.tabs.sendMessage(activeTab.id, {"type": "continueElevenLabs"});
      }
    } catch (error) {
      console.error(`Error in handling continueElevenLabs: ${error}`);
    }
}

async function closeOffscreenDocument() {
  try {
    if (!(await hasDocument())) {
      return;
    }
    await chrome.offscreen.closeDocument();
  } catch (error) {
    console.error(`Error in closeOffscreenDocument: ${error}`);
  }
}

async function hasDocument() {
  try {
    const matchedClients = await clients.matchAll();
    for (const client of matchedClients) {
      if (client.url.endsWith(OFFSCREEN_DOCUMENT_PATH)) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error(`Error in hasDocument: ${error}`);
    return false;
  }
}
