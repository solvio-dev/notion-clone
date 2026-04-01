import { Octokit } from "octokit";
import { getDb } from "./database";
import type { GitHubConnection } from "../types";

let octokitCache: Map<string, Octokit> = new Map();

function getOctokit(token: string): Octokit {
  if (!octokitCache.has(token)) {
    octokitCache.set(token, new Octokit({ auth: token }));
  }
  return octokitCache.get(token)!;
}

// 接続管理
export async function getConnections(): Promise<GitHubConnection[]> {
  const db = await getDb();
  return db.select<GitHubConnection[]>(
    "SELECT * FROM github_connections ORDER BY created_at DESC",
  );
}

export async function addConnection(connection: {
  token: string;
  owner: string;
  repo: string;
  branch?: string;
  syncPath?: string;
}): Promise<string> {
  const db = await getDb();
  const id = crypto.randomUUID();
  await db.execute(
    "INSERT INTO github_connections (id, token, owner, repo, branch, sync_path) VALUES (?, ?, ?, ?, ?, ?)",
    [
      id,
      connection.token,
      connection.owner,
      connection.repo,
      connection.branch ?? "main",
      connection.syncPath ?? "/",
    ],
  );
  return id;
}

export async function removeConnection(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM github_sync_map WHERE connection_id = ?", [id]);
  await db.execute("DELETE FROM github_connections WHERE id = ?", [id]);
}

// 接続テスト
export async function testConnection(
  token: string,
  owner: string,
  repo: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const octokit = getOctokit(token);
    await octokit.rest.repos.get({ owner, repo });
    return { ok: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "不明なエラー";
    return { ok: false, error: message };
  }
}

// リポジトリ内のMDファイル一覧取得
export async function listMarkdownFiles(
  connection: GitHubConnection,
): Promise<{ path: string; sha: string }[]> {
  const octokit = getOctokit(connection.token);
  const files: { path: string; sha: string }[] = [];

  async function fetchTree(path: string) {
    const { data } = await octokit.rest.repos.getContent({
      owner: connection.owner,
      repo: connection.repo,
      path,
      ref: connection.branch,
    });

    if (!Array.isArray(data)) return;

    for (const item of data) {
      if (item.type === "file" && item.name.endsWith(".md")) {
        files.push({ path: item.path, sha: item.sha });
      } else if (item.type === "dir") {
        await fetchTree(item.path);
      }
    }
  }

  const syncPath = connection.sync_path === "/" ? "" : connection.sync_path;
  await fetchTree(syncPath);
  return files;
}

// MDファイル読み込み
export async function readMarkdownFile(
  connection: GitHubConnection,
  filePath: string,
): Promise<{ content: string; sha: string }> {
  const octokit = getOctokit(connection.token);
  const { data } = await octokit.rest.repos.getContent({
    owner: connection.owner,
    repo: connection.repo,
    path: filePath,
    ref: connection.branch,
  });

  if (Array.isArray(data) || data.type !== "file") {
    throw new Error("ファイルではありません");
  }

  const content = atob(data.content);
  return { content, sha: data.sha };
}

// MDファイル書き込み（コミット）
export async function writeMarkdownFile(
  connection: GitHubConnection,
  filePath: string,
  content: string,
  message: string,
  sha?: string,
): Promise<string> {
  const octokit = getOctokit(connection.token);
  const { data } = await octokit.rest.repos.createOrUpdateFileContents({
    owner: connection.owner,
    repo: connection.repo,
    path: filePath,
    message,
    content: btoa(unescape(encodeURIComponent(content))),
    branch: connection.branch,
    sha,
  });

  return data.content?.sha ?? "";
}

// 同期マッピング管理
export async function getSyncMapping(
  pageId: string,
  connectionId: string,
): Promise<{ file_path: string; last_sha: string | null } | null> {
  const db = await getDb();
  const rows = await db.select<
    { file_path: string; last_sha: string | null }[]
  >(
    "SELECT file_path, last_sha FROM github_sync_map WHERE page_id = ? AND connection_id = ?",
    [pageId, connectionId],
  );
  return rows[0] ?? null;
}

export async function upsertSyncMapping(
  pageId: string,
  connectionId: string,
  filePath: string,
  sha: string,
): Promise<void> {
  const db = await getDb();
  const existing = await getSyncMapping(pageId, connectionId);
  if (existing) {
    await db.execute(
      "UPDATE github_sync_map SET file_path = ?, last_sha = ?, last_synced_at = datetime('now') WHERE page_id = ? AND connection_id = ?",
      [filePath, sha, pageId, connectionId],
    );
  } else {
    const id = crypto.randomUUID();
    await db.execute(
      "INSERT INTO github_sync_map (id, page_id, connection_id, file_path, last_sha, last_synced_at) VALUES (?, ?, ?, ?, ?, datetime('now'))",
      [id, pageId, connectionId, filePath, sha],
    );
  }
}
