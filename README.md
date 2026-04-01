# Notion Clone

個人向けNotionクローンデスクトップアプリ

## 概要

Macデスクトップアプリとして動作する、個人利用向けのNotionライクなノートアプリケーション。
ブロックベースのリッチテキスト編集、GitHub/Markdown連携、埋め込みターミナルを備える。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| デスクトップフレームワーク | Tauri 2 v2.10 (Rust) |
| フロントエンド | React 19 + TypeScript 6 + Vite 8 |
| エディタ | BlockNote v0.47 (Prosemirror/Tiptap ベース) |
| データベース | SQLite (tauri-plugin-sql) |
| ターミナル | xterm.js v6 + tauri-plugin-shell |
| GitHub連携 | Octokit.js v5 |
| スタイリング | Tailwind CSS v4 |

## 主な機能

### ブロックエディタ
- Notion風のブロックベースリッチテキスト編集
- 対応ブロック: テキスト、見出し(H1-H3)、箇条書き、番号リスト、To-do、コードブロック、引用、テーブル、画像
- スラッシュメニュー（`/` で呼び出し）
- ドラッグ&ドロップでブロック並べ替え
- インライン書式（太字、斜体、取消線、インラインコード、リンク）
- テキスト色・背景色（10色）

### Notionショートカット
- `Cmd+B/I/U/E/K` テキスト書式
- `Cmd+Option+0〜9` ブロックタイプ切替
- `Cmd+P/K` ページ検索・ジャンプ
- `Cmd+N` 新規ページ
- `Cmd+Shift+L` ダークモード切替
- `Cmd+`` ` ターミナル開閉
- Markdown記法（`#`, `-`, `1.`, `>`, `---` 等）

### ページ管理
- ページの作成・編集・削除・複製
- サイドバーツリー表示（階層・折りたたみ）
- お気に入り管理
- ゴミ箱（復元・完全削除）
- 検索モーダル（Cmd+P、最近のページ優先）
- 自動保存（デバウンス、保存ステータス表示）

### GitHub/Markdown連携
- GitHub Personal Access Token認証
- リポジトリ接続・管理
- Pull: GitHubのMDファイル → ページインポート
- Push: ページ → MDファイルとしてGitHubへコミット
- Markdown ↔ BlockNote JSON 双方向変換
- フロントマター対応

### 埋め込みターミナル
- xterm.js + Tauri Shell によるフルターミナル
- 複数タブ対応
- ドラッグリサイズ
- ライト/ダークテーマ連動
- AIツール（Claude Code等）をそのまま実行可能

### デザイン
- Notionのデザイン・トンマナを踏襲
- ライトモード（背景 #FFFFFF / サイドバー #F7F6F3）
- ダークモード（背景 #191919 / サイドバー #252525）
- 3種フォント切替（Default / Serif / Mono）
- 10色カラーパレット
- Notion風スクロールバー

## 開発

```bash
# 依存関係インストール
pnpm install

# 開発サーバー起動
pnpm tauri dev

# ビルド
pnpm tauri build
```

## ライセンス

MIT
