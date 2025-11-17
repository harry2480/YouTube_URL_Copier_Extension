// offscreen.js - クリップボードアクセス用のoffscreen document

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Offscreen document received message:', message);
  
  if (message.type === 'copy-to-clipboard') {
    copyToClipboard(message.text)
      .then(() => {
        console.log('Offscreen: Successfully copied to clipboard');
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('Offscreen: Failed to copy to clipboard:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    // 非同期でsendResponseを使用するためにtrueを返す
    return true;
  }
});

async function copyToClipboard(text) {
  console.log('Attempting to copy text:', text);
  console.log('Document ready state:', document.readyState);
  console.log('Document has focus:', document.hasFocus());
  console.log('Navigator clipboard available:', !!navigator.clipboard);
  
  try {
    // navigator.clipboard APIを使用（offscreen documentではdocumentにフォーカスがある）
    await navigator.clipboard.writeText(text);
    console.log('Clipboard write successful:', text);
  } catch (error) {
    console.error('Clipboard write error details:');
    console.error('  Name:', error.name);
    console.error('  Message:', error.message);
    console.error('  Stack:', error.stack);
    
    // フォールバック: execCommandを試す
    console.log('Trying fallback execCommand...');
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    
    try {
      textarea.focus();
      textarea.select();
      console.log('Textarea focused, activeElement:', document.activeElement.tagName);
      const success = document.execCommand('copy');
      console.log('execCommand result:', success);
      
      if (!success) {
        throw new Error('execCommand returned false');
      }
      
      console.log('Fallback execCommand successful');
    } catch (execError) {
      console.error('execCommand also failed:', execError);
      throw execError;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

console.log('Offscreen document loaded and ready');
