// Go 側の monitor.go の構造体に対応する型定義。
// ExecJS で push される JSON をそのまま受け取る。

export interface CPUInfo {
  totalUsage: number; // 全コア平均使用率 (0-100)
  perCore: number[]; // コア別使用率
  coreCount: number;
}

export interface MemInfo {
  total: number; // バイト単位
  used: number;
  usedPercent: number; // 0-100
}

export interface SystemStats {
  cpu: CPUInfo;
  mem: MemInfo;
}
