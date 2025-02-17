(() => {
  if (window.top !== window.self) {
    console.log("Skipping injection in iframe.");
    return;
  }

  if (window.__CHATGPT_MEMORY_ASSISTANT_LOADED) {
    console.log("Script already loaded. Skipping setup...");
    return;
  }
  window.__CHATGPT_MEMORY_ASSISTANT_LOADED = true;

  console.log("📌 content.js loaded.");

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
   * Parses <MemorySave> tags and saves found memory to chrome.storage.local.
   */
  function parseMemoryTagsFromText(finalText) {
    console.log("Parsing memory tags from final text:", finalText);
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
      console.log("No MemorySave tags found.");
    }
  }

  let lastProcessedResponse = "";

  /**
   * MutationObserver to watch for new assistant messages.
   */
  function setupMutationObserver() {
    const chatContainer = document.querySelector('[data-message-author-role="assistant"]')?.parentElement;

    if (!chatContainer) {
      console.error("❌ Chat container not found.");
      return;
    }

    const observer = new MutationObserver(() => {
      setTimeout(() => {
        const finalResponse = getLastAssistantMessage();
        if (finalResponse && finalResponse !== lastProcessedResponse) {
          lastProcessedResponse = finalResponse;
          parseMemoryTagsFromText(finalResponse);
        }
      }, 2000);
    });

    observer.observe(chatContainer, { childList: true, subtree: true });

    console.log("👀 MutationObserver set up for response detection.");
  }

  window.addEventListener("load", setupMutationObserver);
})();
