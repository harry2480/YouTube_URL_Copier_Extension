// options.js - Options page script for YouTube URL Copier Extension

document.addEventListener('DOMContentLoaded', function() {
  const copyFormatSelect = document.getElementById('copy-format');
  const enableNotificationsCheckbox = document.getElementById('enable-notifications');
  const shortcutInput = document.getElementById('shortcut');
  const saveBtn = document.getElementById('save-btn');
  const statusDiv = document.getElementById('status');

  // 設定を読み込んでUIに反映
  loadSettings();

  // 保存ボタンのクリック
  saveBtn.addEventListener('click', saveSettings);

  // 現在のショートカットを取得して表示
  chrome.commands.getAll(function(commands) {
    const copyCommand = commands.find(cmd => cmd.name === 'copy-url');
    if (copyCommand && copyCommand.shortcut) {
      shortcutInput.value = copyCommand.shortcut;
    } else {
      shortcutInput.value = '未設定';
    }
  });

  function loadSettings() {
    chrome.storage.sync.get({
      copyFormat: 'url-only',
      enableNotifications: true
    }, function(settings) {
      copyFormatSelect.value = settings.copyFormat;
      enableNotificationsCheckbox.checked = settings.enableNotifications;
    });
  }

  function saveSettings() {
    const settings = {
      copyFormat: copyFormatSelect.value,
      enableNotifications: enableNotificationsCheckbox.checked
    };

    chrome.storage.sync.set(settings, function() {
      if (chrome.runtime.lastError) {
        showStatus('設定の保存に失敗しました: ' + chrome.runtime.lastError.message, 'error');
      } else {
        showStatus('設定を保存しました！', 'success');
      }
    });
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'status';
    }, 3000);
  }
});