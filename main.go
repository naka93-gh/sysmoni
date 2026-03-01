// main.go — Wails v3 アプリの起動とシステムトレイ設定
//
// Wails v3 を使い、macOS メニューバーに常駐する CPU モニターを構成する。
// Vite 等のビルドツールを使わず、frontend/ の HTML/CSS/JS を embed.FS で
// 直接バイナリに埋め込んでいる。
//
// Go→JS のデータ送信には ExecJS を使用。ただし macOS WebKit は hidden
// ウィンドウの JS 実行を遅延するため、ウィンドウ表示中のみ push する。
// メニューバーのラベルはウィンドウ状態に関係なく常時更新する。
//
// 既知の問題:
//
//	macOS では Hidden:true で作成したウィンドウの WKWebView が
//	wails:runtime:ready メッセージを postMessage で送っても Go 側に届かない。
//	Wails runtime 自体は inject されるが、runtimeLoaded フラグが立たず
//	ExecJS がキューに溜まったまま実行されない。
//	対策として初回 WindowShow 時に HandleMessage を手動で呼び、
//	runtime ready を強制的にトリガーしている。
package main

import (
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"runtime"
	"sync/atomic"
	"time"

	"github.com/shirou/gopsutil/v4/cpu"
	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
	"github.com/wailsapp/wails/v3/pkg/icons"
)

//go:embed all:frontend
var assets embed.FS

func main() {
	// embed.FS は "frontend/index.html" のようなパスになるため、
	// fs.Sub で "frontend" を剥がし、ルート直下に index.html が来るようにする。
	frontendFS, _ := fs.Sub(assets, "frontend")

	app := application.New(application.Options{
		Name:        "sysmoni",
		Description: "System Monitor",
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(frontendFS),
		},
		Mac: application.MacOptions{
			ActivationPolicy: application.ActivationPolicyAccessory,
		},
	})

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
			Backdrop: application.MacBackdropTranslucent,
		},
	})

	window.RegisterHook(events.Common.WindowClosing, func(e *application.WindowEvent) {
		window.Hide()
		e.Cancel()
	})

	// windowVisible はウィンドウの表示状態を追跡する。
	// ExecJS は hidden ウィンドウでは WebKit に遅延されるため、
	// 表示中のみ push することで無駄な JS キューイングを防ぐ。
	var windowVisible atomic.Bool

	// showCh はウィンドウ表示イベントをバックグラウンド goroutine に通知する。
	// バッファ 1 で、連続表示イベントを溜め込まずに最新のみ通知する。
	showCh := make(chan struct{}, 1)

	// runtimeReady: Hidden ウィンドウでは Wails runtime の "ready" メッセージが
	// macOS WebKit の postMessage で失われ Go に届かない。
	// 初回 WindowShow 時に HandleMessage を手動で呼んで補完する。
	// HandleMessage は冪等: 2回目以降は pendingJS が空なので副作用なし。
	var runtimeReady atomic.Bool

	window.OnWindowEvent(events.Common.WindowShow, func(_ *application.WindowEvent) {
		if runtimeReady.CompareAndSwap(false, true) {
			window.HandleMessage("wails:runtime:ready")
		}
		windowVisible.Store(true)
		select {
		case showCh <- struct{}{}:
		default:
		}
	})
	window.OnWindowEvent(events.Common.WindowHide, func(_ *application.WindowEvent) {
		windowVisible.Store(false)
	})

	systemTray := app.SystemTray.New()
	if runtime.GOOS == "darwin" {
		systemTray.SetTemplateIcon(icons.SystrayMacTemplate)
	}

	menu := app.NewMenu()
	menu.Add("終了").OnClick(func(ctx *application.Context) {
		app.Quit()
	})
	systemTray.SetMenu(menu)

	systemTray.AttachWindow(window).WindowOffset(5)

	go func() {
		cpu.Percent(0, true)
		time.Sleep(500 * time.Millisecond)

		pushToFrontend := func(stats *SystemStats) {
			data, _ := json.Marshal(stats)
			window.ExecJS(fmt.Sprintf("handleStats(%s)", string(data)))
		}

		update := func() {
			stats, err := GetSystemStats()
			if err != nil {
				return
			}
			systemTray.SetLabel(fmt.Sprintf("%.0f%%", stats.CPU.TotalUsage))
			if windowVisible.Load() {
				pushToFrontend(stats)
			}
		}

		update()

		ticker := time.NewTicker(3 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				update()
			case <-showCh:
				update()
			case <-app.Context().Done():
				return
			}
		}
	}()

	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
