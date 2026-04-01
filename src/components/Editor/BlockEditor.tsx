import { useEffect, useMemo, useCallback } from "react";
import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import {
  useCreateBlockNote,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import type { Theme } from "../../types";

interface BlockEditorProps {
  initialContent?: PartialBlock[];
  onChange?: (content: PartialBlock[]) => void;
  onReady?: (editor: BlockNoteEditor) => void;
  onCreateSubPage?: () => void;
  theme: Theme;
  editable?: boolean;
}

export function BlockEditor({
  initialContent,
  onChange,
  onReady,
  onCreateSubPage,
  theme,
  editable = true,
}: BlockEditorProps) {
  const editor = useCreateBlockNote({
    initialContent:
      initialContent && initialContent.length > 0
        ? initialContent
        : undefined,
  });

  useEffect(() => {
    onReady?.(editor);
  }, [editor, onReady]);

  const blockNoteTheme = useMemo(() => {
    return theme === "dark" ? "dark" : "light";
  }, [theme]);

  const getSlashMenuItems = useCallback(
    (query: string) => {
      const defaultItems = getDefaultReactSlashMenuItems(editor);

      // カスタム「ページ」アイテムを追加
      const pageItem = {
        title: "ページ",
        subtext: "サブページを作成します",
        onItemClick: () => {
          onCreateSubPage?.();
        },
        aliases: ["page", "subpage", "ページ"],
        group: "その他",
      };

      const allItems = [...defaultItems, pageItem];

      // クエリでフィルタ
      if (!query) return allItems;
      const q = query.toLowerCase();
      return allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.aliases?.some((a: string) => a.toLowerCase().includes(q)) ||
          item.subtext?.toLowerCase().includes(q),
      );
    },
    [editor, onCreateSubPage],
  );

  return (
    <div className="blocknote-wrapper">
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={() => onChange?.(editor.document as PartialBlock[])}
        theme={blockNoteTheme}
        slashMenu={false}
        data-notion-editor
      >
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) => getSlashMenuItems(query)}
        />
      </BlockNoteView>
    </div>
  );
}
