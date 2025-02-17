(function() {
  if (window.self !== window.top) {
    console.log("Skipping content script injection.");
    return;
  }

  if (window.__memoryScriptLoaded) {
    console.log("Memory script already loaded.");
    return;
  }
  window.__memoryScriptLoaded = true;

  console.groupCollapsed("Keyston Memory Extractor Debugging");
  console.log("content.js injected");
  console.groupEnd();

  function extractMemoryTags() {
    const memories = [];
    document.querySelectorAll('div[data-memory="true"]').forEach(element => {
      const memoryText = element.innerHTML.trim();
      const attributes = { id: hashMemory(memoryText), category: element.getAttribute("category") || "uncategorized" };
      memories.push({ attributes, text: memoryText });
    });
    return memories;
  }

  function hashMemory(memoryText) {
    let hash = 0;
    for (let i = 0; i < memoryText.length; i++) {
      hash = (hash << 5) - hash + memoryText.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString();
  }

  function saveMemories(newMemories) {
    if (!newMemories || newMemories.length === 0) {
      console.log("No new memories to save.");
      return;
    }
    chrome.storage.local.get({ memories: [] }, function(result) {
      const storedMemories = result.memories;
      const memoriesToAdd = newMemories.filter(mem =>
        !storedMemories.some(stored => stored.attributes.id === mem.attributes.id)
      );

      if (memoriesToAdd.length > 0) {
        const updatedMemories = storedMemories.concat(memoriesToAdd);
        chrome.storage.local.set({ memories: updatedMemories }, function() {
          console.log("Added new memories.");
        });
      } else {
        console.log("No new unique memories to update storage.");
      }
    });
  }
})();
