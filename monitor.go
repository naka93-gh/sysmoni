// monitor.go — gopsutil を使ったシステム情報の取得
//
// フロントエンドに JSON で渡すため、構造体に json タグを付与している。
// cpu.Percent(0, true) は前回呼び出しからの差分で使用率を計算するため、
// 初回は不正確な値を返す。main.go 側で初回呼び出し→短い待機を行い、
// 2回目以降から正確な値が得られるようにしている。
//
// ネットワーク速度・プロセス CPU% は前回値との差分から算出する。
package main

import (
	"sort"
	"time"

	"github.com/shirou/gopsutil/v4/cpu"
	"github.com/shirou/gopsutil/v4/disk"
	"github.com/shirou/gopsutil/v4/host"
	"github.com/shirou/gopsutil/v4/mem"
	"github.com/shirou/gopsutil/v4/net"
	"github.com/shirou/gopsutil/v4/process"
)

type HostInfo struct {
	Hostname        string `json:"hostname"`
	OS              string `json:"os"`
	PlatformVersion string `json:"platformVersion"`
	Uptime          uint64 `json:"uptime"`
}

type CPUInfo struct {
	TotalUsage float64   `json:"totalUsage"`
	PerCore    []float64 `json:"perCore"`
	CoreCount  int       `json:"coreCount"`
}

type MemInfo struct {
	Total       uint64  `json:"total"`
	Used        uint64  `json:"used"`
	UsedPercent float64 `json:"usedPercent"`
}

type DiskInfo struct {
	Total       uint64  `json:"total"`
	Used        uint64  `json:"used"`
	UsedPercent float64 `json:"usedPercent"`
}

type NetInfo struct {
	BytesSent uint64  `json:"bytesSent"`
	BytesRecv uint64  `json:"bytesRecv"`
	SendSpeed float64 `json:"sendSpeed"`
	RecvSpeed float64 `json:"recvSpeed"`
}

type ProcessInfo struct {
	PID    int32   `json:"pid"`
	Name   string  `json:"name"`
	CPUPct float64 `json:"cpuPct"`
	MemPct float64 `json:"memPct"`
}

type SystemStats struct {
	Host      HostInfo      `json:"host"`
	CPU       CPUInfo       `json:"cpu"`
	Mem       MemInfo       `json:"mem"`
	Disk      DiskInfo      `json:"disk"`
	Net       NetInfo       `json:"net"`
	Processes []ProcessInfo `json:"processes"`
}

// ネットワーク速度算出用の前回値
var (
	prevBytesSent uint64
	prevBytesRecv uint64
	prevNetTime   time.Time
)

// プロセス CPU% 算出用の前回値
var (
	prevProcCPU  map[int32]float64
	prevProcTime time.Time
)

func getTopProcesses() []ProcessInfo {
	procs, err := process.Processes()
	if err != nil {
		return nil
	}

	now := time.Now()
	currentCPU := make(map[int32]float64, len(procs))
	var infos []ProcessInfo

	for _, p := range procs {
		times, err := p.Times()
		if err != nil {
			continue
		}
		name, err := p.Name()
		if err != nil {
			continue
		}
		memPct, err := p.MemoryPercent()
		if err != nil {
			continue
		}

		totalCPU := times.User + times.System
		currentCPU[p.Pid] = totalCPU

		var cpuPct float64
		if prevProcCPU != nil {
			if prev, ok := prevProcCPU[p.Pid]; ok {
				elapsed := now.Sub(prevProcTime).Seconds()
				if elapsed > 0 {
					cpuPct = (totalCPU - prev) / elapsed * 100
				}
			}
		}

		infos = append(infos, ProcessInfo{
			PID:    p.Pid,
			Name:   name,
			CPUPct: cpuPct,
			MemPct: float64(memPct),
		})
	}

	prevProcCPU = currentCPU
	prevProcTime = now

	sort.Slice(infos, func(i, j int) bool {
		return infos[i].CPUPct > infos[j].CPUPct
	})
	if len(infos) > 5 {
		infos = infos[:5]
	}
	return infos
}

func GetSystemStats() (*SystemStats, error) {
	// Host
	hostStat, err := host.Info()
	if err != nil {
		return nil, err
	}

	// CPU
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

	// Memory
	memStat, err := mem.VirtualMemory()
	if err != nil {
		return nil, err
	}

	// Disk（ルートのみ）
	diskStat, err := disk.Usage("/")
	if err != nil {
		return nil, err
	}

	// Network（en0）
	netInfo := NetInfo{}
	counters, err := net.IOCounters(true)
	if err == nil {
		for _, c := range counters {
			if c.Name == "en0" {
				now := time.Now()
				netInfo.BytesSent = c.BytesSent
				netInfo.BytesRecv = c.BytesRecv
				if !prevNetTime.IsZero() {
					elapsed := now.Sub(prevNetTime).Seconds()
					if elapsed > 0 {
						netInfo.SendSpeed = float64(c.BytesSent-prevBytesSent) / elapsed
						netInfo.RecvSpeed = float64(c.BytesRecv-prevBytesRecv) / elapsed
					}
				}
				prevBytesSent = c.BytesSent
				prevBytesRecv = c.BytesRecv
				prevNetTime = now
				break
			}
		}
	}

	// Processes（top 5 by CPU）
	procs := getTopProcesses()

	return &SystemStats{
		Host: HostInfo{
			Hostname:        hostStat.Hostname,
			OS:              hostStat.OS,
			PlatformVersion: hostStat.PlatformVersion,
			Uptime:          hostStat.Uptime,
		},
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
		Disk: DiskInfo{
			Total:       diskStat.Total,
			Used:        diskStat.Used,
			UsedPercent: diskStat.UsedPercent,
		},
		Net:       netInfo,
		Processes: procs,
	}, nil
}
