/*
  Minimal utilities to convert between Markdown and Atlassian Document Format (ADF).

  Supported constructs (both directions):
  - Headings: # .. ######
  - Paragraphs
  - Inline: strong (**bold**), em (*italic*), code (`code`), links [label](href)
  - Bullet and ordered lists (single level)
  - Code blocks ```lang
  - Blockquotes >
  - Hard breaks inside paragraphs

  Notes:
  - This is a pragmatic subset intended for common descriptions.
  - Unknown nodes are skipped during ADF->Markdown, and plain lines are paragraphs in Markdown->ADF.
*/

export type ADFTextMark =
  | { type: "strong" }
  | { type: "em" }
  | { type: "code" }
  | { type: "link"; attrs: { href: string } };

export type ADFTextNode = {
  type: "text";
  text: string;
  marks?: ADFTextMark[];
};

export type ADFHardBreakNode = { type: "hardBreak" };

export type ADFParagraphNode = {
  type: "paragraph";
  content?: (ADFTextNode | ADFHardBreakNode)[];
};

export type ADFHeadingNode = {
  type: "heading";
  attrs: { level: 1 | 2 | 3 | 4 | 5 | 6 };
  content?: ADFTextNode[];
};

export type ADFListItemNode = {
  type: "listItem";
  content: ADFParagraphNode[];
};

export type ADFBulletListNode = {
  type: "bulletList";
  content: ADFListItemNode[];
};

export type ADFOrderedListNode = {
  type: "orderedList";
  content: ADFListItemNode[];
};

export type ADFCodeBlockNode = {
  type: "codeBlock";
  attrs?: { language?: string };
  content?: ADFTextNode[];
};

export type ADFBlockquoteNode = {
  type: "blockquote";
  content: (
    | ADFParagraphNode
    | ADFHeadingNode
    | ADFBulletListNode
    | ADFOrderedListNode
    | ADFCodeBlockNode
  )[];
};

export type ADFNode =
  | ADFParagraphNode
  | ADFHeadingNode
  | ADFBulletListNode
  | ADFOrderedListNode
  | ADFListItemNode
  | ADFTextNode
  | ADFHardBreakNode
  | ADFCodeBlockNode
  | ADFBlockquoteNode;

export type ADFDoc = {
  version: 1;
  type: "doc";
  content: ADFNode[];
};

// Public API
export function markdownToADF(markdown: string): ADFDoc {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");

  const doc: ADFDoc = { version: 1, type: "doc", content: [] };

  let bufferParagraph: string[] = [];
  let inCodeBlock = false;
  let codeBlockLang = "";
  let codeBlockLines: string[] = [];
  let currentBulletList: string[] | null = null;
  let currentOrderedList: string[] | null = null;
  let currentBlockquote: string[] | null = null;

  function flushParagraph() {
    if (bufferParagraph.length === 0) return;
    const text = bufferParagraph.join("\n");
    doc.content.push(createParagraphFromText(text));
    bufferParagraph = [];
  }

  function flushBulletList() {
    if (!currentBulletList || currentBulletList.length === 0) return;
    const list: ADFBulletListNode = {
      type: "bulletList",
      content: currentBulletList.map((item) => ({
        type: "listItem",
        content: [createParagraphFromText(item)],
      })),
    };
    doc.content.push(list);
    currentBulletList = null;
  }

  function flushOrderedList() {
    if (!currentOrderedList || currentOrderedList.length === 0) return;
    const list: ADFOrderedListNode = {
      type: "orderedList",
      content: currentOrderedList.map((item) => ({
        type: "listItem",
        content: [createParagraphFromText(item)],
      })),
    };
    doc.content.push(list);
    currentOrderedList = null;
  }

  function flushBlockquote() {
    if (!currentBlockquote || currentBlockquote.length === 0) return;
    const content = currentBlockquote.map((line) =>
      createParagraphFromText(line)
    );
    doc.content.push({ type: "blockquote", content });
    currentBlockquote = null;
  }

  for (const rawLine of lines) {
    const line = rawLine;

    // Fence start/end
    const fenceMatch = line.match(/^```(.*)$/);
    if (fenceMatch) {
      if (inCodeBlock) {
        // flush code
        doc.content.push(
          createCodeBlock(codeBlockLines.join("\n"), codeBlockLang)
        );
        inCodeBlock = false;
        codeBlockLang = "";
        codeBlockLines = [];
      } else {
        flushParagraph();
        flushBulletList();
        flushOrderedList();
        flushBlockquote();
        inCodeBlock = true;
        codeBlockLang = (fenceMatch[1] || "").trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Blank line => flush paragraph and lists/blockquote
    if (/^\s*$/.test(line)) {
      flushParagraph();
      flushBulletList();
      flushOrderedList();
      flushBlockquote();
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushBulletList();
      flushOrderedList();
      flushBlockquote();
      const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      const text = headingMatch[2];
      doc.content.push(createHeading(level, text));
      continue;
    }

    // Blockquote
    const quoteMatch = line.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      flushBulletList();
      flushOrderedList();
      currentBlockquote = currentBlockquote ?? [];
      currentBlockquote.push(quoteMatch[1]);
      continue;
    }

    // Ordered list
    const orderedMatch = line.match(/^\s*\d+\.\s+(.*)$/);
    if (orderedMatch) {
      flushParagraph();
      flushBulletList();
      flushBlockquote();
      currentOrderedList = currentOrderedList ?? [];
      currentOrderedList.push(orderedMatch[1]);
      continue;
    }

    // Bullet list
    const bulletMatch = line.match(/^\s*[-*]\s+(.*)$/);
    if (bulletMatch) {
      flushParagraph();
      flushOrderedList();
      flushBlockquote();
      currentBulletList = currentBulletList ?? [];
      currentBulletList.push(bulletMatch[1]);
      continue;
    }

    // Otherwise it's part of a paragraph
    bufferParagraph.push(line);
  }

  // Final flush
  flushParagraph();
  flushBulletList();
  flushOrderedList();
  flushBlockquote();

  return doc;
}

export function adfToMarkdown(adf: unknown): string {
  const doc = normalizeADF(adf);
  if (!doc) return "";

  const out: string[] = [];

  function renderTextNode(node: ADFTextNode): string {
    const base = escapeMarkdown(node.text);
    const marks = node.marks ?? [];
    return marks.reduce((acc, mark) => {
      if (mark.type === "strong") return `**${acc}**`;
      if (mark.type === "em") return `*${acc}*`;
      if (mark.type === "code") return `\`${acc}\``;
      if (mark.type === "link" && mark.attrs?.href)
        return `[${acc}](${mark.attrs.href})`;
      return acc;
    }, base);
  }

  function renderInline(content?: (ADFTextNode | ADFHardBreakNode)[]): string {
    if (!content || content.length === 0) return "";
    return content
      .map((n) => (n.type === "hardBreak" ? "\n" : renderTextNode(n)))
      .join("")
      .replace(/\n+/g, "\n");
  }

  function walk(node: ADFNode) {
    switch (node.type) {
      case "heading": {
        const level = Math.max(1, Math.min(6, node.attrs.level));
        out.push(`${"#".repeat(level)} ${renderInline(node.content)}`);
        out.push("");
        break;
      }
      case "paragraph": {
        const text = renderInline(node.content);
        if (text.trim().length) {
          out.push(text);
          out.push("");
        }
        break;
      }
      case "bulletList": {
        for (const item of node.content) {
          const para = item.content?.[0];
          const text =
            para && para.type === "paragraph" ? renderInline(para.content) : "";
          out.push(`- ${text}`);
        }
        out.push("");
        break;
      }
      case "orderedList": {
        let idx = 1;
        for (const item of node.content) {
          const para = item.content?.[0];
          const text =
            para && para.type === "paragraph" ? renderInline(para.content) : "";
          out.push(`${idx}. ${text}`);
          idx += 1;
        }
        out.push("");
        break;
      }
      case "codeBlock": {
        const lang = node.attrs?.language ?? "";
        const text =
          (node.content?.[0]?.type === "text" ? node.content?.[0]?.text : "") ??
          "";
        out.push("```" + lang);
        out.push(text);
        out.push("```");
        out.push("");
        break;
      }
      case "blockquote": {
        for (const c of node.content) {
          // Only paragraphs/headings/code are expected here per our writer
          if (c.type === "paragraph") {
            const text = renderInline(c.content);
            out.push(
              text
                .split("\n")
                .map((l) => "> " + l)
                .join("\n")
            );
          } else if (c.type === "heading") {
            const level = c.attrs.level;
            const text = renderInline(c.content);
            out.push(
              text
                .split("\n")
                .map((l) => "> " + "#".repeat(level) + " " + l)
                .join("\n")
            );
          } else if (c.type === "codeBlock") {
            const lang = c.attrs?.language ?? "";
            const text =
              (c.content?.[0]?.type === "text" ? c.content?.[0]?.text : "") ??
              "";
            out.push(
              [
                "> ```" + lang,
                ...text.split("\n").map((l) => "> " + l),
                "> ```",
              ].join("\n")
            );
          }
        }
        out.push("");
        break;
      }
      default:
        break;
    }
  }

  for (const node of doc.content) {
    walk(node as ADFNode);
  }

  // Trim trailing blank lines
  while (out.length > 0 && out[out.length - 1] === "") out.pop();
  return out.join("\n");
}

// Helpers
function createParagraphFromText(text: string): ADFParagraphNode {
  const lines = text.split("\n");
  const content: (ADFTextNode | ADFHardBreakNode)[] = [];
  lines.forEach((line, idx) => {
    const parts = parseInline(line);
    content.push(...parts);
    if (idx < lines.length - 1) content.push({ type: "hardBreak" });
  });
  return { type: "paragraph", content: content.length ? content : undefined };
}

function createHeading(
  level: 1 | 2 | 3 | 4 | 5 | 6,
  text: string
): ADFHeadingNode {
  const inline = parseInline(text).filter(
    (n) => n.type === "text"
  ) as ADFTextNode[];
  return {
    type: "heading",
    attrs: { level },
    content: inline.length ? inline : undefined,
  };
}

function createCodeBlock(code: string, language?: string): ADFCodeBlockNode {
  const node: ADFCodeBlockNode = {
    type: "codeBlock",
    content: code ? [{ type: "text", text: code }] : undefined,
  };
  if (language) node.attrs = { language };
  return node;
}

function parseInline(line: string): (ADFTextNode | ADFHardBreakNode)[] {
  // Process links first to avoid interfering with other marks
  const tokens: (ADFTextNode | ADFHardBreakNode)[] = [];
  const remaining = line;

  // Tokenize by inline code to avoid formatting inside code spans
  const segments = splitByRegex(remaining, /`([^`]+)`/g);
  segments.forEach((seg, idx) => {
    if (idx % 2 === 1) {
      // code segment
      tokens.push({ type: "text", text: seg, marks: [{ type: "code" }] });
    } else {
      // process links and strong/em inside
      tokenizeMarks(seg, tokens);
    }
  });

  return tokens;
}

function tokenizeMarks(text: string, out: (ADFTextNode | ADFHardBreakNode)[]) {
  if (!text) return;

  // Links [text](url)
  const linkSplit = splitByRegex(text, /\[([^\]]+)\]\(([^)]+)\)/g);
  linkSplit.forEach((part, i) => {
    if (i % 3 === 1) {
      // label
      const label = part;
      const href = linkSplit[i + 1];
      out.push({
        type: "text",
        text: label,
        marks: [{ type: "link", attrs: { href } }],
      });
    } else if (i % 3 !== 2) {
      // normal segment
      tokenizeStrongEm(part, out);
    }
  });
}

function tokenizeStrongEm(
  text: string,
  out: (ADFTextNode | ADFHardBreakNode)[]
) {
  if (!text) return;

  // Strong (**bold**)
  const strongSplit = splitByRegex(text, /\*\*([^*]+)\*\*/g);
  strongSplit.forEach((part, i) => {
    if (i % 2 === 1) {
      out.push({ type: "text", text: part, marks: [{ type: "strong" }] });
    } else {
      // Em (*italic*)
      const emSplit = splitByRegex(part, /\*([^*]+)\*/g);
      emSplit.forEach((e, j) => {
        if (j % 2 === 1) {
          out.push({ type: "text", text: e, marks: [{ type: "em" }] });
        } else if (e) {
          out.push({ type: "text", text: e });
        }
      });
    }
  });
}

function splitByRegex(input: string, regex: RegExp): string[] {
  const result: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(
    regex.source,
    regex.flags.includes("g") ? regex.flags : regex.flags + "g"
  );

  while ((match = re.exec(input))) {
    if (match.index > lastIndex) {
      result.push(input.slice(lastIndex, match.index));
    }
    // push groups (excluding the full match)
    for (let i = 1; i < match.length; i++) {
      result.push(match[i]);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < input.length) {
    result.push(input.slice(lastIndex));
  }
  return result;
}

function normalizeADF(adf: unknown): ADFDoc | null {
  if (!adf || typeof adf !== "object") return null;
  const doc = adf as Partial<ADFDoc>;
  if (doc.type !== "doc" || doc.version !== 1 || !Array.isArray(doc.content))
    return null;
  return doc as ADFDoc;
}

function escapeMarkdown(text: string): string {
  // Preserve text but avoid breaking inline formatting when round-tripping
  return text.replace(/([*_`])/g, "\\$1");
}
