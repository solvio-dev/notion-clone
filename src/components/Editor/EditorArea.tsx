import type { Page } from "../../types";

interface EditorAreaProps {
  page: Page | null;
  onUpdateTitle: (title: string) => void;
}

export function EditorArea({ page, onUpdateTitle }: EditorAreaProps) {
  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center text-notion-secondary">
        <div className="text-center">
          <p className="text-lg">ページを選択するか、新規作成してください</p>
          <p className="text-sm mt-2 opacity-60">
            Cmd+N で新規ページを作成
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[900px] mx-auto px-24 py-20">
        {/* カバー画像 */}
        {page.cover_image && (
          <div className="w-full h-[200px] mb-8 rounded overflow-hidden">
            <img
              src={page.cover_image}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* アイコン */}
        <div className="mb-2">
          <button className="text-6xl hover:bg-notion-hover rounded p-1 transition-colors">
            {page.icon || "📄"}
          </button>
        </div>

        {/* タイトル */}
        <input
          type="text"
          value={page.title}
          onChange={(e) => onUpdateTitle(e.target.value)}
          placeholder="無題"
          className="w-full text-4xl font-bold bg-transparent border-none outline-none text-notion-text placeholder:text-notion-text/20 mb-4"
        />

        {/* エディタ本体（BlockNote統合予定） */}
        <div className="min-h-[200px] text-notion-secondary text-sm">
          <p className="opacity-40">
            「/」を入力してコマンドを使用...
          </p>
        </div>
      </div>
    </div>
  );
}
