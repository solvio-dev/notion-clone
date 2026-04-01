import { useState, useEffect, useCallback, useRef } from "react";
import { PartialBlock } from "@blocknote/core";
import { Sidebar } from "./components/Sidebar";
import { EditorArea } from "./components/Editor";
import { SearchModal } from "./components/Search";
import { GitHubPanel } from "./components/GitHub";
import { TerminalPanel } from "./components/Terminal";
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [githubOpen, setGithubOpen] = useState(false);
  const [recentPageIds, setRecentPageIds] = useState<string[]>([]);

  const titleSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSaved = useCallback(() => {
    setSaveStatus("saved");
    if (savedStatusTimerRef.current) clearTimeout(savedStatusTimerRef.current);
    savedStatusTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
  }, []);

  // ページ選択＋最近のページトラッキング
  const handleSelectPage = useCallback(
    (id: string) => {
      setCurrentPageId(id);
      setRecentPageIds((prev) => {
        const filtered = prev.filter((pid) => pid !== id);
        return [id, ...filtered].slice(0, 20);
      });
    },
    [],
  );

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

  // タイトル更新
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

  // コンテンツ更新
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
      // Cmd+P / Cmd+K: 検索
      if (e.metaKey && !e.shiftKey && (e.key === "p" || e.key === "k")) {
        e.preventDefault();
        setSearchOpen(true);
      }
      // Cmd+Shift+L: ダークモード切替
      if (e.metaKey && e.shiftKey && e.key === "l") {
        e.preventDefault();
        toggleTheme();
      }
      // Cmd+N: 新規ページ
      if (e.metaKey && !e.shiftKey && !e.altKey && e.key === "n") {
        e.preventDefault();
        addPage(null).then(handleSelectPage);
      }
      // Cmd+`: ターミナル開閉
      if (e.metaKey && e.key === "`") {
        e.preventDefault();
        setTerminalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleTheme, addPage, handleSelectPage]);

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
        onSelectPage={handleSelectPage}
        onAddPage={addPage}
        onDeletePage={removePage}
        onRefresh={refresh}
      />

      {/* メイン領域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ヘッダーバー */}
        <div className="h-[45px] border-b border-notion-border flex-shrink-0">
          <div className="h-full max-w-[900px] mx-auto px-[96px] flex items-center justify-between">
            <div className="min-w-0 flex items-center gap-2 text-[13px] text-notion-secondary">
              {currentPage && (
                <>
                  <span className="opacity-70">{currentPage.icon || "📄"}</span>
                  <span className="truncate text-notion-text/85">
                    {currentPage.title || "無題"}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-[12px] text-notion-secondary">
              {saveStatus === "saving" && (
                <span className="opacity-60">保存中...</span>
              )}
              {saveStatus === "saved" && (
                <span className="opacity-40">保存済み</span>
              )}
              {saveStatus === "error" && (
                <span className="text-notion-red">保存エラー</span>
              )}
              <button
                onClick={() => setGithubOpen(true)}
                className="h-7 px-2.5 rounded-md hover:bg-notion-hover hover:text-notion-text transition-colors"
                title="GitHub連携"
              >
                GitHub
              </button>
            </div>
          </div>
        </div>

        {/* エディタ */}
        <EditorArea
          page={currentPage}
          theme={theme}
          loading={pageLoading}
          onUpdateTitle={handleUpdateTitle}
          onUpdateContent={handleUpdateContent}
          onCreateSubPage={
            currentPageId
              ? () => addPage(currentPageId).then(handleSelectPage)
              : undefined
          }
          initialContent={initialContent}
        />

        {/* ターミナルパネル */}
        <TerminalPanel
          isOpen={terminalOpen}
          onClose={() => setTerminalOpen(false)}
          theme={theme}
        />
      </div>

      {/* 検索モーダル */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectPage={(id) => {
          handleSelectPage(id);
          setSearchOpen(false);
        }}
        recentPageIds={recentPageIds}
      />

      {/* GitHub連携パネル */}
      <GitHubPanel
        isOpen={githubOpen}
        onClose={() => setGithubOpen(false)}
        currentPageId={currentPageId}
        onRefresh={refresh}
        onSelectPage={handleSelectPage}
      />
    </div>
  );
}

export default App;
