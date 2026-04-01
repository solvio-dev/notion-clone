use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "初期スキーマ作成",
            sql: r#"
                CREATE TABLE IF NOT EXISTS pages (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL DEFAULT '',
                    icon TEXT,
                    cover_image TEXT,
                    parent_id TEXT REFERENCES pages(id),
                    position INTEGER NOT NULL DEFAULT 0,
                    is_favorite INTEGER DEFAULT 0,
                    is_deleted INTEGER DEFAULT 0,
                    font_style TEXT DEFAULT 'default',
                    created_at TEXT DEFAULT (datetime('now')),
                    updated_at TEXT DEFAULT (datetime('now'))
                );

                CREATE TABLE IF NOT EXISTS blocks (
                    id TEXT PRIMARY KEY,
                    page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
                    type TEXT NOT NULL,
                    content TEXT NOT NULL DEFAULT '{}',
                    position INTEGER NOT NULL DEFAULT 0,
                    parent_block_id TEXT REFERENCES blocks(id),
                    created_at TEXT DEFAULT (datetime('now')),
                    updated_at TEXT DEFAULT (datetime('now'))
                );

                CREATE TABLE IF NOT EXISTS github_connections (
                    id TEXT PRIMARY KEY,
                    token TEXT NOT NULL,
                    owner TEXT NOT NULL,
                    repo TEXT NOT NULL,
                    branch TEXT DEFAULT 'main',
                    sync_path TEXT DEFAULT '/',
                    last_synced_at TEXT,
                    created_at TEXT DEFAULT (datetime('now'))
                );

                CREATE TABLE IF NOT EXISTS github_sync_map (
                    id TEXT PRIMARY KEY,
                    page_id TEXT NOT NULL REFERENCES pages(id),
                    connection_id TEXT NOT NULL REFERENCES github_connections(id),
                    file_path TEXT NOT NULL,
                    last_sha TEXT,
                    last_synced_at TEXT
                );

                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_pages_parent ON pages(parent_id);
                CREATE INDEX IF NOT EXISTS idx_blocks_page ON blocks(page_id);
                CREATE INDEX IF NOT EXISTS idx_blocks_parent ON blocks(parent_block_id);
                CREATE INDEX IF NOT EXISTS idx_sync_map_page ON github_sync_map(page_id);

                INSERT OR IGNORE INTO settings (key, value) VALUES ('theme', 'light');
                INSERT OR IGNORE INTO settings (key, value) VALUES ('default_font', 'default');
                INSERT OR IGNORE INTO settings (key, value) VALUES ('sidebar_width', '260');
                INSERT OR IGNORE INTO settings (key, value) VALUES ('terminal_height', '300');
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "blocksテーブルにUNIQUE制約追加",
            sql: r#"
                CREATE UNIQUE INDEX IF NOT EXISTS idx_blocks_page_position
                ON blocks(page_id, position);
            "#,
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:notion-clone.db", migrations)
                .build(),
        )
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
