# Notion Clone 仕様書

## 1. プロジェクト概要

### 1.1 目的
個人利用向けのNotionクローンデスクトップアプリを構築する。
Macネイティブアプリとして動作し、ローカルファーストでデータを管理する。

### 1.2 ターゲットユーザー
- 開発者本人（個人利用）

### 1.3 技術スタック
- **Tauri 2** (v2.10.x): デスクトップアプリフレームワーク
- **React 19** + **TypeScript**: フロントエンド
- **Vite**: ビルドツール
- **BlockNote** (v0.47.x): ブロックエディタ
- **SQLite**: ローカルデータベース（tauri-plugin-sql）
- **xterm.js** + **tauri-plugin-pty**: 埋め込みターミナル
- **Octokit.js**: GitHub API連携
- **Tailwind CSS**: スタイリング

---

## 2. 機能仕様

### 2.1 ブロックエディタ

BlockNoteをベースとしたNotion風のブロックベースエディタ。

#### 対応ブロックタイプ
| ブロック | 説明 |
|---------|------|
| テキスト | 通常テキスト |
| 見出し (H1/H2/H3) | 3段階の見出し |
| 箇条書きリスト | `*`, `-`, `+` で作成 |
| 番号付きリスト | `1.`, `a.`, `i.` で作成 |
| To-doリスト | チェックボックス付きリスト |
| トグルリスト | 折りたたみ可能なリスト |
| コードブロック | シンタックスハイライト対応 |
| 引用 | ブロック引用 |
| コールアウト | アイコン付きの強調ボックス |
| 区切り線 | 水平区切り |
| テーブル | 行・列追加可能なテーブル |
| 数式 | LaTeX/KaTeX数式 |
| 画像 | ローカル画像埋め込み |
| ページリンク | 他ページへのリンクブロック |

#### インライン書式
- **太字** (`Cmd+B`, `**text**`)
- *斜体* (`Cmd+I`, `*text*`)
- <u>下線</u> (`Cmd+U`)
- ~~取消線~~ (`Cmd+Shift+S`, `~text~`)
- `インラインコード` (`Cmd+E`, `` `text` ``)
- [リンク]() (`Cmd+K`)
- テキスト色・背景色（10色）

#### スラッシュメニュー
`/` 入力でブロック挿入メニューを表示:
- `/text` → テキスト
- `/h1`, `/h2`, `/h3` → 見出し
- `/bullet` → 箇条書き
- `/numbered` → 番号リスト
- `/todo` → To-do
- `/toggle` → トグル
- `/code` → コードブロック
- `/quote` → 引用
- `/callout` → コールアウト
- `/divider` → 区切り線
- `/table` → テーブル
- `/equation` → 数式
- `/image` → 画像
- `/page` → サブページ作成
- `/turn` → ブロックタイプ変換
- `/color`, `/red` 等 → 色変更
- `/delete` → ブロック削除
- `/duplicate` → ブロック複製

### 2.2 キーボードショートカット

Notionのショートカットを完全踏襲する。

#### テキスト書式
| ショートカット | 動作 |
|--------------|------|
| `Cmd+B` | 太字 |
| `Cmd+I` | 斜体 |
| `Cmd+U` | 下線 |
| `Cmd+Shift+S` | 取消線 |
| `Cmd+E` | インラインコード |
| `Cmd+K` | リンク追加 |
| `Cmd+Shift+M` | コメント追加 |

#### ブロック作成 (Cmd+Option+数字)
| ショートカット | 動作 |
|--------------|------|
| `Cmd+Option+0` | テキスト |
| `Cmd+Option+1` | H1見出し |
| `Cmd+Option+2` | H2見出し |
| `Cmd+Option+3` | H3見出し |
| `Cmd+Option+4` | To-doチェックボックス |
| `Cmd+Option+5` | 箇条書きリスト |
| `Cmd+Option+6` | 番号付きリスト |
| `Cmd+Option+7` | トグルリスト |
| `Cmd+Option+8` | コードブロック |
| `Cmd+Option+9` | 新規ページ / ページ化 |

#### Markdownショートカット（行頭入力）
| 入力 | 動作 |
|-----|------|
| `#` + Space | H1 |
| `##` + Space | H2 |
| `###` + Space | H3 |
| `*`, `-`, `+` + Space | 箇条書き |
| `1.`, `a.`, `i.` + Space | 番号付きリスト |
| `[]` | To-do |
| `>` + Space | トグルリスト |
| `"` + Space | 引用 |
| `---` | 区切り線 |
| ` ``` ` | コードブロック |

#### インライン書式（両端入力）
| 入力 | 動作 |
|-----|------|
| `**text**` | 太字 |
| `*text*` | 斜体 |
| `` `text` `` | インラインコード |
| `~text~` | 取消線 |

#### ブロック操作
| ショートカット | 動作 |
|--------------|------|
| `Esc` | ブロック選択 |
| `Cmd+A` | ブロック全選択 |
| `Cmd+D` | ブロック複製 |
| `Tab` | インデント |
| `Shift+Tab` | アンインデント |
| `Cmd+Shift+↑` | ブロックを上に移動 |
| `Cmd+Shift+↓` | ブロックを下に移動 |
| `Delete` / `Backspace` | ブロック削除 |
| ドラッグ&ドロップ | ブロック並べ替え |
| `Option+ドラッグ` | ブロック複製 |

#### ナビゲーション
| ショートカット | 動作 |
|--------------|------|
| `Cmd+P` / `Cmd+K` | 検索・ページジャンプ |
| `Cmd+[` | 戻る |
| `Cmd+]` | 進む |
| `Cmd+N` | 新規ページ |
| `Cmd+Shift+N` | 新規ウィンドウ |
| `Cmd+Shift+L` | ダークモード切替 |
| `Cmd+F` | ページ内検索 |
| `Cmd+L` | ページURLコピー |

#### メンション・絵文字
| 入力 | 動作 |
|-----|------|
| `@` + ページ名 | ページリンク挿入 |
| `:` + 絵文字名 | 絵文字挿入 |

### 2.3 ページ管理

#### ページ構造
- ページは階層構造（ツリー）で管理
- 各ページは一意のIDを持つ
- ページはサブページを持てる（無制限ネスト）
- ページにはアイコン（絵文字）とカバー画像を設定可能

#### サイドバー
- ページ一覧をツリー表示
- ドラッグ&ドロップでページの並べ替え・階層変更
- ページの新規作成・削除・複製
- お気に入りセクション
- 最近閲覧したページ
- ゴミ箱（削除済みページの復元）

#### ページ検索
- `Cmd+P` / `Cmd+K` でクイックサーチ表示
- ページタイトルによるインクリメンタルサーチ
- 最近閲覧したページの表示
- 全文検索対応

### 2.4 GitHub / Markdown連携

#### GitHub連携
- GitHub Personal Access Token による認証
- リポジトリの選択・接続
- リポジトリ内のMDファイル一覧表示
- MDファイルの読み込み → ページとしてインポート
- ページ → MDファイルとしてエクスポート・コミット
- Pull / Push による双方向同期

#### Markdown変換
- ページ内容 ↔ Markdown の双方向変換
- BlockNoteのブロック → Markdown変換
- Markdown → BlockNoteブロック変換
- フロントマター対応（タイトル、日付、タグ等）

#### 同期モード
- **手動同期**: ユーザーが明示的にPull/Push
- **ワークスペース同期**: 特定フォルダをGitHubリポジトリと紐付け

### 2.5 埋め込みターミナル

#### 概要
VS Code風のターミナルパネルをアプリ下部に配置。
AIツール（Claude Code等）との連携を主目的とする。

#### 実装
- **xterm.js**: ターミナルUIレンダリング
- **tauri-plugin-pty**: PTY（疑似端末）管理

#### 機能
| 機能 | 説明 |
|-----|------|
| 開閉 | `Cmd+`` ` でトグル |
| 複数タブ | タブで複数セッション管理 |
| 分割 | 水平・垂直分割 |
| シェル | デフォルトシェル（zsh/bash）を自動検出 |
| コピー&ペースト | `Cmd+C` / `Cmd+V` 対応 |
| リサイズ | パネルの高さをドラッグで変更 |
| テーマ | エディタのダーク/ライトモードと連動 |

### 2.6 UI / デザイン

#### デザイン原則
- Notionのデザイン・トンマナを踏襲
- クリーンでミニマルなUI
- 余白を活かしたレイアウト
- コンテンツファーストの設計

#### カラーパレット

**ライトモード**
| 要素 | カラー |
|-----|--------|
| 背景 | #FFFFFF |
| サイドバー背景 | #F7F6F3 |
| テキスト | #37352F |
| セカンダリテキスト | #787774 |
| ボーダー | #E9E9E7 |
| ホバー | #EFEFEF |

**ダークモード**
| 要素 | カラー |
|-----|--------|
| 背景 | #191919 |
| サイドバー背景 | #252525 |
| テキスト | #FFFFFFCF |
| セカンダリテキスト | #FFFFFF71 |
| ボーダー | #FFFFFF18 |
| ホバー | #FFFFFF0E |

**テキスト/背景カラー（10色）**
Gray, Brown, Orange, Yellow, Green, Blue, Purple, Pink, Red（ライト/ダーク各モード対応）

#### フォント
3種類のフォントスタイルを切替可能:
- **Default**: system-ui, -apple-system, BlinkMacSystemFont
- **Serif**: Lyon-Text, Georgia, serif
- **Mono**: iawriter-mono, Nitti, Menlo, Courier, monospace

#### レイアウト
```
+-------------------------------------------+
| タイトルバー                                |
+--------+----------------------------------+
|        |                                  |
| サイド   |        エディタ領域                |
| バー    |                                  |
|        |                                  |
|        |                                  |
|        +----------------------------------+
|        |        ターミナルパネル              |
+--------+----------------------------------+
```

---

## 3. データモデル

### 3.1 SQLiteスキーマ

```sql
-- ページテーブル
CREATE TABLE pages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  icon TEXT,                          -- 絵文字アイコン
  cover_image TEXT,                   -- カバー画像パス
  parent_id TEXT REFERENCES pages(id),
  position INTEGER NOT NULL DEFAULT 0,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  font_style TEXT DEFAULT 'default',  -- default/serif/mono
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ブロックテーブル
CREATE TABLE blocks (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                 -- paragraph/heading/list/code/etc
  content TEXT NOT NULL DEFAULT '{}', -- JSON: BlockNoteブロックデータ
  position INTEGER NOT NULL DEFAULT 0,
  parent_block_id TEXT REFERENCES blocks(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- GitHub連携設定
CREATE TABLE github_connections (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL,                -- Personal Access Token (暗号化)
  owner TEXT NOT NULL,                -- リポジトリオーナー
  repo TEXT NOT NULL,                 -- リポジトリ名
  branch TEXT DEFAULT 'main',
  sync_path TEXT DEFAULT '/',         -- 同期対象パス
  last_synced_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- GitHub同期マッピング
CREATE TABLE github_sync_map (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL REFERENCES pages(id),
  connection_id TEXT NOT NULL REFERENCES github_connections(id),
  file_path TEXT NOT NULL,            -- リポジトリ内のファイルパス
  last_sha TEXT,                      -- 最後に同期したファイルのSHA
  last_synced_at DATETIME
);

-- アプリ設定
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- インデックス
CREATE INDEX idx_pages_parent ON pages(parent_id);
CREATE INDEX idx_blocks_page ON blocks(page_id);
CREATE INDEX idx_blocks_parent ON blocks(parent_block_id);
CREATE INDEX idx_sync_map_page ON github_sync_map(page_id);
```

### 3.2 設定項目
| キー | 説明 | デフォルト |
|-----|------|----------|
| `theme` | ライト/ダークモード | `light` |
| `default_font` | デフォルトフォント | `default` |
| `sidebar_width` | サイドバー幅 | `260` |
| `terminal_height` | ターミナル高さ | `300` |
| `terminal_shell` | シェルパス | 自動検出 |

---

## 4. アーキテクチャ

### 4.1 ディレクトリ構成
```
notion-clone/
├── src/                          # Reactフロントエンド
│   ├── components/
│   │   ├── Editor/               # ブロックエディタ
│   │   ├── Sidebar/              # サイドバー
│   │   ├── Terminal/             # ターミナルパネル
│   │   ├── Search/               # 検索モーダル
│   │   └── common/               # 共通コンポーネント
│   ├── hooks/                    # カスタムフック
│   ├── stores/                   # 状態管理
│   ├── services/
│   │   ├── database.ts           # SQLite操作
│   │   ├── github.ts             # GitHub連携
│   │   └── markdown.ts           # MD変換
│   ├── styles/                   # グローバルスタイル
│   ├── types/                    # TypeScript型定義
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/                    # Tauriバックエンド (Rust)
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands/             # Tauriコマンド
│   │   └── lib.rs
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── capabilities/
├── docs/                         # ドキュメント
│   └── SPEC.md
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
└── README.md
```

---

## 5. マイルストーン

### M1: 基盤構築
- Tauri 2 + React + Viteプロジェクト初期化
- SQLiteセットアップ・スキーマ作成
- 基本レイアウト（サイドバー + エディタ領域）
- Tailwind CSS + Notionテーマ設定

### M2: ブロックエディタ
- BlockNote統合
- 全ブロックタイプ対応
- スラッシュメニュー
- Notionキーボードショートカット実装
- インライン書式対応
- ブロック操作（移動・複製・削除）

### M3: ページ管理
- ページCRUD
- サイドバーツリー表示
- ページ階層管理（ドラッグ&ドロップ）
- ページ検索（Cmd+P）
- お気に入り・最近閲覧
- ゴミ箱

### M4: GitHub / Markdown連携
- GitHub認証（PAT）
- リポジトリ接続・管理
- Markdown ↔ ブロック変換
- Pull / Push同期
- 同期マッピング管理

### M5: ターミナル
- xterm.js + PTY統合
- ターミナルパネル開閉（Cmd+`）
- 複数タブ
- 分割表示
- テーマ連動

### M6: 仕上げ
- ダークモード完全対応
- フォント切替
- パフォーマンス最適化
- エラーハンドリング
- アプリアイコン・配布設定
