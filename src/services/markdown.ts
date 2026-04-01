// BlockNote JSONとMarkdownの双方向変換
// BlockNoteの内部型は複雑なため、変換レイヤーではanyを許容する
/* eslint-disable @typescript-eslint/no-explicit-any */

// BlockNote JSON → Markdown 変換
export function blocksToMarkdown(blocks: any[]): string {
  const lines: string[] = [];

  for (const block of blocks) {
    const line = blockToMarkdown(block);
    if (line !== null) {
      lines.push(line);
    }
  }

  return lines.join("\n\n");
}

function blockToMarkdown(block: any): string | null {
  const type = block.type ?? "paragraph";
  const text = inlineContentToMarkdown(block.content);

  switch (type) {
    case "paragraph":
      return text;
    case "heading": {
      const level = (block.props as { level?: number })?.level ?? 1;
      return "#".repeat(level) + " " + text;
    }
    case "bulletListItem":
      return "- " + text;
    case "numberedListItem":
      return "1. " + text;
    case "checkListItem": {
      const checked = (block.props as { checked?: boolean })?.checked;
      return `- [${checked ? "x" : " "}] ${text}`;
    }
    case "codeBlock": {
      const language = (block.props as { language?: string })?.language ?? "";
      return "```" + language + "\n" + text + "\n```";
    }
    case "image": {
      const url = (block.props as { url?: string })?.url ?? "";
      const caption = (block.props as { caption?: string })?.caption ?? "";
      return `![${caption}](${url})`;
    }
    case "table":
      return tableToMarkdown(block);
    default:
      return text || null;
  }
}

function inlineContentToMarkdown(content: any): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  return content
    .map((item) => {
      if (typeof item === "string") return item;
      if (item.type === "text") {
        let text = item.text ?? "";
        const styles = item.styles ?? {};
        if (styles.bold) text = `**${text}**`;
        if (styles.italic) text = `*${text}*`;
        if (styles.strikethrough) text = `~~${text}~~`;
        if (styles.code) text = `\`${text}\``;
        return text;
      }
      if (item.type === "link") {
        const linkText = inlineContentToMarkdown(item.content);
        return `[${linkText}](${item.href ?? ""})`;
      }
      return "";
    })
    .join("");
}

function tableToMarkdown(block: any): string {
  const tableContent = block.content as { type: string; rows?: { cells: string[][] }[] } | undefined;
  if (!tableContent || !("rows" in tableContent)) return "";

  const rows = (tableContent as unknown as { rows: { cells: string[][] }[] }).rows ?? [];
  if (rows.length === 0) return "";

  const lines: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const cells = row.cells.map((cell) => cell.join(""));
    lines.push("| " + cells.join(" | ") + " |");
    if (i === 0) {
      lines.push("| " + cells.map(() => "---").join(" | ") + " |");
    }
  }
  return lines.join("\n");
}

// Markdown → BlockNote JSON 変換
export function markdownToBlocks(markdown: string): any[] {
  const lines = markdown.split("\n");
  const blocks: any[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    // 空行スキップ
    if (line.trim() === "") {
      i++;
      continue;
    }

    // コードブロック
    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.startsWith("```")) {
        codeLines.push(lines[i]!);
        i++;
      }
      i++; // 閉じ```をスキップ
      blocks.push({
        type: "codeBlock",
        props: { language },
        content: [{ type: "text", text: codeLines.join("\n"), styles: {} }],
      });
      continue;
    }

    // 見出し
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        props: { level: headingMatch[1]!.length as 1 | 2 | 3 },
        content: parseInlineContent(headingMatch[2]!),
      });
      i++;
      continue;
    }

    // チェックリスト
    const checkMatch = line.match(/^-\s+\[([ x])\]\s+(.*)/);
    if (checkMatch) {
      blocks.push({
        type: "checkListItem",
        props: { checked: checkMatch[1] === "x" },
        content: parseInlineContent(checkMatch[2]!),
      });
      i++;
      continue;
    }

    // 箇条書き
    const bulletMatch = line.match(/^[-*+]\s+(.*)/);
    if (bulletMatch) {
      blocks.push({
        type: "bulletListItem",
        content: parseInlineContent(bulletMatch[1]!),
      });
      i++;
      continue;
    }

    // 番号付きリスト
    const numberedMatch = line.match(/^\d+\.\s+(.*)/);
    if (numberedMatch) {
      blocks.push({
        type: "numberedListItem",
        content: parseInlineContent(numberedMatch[1]!),
      });
      i++;
      continue;
    }

    // 画像
    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imageMatch) {
      blocks.push({
        type: "image",
        props: { url: imageMatch[2], caption: imageMatch[1] },
      });
      i++;
      continue;
    }

    // 区切り線
    if (/^---+$/.test(line.trim())) {
      blocks.push({ type: "paragraph", content: [] });
      i++;
      continue;
    }

    // 通常のパラグラフ
    blocks.push({
      type: "paragraph",
      content: parseInlineContent(line),
    });
    i++;
  }

  return blocks;
}

function parseInlineContent(text: string): any[] {
  const result: Array<{ type: "text"; text: string; styles: Record<string, boolean> }> = [];

  // シンプルなパーサー: **bold**, *italic*, `code`, ~~strikethrough~~
  let remaining = text;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
    if (boldMatch) {
      result.push({ type: "text", text: boldMatch[1]!, styles: { bold: true } });
      remaining = remaining.slice(boldMatch[0]!.length);
      continue;
    }

    // Strikethrough
    const strikeMatch = remaining.match(/^~~(.+?)~~/);
    if (strikeMatch) {
      result.push({ type: "text", text: strikeMatch[1]!, styles: { strikethrough: true } });
      remaining = remaining.slice(strikeMatch[0]!.length);
      continue;
    }

    // Italic
    const italicMatch = remaining.match(/^\*(.+?)\*/);
    if (italicMatch) {
      result.push({ type: "text", text: italicMatch[1]!, styles: { italic: true } });
      remaining = remaining.slice(italicMatch[0]!.length);
      continue;
    }

    // Inline code
    const codeMatch = remaining.match(/^`(.+?)`/);
    if (codeMatch) {
      result.push({ type: "text", text: codeMatch[1]!, styles: { code: true } });
      remaining = remaining.slice(codeMatch[0]!.length);
      continue;
    }

    // 普通のテキスト（次のマークダウン記法まで）
    const nextSpecial = remaining.slice(1).search(/[*~`]/);
    if (nextSpecial === -1) {
      result.push({ type: "text", text: remaining, styles: {} });
      break;
    } else {
      result.push({ type: "text", text: remaining.slice(0, nextSpecial + 1), styles: {} });
      remaining = remaining.slice(nextSpecial + 1);
    }
  }

  return result;
}

// ページタイトルからファイル名を生成
export function titleToFileName(title: string): string {
  if (!title.trim()) return "untitled.md";
  const sanitized = title
    .replace(/[/\\:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .toLowerCase();
  return sanitized + ".md";
}

// フロントマター付きMarkdown生成
export function toMarkdownWithFrontmatter(
  title: string,
  blocks: any[],
  metadata?: Record<string, string>,
): string {
  const frontmatter: string[] = ["---"];
  frontmatter.push(`title: "${title}"`);
  frontmatter.push(`date: "${new Date().toISOString()}"`);
  if (metadata) {
    for (const [key, value] of Object.entries(metadata)) {
      frontmatter.push(`${key}: "${value}"`);
    }
  }
  frontmatter.push("---");
  frontmatter.push("");

  const body = blocksToMarkdown(blocks);
  return frontmatter.join("\n") + body;
}

// フロントマター付きMarkdownからタイトルとブロックを抽出
export function fromMarkdownWithFrontmatter(markdown: string): {
  title: string;
  blocks: any[];
  metadata: Record<string, string>;
} {
  const metadata: Record<string, string> = {};
  let body = markdown;
  let title = "";

  // フロントマター抽出
  const fmMatch = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (fmMatch) {
    const fmLines = fmMatch[1]!.split("\n");
    for (const line of fmLines) {
      const kvMatch = line.match(/^(\w+):\s*"?([^"]*)"?$/);
      if (kvMatch) {
        metadata[kvMatch[1]!] = kvMatch[2]!;
      }
    }
    title = metadata["title"] ?? "";
    body = fmMatch[2]!;
  }

  const blocks = markdownToBlocks(body);
  return { title, blocks, metadata };
}
