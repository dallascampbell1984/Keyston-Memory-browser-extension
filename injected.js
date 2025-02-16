console.log("🛠️ Injected script running inside webpage.");

window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data || event.data.type !== "FROM_PAGE") return;

    chrome.runtime.sendMessage(event.data.message, function(response) {
        window.postMessage({ type: "FROM_EXTENSION", response }, "*");
    });
});