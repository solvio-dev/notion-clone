import { useState, useCallback } from "react";
import type { Page } from "../../types";
import { updatePage, duplicatePage } from "../../services/database";

interface SidebarItemProps {
  page: Page;
  depth: number;
  currentPageId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string | null) => Promise<string>;
  getChildren: (parentId: string) => Promise<Page[]>;
  onRefresh?: () => void;
}

export function SidebarItem({
  page,
  depth,
  currentPageId,
  onSelect,
  onDelete,
  onAddChild,
  getChildren,
  onRefresh,
}: SidebarItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<Page[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  const isActive = page.id === currentPageId;

  const handleToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!expanded) {
        const kids = await getChildren(page.id);
        setChildren(kids);
      }
      setExpanded(!expanded);
    },
    [expanded, getChildren, page.id],
  );

  const handleAddChild = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      const id = await onAddChild(page.id);
      const kids = await getChildren(page.id);
      setChildren(kids);
      setExpanded(true);
      onSelect(id);
    },
    [onAddChild, page.id, getChildren, onSelect],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(page.id);
      setShowMenu(false);
    },
    [onDelete, page.id],
  );

  const handleToggleFavorite = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      await updatePage(page.id, {
        is_favorite: page.is_favorite ? 0 : 1,
      });
      setShowMenu(false);
      onRefresh?.();
    },
    [page.id, page.is_favorite, onRefresh],
  );

  const handleDuplicate = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      const newId = await duplicatePage(page.id);
      setShowMenu(false);
      onRefresh?.();
      onSelect(newId);
    },
    [page.id, onRefresh, onSelect],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  }, []);

  return (
    <div>
      <div
        className={`group flex items-center gap-1.5 mx-1 px-2 py-1.5 rounded-md cursor-pointer text-[13px] leading-[1.2] transition-colors ${
          isActive
            ? "bg-notion-selected/80 text-notion-text"
            : "text-notion-secondary hover:bg-notion-hover hover:text-notion-text"
        }`}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        onClick={() => onSelect(page.id)}
        onContextMenu={handleContextMenu}
      >
        {/* 展開/折りたたみ */}
        <button
          onClick={handleToggle}
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-sm opacity-40 group-hover:opacity-100 hover:bg-notion-hover transition-colors"
        >
          <svg
            width="8"
            height="8"
            viewBox="0 0 8 8"
            fill="currentColor"
            className={`transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}
          >
            <path d="M2 1L6 4L2 7Z" />
          </svg>
        </button>

        {/* アイコン */}
        <span className="flex-shrink-0 w-5 text-center text-[14px] leading-none">
          {page.icon || "📄"}
        </span>

        {/* タイトル */}
        <span className="truncate flex-1 leading-normal">
          {page.title || "無題"}
        </span>

        {/* アクションボタン（ホバー時表示） */}
        <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={handleAddChild}
            className="w-5 h-5 flex items-center justify-center rounded-[3px] hover:bg-notion-hover text-notion-secondary"
            title="サブページを追加"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <line x1="6" y1="2" x2="6" y2="10" />
              <line x1="2" y1="6" x2="10" y2="6" />
            </svg>
          </button>
        </div>
      </div>

      {/* 右クリックメニュー */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div
            className="fixed z-50 bg-notion-bg border border-notion-border rounded-lg shadow-lg py-1 min-w-[180px]"
            style={{ left: menuPos.x, top: menuPos.y }}
          >
            <button
              onClick={handleToggleFavorite}
              className="w-full text-left px-3 py-1.5 text-[13px] text-notion-text hover:bg-notion-hover"
            >
              {page.is_favorite ? "お気に入りから削除" : "お気に入りに追加"}
            </button>
            <button
              onClick={handleDuplicate}
              className="w-full text-left px-3 py-1.5 text-[13px] text-notion-text hover:bg-notion-hover"
            >
              複製
            </button>
            <div className="border-t border-notion-border my-1" />
            <button
              onClick={handleDelete}
              className="w-full text-left px-3 py-1.5 text-[13px] text-notion-red hover:bg-notion-hover"
            >
              削除
            </button>
          </div>
        </>
      )}

      {/* 子ページ */}
      {expanded &&
        children.map((child) => (
          <SidebarItem
            key={child.id}
            page={child}
            depth={depth + 1}
            currentPageId={currentPageId}
            onSelect={onSelect}
            onDelete={onDelete}
            onAddChild={onAddChild}
            getChildren={getChildren}
            onRefresh={onRefresh}
          />
        ))}
    </div>
  );
}
