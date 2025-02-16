document.getElementById("syncMemory").addEventListener("click", function () {
  chrome.runtime.sendMessage({ action: "syncMemory" }, function (response) {
    if (chrome.runtime.lastError) {
      console.error("⚠️ Error syncing memory:", chrome.runtime.lastError);
    } else {
      alert("✅ Memory Synced!");
    }
  });
});