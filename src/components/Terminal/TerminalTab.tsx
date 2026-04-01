import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { Command } from "@tauri-apps/plugin-shell";
import "@xterm/xterm/css/xterm.css";
import type { Theme } from "../../types";

interface TerminalTabProps {
  id: string;
  theme: Theme;
  isActive: boolean;
}

const LIGHT_THEME = {
  background: "#FFFFFF",
  foreground: "#37352F",
  cursor: "#37352F",
  cursorAccent: "#FFFFFF",
  selectionBackground: "rgba(45, 170, 219, 0.3)",
  black: "#37352F",
  red: "#D44C47",
  green: "#448361",
  yellow: "#CB912F",
  blue: "#337EA9",
  magenta: "#9065B0",
  cyan: "#337EA9",
  white: "#787774",
  brightBlack: "#787774",
  brightRed: "#D44C47",
  brightGreen: "#448361",
  brightYellow: "#CB912F",
  brightBlue: "#337EA9",
  brightMagenta: "#9065B0",
  brightCyan: "#337EA9",
  brightWhite: "#37352F",
};

const DARK_THEME = {
  background: "#191919",
  foreground: "rgba(255, 255, 255, 0.81)",
  cursor: "rgba(255, 255, 255, 0.81)",
  cursorAccent: "#191919",
  selectionBackground: "rgba(45, 170, 219, 0.3)",
  black: "#191919",
  red: "#E06B6C",
  green: "#529E72",
  yellow: "#CA9849",
  blue: "#5B98BD",
  magenta: "#9A6DD7",
  cyan: "#5B98BD",
  white: "rgba(255, 255, 255, 0.44)",
  brightBlack: "rgba(255, 255, 255, 0.44)",
  brightRed: "#E06B6C",
  brightGreen: "#529E72",
  brightYellow: "#CA9849",
  brightBlue: "#5B98BD",
  brightMagenta: "#9A6DD7",
  brightCyan: "#5B98BD",
  brightWhite: "rgba(255, 255, 255, 0.81)",
};

export function TerminalTab({ id, theme, isActive }: TerminalTabProps) {
  const termRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!termRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const terminal = new Terminal({
      fontFamily: "iawriter-mono, Menlo, Monaco, 'Courier New', monospace",
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: "bar",
      theme: theme === "dark" ? DARK_THEME : LIGHT_THEME,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    terminal.open(termRef.current);
    fitAddon.fit();

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Tauri Shell APIでシェルプロセスを起動
    const cmd = Command.create("exec-shell", [], {
      env: { TERM: "xterm-256color" },
    });

    cmd.on("close", () => {
      terminal.writeln("\r\n[プロセス終了]");
    });

    cmd.on("error", (error: string) => {
      terminal.writeln(`\r\n[エラー: ${error}]`);
    });

    cmd.stdout.on("data", (data: string) => {
      terminal.write(data);
    });

    cmd.stderr.on("data", (data: string) => {
      terminal.write(data);
    });

    // ターミナル入力をシェルに送信
    let childProcess: Awaited<ReturnType<typeof cmd.spawn>> | null = null;

    cmd.spawn().then((child) => {
      childProcess = child;
    }).catch((err) => {
      // Shellプラグインが利用できない場合のフォールバック
      terminal.writeln("ターミナルの起動に失敗しました。");
      terminal.writeln(`エラー: ${err}`);
      terminal.writeln("");
      terminal.writeln("※ Tauri Shell プラグインの設定が必要です。");
      terminal.writeln("  開発モードでは `pnpm tauri dev` で実行してください。");
    });

    terminal.onData((data) => {
      childProcess?.write(data);
    });

    // リサイズ対応
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(termRef.current);

    return () => {
      resizeObserver.disconnect();
      childProcess?.kill();
      terminal.dispose();
      initializedRef.current = false;
    };
    // id, shell をdepsから外す（初期化は一度のみ）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // テーマ変更
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.options.theme =
        theme === "dark" ? DARK_THEME : LIGHT_THEME;
    }
  }, [theme]);

  // アクティブ時にフィット
  useEffect(() => {
    if (isActive && fitAddonRef.current) {
      setTimeout(() => fitAddonRef.current?.fit(), 50);
    }
  }, [isActive]);

  return (
    <div
      ref={termRef}
      data-terminal-id={id}
      className="w-full h-full"
    />
  );
}
