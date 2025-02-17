function observeChatGPTResponses() {
    const chatMessages = document.querySelectorAll("div[data-message-author-role='assistant']");

    if (chatMessages.length > 0) {
        chatMessages.forEach((message) => {
            let timeoutId;

            const observer = new MutationObserver((mutationsList, obs) => {
                mutationsList.forEach((mutation) => {
                    if (mutation.type === "childList" && mutation.target.innerText.trim() !== "") {
                        console.log("✅ Detected a new ChatGPT response:", mutation.target.innerText);

                        // Reset the timeout each time a change is detected
                        if (timeoutId) clearTimeout(timeoutId);

                        // Set a delay to wait for the response to finish rendering
                        timeoutId = setTimeout(() => {
                            console.log("⏳ Waiting for response to fully load...");

                            // Extract memory entries using regex
                            const memoryPattern = /<Keyston-Memory-Save[^>]*>(.*?)<\/Keyston-Memory-Save>/g;
                            const matches = [...mutation.target.innerText.matchAll(memoryPattern)];

                            if (matches.length > 0) {
                                console.log("🔍 Found Keyston-Memory-Save tags. Extracting...");

                                let memories = [];
                                matches.forEach(match => memories.push({ text: match[1], timestamp: Date.now() }));

                                // Store memories in chrome.storage.local
                                chrome.storage.local.get({ memories: [] }, function(result) {
                                    const storedMemories = result.memories.concat(memories);
                                    chrome.storage.local.set({ memories: storedMemories }, function() {
                                        console.log("✅ Memory successfully saved:", memories);
                                    });
                                });
                            } else {
                                console.log("⚠️ No Keyston-Memory-Save tags found in this response.");
                            }
                        }, 1000); // Wait 1 second after the last detected change
                    }
                });
            });

            observer.observe(message, { childList: true, subtree: true });
        });

        console.log("🔍 MutationObserver is now watching for all ChatGPT responses.");
    } else {
        console.log("⚠️ Could not find ChatGPT response nodes. Retrying in 2 seconds...");
        setTimeout(observeChatGPTResponses, 2000);
    }
}

// Start observing
observeChatGPTResponses();
