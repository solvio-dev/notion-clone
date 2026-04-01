import { useCallback, useRef } from "react";
import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { BlockEditor } from "./BlockEditor";
import type { Page, Theme } from "../../types";

interface EditorAreaProps {
  page: Page | null;
  theme: Theme;
  loading: boolean;
  onUpdateTitle: (title: string) => void;
  onUpdateContent: (content: PartialBlock[]) => void;
  initialContent: PartialBlock[];
}

export function EditorArea({
  page,
  theme,
  loading,
  onUpdateTitle,
  onUpdateContent,
  initialContent,
}: EditorAreaProps) {
  const editorRef = useRef<BlockNoteEditor | null>(null);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        editorRef.current?.focus();
      }
    },
    [],
  );

  const handleEditorReady = useCallback((editor: BlockNoteEditor) => {
    editorRef.current = editor;
  }, []);

  // ローディング中
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-notion-secondary text-[13px] animate-pulse">
          読み込み中...
        </div>
      </div>
    );
  }

  // ページ未選択
  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center text-notion-secondary">
        <div className="text-center">
          <div className="text-4xl mb-4 opacity-20">📝</div>
          <p className="text-[15px]">ページを選択するか、新規作成してください</p>
          <p className="text-[13px] mt-2 opacity-50">
            Cmd+N で新規ページを作成
          </p>
        </div>
      </div>
    );
  }

  const fontClass =
    page.font_style === "serif"
      ? "font-serif"
      : page.font_style === "mono"
        ? "font-mono"
        : "";

  return (
    <div className={`flex-1 overflow-y-auto ${fontClass}`}>
      <div className="max-w-[708px] mx-auto px-24 pt-9 pb-32">
        {/* カバー画像 */}
        {page.cover_image && (
          <div className="h-[220px] mb-7 -mx-24 overflow-hidden">
            <img
              src={page.cover_image}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* アイコン */}
        <div className="mb-1.5 -ml-1.5">
          <button className="text-[50px] leading-none hover:bg-notion-hover rounded-[5px] p-1.5 transition-colors">
            {page.icon || "📄"}
          </button>
        </div>

        {/* タイトル */}
        <input
          type="text"
          value={page.title}
          onChange={(e) => onUpdateTitle(e.target.value)}
          onKeyDown={handleTitleKeyDown}
          placeholder="無題"
          className="w-full text-[40px] font-[600] leading-[1.05] tracking-[-0.03em] bg-transparent border-none outline-none text-notion-text placeholder:text-notion-tertiary mb-3"
        />

        {/* BlockNoteエディタ */}
        <BlockEditor
          key={page.id}
          initialContent={initialContent}
          onChange={onUpdateContent}
          onReady={handleEditorReady}
          theme={theme}
        />
      </div>
    </div>
  );
}
