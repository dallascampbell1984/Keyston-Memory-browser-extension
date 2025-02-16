chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Ensure the tab object exists and has a valid URL
  if (!tab || !tab.url) return;

  console.log(`🔄 Tab Update Event: ID=${tabId}, URL=${tab.url}, Status=${changeInfo.status}`);

  try {
    // Parse the URL to ensure it's a valid ChatGPT page
    const url = new URL(tab.url);

    if (changeInfo.status === "complete" && url.hostname === "chat.openai.com") {
      console.log(`📌 Targeting ChatGPT tab: ${url.href}`);

      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ["content.js"]
      })
      .then(() => {
        console.log(`✅ [Success] Injected content.js into Tab ID ${tabId} (${url.href})`);
      })
      .catch((err) => {
        console.error(`❌ [Error] Failed to inject content.js into Tab ID ${tabId} (${url.href}). Error:`, err);
      });
    }
  } catch (error) {
    console.error("❌ [Error] URL parsing failed:", error);
  }
});
