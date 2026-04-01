export interface Page {
  id: string;
  title: string;
  icon: string | null;
  cover_image: string | null;
  parent_id: string | null;
  position: number;
  is_favorite: number;
  is_deleted: number;
  font_style: "default" | "serif" | "mono";
  created_at: string;
  updated_at: string;
}

export interface Block {
  id: string;
  page_id: string;
  type: string;
  content: string;
  position: number;
  parent_block_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GitHubConnection {
  id: string;
  token: string;
  owner: string;
  repo: string;
  branch: string;
  sync_path: string;
  last_synced_at: string | null;
  created_at: string;
}

export interface Setting {
  key: string;
  value: string;
}

export type Theme = "light" | "dark";
export type FontStyle = "default" | "serif" | "mono";
