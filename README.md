# YouTube URL Copier Extension

Chrome 拡張機能で、YouTube の動画ページから短縮 URL を様々な形式でコピーできます。

## 機能

- ワンクリックコピー: 拡張機能アイコンをクリックして URL をコピー
- 右クリックメニュー: YouTube ページ上で右クリックしてコピー形式を選択
- キーボードショートカット: `Ctrl+Shift+Y` で素早くコピー
- 複数形式対応:
  - URL のみ: `https://youtu.be/xxxxxx`
  - タイトルと URL: `動画タイトル https://youtu.be/xxxxxx`
  - Markdown 形式: `[動画タイトル](https://youtu.be/xxxxxx)`

## インストール

1. アイコンファイルの準備:
   - `icon16.png` (16x16px)
   - `icon48.png` (48x48px)
   - `icon128.png` (128x128px)

2. Chrome での読み込み:
   - Chrome を開き `chrome://extensions/`
   - 右上の「デベロッパーモード」を有効化
   - 「パッケージ化されていない拡張機能を読み込む」をクリック
   - このプロジェクトフォルダ (`youtube_url_copier_extension`) を選択

3. 権限の確認:
   - 拡張機能が読み込まれたら、権限を確認してください

## 使用方法

1. YouTube の動画ページを開く
2. 拡張機能アイコンをクリックして形式を選択しコピー
3. または右クリックしてメニューから選択
4. またはキーボードショートカットを使用

## 開発

### 環境構築

```bash
npm install
```

### テスト

```bash
npm test
```

### コードフォーマット

```bash
npm run format
```

## 要件

- Google Chrome (Manifest V3 対応)
- Node.js (開発時)

## ライセンス

MIT License

## パッケージ化: `package.ps1`

このリポジトリには、拡張機能フォルダを ZIP にまとめる PowerShell スクリプト `package.ps1` を追加しています。簡単に配布用 ZIP を作成できます。

使い方（Windows、PowerShell）:

1. 拡張機能フォルダに移動します:

```powershell
cd C:\Users\ryota\py\youtube_url_copier_extension
```

2. スクリプトを実行して ZIP を作成します:

```powershell
powershell -ExecutionPolicy Bypass -File .\package.ps1
```

3. 出力: `C:\Users\ryota\py\youtube_url_copier_extension.zip`

備考:

- スクリプトは既存の ZIP を上書きします。
- Chrome は ZIP を直接読み込めません。受け取り側が ZIP を解凍して `chrome://extensions/` の「Load unpacked」から読み込むか、公開フローを使用してください。
