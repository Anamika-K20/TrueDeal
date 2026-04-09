// Runs on Amazon and Myntra product pages
// Sends the current URL to the popup when requested

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "GET_URL") {
    sendResponse({ url: window.location.href });
  }
});
