chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Ensure tab and tab.url exist
  if (!tab || !tab.url) {
    return;
  }
  
  console.log(`🔄 Tab Update Event: ID=${tabId}, URL=${tab.url}, Status=${changeInfo.status}`);

  if (changeInfo.status === "complete" && tab.url.includes("chatgpt.com")) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["content.js"]
    })
    .then(() => {
      console.log(`✅ [Success] Injected content.js into Tab ID ${tabId} (${tab.url})`);
    })
    .catch((err) => {
      console.error(`❌ [Error] Failed to inject content.js into Tab ID ${tabId} (${tab.url}). Error:`, err);
    });
  }
});
