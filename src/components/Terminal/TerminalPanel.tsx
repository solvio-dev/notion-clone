import { useState, useRef, useCallback, useEffect } from "react";
import { TerminalTab } from "./TerminalTab";
import type { Theme } from "../../types";

interface TerminalPanelProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
}

interface TabInfo {
  id: string;
  title: string;
}

export function TerminalPanel({ isOpen, onClose, theme }: TerminalPanelProps) {
  const [tabs, setTabs] = useState<TabInfo[]>([
    { id: crypto.randomUUID(), title: "ターミナル 1" },
  ]);
  const [activeTabId, setActiveTabId] = useState(tabs[0]!.id);
  const [height, setHeight] = useState(300);
  const resizingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  const handleAddTab = useCallback(() => {
    const id = crypto.randomUUID();
    const num = tabs.length + 1;
    setTabs((prev) => [...prev, { id, title: `ターミナル ${num}` }]);
    setActiveTabId(id);
  }, [tabs.length]);

  const handleCloseTab = useCallback(
    (id: string) => {
      setTabs((prev) => {
        const next = prev.filter((t) => t.id !== id);
        if (next.length === 0) {
          onClose();
          return prev;
        }
        if (activeTabId === id) {
          setActiveTabId(next[next.length - 1]!.id);
        }
        return next;
      });
    },
    [activeTabId, onClose],
  );

  // リサイズハンドル
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      resizingRef.current = true;
      startYRef.current = e.clientY;
      startHeightRef.current = height;
    },
    [height],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const delta = startYRef.current - e.clientY;
      const newHeight = Math.max(150, Math.min(600, startHeightRef.current + delta));
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      resizingRef.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="border-t border-notion-border bg-notion-bg flex-shrink-0 flex flex-col"
      style={{ height }}
    >
      {/* リサイズハンドル */}
      <div
        className="h-1 cursor-row-resize hover:bg-notion-blue/30 transition-colors"
        onMouseDown={handleResizeStart}
      />

      {/* タブバー */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-notion-border bg-notion-sidebar">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center gap-1 px-3 py-1 text-xs rounded transition-colors ${
                tab.id === activeTabId
                  ? "bg-notion-bg text-notion-text"
                  : "text-notion-secondary hover:text-notion-text hover:bg-notion-hover"
              }`}
              onClick={() => setActiveTabId(tab.id)}
            >
              <span>{tab.title}</span>
              <span
                className="ml-1 opacity-50 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseTab(tab.id);
                }}
              >
                ✕
              </span>
            </button>
          ))}
          <button
            onClick={handleAddTab}
            className="px-2 py-1 text-xs text-notion-secondary hover:text-notion-text transition-colors"
            title="新しいタブ"
          >
            +
          </button>
        </div>
        <button
          onClick={onClose}
          className="text-notion-secondary hover:text-notion-text text-xs px-2"
        >
          ✕
        </button>
      </div>

      {/* ターミナルコンテンツ */}
      <div className="flex-1 relative overflow-hidden">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`absolute inset-0 ${
              tab.id === activeTabId ? "block" : "hidden"
            }`}
          >
            <TerminalTab id={tab.id} theme={theme} isActive={tab.id === activeTabId} />
          </div>
        ))}
      </div>
    </div>
  );
}
