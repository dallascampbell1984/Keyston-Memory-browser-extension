# Logs the last ChatGPT response and searches for <MemorySave> tags.

function observeChatGPTResponses() {
    const chatContainer = document.querySelector("div[class*='chat']") || document.body; // Adjust as needed

    if (!chatContainer) {
        console.log("⚠️ No chat container found. Retrying in 2 seconds...");
        setTimeout(observeChatGPTResponses, 2000);
        return;
    }

    const observer = new MutationObserver((mutations) => {
        let lastResponse = null;
        
        for (const mutation of mutations) {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    lastResponse = node.innerText.trim() ? node.innerText : lastResponse;
                }
            });
        }

        if (lastResponse) {
            console.log("✅ Last ChatGPT response detected:\\n" + lastResponse);

            // Check for <MemorySave> tags
            const memoryPattern = /<MemorySave[^>]*>(.*?)<\\/MemorySave>/g;
            const matches = [...lastResponse.matchAll(memoryPattern)];

            if (matches.length > 0) {
                console.log("🔍 Found MemorySave tags:");
                const memories = matches.map(match => ({ text: match[1], timestamp: Date.now() }));
                memories.forEach(m => console.log("📌 " + m.text));

                // Store them in chrome.storage.local
                chrome.storage.local.get({ memories: [] }, function(result) {
                    const updated = result.memories.concat(memories);
                    chrome.storage.local.set({ memories: updated }, function() {
                        console.log("✅ Memory saved:", memories);
                    });
                });
            } else {
                console.log("⚠️ No <MemorySave> tags found.");
            }
        }
    });

    observer.observe(chatContainer, { childList: true, subtree: true });
    console.log("🔍 Now watching for the last ChatGPT response...");
}

// Start observing
observeChatGPTResponses();
