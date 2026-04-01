import { useState, useCallback } from "react";
import type { Page } from "../../types";
import { SidebarItem } from "./SidebarItem";
import { TrashSection } from "./TrashSection";
import { getChildPages } from "../../services/database";

interface SidebarProps {
  pages: Page[];
  favorites: Page[];
  currentPageId: string | null;
  onSelectPage: (id: string) => void;
  onAddPage: (parentId?: string | null) => Promise<string>;
  onDeletePage: (id: string) => void;
  onRefresh: () => void;
}

export function Sidebar({
  pages,
  favorites,
  currentPageId,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onRefresh,
}: SidebarProps) {
  const [sidebarWidth] = useState(260);

  const handleAddRootPage = useCallback(async () => {
    const id = await onAddPage(null);
    onSelectPage(id);
  }, [onAddPage, onSelectPage]);

  return (
    <aside
      className="flex flex-col h-full bg-notion-sidebar border-r border-notion-border select-none overflow-hidden flex-shrink-0"
      style={{ width: sidebarWidth }}
    >
      {/* ワークスペース名 */}
      <div className="px-3 py-3 flex items-center gap-2">
        <span className="text-sm font-semibold text-notion-text truncate">
          Notion Clone
        </span>
      </div>

      {/* お気に入り */}
      {favorites.length > 0 && (
        <div className="px-1 mb-1">
          <div className="px-2 py-1 text-xs font-medium text-notion-secondary">
            お気に入り
          </div>
          {favorites.map((page) => (
            <SidebarItem
              key={page.id}
              page={page}
              depth={0}
              isActive={page.id === currentPageId}
              onSelect={onSelectPage}
              onDelete={onDeletePage}
              onAddChild={onAddPage}
              getChildren={getChildPages}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}

      {/* ページ一覧 */}
      <div className="flex-1 overflow-y-auto px-1">
        <div className="px-2 py-1 text-xs font-medium text-notion-secondary flex items-center justify-between">
          <span>ページ</span>
          <button
            onClick={handleAddRootPage}
            className="hover:bg-notion-hover rounded p-0.5 text-notion-secondary hover:text-notion-text transition-colors"
            title="新規ページ"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <line x1="7" y1="2" x2="7" y2="12" />
              <line x1="2" y1="7" x2="12" y2="7" />
            </svg>
          </button>
        </div>
        {pages.map((page) => (
          <SidebarItem
            key={page.id}
            page={page}
            depth={0}
            isActive={page.id === currentPageId}
            onSelect={onSelectPage}
            onDelete={onDeletePage}
            onAddChild={onAddPage}
            getChildren={getChildPages}
            onRefresh={onRefresh}
          />
        ))}
      </div>

      {/* 下部: ゴミ箱 + 新規ページ */}
      <div className="py-2 border-t border-notion-border">
        <TrashSection onRestore={onRefresh} />
        <div className="px-1">
          <button
            onClick={handleAddRootPage}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-notion-secondary hover:bg-notion-hover hover:text-notion-text transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <line x1="8" y1="3" x2="8" y2="13" />
              <line x1="3" y1="8" x2="13" y2="8" />
            </svg>
            新規ページ
          </button>
        </div>
      </div>
    </aside>
  );
}
