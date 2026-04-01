import { useState, useCallback } from "react";
import type { Page } from "../../types";
import {
  getDeletedPages,
  restorePage,
  permanentlyDeletePage,
} from "../../services/database";

interface TrashSectionProps {
  onRestore: () => void;
}

export function TrashSection({ onRestore }: TrashSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [deletedPages, setDeletedPages] = useState<Page[]>([]);

  const handleOpen = useCallback(async () => {
    if (!isOpen) {
      const pages = await getDeletedPages();
      setDeletedPages(pages);
    }
    setIsOpen(!isOpen);
  }, [isOpen]);

  const handleRestore = useCallback(
    async (id: string) => {
      await restorePage(id);
      setDeletedPages((prev) => prev.filter((p) => p.id !== id));
      onRestore();
    },
    [onRestore],
  );

  const handlePermanentDelete = useCallback(async (id: string) => {
    await permanentlyDeletePage(id);
    setDeletedPages((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <div className="px-1">
      <button
        onClick={handleOpen}
        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] text-notion-secondary hover:bg-notion-hover hover:text-notion-text transition-colors"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="opacity-70"
        >
          <path d="M3 4h10M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5M4 4l1 9a1 1 0 001 1h4a1 1 0 001-1l1-9" />
        </svg>
        ゴミ箱
      </button>

      {isOpen && (
        <div className="mt-1.5 mx-1 rounded-lg bg-notion-bg overflow-hidden"
          style={{
            boxShadow: "0 0 0 1px rgba(15, 15, 15, 0.05), 0 3px 6px rgba(15, 15, 15, 0.1), 0 9px 24px rgba(15, 15, 15, 0.2)",
          }}
        >
          {deletedPages.length === 0 ? (
            <div className="px-4 py-5 text-center text-[12px] text-notion-secondary">
              ゴミ箱は空です
            </div>
          ) : (
            <div className="max-h-[200px] overflow-y-auto py-1">
              {deletedPages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between px-3 py-2 text-[13px] hover:bg-notion-hover transition-colors"
                >
                  <span className="flex items-center gap-2 truncate text-notion-text">
                    <span className="text-[14px]">{page.icon || "📄"}</span>
                    <span className="truncate">{page.title || "無題"}</span>
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <button
                      onClick={() => handleRestore(page.id)}
                      className="text-[12px] text-notion-blue hover:underline"
                    >
                      復元
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(page.id)}
                      className="text-[12px] text-notion-red hover:underline"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
