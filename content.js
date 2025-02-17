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

  function getLastAssistantMessage() {
    const messages = document.querySelectorAll('[data-message-author-role="assistant"]');
    if (messages.length > 0) {
      return messages[messages.length - 1].innerText.trim();
    }
    return "";
  }

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

  function monitorStreamingState() {
    let wasStreaming = false;

    const interval = setInterval(() => {
      const stopButton = document.querySelector('button[aria-label="Stop streaming"]');
      const isStreaming = !!stopButton;

      if (isStreaming !== wasStreaming) {
        if (isStreaming) {
          console.log("🛑 ChatGPT started streaming its response.");
        } else {
          console.log("✅ ChatGPT finished streaming. Waiting 2 seconds for final text...");
          clearInterval(interval);

          setTimeout(() => {
            const finalResponse = getLastAssistantMessage();
            if (finalResponse && finalResponse !== lastProcessedResponse) {
              lastProcessedResponse = finalResponse;
              parseMemoryTagsFromText(finalResponse);
            }
          }, 2000);
        }
        wasStreaming = isStreaming;
      }
    }, 500);
  }

  window.addEventListener("load", monitorStreamingState);
})();
