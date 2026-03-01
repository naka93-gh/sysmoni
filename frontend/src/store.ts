// アプリ全体で共有するリアクティブストア。
// Go 側から ExecJS → window.handleStats → setStats の流れでデータが入る。
// 初期値 null はデータ未着を表し、App.tsx で Placeholder 表示に使う。

import { createSignal } from "solid-js";
import type { SystemStats } from "./types";

export const [stats, setStats] = createSignal<SystemStats | null>(null);
