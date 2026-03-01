# sysmoni (システムモニター)

macOS メニューバーに常駐するシステムモニター。
トレイアイコンをクリックするとポップアップで CPU / メモリの使用状況を確認できる。

## 技術スタック

| 用途                 | ライブラリ                                            |
| -------------------- | ----------------------------------------------------- |
| アプリフレームワーク | [Wails v3](https://github.com/wailsapp/wails) (alpha) |
| システム情報取得     | [gopsutil v4](https://github.com/shirou/gopsutil)     |
| フロントエンド       | HTML + CSS + JS (Vanilla)                             |
