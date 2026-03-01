// main.go — Wails v3 アプリの起動とシステムトレイ設定
//
// Wails v3 を使い、macOS メニューバーに常駐する CPU モニターを構成する。
// Vite 等のビルドツールを使わず、frontend/ の HTML/CSS/JS を embed.FS で
// 直接バイナリに埋め込んでいる。フロントエンドへのデータ送信には
// Wails のイベント API ではなく ExecJS を使っている。これは Wails v3 の
// JS ランタイムがバンドラ前提（@wailsio/runtime の import）で設計されており、
// バンドラなしの vanilla JS から利用できないため。
package main

import (
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"runtime"
	"time"

	"github.com/shirou/gopsutil/v4/cpu"
	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
	"github.com/wailsapp/wails/v3/pkg/icons"
)

// go:embed は frontend/ ディレクトリをバイナリに埋め込む。
// all: プレフィックスで . や _ 始まりのファイルも含める。
//
//go:embed all:frontend
var assets embed.FS

func main() {
	// embed.FS は "frontend/index.html" のようなパスになるため、
	// fs.Sub で "frontend" を剥がし、ルート直下に index.html が来るようにする。
	// こうしないと AssetFileServerFS が "/" へのリクエストに対応できない。
	frontendFS, _ := fs.Sub(assets, "frontend")

	app := application.New(application.Options{
		Name:        "CPU Monitor",
		Description: "CPU/Memory Monitor",
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(frontendFS),
		},
		Mac: application.MacOptions{
			// Accessory にすると Dock にアイコンを表示しない。
			// メニューバー常駐アプリとして振る舞うために必要。
			ActivationPolicy: application.ActivationPolicyAccessory,
		},
	})

	// Frameless + AlwaysOnTop + Hidden で、メニューバーから
	// ドロップダウンするポップアップ風のウィンドウを実現する。
	// HideOnFocusLost により、ウィンドウ外クリックで自動的に閉じる。
	window := app.Window.NewWithOptions(application.WebviewWindowOptions{
		Width:            320,
		Height:           420,
		Frameless:        true,
		AlwaysOnTop:      true,
		Hidden:           true,
		DisableResize:    true,
		HideOnFocusLost:  true,
		BackgroundColour: application.NewRGB(30, 30, 30),
		URL:              "/",
		Mac: application.MacWindow{
			// macOS のすりガラス風背景を有効にする
			Backdrop: application.MacBackdropTranslucent,
		},
	})

	// ウィンドウの「閉じる」操作を非表示に置き換える。
	// 閉じてしまうと WebView が破棄されて再表示できなくなるため。
	window.RegisterHook(events.Common.WindowClosing, func(e *application.WindowEvent) {
		window.Hide()
		e.Cancel()
	})

	systemTray := app.SystemTray.New()
	if runtime.GOOS == "darwin" {
		// テンプレートアイコンを使うと macOS がダーク/ライトモードに
		// 応じて自動的に色を反転してくれる
		systemTray.SetTemplateIcon(icons.SystrayMacTemplate)
	}

	// 右クリックメニュー。Wails v3 のスマートデフォルトにより、
	// メニューが設定されている + OnRightClick 未設定の場合、
	// 右クリックで自動的にメニューが開く。
	menu := app.NewMenu()
	menu.Add("終了").OnClick(func(ctx *application.Context) {
		app.Quit()
	})
	systemTray.SetMenu(menu)

	// ウィンドウをトレイアイコンに紐づける。Wails v3 のスマートデフォルトにより、
	// AttachWindow + OnClick 未設定の場合、左クリックでウィンドウの表示/非表示がトグルされる。
	// WindowOffset はアイコンとウィンドウ間の余白（px）。
	systemTray.AttachWindow(window).WindowOffset(5)

	// バックグラウンドでシステム情報を定期取得し、トレイラベルとフロントエンドを更新する
	go func() {
		// cpu.Percent(0, true) は前回呼び出しとの差分で計算するため、
		// 初回は基準値の記録だけ行い、500ms 待ってから本計測を始める
		cpu.Percent(0, true)
		time.Sleep(500 * time.Millisecond)

		push := func() {
			stats, err := GetSystemStats()
			if err != nil {
				return
			}
			// メニューバーのラベルを更新（例: "45%"）
			systemTray.SetLabel(fmt.Sprintf("%.0f%%", stats.CPU.TotalUsage))
			// ExecJS でフロントエンドのグローバル関数 handleStats() を直接呼ぶ。
			// JSON を引数としてインライン展開することで、イベント API を介さずにデータを渡す。
			data, _ := json.Marshal(stats)
			window.ExecJS(fmt.Sprintf("handleStats(%s)", string(data)))
		}

		push()

		ticker := time.NewTicker(3 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				push()
			case <-app.Context().Done():
				// アプリ終了時にゴルーチンをクリーンに停止する
				return
			}
		}
	}()

	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
