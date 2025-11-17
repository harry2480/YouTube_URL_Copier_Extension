package.ps1 — パッケージ化手順

このプロジェクトには `package.ps1`（PowerShell スクリプト）が含まれています。簡単に ZIP を作成できます。

使い方（Windows）

1. PowerShell を開き、拡張フォルダへ移動:

```powershell
cd C:\Users\ryota\py\youtube_url_copier_extension
```

2. スクリプトを実行:

```powershell
powershell -ExecutionPolicy Bypass -File .\package.ps1
```

3. 出力ファイル:

- `C:\Users\ryota\py\youtube_url_copier_extension.zip`

備考:
- 既存の ZIP は上書きされます。
- この ZIP を配布する場合、受け取り側は解凍して `chrome://extensions/` の「Load unpacked」から読み込んでください。

トラブルシュート:
- 実行に失敗する場合は、PowerShell の実行ポリシー設定（ExecutionPolicy）やファイルのアクセス権を確認してください。
