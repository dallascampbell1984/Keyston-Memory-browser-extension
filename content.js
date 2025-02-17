(() => {
  // Skip if in an iframe.
  if (window.top !== window.self) {
    console.log("Skipping injection in iframe.");
    return;
  }
  
  // Prevent multiple injections.
  if (window.__CHATGPT_MEMORY_ASSISTANT_LOADED) {
    console.log("Script already loaded. Skipping setup...");
    return;
  }
  window.__CHATGPT_MEMORY_ASSISTANT_LOADED = true;
  
  console.log("📌 content.js loaded.");

  /**
   * Helper: Wait for an element matching the selector.
   */
  function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        const el = document.querySelector(selector);
        if (el) {
          clearInterval(interval);
          resolve(el);
        }
      }, 500);
      setTimeout(() => {
        clearInterval(interval);
        reject(new Error("Timeout waiting for element: " + selector));
      }, timeout);
    });
  }

  /**
   * Retrieves the last assistant message's text.
   */
  function getLastAssistantMessage() {
    const messages = document.querySelectorAll('[data-message-author-role="assistant"]');
    if (messages.length > 0) {
      return messages[messages.length - 1].innerText.trim();
    }
    return "";
  }

  /**
   * Parses the final text for <MemorySave> tags and saves any found memory to chrome.storage.local.
   */
  function parseMemoryTagsFromText(finalText) {
    console.log("Parsing memory tags from final text:");
    console.log(finalText);
    // Regex that captures across newlines
    const memoryPattern = /<MemorySave[^>]*>([\s\S]*?)<\/MemorySave>/g;
    const matches = [...finalText.matchAll(memoryPattern)];
    if (matches.length > 0) {
      const memoriesFound = matches.map(match => match[1].trim());
      console.log("Found MemorySave tags:", memoriesFound);
      chrome.storage.local.get({ memories: [] }, function(result) {
        const newMemories = memoriesFound.map(mem => ({
          text: mem,
          timestamp: Date.now()
        }));
        const updated = result.memories.concat(newMemories);
        chrome.storage.local.set({ memories: updated }, function() {
          console.log("✅ Memory saved:", newMemories);
        });
      });
    } else {
      console.log("No MemorySave tags found in final response.");
    }
  }

  // Global variable to store the last processed response to avoid duplicates.
  let lastProcessedResponse = "";

  /**
   * Monitors the Stop streaming button state.
   * When it disappears, waits 2 seconds then retrieves the final assistant message.
   */
  async function monitorStreamingState() {
    try {
      await waitForElement('button[aria-label="Send prompt"]');
      console.log("✅ Send button is available.");
      
      let wasStreaming = false;
      setInterval(() => {
        // Check for the Stop streaming button.
        const stopButton = document.querySelector('button[aria-label="Stop streaming"]');
        const isStreaming = !!stopButton;
        
        if (isStreaming !== wasStreaming) {
          if (isStreaming) {
            console.log("🛑 ChatGPT started streaming its response.");
          } else {
            console.log("✅ ChatGPT finished streaming. Waiting 2 seconds for final text...");
            setTimeout(() => {
              const finalResponse = getLastAssistantMessage();
              console.log("Final assistant message:");
              console.log(finalResponse);
              // Only process if nonempty and not already processed.
              if (finalResponse && finalResponse !== lastProcessedResponse) {
                lastProcessedResponse = finalResponse;
                parseMemoryTagsFromText(finalResponse);
              } else {
                console.log("Response already processed or empty.");
              }
            }, 2000);
          }
          wasStreaming = isStreaming;
        }
      }, 500);
    } catch (error) {
      console.error("Error in monitorStreamingState:", error);
    }
  }
  
  window.addEventListener("load", monitorStreamingState);
})();
