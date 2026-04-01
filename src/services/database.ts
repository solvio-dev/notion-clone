import Database from "@tauri-apps/plugin-sql";
import type { Page, Block, Setting } from "../types";

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load("sqlite:notion-clone.db");
  }
  return db;
}

// ページ操作
export async function getPages(): Promise<Page[]> {
  const database = await getDb();
  return database.select<Page[]>(
    "SELECT * FROM pages WHERE is_deleted = 0 ORDER BY position ASC",
  );
}

export async function getPageById(id: string): Promise<Page | null> {
  const database = await getDb();
  const rows = await database.select<Page[]>(
    "SELECT * FROM pages WHERE id = ?",
    [id],
  );
  return rows[0] ?? null;
}

export async function createPage(page: {
  id: string;
  title: string;
  parent_id?: string | null;
  icon?: string | null;
  position?: number;
}): Promise<void> {
  const database = await getDb();
  await database.execute(
    "INSERT INTO pages (id, title, parent_id, icon, position) VALUES (?, ?, ?, ?, ?)",
    [page.id, page.title, page.parent_id ?? null, page.icon ?? null, page.position ?? 0],
  );
}

export async function updatePage(
  id: string,
  updates: Partial<Pick<Page, "title" | "icon" | "cover_image" | "parent_id" | "position" | "is_favorite" | "font_style">>,
): Promise<void> {
  const database = await getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }

  if (fields.length === 0) return;

  fields.push("updated_at = datetime('now')");
  values.push(id);

  await database.execute(
    `UPDATE pages SET ${fields.join(", ")} WHERE id = ?`,
    values,
  );
}

export async function deletePage(id: string): Promise<void> {
  const database = await getDb();
  await database.execute(
    "UPDATE pages SET is_deleted = 1, updated_at = datetime('now') WHERE id = ?",
    [id],
  );
}

export async function getChildPages(parentId: string | null): Promise<Page[]> {
  const database = await getDb();
  if (parentId === null) {
    return database.select<Page[]>(
      "SELECT * FROM pages WHERE parent_id IS NULL AND is_deleted = 0 ORDER BY position ASC",
    );
  }
  return database.select<Page[]>(
    "SELECT * FROM pages WHERE parent_id = ? AND is_deleted = 0 ORDER BY position ASC",
    [parentId],
  );
}

export async function getFavoritePages(): Promise<Page[]> {
  const database = await getDb();
  return database.select<Page[]>(
    "SELECT * FROM pages WHERE is_favorite = 1 AND is_deleted = 0 ORDER BY position ASC",
  );
}

// ブロック操作
export async function getPageContent(pageId: string): Promise<string | null> {
  const database = await getDb();
  const rows = await database.select<Block[]>(
    "SELECT * FROM blocks WHERE page_id = ? ORDER BY position ASC LIMIT 1",
    [pageId],
  );
  return rows[0]?.content ?? null;
}

export async function savePageContent(
  pageId: string,
  content: string,
): Promise<void> {
  const database = await getDb();
  const id = crypto.randomUUID();
  await database.execute(
    `INSERT INTO blocks (id, page_id, type, content, position)
     VALUES (?, ?, 'document', ?, 0)
     ON CONFLICT(page_id, position)
     DO UPDATE SET content = excluded.content, updated_at = datetime('now')`,
    [id, pageId, content],
  );
}

// 設定操作
export async function getSetting(key: string): Promise<string | null> {
  const database = await getDb();
  const rows = await database.select<Setting[]>(
    "SELECT * FROM settings WHERE key = ?",
    [key],
  );
  return rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const database = await getDb();
  await database.execute(
    "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    [key, value],
  );
}
