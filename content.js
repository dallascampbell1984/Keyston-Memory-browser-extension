// Select all elements where ChatGPT responses appear
const targetNodes = document.querySelectorAll('[data-message-author-role="assistant"]');

if (targetNodes.length > 0) {
    targetNodes.forEach((targetNode) => {
        const observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    console.log('New ChatGPT response detected:');
                    console.log(mutation.target.innerText);
                }
            }
        });

        observer.observe(targetNode, { childList: true, subtree: true });
    });

    console.log('MutationObserver is now watching for ChatGPT responses.');
} else {
    console.log('Could not find the target node. Check the selector.');
}
