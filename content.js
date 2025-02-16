(function() {
  // Only run in the main frame.
  if (window.self !== window.top) {
    console.log("Not main frame; skipping content script injection.");
    return;
  }

  // Prevent duplicate injection.
  if (window.__memoryScriptLoaded) {
    console.log("Memory script already loaded, skipping duplicate injection.");
    return;
  }
  window.__memoryScriptLoaded = true;

  console.log("✅ content.js injected on", window.location.href, "| Context: Main Frame Extension");

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
      memories.push({ attributes: attrs, text: memoryText });
    }
    return memories;
  }

  // Function: Save extracted memories to chrome.storage.local.
  function saveMemories(newMemories) {
    if (!newMemories || newMemories.length === 0) {
      console.log("⚠️ [Save] No new memories to save.");
      return;
    }
    chrome.storage.local.get({ memories: [] }, function(result) {
      const storedMemories = result.memories;
      // Filter duplicates based on timestamp and text.
      const memoriesToAdd = newMemories.filter(mem =>
        !storedMemories.some(stored =>
          stored.attributes.timestamp === mem.attributes.timestamp && stored.text === mem.text
        )
      );
      if (memoriesToAdd.length > 0) {
        const updatedMemories = storedMemories.concat(memoriesToAdd);
        chrome.storage.local.set({ memories: updatedMemories }, function() {
          if (chrome.runtime.lastError) {
            console.error("❌ [Storage Error] Failed to save memories:", chrome.runtime.lastError);
          } else {
            console.log("✅ [Storage Success] Updated stored memories:", updatedMemories);
          }
        });
      } else {
        console.log("⚠️ [Storage] No new memories found to update storage.");
      }
    });
  }

  // Function: Process a node to extract MemorySave tags.
  function processNode(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      let extractedMemories = [];
      // Case 1: Node is a MemorySave element (raw HTML).
      if (node.tagName && node.tagName.toLowerCase() === "memorysave") {
        extractedMemories = extractMemoryTags(node.outerHTML);
      }
      // Case 2: Node is a <code> element containing escaped MemorySave.
      else if (node.tagName && node.tagName.toLowerCase() === "code" && node.textContent.includes("&lt;MemorySave")) {
        const rawHTML = unescapeHTML(node.textContent);
        extractedMemories = extractMemoryTags(rawHTML);
      }
      // Case 3: Node contains raw HTML with MemorySave somewhere in its innerHTML.
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
  // Adjust this selector based on the actual ChatGPT DOM structure.
  const responseContainer = document.querySelector('#__next') ||
                            document.querySelector('.chatgpt-response-container') ||
                            document.body;
  console.log("Monitoring responses in container:", responseContainer);

  // Set up a MutationObserver to watch for new nodes in the response container.
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        // Process the node if it contains our MemorySave tag (either raw or escaped).
        if (node.nodeType === Node.ELEMENT_NODE &&
            node.innerHTML && node.innerHTML.includes("MemorySave")) {
          processNode(node);
        }
      });
    });
  });
  
  observer.observe(responseContainer, { childList: true, subtree: true });
  console.log("Memory tag extractor is active; it will extract tags when the AI outputs them.");

  // For manual testing, you can uncomment the following:
  // document.body.insertAdjacentHTML('beforeend', `
  //   <MemorySave timestamp="2025-02-11T10:00:00Z" tags="AI, connection, growth">
  //     Dallas is reflecting on how AI can help people connect more meaningfully and foster growth in society.
  //   </MemorySave>
  // `);
})();
