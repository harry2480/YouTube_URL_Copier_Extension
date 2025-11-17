// background.js - Service Worker for YouTube URL Copier Extension

// グローバルエラーハンドラ
self.addEventListener('error', (event) => {
  console.error('Global error:', event.error, event.message, event.filename, event.lineno, event.colno);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason, event.promise);
});

console.log('Background service worker loaded');

// インストール時にコンテキストメニューを作成
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated');
  try {
    chrome.contextMenus.create({
      id: "copy-youtube-url",
      title: "ショートURLをコピー",
      contexts: ["page"],
      documentUrlPatterns: ["*://*.youtube.com/*", "*://*.youtu.be/*"]
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Context menu creation error:', chrome.runtime.lastError);
      } else {
        console.log('Context menu "copy-youtube-url" created');
      }
    });

    chrome.contextMenus.create({
      id: "copy-youtube-url-format",
      title: "コピー形式を選択",
      contexts: ["page"],
      documentUrlPatterns: ["*://*.youtube.com/*", "*://*.youtu.be/*"]
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Context menu creation error:', chrome.runtime.lastError);
      } else {
        console.log('Context menu "copy-youtube-url-format" created');
      }
    });

    // サブメニューを作成
    chrome.contextMenus.create({
      id: "copy-url-only",
      parentId: "copy-youtube-url-format",
      title: "URLのみ",
      contexts: ["page"]
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Context menu creation error:', chrome.runtime.lastError);
      } else {
        console.log('Context menu "copy-url-only" created');
      }
    });

    chrome.contextMenus.create({
      id: "copy-title-url",
      parentId: "copy-youtube-url-format",
      title: "タイトルとURL",
      contexts: ["page"]
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Context menu creation error:', chrome.runtime.lastError);
      } else {
        console.log('Context menu "copy-title-url" created');
      }
    });

    chrome.contextMenus.create({
      id: "copy-markdown",
      parentId: "copy-youtube-url-format",
      title: "Markdown形式",
      contexts: ["page"]
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Context menu creation error:', chrome.runtime.lastError);
      } else {
        console.log('Context menu "copy-markdown" created');
      }
    });
  } catch (error) {
    console.error('Error during context menu creation:', error);
  }
});

// コンテキストメニューのクリックを処理
chrome.contextMenus.onClicked.addListener(async (info, clickedTab) => {
  console.log('Context menu clicked:', info.menuItemId, clickedTab);
  try {
    if (info.menuItemId.startsWith("copy-")) {
      // クリックされたタブを使用（コンテキストメニューの場合は必ずclickedTabが存在する）
      const targetTab = clickedTab;
      console.log('Target tab:', targetTab);
      
      if (!targetTab || !targetTab.id) {
        throw new Error("タブ情報が取得できませんでした");
      }
      
      const format = getFormatFromMenuId(info.menuItemId);
      console.log('Format to copy:', format);
      await copyYouTubeUrl(targetTab, format);
    }
  } catch (error) {
    console.error("コンテキストメニューエラー:", error);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      title: 'エラー',
      message: error.message || 'エラーが発生しました'
    });
  }
});

// キーボードショートカットの処理
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "copy-url") {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab && (activeTab.url.includes("youtube.com") || activeTab.url.includes("youtu.be"))) {
      await copyYouTubeUrl(activeTab, null); // デフォルト形式を使用
    }
  }
});

// popupからのメッセージを処理
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);
  
  if (request.action === "copyUrl") {
    // 非同期処理を実行
    (async () => {
      try {
        // ポップアップが閉じるまで少し待つ
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // 現在アクティブなタブを取得
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const targetTab = tabs && tabs[0] ? tabs[0] : null;

        if (!targetTab || !targetTab.id) {
          throw new Error("タブ情報が取得できませんでした");
        }

        console.log('Popup target tab:', targetTab);

        await copyYouTubeUrl(targetTab, request.format);
        sendResponse({ success: true });
      } catch (error) {
        console.error("メッセージ処理エラー:", error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    
    return true; // 非同期レスポンスを示す
  }
  
  // 他のメッセージタイプの場合は何もしない
  return false;
});

// URLをコピーするメイン関数
async function copyYouTubeUrl(sourceTab, format) {
  console.log('copyYouTubeUrl called with:', { sourceTab, format });
  try {
    // まずタブをアクティブにする
    await chrome.tabs.update(sourceTab.id, { active: true });
    console.log('Tab activated:', sourceTab.id);
    
    // タブがアクティブになるまで少し待つ
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 設定を取得
    const settings = await chrome.storage.sync.get({
      copyFormat: 'url-only',
      enableNotifications: true
    });
    console.log('Settings loaded:', settings);

    // 実際の形式を決定
    const actualFormat = format || settings.copyFormat;
    console.log('Actual format:', actualFormat);

    // タブ情報の検証
    if (!sourceTab || !sourceTab.id) {
      throw new Error('タブ情報が取得できませんでした');
    }

    // タブのURLを確認
    if (!sourceTab.url || (!sourceTab.url.includes('youtube.com') && !sourceTab.url.includes('youtu.be'))) {
      throw new Error('YouTubeページでのみ動作します');
    }

    // content scriptにデータを要求
    let response;
    try {
      console.log('Sending message to content script...');
      response = await chrome.tabs.sendMessage(sourceTab.id, { action: "getVideoData" });
      
      // chrome.runtime.lastErrorをチェック
      if (chrome.runtime.lastError) {
        throw new Error(chrome.runtime.lastError.message);
      }
      
      console.log('Response received:', response);
    } catch (error) {
      // content scriptが注入されていない場合、再注入を試みる
      console.log('Content script not found, attempting to inject...', error);
      try {
        await chrome.scripting.executeScript({
          target: { tabId: sourceTab.id },
          files: ['content.js']
        });
        // 少し待ってから再度メッセージを送信
        await new Promise(resolve => setTimeout(resolve, 200));
        response = await chrome.tabs.sendMessage(sourceTab.id, { action: "getVideoData" });
        
        // chrome.runtime.lastErrorをチェック
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
        
        console.log('Response after injection:', response);
      } catch (injectError) {
        console.error('Injection error:', injectError);
        throw new Error('Content scriptの注入に失敗しました。ページをリロードしてください。');
      }
    }

    if (!response || !response.videoId) {
      throw new Error("YouTubeの動画ページではありません");
    }

    // デバッグ情報をログ出力
    console.log('Video data:', response);
    console.log('Format:', actualFormat);

    // タイトルが取得できない場合のフォールバック
    const title = response.title || 'YouTube Video';
    console.log('Title to use:', title);

    // URLを生成
    const shortUrl = `https://youtu.be/${response.videoId}`;
    let textToCopy;

    switch (actualFormat) {
      case 'url-only':
        textToCopy = shortUrl;
        break;
      case 'title-url':
        textToCopy = `${title} ${shortUrl}`;
        break;
      case 'markdown':
        textToCopy = `[${title}](${shortUrl})`;
        break;
      default:
        textToCopy = shortUrl;
    }

    console.log('Text to copy:', textToCopy);

    // content scriptにクリップボードコピーを依頼
    console.log('Sending copy request to content script');
    console.log('Target tab ID:', sourceTab.id);
    
    try {
      const response = await chrome.tabs.sendMessage(sourceTab.id, {
        action: 'copyToClipboard',
        text: textToCopy
      });
      
      console.log('Content script response:', response);
      
      if (!response || !response.success) {
        throw new Error('クリップボードへのコピーに失敗: ' + (response?.error || 'Unknown error'));
      }
      
      console.log('Successfully copied to clipboard via content script');
    } catch (clipboardError) {
      console.error('Clipboard operation failed:', clipboardError);
      throw new Error('クリップボードへのコピーに失敗しました: ' + clipboardError.message);
    }

    // 通知を表示
    if (settings.enableNotifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        title: 'URLコピー完了',
        message: 'YouTube URLをクリップボードにコピーしました'
      });
    }

    return { success: true };

  } catch (error) {
    console.error('URLコピーエラー:', error);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      title: 'エラー',
      message: error.message || 'エラーが発生しました'
    });
    return { success: false, error: error.message };
  }
}

// メニューIDから形式を取得
function getFormatFromMenuId(menuId) {
  switch (menuId) {
    case 'copy-url-only':
      return 'url-only';
    case 'copy-title-url':
      return 'title-url';
    case 'copy-markdown':
      return 'markdown';
    default:
      return 'url-only';
  }
}