import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "./components/Sidebar";
import { EditorArea } from "./components/Editor";
import { useTheme } from "./hooks/useTheme";
import { usePages } from "./hooks/usePages";
import { getPageById, updatePage } from "./services/database";
import type { Page } from "./types";

function App() {
  const { toggleTheme, loaded } = useTheme();
  const { pages, favorites, addPage, removePage } = usePages();
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);

  // ページ選択時にデータ取得
  useEffect(() => {
    if (currentPageId) {
      getPageById(currentPageId).then(setCurrentPage);
    } else {
      setCurrentPage(null);
    }
  }, [currentPageId]);

  // タイトル更新
  const handleUpdateTitle = useCallback(
    async (title: string) => {
      if (!currentPageId) return;
      await updatePage(currentPageId, { title });
      setCurrentPage((prev) => (prev ? { ...prev, title } : null));
    },
    [currentPageId],
  );

  // グローバルキーボードショートカット
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd+Shift+L: ダークモード切替
      if (e.metaKey && e.shiftKey && e.key === "l") {
        e.preventDefault();
        toggleTheme();
      }
      // Cmd+N: 新規ページ
      if (e.metaKey && !e.shiftKey && e.key === "n") {
        e.preventDefault();
        addPage(null).then(setCurrentPageId);
      }
      // Cmd+`: ターミナル開閉
      if (e.metaKey && e.key === "`") {
        e.preventDefault();
        setTerminalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleTheme, addPage]);

  if (!loaded) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-notion-bg">
        <div className="text-notion-secondary text-sm">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-notion-bg text-notion-text overflow-hidden">
      {/* サイドバー */}
      <Sidebar
        pages={pages}
        favorites={favorites}
        currentPageId={currentPageId}
        onSelectPage={setCurrentPageId}
        onAddPage={addPage}
        onDeletePage={removePage}
      />

      {/* メイン領域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* エディタ */}
        <EditorArea page={currentPage} onUpdateTitle={handleUpdateTitle} />

        {/* ターミナルパネル（プレースホルダー） */}
        {terminalOpen && (
          <div className="h-[300px] border-t border-notion-border bg-notion-bg flex-shrink-0">
            <div className="flex items-center justify-between px-4 py-2 border-b border-notion-border">
              <span className="text-xs font-medium text-notion-secondary">
                ターミナル
              </span>
              <button
                onClick={() => setTerminalOpen(false)}
                className="text-notion-secondary hover:text-notion-text text-xs"
              >
                ✕
              </button>
            </div>
            <div className="p-4 text-sm text-notion-secondary font-mono">
              ターミナル（M5で実装予定）
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
