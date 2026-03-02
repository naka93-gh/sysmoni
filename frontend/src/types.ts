// Go 側の monitor.go の構造体に対応する型定義。
// ExecJS で push される JSON をそのまま受け取る。

export interface HostInfo {
  hostname: string;
  os: string;
  platformVersion: string;
  uptime: number; // 秒
}

export interface CPUInfo {
  totalUsage: number;
  perCore: number[];
  coreCount: number;
}

export interface MemInfo {
  total: number;
  used: number;
  usedPercent: number;
}

export interface DiskInfo {
  total: number;
  used: number;
  usedPercent: number;
}

export interface NetInfo {
  bytesSent: number;
  bytesRecv: number;
  sendSpeed: number;
  recvSpeed: number;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpuPct: number;
  memPct: number;
}

export interface SystemStats {
  host: HostInfo;
  cpu: CPUInfo;
  mem: MemInfo;
  disk: DiskInfo;
  net: NetInfo;
  processes: ProcessInfo[];
}
