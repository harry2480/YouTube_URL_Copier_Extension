// popup.js - Popup script for YouTube URL Copier Extension

document.addEventListener('DOMContentLoaded', function() {
  const formatSelect = document.getElementById('format-select');
  const copyBtn = document.getElementById('copy-btn');
  const optionsBtn = document.getElementById('options-btn');
  const statusDiv = document.getElementById('status');

  // 保存された設定を読み込む
  chrome.storage.sync.get({
    copyFormat: 'url-only'
  }, function(settings) {
    formatSelect.value = settings.copyFormat;
  });

  // コピーボタンのクリック
  copyBtn.addEventListener('click', async function() {
    try {
      const format = formatSelect.value;

      // 現在のタブを取得
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || (!tab.url.includes('youtube.com') && !tab.url.includes('youtu.be'))) {
        showStatus('YouTubeの動画ページで使用してください', 'error');
        return;
      }

      // 設定を保存
      chrome.storage.sync.set({ copyFormat: format });

      // background scriptにコピー要求を送る（レスポンスを待たない）
      chrome.runtime.sendMessage({
        action: 'copyUrl',
        format: format
      });

      // すぐにポップアップを閉じる（これによりYouTubeタブにフォーカスが戻る）
      window.close();

    } catch (error) {
      showStatus('エラー: ' + error.message, 'error');
    }
  });

  // 設定ボタンのクリック
  optionsBtn.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });

  // ステータス表示関数
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.style.color = type === 'error' ? '#d93025' : '#188038';
    setTimeout(() => {
      statusDiv.textContent = '';
    }, 3000);
  }
});