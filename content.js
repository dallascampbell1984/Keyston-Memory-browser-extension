(function() {
  // Only run in the main frame.
  if (window.self !== window.top) {
    console.log("🚫 Not main frame; skipping content script injection.");
    return;
  }

  // Prevent duplicate injection.
  if (window.__memoryScriptLoaded) {
    console.log("⚠️ Memory script already loaded, skipping duplicate injection.");
    return;
  }
  window.__memoryScriptLoaded = true;

  console.groupCollapsed("📦 Keyston Memory Extractor Debugging");
  console.log("✅ content.js injected on", window.location.href);
  console.log("⏳ Monitoring ChatGPT responses...");
  console.groupEnd();

  // Helper: Unescape HTML entities.
  function unescapeHTML(escapedStr) {
    const temp = document.createElement("textarea");
    temp.innerHTML = escapedStr;
    return temp.value;
  }

  // Function: Extract MemorySave tags from an HTML string.
  function extractMemoryTags(html) {
    const regex = /<MemorySave\s+([^>]*)>([\s\S]*?)<\/MemorySave>/gi;
    let match;
    const memories = [];
    while ((match = regex.exec(html)) !== null) {
      const attrString = match[1];
      const memoryText = match[2].trim();
      const attrs = {};
      const attrRegex = /(\w+)=["']([^"']+)["']/g;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(attrString)) !== null) {
        attrs[attrMatch[1]] = attrMatch[2];
      }
      // Generate a unique ID for each memory
      attrs.id = hashMemory(memoryText);
      memories.push({ attributes: attrs, text: memoryText });
    }
    return memories;
  }

  // Function: Generate a unique hash for memory text.
  function hashMemory(memoryText) {
    let hash = 0;
    for (let i = 0; i < memoryText.length; i++) {
      hash = (hash << 5) - hash + memoryText.charCodeAt(i);
      hash |= 0; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // Function: Save extracted memories to chrome.storage.local.
  function saveMemories(newMemories) {
    if (!newMemories || newMemories.length === 0) {
      console.log("⚠️ [Save] No new memories to save.");
      return;
    }
    chrome.storage.local.get({ memories: [] }, function(result) {
      const storedMemories = result.memories;

      // Remove duplicates using the unique hash ID
      const memoriesToAdd = newMemories.filter(mem =>
        !storedMemories.some(stored => stored.attributes.id === mem.attributes.id)
      );

      if (memoriesToAdd.length > 0) {
        const updatedMemories = storedMemories.concat(memoriesToAdd);
        chrome.storage.local.set({ memories: updatedMemories }, function() {
          if (chrome.runtime.lastError) {
            console.error("❌ [Storage Error] Failed to save memories:", chrome.runtime.lastError);
          } else {
            console.log(`✅ [Storage Success] Added ${memoriesToAdd.length} new memories.`);
          }
        });
      } else {
        console.log("⚠️ [Storage] No new unique memories to update storage.");
      }
    });
  }

  // Function: Process a node to extract MemorySave tags.
  function processNode(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      let extractedMemories = [];

      if (node.tagName && node.tagName.toLowerCase() === "memorysave") {
        extractedMemories = extractMemoryTags(node.outerHTML);
      }
      else if (node.tagName && node.tagName.toLowerCase() === "code" && node.textContent.includes("&lt;MemorySave")) {
        const rawHTML = unescapeHTML(node.textContent);
        extractedMemories = extractMemoryTags(rawHTML);
      }
      else if (node.innerHTML && node.innerHTML.includes("<MemorySave")) {
        extractedMemories = extractMemoryTags(node.innerHTML);
      }

      if (extractedMemories.length > 0) {
        console.log("✅ [ProcessNode] Extracted memory tags:", extractedMemories);
        saveMemories(extractedMemories);
      }
    }
  }

  // Determine the container where ChatGPT responses appear.
  const responseContainer = document.querySelector('#__next') ||
                            document.querySelector('.chatgpt-response-container') ||
                            document.body;

  console.log("📌 Monitoring responses in container:", responseContainer);

  // Set up a MutationObserver to watch for new nodes in the response container.
  const observer = new MutationObserver((mutations) => {
    let nodesToProcess = [];

    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE &&
            (node.textContent.includes("<MemorySave") || node.innerHTML.includes("<MemorySave"))) {
          nodesToProcess.push(node);
        }
      });
    });

    if (nodesToProcess.length > 0) {
      console.log(`🔍 [Observer] Found ${nodesToProcess.length} new nodes containing MemorySave tags.`);
      nodesToProcess.forEach(processNode);
    }
  });

  observer.observe(responseContainer, { childList: true, subtree: true });
  console.log("🔄 Memory tag extractor is active.");

})();
