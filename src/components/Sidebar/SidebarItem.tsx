import { useState, useCallback } from "react";
import type { Page } from "../../types";

interface SidebarItemProps {
  page: Page;
  depth: number;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string | null) => Promise<string>;
  getChildren: (parentId: string) => Promise<Page[]>;
}

export function SidebarItem({
  page,
  depth,
  isActive,
  onSelect,
  onDelete,
  onAddChild,
  getChildren,
}: SidebarItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<Page[]>([]);
  const [showMenu, setShowMenu] = useState(false);

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

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setShowMenu(true);
  }, []);

  return (
    <div>
      <div
        className={`group flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-sm transition-colors ${
          isActive
            ? "bg-notion-selected text-notion-text"
            : "text-notion-secondary hover:bg-notion-hover hover:text-notion-text"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(page.id)}
        onContextMenu={handleContextMenu}
      >
        {/* 展開/折りたたみ */}
        <button
          onClick={handleToggle}
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-notion-hover transition-colors"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="currentColor"
            className={`transition-transform ${expanded ? "rotate-90" : ""}`}
          >
            <path d="M3 1L8 5L3 9Z" />
          </svg>
        </button>

        {/* アイコン */}
        <span className="flex-shrink-0 w-5 text-center">
          {page.icon || "📄"}
        </span>

        {/* タイトル */}
        <span className="truncate flex-1">
          {page.title || "無題"}
        </span>

        {/* アクションボタン（ホバー時表示） */}
        <div className="hidden group-hover:flex items-center gap-0.5">
          <button
            onClick={handleAddChild}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-notion-hover"
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
          <div className="absolute z-50 bg-notion-bg border border-notion-border rounded-lg shadow-lg py-1 min-w-[160px]">
            <button
              onClick={handleDelete}
              className="w-full text-left px-3 py-1.5 text-sm text-notion-red hover:bg-notion-hover"
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
            isActive={isActive}
            onSelect={onSelect}
            onDelete={onDelete}
            onAddChild={onAddChild}
            getChildren={getChildren}
          />
        ))}
    </div>
  );
}
