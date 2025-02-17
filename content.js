function observeChatGPTResponses() {
    const targetNodes = document.querySelectorAll('div[data-message-author-role="assistant"], div[data-message-id]');

    if (targetNodes.length > 0) {
        targetNodes.forEach((targetNode) => {
            const observer = new MutationObserver((mutationsList) => {
                for (let mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        console.log('✅ New ChatGPT response detected:');
                        console.log(mutation.target.innerText);

                        // Extract <Keyston-Memory-Save> elements
                        const memoryElements = mutation.target.querySelectorAll("Keyston-Memory-Save");

                        if (memoryElements.length > 0) {
                            let memories = [];
                            memoryElements.forEach(element => {
                                memories.push({ text: element.innerText, timestamp: Date.now() });
                            });

                            // Store memories in chrome.storage.local
                            chrome.storage.local.get({ memories: [] }, function(result) {
                                const storedMemories = result.memories.concat(memories);
                                chrome.storage.local.set({ memories: storedMemories }, function() {
                                    console.log("✅ Memories saved:", memories);
                                });
                            });
                        }
                    }
                }
            });

            observer.observe(targetNode, { childList: true, subtree: true });
        });

        console.log('🔍 MutationObserver is now watching for ChatGPT responses.');
    } else {
        console.log('⚠️ Could not find the target node. Retrying in 2 seconds...');
        setTimeout(observeChatGPTResponses, 2000);
    }
}

// Start observing
observeChatGPTResponses();
