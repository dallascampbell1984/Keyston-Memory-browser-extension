document.addEventListener('DOMContentLoaded', function () {
    const memoryList = document.getElementById('memory-list');

    chrome.storage.local.get('memories', function (data) {
        memoryList.innerHTML = ''; // Clear loading text

        if (data.memories && data.memories.length > 0) {
            data.memories.forEach(mem => {
                let li = document.createElement('li');
                li.textContent = mem.text;
                memoryList.appendChild(li);
            });
        } else {
            memoryList.innerHTML = '<li>No memories stored yet.</li>';
        }
    });
});
