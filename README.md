# sysmoni (システムモニター)

macOS メニューバーに常駐するシステムモニター。
トレイアイコンをクリックするとポップアップで CPU / メモリの使用状況を確認できる。

## 技術スタック

| 用途                 | ライブラリ                                                                   |
| -------------------- | ---------------------------------------------------------------------------- |
| アプリフレームワーク | [Wails v3](https://github.com/wailsapp/wails) (alpha)                        |
| システム情報取得     | [gopsutil v4](https://github.com/shirou/gopsutil)                            |
| フロントエンド       | [SolidJS](https://www.solidjs.com/) + [Vite](https://vite.dev/) + TypeScript |

フロントエンドは Vite でビルドし、出力 (`frontend/dist/`) を `embed.FS` でバイナリに埋め込んでいる。
Go → JS のデータ送信は ExecJS push パターンを使用し、SolidJS の Signal で受け取る。
