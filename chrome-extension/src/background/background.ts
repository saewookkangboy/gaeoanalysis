// Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('GAEO Analysis Extension installed');
});

// 메시지 리스너
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'ANALYZE_URL') {
    // 필요시 백그라운드 작업 수행
    sendResponse({ success: true });
  }
  return true;
});

