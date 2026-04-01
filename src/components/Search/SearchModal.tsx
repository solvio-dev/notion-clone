import { useState, useEffect, useCallback, useRef } from "react";
import type { Page } from "../../types";
import { getPages } from "../../services/database";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPage: (id: string) => void;
  recentPageIds: string[];
}

export function SearchModal({
  isOpen,
  onClose,
  onSelectPage,
  recentPageIds,
}: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [allPages, setAllPages] = useState<Page[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // モーダルが開いたらページ一覧を取得してフォーカス
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      getPages().then(setAllPages);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // フィルタリング結果
  const filteredPages = query.trim()
    ? allPages.filter((p) =>
        p.title.toLowerCase().includes(query.toLowerCase()),
      )
    : // クエリ未入力時は最近のページ優先
      [...allPages].sort((a, b) => {
        const aRecent = recentPageIds.indexOf(a.id);
        const bRecent = recentPageIds.indexOf(b.id);
        if (aRecent !== -1 && bRecent !== -1) return aRecent - bRecent;
        if (aRecent !== -1) return -1;
        if (bRecent !== -1) return 1;
        return 0;
      });

  // キーボードナビゲーション
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredPages.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const page = filteredPages[selectedIndex];
        if (page) {
          onSelectPage(page.id);
          onClose();
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [filteredPages, selectedIndex, onSelectPage, onClose],
  );

  if (!isOpen) return null;

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
      />

      {/* モーダル */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]">
        <div
          className="w-full max-w-[540px] bg-notion-bg rounded-xl overflow-hidden"
          style={{
            boxShadow:
              "0 0 0 1px rgba(15, 15, 15, 0.05), 0 3px 6px rgba(15, 15, 15, 0.1), 0 9px 24px rgba(15, 15, 15, 0.2)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 検索入力 */}
          <div className="flex items-center px-5 py-3.5 border-b border-notion-border">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="text-notion-secondary mr-3 flex-shrink-0"
            >
              <circle
                cx="8.5"
                cy="8.5"
                r="5.5"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <line
                x1="12.5"
                y1="12.5"
                x2="17"
                y2="17"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="ページを検索..."
              className="flex-1 bg-transparent border-none outline-none text-notion-text placeholder:text-notion-secondary/60 text-[15px]"
            />
          </div>

          {/* 検索結果 */}
          <div className="max-h-[360px] overflow-y-auto py-1.5">
            {filteredPages.length === 0 ? (
              <div className="px-4 py-8 text-center text-notion-secondary text-sm">
                ページが見つかりません
              </div>
            ) : (
              filteredPages.slice(0, 20).map((page, index) => (
                <button
                  key={page.id}
                  className={`w-full flex items-center gap-3 px-5 py-2 text-left text-[13px] transition-colors ${
                    index === selectedIndex
                      ? "bg-notion-hover text-notion-text"
                      : "text-notion-text hover:bg-notion-hover"
                  }`}
                  onClick={() => {
                    onSelectPage(page.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <span className="flex-shrink-0 w-5 text-center">
                    {page.icon || "📄"}
                  </span>
                  <span className="truncate text-notion-text">
                    {page.title || "無題"}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
