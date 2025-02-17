function observeChatGPTResponses() {
    const chatMessages = document.querySelectorAll("div[data-message-author-role='assistant']");

    if (chatMessages.length > 0) {
        chatMessages.forEach((message) => {
            const observer = new MutationObserver((mutationsList) => {
                mutationsList.forEach((mutation) => {
                    if (mutation.type === "childList" && mutation.target.innerText.trim() !== "") {
                        console.log("✅ New ChatGPT response detected:", mutation.target.innerText);

                        // Extract memory entries using regex
                        const memoryPattern = /<Keyston-Memory-Save[^>]*>(.*?)<\/Keyston-Memory-Save>/g;
                        const matches = [...mutation.target.innerText.matchAll(memoryPattern)];

                        if (matches.length > 0) {
                            let memories = [];
                            matches.forEach(match => memories.push({ text: match[1], timestamp: Date.now() }));

                            // Store memories in chrome.storage.local
                            chrome.storage.local.get({ memories: [] }, function(result) {
                                const storedMemories = result.memories.concat(memories);
                                chrome.storage.local.set({ memories: storedMemories }, function() {
                                    console.log("✅ Memories saved:", memories);
                                });
                            });
                        }
                    }
                });
            });

            observer.observe(message, { childList: true, subtree: true });
        });

        console.log("🔍 MutationObserver is now watching for ChatGPT responses.");
    } else {
        console.log("⚠️ Could not find ChatGPT response nodes. Retrying in 2 seconds...");
        setTimeout(observeChatGPTResponses, 2000);
    }
}

// Start observing
observeChatGPTResponses();
