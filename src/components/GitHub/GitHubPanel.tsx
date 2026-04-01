import { useState, useEffect, useCallback } from "react";
import type { GitHubConnection } from "../../types";
import {
  getConnections,
  addConnection,
  removeConnection,
  testConnection,
  listMarkdownFiles,
  readMarkdownFile,
  writeMarkdownFile,
  upsertSyncMapping,
} from "../../services/github";
import {
  createPage,
  savePageContent,
  getPageById,
  getPageContent,
} from "../../services/database";
import {
  fromMarkdownWithFrontmatter,
  toMarkdownWithFrontmatter,
  titleToFileName,
} from "../../services/markdown";

interface GitHubPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentPageId: string | null;
  onRefresh: () => void;
  // onSelectPageは将来のインポート後のページ選択で使用予定
  onSelectPage?: (id: string) => void;
}

export function GitHubPanel({
  isOpen,
  onClose,
  currentPageId,
  onRefresh,
}: GitHubPanelProps) {
  const [connections, setConnections] = useState<GitHubConnection[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [token, setToken] = useState("");
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("main");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      getConnections().then(setConnections);
    }
  }, [isOpen]);

  const handleAdd = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testConnection(token, owner, repo);

    if (!result.ok) {
      setTestResult(`接続失敗: ${result.error}`);
      setTesting(false);
      return;
    }

    await addConnection({ token, owner, repo, branch });
    const updated = await getConnections();
    setConnections(updated);
    setShowAddForm(false);
    setToken("");
    setOwner("");
    setRepo("");
    setBranch("main");
    setTestResult(null);
    setTesting(false);
  }, [token, owner, repo, branch]);

  const handleRemove = useCallback(async (id: string) => {
    await removeConnection(id);
    const updated = await getConnections();
    setConnections(updated);
  }, []);

  // Pull: GitHub → ローカル
  const handlePull = useCallback(
    async (connection: GitHubConnection) => {
      setSyncing(true);
      setSyncMessage("ファイル一覧を取得中...");

      try {
        const files = await listMarkdownFiles(connection);
        let imported = 0;

        for (const file of files) {
          setSyncMessage(`インポート中: ${file.path}`);
          const { content } = await readMarkdownFile(connection, file.path);
          const { title, blocks } = fromMarkdownWithFrontmatter(content);

          const pageId = crypto.randomUUID();
          await createPage({
            id: pageId,
            title: title || file.path.replace(/\.md$/, ""),
          });
          await savePageContent(pageId, JSON.stringify(blocks));
          await upsertSyncMapping(pageId, connection.id, file.path, file.sha);
          imported++;
        }

        setSyncMessage(`${imported}件のファイルをインポートしました`);
        onRefresh();
      } catch (error) {
        setSyncMessage(
          `エラー: ${error instanceof Error ? error.message : "不明"}`,
        );
      } finally {
        setSyncing(false);
      }
    },
    [onRefresh],
  );

  // Push: ローカル → GitHub
  const handlePush = useCallback(
    async (connection: GitHubConnection) => {
      if (!currentPageId) {
        setSyncMessage("ページを選択してください");
        return;
      }

      setSyncing(true);
      setSyncMessage("エクスポート中...");

      try {
        const page = await getPageById(currentPageId);
        if (!page) throw new Error("ページが見つかりません");

        const content = await getPageContent(currentPageId);
        const blocks = content ? JSON.parse(content) : [];
        const markdown = toMarkdownWithFrontmatter(page.title, blocks);
        const filePath = titleToFileName(page.title);

        // 既存ファイルのSHAを取得試行
        let existingSha: string | undefined;
        try {
          const { sha } = await readMarkdownFile(connection, filePath);
          existingSha = sha;
        } catch {
          // ファイルが存在しない場合
        }

        const newSha = await writeMarkdownFile(
          connection,
          filePath,
          markdown,
          `更新: ${page.title || "無題"}`,
          existingSha,
        );

        await upsertSyncMapping(
          currentPageId,
          connection.id,
          filePath,
          newSha,
        );
        setSyncMessage(`プッシュ完了: ${filePath}`);
      } catch (error) {
        setSyncMessage(
          `エラー: ${error instanceof Error ? error.message : "不明"}`,
        );
      } finally {
        setSyncing(false);
      }
    },
    [currentPageId],
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="w-full max-w-[600px] bg-notion-bg border border-notion-border rounded-xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-notion-border">
            <h2 className="text-lg font-semibold text-notion-text">
              GitHub連携
            </h2>
            <button
              onClick={onClose}
              className="text-notion-secondary hover:text-notion-text"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* 接続一覧 */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-notion-text mb-3">
                接続済みリポジトリ
              </h3>
              {connections.length === 0 ? (
                <p className="text-sm text-notion-secondary">
                  リポジトリが接続されていません
                </p>
              ) : (
                <div className="space-y-3">
                  {connections.map((conn) => (
                    <div
                      key={conn.id}
                      className="border border-notion-border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-notion-text">
                          {conn.owner}/{conn.repo}
                        </span>
                        <button
                          onClick={() => handleRemove(conn.id)}
                          className="text-xs text-notion-red hover:underline"
                        >
                          切断
                        </button>
                      </div>
                      <div className="text-xs text-notion-secondary mb-3">
                        ブランチ: {conn.branch} | パス: {conn.sync_path}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePull(conn)}
                          disabled={syncing}
                          className="px-3 py-1.5 text-xs bg-notion-blue text-white rounded hover:opacity-90 disabled:opacity-50"
                        >
                          Pull（取得）
                        </button>
                        <button
                          onClick={() => handlePush(conn)}
                          disabled={syncing || !currentPageId}
                          className="px-3 py-1.5 text-xs bg-notion-green text-white rounded hover:opacity-90 disabled:opacity-50"
                        >
                          Push（送信）
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 同期メッセージ */}
            {syncMessage && (
              <div className="mb-4 px-3 py-2 rounded bg-notion-hover text-sm text-notion-text">
                {syncMessage}
              </div>
            )}

            {/* 接続追加フォーム */}
            {showAddForm ? (
              <div className="border border-notion-border rounded-lg p-4">
                <h3 className="text-sm font-medium text-notion-text mb-3">
                  新しいリポジトリを接続
                </h3>
                <div className="space-y-3">
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Personal Access Token"
                    className="w-full px-3 py-2 text-sm bg-notion-bg border border-notion-border rounded text-notion-text placeholder:text-notion-secondary"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={owner}
                      onChange={(e) => setOwner(e.target.value)}
                      placeholder="オーナー"
                      className="flex-1 px-3 py-2 text-sm bg-notion-bg border border-notion-border rounded text-notion-text placeholder:text-notion-secondary"
                    />
                    <input
                      type="text"
                      value={repo}
                      onChange={(e) => setRepo(e.target.value)}
                      placeholder="リポジトリ名"
                      className="flex-1 px-3 py-2 text-sm bg-notion-bg border border-notion-border rounded text-notion-text placeholder:text-notion-secondary"
                    />
                  </div>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="ブランチ (default: main)"
                    className="w-full px-3 py-2 text-sm bg-notion-bg border border-notion-border rounded text-notion-text placeholder:text-notion-secondary"
                  />
                  {testResult && (
                    <p className="text-xs text-notion-red">{testResult}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleAdd}
                      disabled={testing || !token || !owner || !repo}
                      className="px-4 py-2 text-sm bg-notion-blue text-white rounded hover:opacity-90 disabled:opacity-50"
                    >
                      {testing ? "接続テスト中..." : "接続"}
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 text-sm text-notion-secondary hover:text-notion-text"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-notion-border rounded-lg text-sm text-notion-secondary hover:bg-notion-hover hover:text-notion-text transition-colors"
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
                リポジトリを接続
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
