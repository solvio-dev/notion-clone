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
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* モーダル */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-[520px] bg-notion-bg rounded-xl overflow-hidden max-h-[80vh] flex flex-col"
          style={{
            boxShadow:
              "0 0 0 1px rgba(15, 15, 15, 0.05), 0 3px 6px rgba(15, 15, 15, 0.1), 0 9px 24px rgba(15, 15, 15, 0.2)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between px-6 py-5">
            <h2 className="text-[15px] font-semibold text-notion-text">
              GitHub 連携
            </h2>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-md text-notion-secondary hover:bg-notion-hover hover:text-notion-text transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="3" x2="11" y2="11" />
                <line x1="11" y1="3" x2="3" y2="11" />
              </svg>
            </button>
          </div>

          <div className="border-t border-notion-border" />

          {/* コンテンツ */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {/* 接続一覧 */}
            <div className="mb-6">
              <div className="text-[12px] font-medium text-notion-secondary mb-3 uppercase tracking-wide">
                接続済みリポジトリ
              </div>
              {connections.length === 0 ? (
                <div className="py-6 text-center">
                  <div className="text-[28px] mb-2 opacity-30">🔗</div>
                  <p className="text-[13px] text-notion-secondary">
                    リポジトリが接続されていません
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {connections.map((conn) => (
                    <div
                      key={conn.id}
                      className="border border-notion-border rounded-lg p-4 hover:border-notion-secondary/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-notion-secondary">
                            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                          </svg>
                          <span className="text-[13px] font-medium text-notion-text">
                            {conn.owner}/{conn.repo}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemove(conn.id)}
                          className="text-[12px] text-notion-secondary hover:text-notion-red transition-colors"
                        >
                          切断
                        </button>
                      </div>
                      <div className="text-[12px] text-notion-secondary mb-4">
                        ブランチ: {conn.branch} · パス: {conn.sync_path}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePull(conn)}
                          disabled={syncing}
                          className="h-8 px-3 text-[12px] font-medium bg-notion-blue text-white rounded-md hover:opacity-90 disabled:opacity-40 transition-opacity"
                        >
                          ↓ Pull
                        </button>
                        <button
                          onClick={() => handlePush(conn)}
                          disabled={syncing || !currentPageId}
                          className="h-8 px-3 text-[12px] font-medium bg-notion-green text-white rounded-md hover:opacity-90 disabled:opacity-40 transition-opacity"
                        >
                          ↑ Push
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 同期メッセージ */}
            {syncMessage && (
              <div className="mb-5 px-4 py-3 rounded-lg bg-notion-hover text-[13px] text-notion-text">
                {syncMessage}
              </div>
            )}

            {/* 接続追加フォーム */}
            {showAddForm ? (
              <div className="rounded-lg border border-notion-border p-5">
                <div className="text-[13px] font-medium text-notion-text mb-4">
                  新しいリポジトリを接続
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[12px] text-notion-secondary mb-1.5">
                      Personal Access Token
                    </label>
                    <input
                      type="password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxx"
                      className="w-full h-9 px-3 text-[13px] bg-notion-bg border border-notion-border rounded-md text-notion-text placeholder:text-notion-secondary/50 focus:border-notion-blue focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-[12px] text-notion-secondary mb-1.5">
                        オーナー
                      </label>
                      <input
                        type="text"
                        value={owner}
                        onChange={(e) => setOwner(e.target.value)}
                        placeholder="username"
                        className="w-full h-9 px-3 text-[13px] bg-notion-bg border border-notion-border rounded-md text-notion-text placeholder:text-notion-secondary/50 focus:border-notion-blue focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[12px] text-notion-secondary mb-1.5">
                        リポジトリ
                      </label>
                      <input
                        type="text"
                        value={repo}
                        onChange={(e) => setRepo(e.target.value)}
                        placeholder="repo-name"
                        className="w-full h-9 px-3 text-[13px] bg-notion-bg border border-notion-border rounded-md text-notion-text placeholder:text-notion-secondary/50 focus:border-notion-blue focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] text-notion-secondary mb-1.5">
                      ブランチ
                    </label>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="main"
                      className="w-full h-9 px-3 text-[13px] bg-notion-bg border border-notion-border rounded-md text-notion-text placeholder:text-notion-secondary/50 focus:border-notion-blue focus:outline-none transition-colors"
                    />
                  </div>
                  {testResult && (
                    <p className="text-[12px] text-notion-red">{testResult}</p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleAdd}
                      disabled={testing || !token || !owner || !repo}
                      className="h-8 px-4 text-[13px] font-medium bg-notion-blue text-white rounded-md hover:opacity-90 disabled:opacity-40 transition-opacity"
                    >
                      {testing ? "テスト中..." : "接続する"}
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="h-8 px-4 text-[13px] text-notion-secondary hover:text-notion-text hover:bg-notion-hover rounded-md transition-colors"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center justify-center gap-2 h-10 border border-dashed border-notion-border rounded-lg text-[13px] text-notion-secondary hover:bg-notion-hover hover:text-notion-text hover:border-notion-secondary/40 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="7" y1="2" x2="7" y2="12" />
                  <line x1="2" y1="7" x2="12" y2="7" />
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
