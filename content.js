// content.js - Content Script for YouTube URL Copier Extension
console.log("content.js loaded");

// グローバルエラーハンドラ（YouTubeの無害なエラーを除外）
window.addEventListener('error', (event) => {
  // ResizeObserverエラーは無視（YouTubeページの既知の問題）
  if (event.message && event.message.includes('ResizeObserver')) {
    event.preventDefault();
    return;
  }
  console.error('Content script error:', event.error, event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Content script unhandled rejection:', event.reason);
});

// background scriptからのメッセージを処理
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === "getVideoData") {
    try {
      const videoData = extractVideoData(request.linkUrl);
      console.log('Sending video data:', videoData);
      sendResponse(videoData);
      return true; // 同期レスポンスでもtrueを返すことで安全
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
      return true;
    }
  }
  
  if (request.action === "copyToClipboard") {
    // 非同期でClipboard APIを試す
    (async () => {
      try {
        console.log('[Content Script] Attempting to copy:', request.text);
        
        // まずClipboard APIを試す
        if (navigator.clipboard && navigator.clipboard.writeText) {
          try {
            await navigator.clipboard.writeText(request.text);
            console.log('[Content Script] Clipboard API succeeded');
            sendResponse({ success: true, text: request.text, method: 'clipboard-api' });
            return;
          } catch (clipboardErr) {
            console.log('[Content Script] Clipboard API failed:', clipboardErr.message);
            console.log('[Content Script] Falling back to execCommand');
          }
        }
        
        // フォールバック: execCommand
        const result = copyToClipboardExecCommand(request.text);
        console.log('[Content Script] execCommand result:', result);
        sendResponse(result);
      } catch (error) {
        console.error('[Content Script] Copy error:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // 非同期レスポンス
  }
  
  // 認識できないアクションの場合
  return false;
});

// クリップボードにコピーする関数（execCommandバージョン）
function copyToClipboardExecCommand(text) {
  console.log('[Content Script] Starting execCommand copy operation');
  console.log('[Content Script] Text to copy:', text);
  console.log('[Content Script] Document ready state:', document.readyState);
  console.log('[Content Script] Document has focus:', document.hasFocus());
  console.log('[Content Script] Active element:', document.activeElement?.tagName);
  
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '0';
  textarea.style.top = '0';
  textarea.style.width = '1px';
  textarea.style.height = '1px';
  textarea.style.padding = '0';
  textarea.style.border = 'none';
  textarea.style.outline = 'none';
  textarea.style.boxShadow = 'none';
  textarea.style.background = 'transparent';
  document.body.appendChild(textarea);
  
  console.log('[Content Script] Textarea created and appended');
  
  // 選択範囲を設定
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, text.length);
  
  console.log('[Content Script] After focus - Document has focus:', document.hasFocus());
  console.log('[Content Script] Active element:', document.activeElement?.tagName);
  console.log('[Content Script] Is active element textarea:', document.activeElement === textarea);
  console.log('[Content Script] Selection start:', textarea.selectionStart, 'end:', textarea.selectionEnd);
  
  let success = false;
  let errorMsg = null;
  
  try {
    success = document.execCommand('copy');
    console.log('[Content Script] execCommand result:', success);
  } catch (err) {
    errorMsg = err.message;
    console.error('[Content Script] execCommand failed:', err);
  }
  
  document.body.removeChild(textarea);
  console.log('[Content Script] Textarea removed');
  
  return { 
    success, 
    text, 
    error: errorMsg,
    method: 'execCommand',
    hasFocus: document.hasFocus() 
  };
}

// YouTubeページから動画データを抽出する関数
function extractVideoData(linkUrl = null) {
  try {
    // linkUrlが指定されている場合はそこから動画IDを抽出
    let url = linkUrl || window.location.href;
    let videoId = null;
    let title = '';
    let currentTime = 0;

    console.log('extractVideoData called with linkUrl:', linkUrl);
    console.log('Using url:', url);

    // 相対URLの場合は絶対URLに変換
    if (linkUrl && linkUrl.startsWith('/')) {
      url = 'https://www.youtube.com' + linkUrl;
      console.log('Converted to absolute URL:', url);
    }

    // 動画IDを抽出
    if (url.includes('youtube.com/watch') || url.includes('/watch?v=')) {
      // URLからクエリパラメータを抽出
      let queryString = '';
      if (url.includes('?')) {
        queryString = url.split('?')[1] || '';
      }
      const urlParams = new URLSearchParams(queryString);
      videoId = urlParams.get('v');
      console.log('Extracted videoId from watch URL:', videoId);
      
      // 現在の再生時間を取得（オプション、現在のページからのみ）
      if (!linkUrl) {
        const player = document.querySelector('video');
        if (player) {
          currentTime = Math.floor(player.currentTime);
        }
      }
    } else if (url.includes('youtu.be/')) {
      const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
      if (match) {
        videoId = match[1];
        console.log('Extracted videoId from youtu.be URL:', videoId);
      }
    } else if (url.includes('youtube.com/shorts/') || url.includes('/shorts/')) {
      const match = url.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
      if (match) {
        videoId = match[1];
        console.log('Extracted videoId from shorts URL:', videoId);
      }
    }

    console.log('Final videoId:', videoId);

    // 動画タイトルを取得
    if (linkUrl && videoId) {
      // linkUrlが指定されている場合、そのリンクに関連する要素からタイトルを探す
      // 動画IDを含むリンク要素を探す
      const linkElements = document.querySelectorAll(`a[href*="${videoId}"]`);
      for (const link of linkElements) {
        // aria-labelからタイトルを取得
        if (link.getAttribute('aria-label')) {
          title = link.getAttribute('aria-label');
          console.log('Title from aria-label:', title);
          break;
        }
        // title属性からタイトルを取得
        if (link.getAttribute('title')) {
          title = link.getAttribute('title');
          console.log('Title from title attribute:', title);
          break;
        }
        // #video-titleを探す
        const videoTitle = link.querySelector('#video-title, .ytd-video-renderer #video-title, yt-formatted-string#video-title');
        if (videoTitle && videoTitle.textContent.trim()) {
          title = videoTitle.textContent.trim();
          console.log('Title from video-title element:', title);
          break;
        }
      }
    } else {
      // 現在のページから動画タイトルを取得（複数のセレクタを試す）
      const titleSelectors = [
        'h1.ytd-watch-metadata yt-formatted-string',
        'h1.ytd-watch-metadata',
        'h1.ytd-video-primary-info-renderer',
        'yt-formatted-string.style-scope.ytd-watch-metadata',
        '#title h1',
        'h1.title'
      ];
      
      for (const selector of titleSelectors) {
        const titleElement = document.querySelector(selector);
        if (titleElement && titleElement.textContent.trim()) {
          title = titleElement.textContent.trim();
          console.log('Title extracted using selector:', selector, 'Title:', title);
          break;
        }
      }
    }
    
    // まだタイトルが取得できない場合、document.titleから取得
    if (!title || title === '') {
      title = document.title.replace(' - YouTube', '').replace('YouTube', '').trim();
      console.log('Title extracted from document.title:', title);
    }
    
    // それでも取得できない場合はデフォルト値
    if (!title || title === '') {
      title = 'YouTube Video';
      console.log('Using default title');
    }

    console.log('Final extracted data:', { videoId, title, currentTime, url });

    return {
      videoId: videoId,
      title: title,
      currentTime: currentTime,
      url: url
    };

  } catch (error) {
    console.error('動画データ抽出エラー:', error);
    return {
      error: error.message
    };
  }
}