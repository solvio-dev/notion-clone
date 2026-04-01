import { useEffect, useMemo } from "react";
import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import type { Theme } from "../../types";

interface BlockEditorProps {
  initialContent?: PartialBlock[];
  onChange?: (content: PartialBlock[]) => void;
  onReady?: (editor: BlockNoteEditor) => void;
  theme: Theme;
  editable?: boolean;
}

export function BlockEditor({
  initialContent,
  onChange,
  onReady,
  theme,
  editable = true,
}: BlockEditorProps) {
  const editor = useCreateBlockNote({
    initialContent:
      initialContent && initialContent.length > 0
        ? initialContent
        : undefined,
  });

  // エディタ準備完了時にrefを親に渡す
  useEffect(() => {
    onReady?.(editor);
  }, [editor, onReady]);

  const blockNoteTheme = useMemo(() => {
    return theme === "dark" ? "dark" : "light";
  }, [theme]);

  return (
    <div className="blocknote-wrapper">
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={() => onChange?.(editor.document as PartialBlock[])}
        theme={blockNoteTheme}
        data-notion-editor
      />
    </div>
  );
}
