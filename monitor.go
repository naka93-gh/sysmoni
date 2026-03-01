// monitor.go — gopsutil を使った CPU/メモリ情報の取得
//
// フロントエンドに JSON で渡すため、構造体に json タグを付与している。
// cpu.Percent(0, true) は前回呼び出しからの差分で使用率を計算するため、
// 初回は不正確な値を返す。main.go 側で初回呼び出し→短い待機を行い、
// 2回目以降から正確な値が得られるようにしている。
package main

import (
	"github.com/shirou/gopsutil/v4/cpu"
	"github.com/shirou/gopsutil/v4/mem"
)

// CPUInfo はフロントエンドに渡す CPU 使用状況。
// TotalUsage は全コア平均。PerCore は論理コアごとの使用率。
type CPUInfo struct {
	TotalUsage float64   `json:"totalUsage"`
	PerCore    []float64 `json:"perCore"`
	CoreCount  int       `json:"coreCount"`
}

// MemInfo はフロントエンドに渡すメモリ使用状況。
// Total/Used はバイト単位。JS 側で GB に変換して表示する。
type MemInfo struct {
	Total       uint64  `json:"total"`
	Used        uint64  `json:"used"`
	UsedPercent float64 `json:"usedPercent"`
}

// SystemStats は CPU と メモリの情報をまとめた構造体。
// JSON シリアライズして ExecJS でフロントエンドに送る。
type SystemStats struct {
	CPU CPUInfo `json:"cpu"`
	Mem MemInfo `json:"mem"`
}

// GetSystemStats は CPU とメモリの現在の使用状況を返す。
// cpu.Percent に percpu=true のみを使い、全体平均は手動計算している。
// percpu=false と percpu=true で内部の前回値が別管理になるため、
// 片方だけ使うことで計測タイミングのずれを防いでいる。
func GetSystemStats() (*SystemStats, error) {
	perCore, err := cpu.Percent(0, true)
	if err != nil {
		return nil, err
	}
	var total float64
	for _, v := range perCore {
		total += v
	}
	if len(perCore) > 0 {
		total /= float64(len(perCore))
	}

	memStat, err := mem.VirtualMemory()
	if err != nil {
		return nil, err
	}

	return &SystemStats{
		CPU: CPUInfo{
			TotalUsage: total,
			PerCore:    perCore,
			CoreCount:  len(perCore),
		},
		Mem: MemInfo{
			Total:       memStat.Total,
			Used:        memStat.Used,
			UsedPercent: memStat.UsedPercent,
		},
	}, nil
}
