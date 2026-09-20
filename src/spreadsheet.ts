import type { GroupingStudent } from "./grouping";
import type { Book } from "./types";

export type ImportedResponses = {
  books: Book[];
  students: GroupingStudent[];
  rankedBooks: number;
};

export type ImportResult = {
  data?: ImportedResponses;
  errors: string[];
  conflicts: RankConflict[];
};

export type RankConflict = {
  key: string;
  kind: "duplicate" | "missing";
  studentName: string;
  rank: number;
  options: { bookId: string; title: string }[];
};

const rankWords = [
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "eighth",
  "ninth",
  "tenth",
];

function delimiterFor(text: string) {
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  return firstLine.includes("\t") ? "\t" : ",";
}

// Handles quoted commas, quotes, and line breaks from a real CSV export. A
// pasted range from Sheets or Excel follows the same path with tabs instead.
export function parseDelimited(text: string) {
  const delimiter = delimiterFor(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"' && field === "") {
      quoted = true;
    } else if (character === delimiter) {
      row.push(field.trim());
      field = "";
    } else if (character === "\n") {
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else if (character !== "\r") {
      field += character;
    }
  }
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function rankFrom(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  const wordRank = rankWords.findIndex((word) => normalized.startsWith(word));
  if (wordRank >= 0) return wordRank + 1;
  const numeric = normalized.match(/^(10|[1-9])(?:st|nd|rd|th)?(?:\s+choice)?$/);
  return numeric ? Number(numeric[1]) : undefined;
}

function bookTitle(header: string) {
  return header
    .replace(/^\[\s*/, "")
    .replace(/\s*\]$/, "")
    .replace(/^example:\s*/i, "")
    .trim();
}

export function importResponses(text: string, resolutions: Record<string, string> = {}): ImportResult {
  const rows = parseDelimited(text.replace(/^\uFEFF/, ""));
  if (rows.length < 2) return { errors: ["Include the header row and at least one student response."], conflicts: [] };

  const headers = rows[0];
  const nameColumn = headers.findIndex((header) => /\bname\b/i.test(header));
  if (nameColumn < 0) return { errors: ["The sheet needs a student name column."], conflicts: [] };

  const responseRows = rows.slice(1).filter((row) => row.some((cell, index) => index !== 0 && cell));
  const bookColumns = headers
    .map((header, index) => ({ header, index }))
    .filter(({ index }) => index !== nameColumn && responseRows.some((row) => rankFrom(row[index] || "") !== undefined));

  if (bookColumns.length < 2) {
    return { errors: ["I could not find at least two book columns with choices in them."], conflicts: [] };
  }

  const books: Book[] = bookColumns.map(({ header }, index) => ({
    id: `book-${index + 1}`,
    position: index + 1,
    title: bookTitle(header) || `Book ${index + 1}`,
  }));
  const errors: string[] = [];
  const conflicts: RankConflict[] = [];
  const students: GroupingStudent[] = [];
  const expectedRanks = Math.max(
    0,
    ...responseRows.flatMap((row) => bookColumns.map(({ index }) => rankFrom(row[index] || "") || 0)),
  );

  responseRows.forEach((row, rowIndex) => {
    const name = (row[nameColumn] || "").trim();
    let ranked = bookColumns
      .map(({ index }, bookIndex) => ({ rank: rankFrom(row[index] || ""), bookId: books[bookIndex].id }))
      .filter((choice): choice is { rank: number; bookId: string } => choice.rank !== undefined)
      .sort((left, right) => left.rank - right.rank);
    if (!name) {
      errors.push(`Row ${rowIndex + 2} has choices but no student name.`);
      return;
    }
    if (!ranked.length) return;

    const ranks = ranked.map((choice) => choice.rank);
    const duplicates = [...new Set(ranks.filter((rank, index) => ranks.indexOf(rank) !== index))];
    let unresolved = false;
    duplicates.forEach((rank) => {
      const key = `row-${rowIndex + 2}-rank-${rank}`;
      const duplicateChoices = ranked.filter((choice) => choice.rank === rank);
      const selected = resolutions[key];
      if (selected && duplicateChoices.some((choice) => choice.bookId === selected)) {
        ranked = ranked.filter((choice) => choice.rank !== rank || choice.bookId === selected);
      } else {
        unresolved = true;
        conflicts.push({
          key,
          kind: "duplicate",
          studentName: name,
          rank,
          options: duplicateChoices.map((choice) => ({
            bookId: choice.bookId,
            title: books.find((book) => book.id === choice.bookId)?.title || "Book",
          })),
        });
      }
    });
    if (unresolved) {
      return;
    }
    const missing = Array.from({ length: expectedRanks }, (_, index) => index + 1).filter((rank) => !ranked.some((choice) => choice.rank === rank));
    missing.forEach((rank) => {
      const key = `row-${rowIndex + 2}-rank-${rank}`;
      const availableBooks = books.filter((book) => !ranked.some((choice) => choice.bookId === book.id));
      const selected = resolutions[key];
      if (selected && availableBooks.some((book) => book.id === selected)) {
        ranked.push({ rank, bookId: selected });
      } else {
        unresolved = true;
        conflicts.push({
          key,
          kind: "missing",
          studentName: name,
          rank,
          options: availableBooks.map((book) => ({ bookId: book.id, title: book.title })),
        });
      }
    });
    if (unresolved) {
      return;
    }
    ranked.sort((left, right) => left.rank - right.rank);
    const resolvedRanks = ranked.map((choice) => choice.rank);
    if (resolvedRanks.length !== expectedRanks) {
      errors.push(`${name} ranked ${resolvedRanks.length} books; the other responses rank ${expectedRanks}.`);
      return;
    }
    students.push({ id: `student-${rowIndex + 1}`, firstName: name, lastInitial: "", choices: ranked.map((choice) => choice.bookId) });
  });

  if (!students.length && !errors.length && !conflicts.length) errors.push("I could not find any completed student responses.");
  if (errors.length || conflicts.length) return { errors, conflicts };
  return { data: { books, students, rankedBooks: expectedRanks }, errors: [], conflicts: [] };
}
