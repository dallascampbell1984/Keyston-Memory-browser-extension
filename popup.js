document.addEventListener("DOMContentLoaded", function() {
    const memoryList = document.getElementById("memory-list");
    const exportBtn = document.getElementById("export-memories");
    const importBtn = document.getElementById("import-memories");
    const fileInput = document.getElementById("memory-file");
    const clearBtn = document.getElementById("clear-memories");

    if (!memoryList || !exportBtn || !importBtn || !fileInput || !clearBtn) {
        console.error("Error: One or more UI elements not found.");
        return;
    }

    // Load stored memories
    chrome.storage.local.get("memories", function(result) {
        memoryList.innerHTML = "";
        if (!result.memories || result.memories.length === 0) {
            memoryList.innerHTML = "<li>No memories stored.</li>";
        } else {
            result.memories.forEach(memory => {
                const li = document.createElement("li");
                li.textContent = memory.text;
                memoryList.appendChild(li);
            });
        }
    });

    // Clear all stored memories
    clearBtn.addEventListener("click", function() {
        chrome.storage.local.set({ memories: [] }, function() {
            alert("All memories cleared.");
            location.reload(); // Refresh popup
        });
    });

});
