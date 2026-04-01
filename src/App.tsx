import { useState, useEffect, useCallback, useRef } from "react";
import { PartialBlock } from "@blocknote/core";
import { Sidebar } from "./components/Sidebar";
import { EditorArea } from "./components/Editor";
import { useTheme } from "./hooks/useTheme";
import { usePages } from "./hooks/usePages";
import {
  getPageById,
  updatePage,
  getPageContent,
  savePageContent,
} from "./services/database";
import type { Page } from "./types";

type SaveStatus = "idle" | "saving" | "saved" | "error";

function App() {
  const { theme, toggleTheme, loaded } = useTheme();
  const { pages, favorites, addPage, removePage, refresh } = usePages();
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [initialContent, setInitialContent] = useState<PartialBlock[]>([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [terminalOpen, setTerminalOpen] = useState(false);

  // タイトルとコンテンツで別々のデバウンスタイマー
  const titleSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSaved = useCallback(() => {
    setSaveStatus("saved");
    if (savedStatusTimerRef.current) clearTimeout(savedStatusTimerRef.current);
    savedStatusTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
  }, []);

  // ページ選択時にデータ取得（レースコンディション防止）
  useEffect(() => {
    let cancelled = false;

    if (!currentPageId) {
      setCurrentPage(null);
      setInitialContent([]);
      setPageLoading(false);
      return;
    }

    setPageLoading(true);

    void (async () => {
      const [page, content] = await Promise.all([
        getPageById(currentPageId),
        getPageContent(currentPageId),
      ]);

      if (cancelled) return;

      setCurrentPage(page);

      try {
        setInitialContent(content ? JSON.parse(content) : []);
      } catch (error) {
        console.error("ページコンテンツのパースに失敗", { currentPageId, error });
        setInitialContent([]);
      }

      setPageLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [currentPageId]);

  // タイトル更新（独立デバウンス）
  const handleUpdateTitle = useCallback(
    (title: string) => {
      if (!currentPageId) return;
      setCurrentPage((prev) => (prev ? { ...prev, title } : null));

      if (titleSaveRef.current) clearTimeout(titleSaveRef.current);
      setSaveStatus("saving");
      titleSaveRef.current = setTimeout(async () => {
        try {
          await updatePage(currentPageId, { title });
          refresh();
          showSaved();
        } catch (error) {
          console.error("タイトル保存エラー", error);
          setSaveStatus("error");
        }
      }, 500);
    },
    [currentPageId, refresh, showSaved],
  );

  // コンテンツ更新（独立デバウンス）
  const handleUpdateContent = useCallback(
    (content: PartialBlock[]) => {
      if (!currentPageId) return;

      if (contentSaveRef.current) clearTimeout(contentSaveRef.current);
      setSaveStatus("saving");
      contentSaveRef.current = setTimeout(async () => {
        try {
          await savePageContent(currentPageId, JSON.stringify(content));
          showSaved();
        } catch (error) {
          console.error("コンテンツ保存エラー", error);
          setSaveStatus("error");
        }
      }, 500);
    },
    [currentPageId, showSaved],
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
      if (e.metaKey && !e.shiftKey && !e.altKey && e.key === "n") {
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
        {/* 保存ステータスバー */}
        {currentPage && (
          <div className="flex items-center justify-end px-4 py-1 text-xs text-notion-secondary border-b border-notion-border">
            {saveStatus === "saving" && <span>保存中...</span>}
            {saveStatus === "saved" && <span>保存済み</span>}
            {saveStatus === "error" && (
              <span className="text-notion-red">保存エラー</span>
            )}
          </div>
        )}

        {/* エディタ */}
        <EditorArea
          page={currentPage}
          theme={theme}
          loading={pageLoading}
          onUpdateTitle={handleUpdateTitle}
          onUpdateContent={handleUpdateContent}
          initialContent={initialContent}
        />

        {/* ターミナルパネル */}
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
