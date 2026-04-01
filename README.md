# Notion Clone

個人向けNotionクローンデスクトップアプリ

## 概要

Macデスクトップアプリとして動作する、個人利用向けのNotionライクなノートアプリケーション。
ブロックベースのリッチテキスト編集、GitHub/Markdown連携、埋め込みターミナルを備える。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| デスクトップフレームワーク | Tauri 2 (Rust) |
| フロントエンド | React + TypeScript + Vite |
| エディタ | BlockNote (Prosemirror/Tiptap ベース) |
| データベース | SQLite (tauri-plugin-sql) |
| ターミナル | xterm.js + tauri-plugin-pty |
| GitHub連携 | Octokit.js |
| スタイリング | Tailwind CSS |

## 主な機能

- **ブロックエディタ**: Notion風のブロックベースリッチテキスト編集
- **Notionショートカット**: Notionのキーボードショートカットを完全踏襲
- **GitHub/MD連携**: GitHubリポジトリとMarkdownファイルの双方向同期
- **埋め込みターミナル**: AIツール連携用のターミナルパネル
- **ダークモード**: Notionライクなライト/ダークモード切替
- **ローカルファースト**: SQLiteによるローカルデータ永続化

## デザイン

Notionのデザイン・トンマナを踏襲:
- クリーンでミニマルなUI
- ライトモード（背景 #FFFFFF / サイドバー #F7F6F3）
- ダークモード（背景 #191919 / サイドバー #252525）
- 3種フォント切替（Default / Serif / Mono）
- 10色カラーパレット

## 開発

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run tauri dev

# ビルド
npm run tauri build
```

## ライセンス

MIT
