import { describe, expect, test } from "bun:test";
import { importResponses, parseDelimited } from "../src/spreadsheet";

describe("spreadsheet import", () => {
  test("reads quoted CSV fields", () => {
    expect(parseDelimited('Name,"Book, One"\r\n"Lee, A.",First Choice\r\n')).toEqual([
      ["Name", "Book, One"],
      ["Lee, A.", "First Choice"],
    ]);
  });

  test("imports the Google Forms grid format", () => {
    const result = importResponses('Timestamp,What is your name?,[Example: Book A],[Example: Book B]\nnow,Ada,Second Choice,First Choice');
    expect(result.errors).toEqual([]);
    expect(result.data?.books.map((book) => book.title)).toEqual(["Book A", "Book B"]);
    expect(result.data?.students[0].choices).toEqual(["book-2", "book-1"]);
    expect(result.data?.rankedBooks).toBe(2);
  });

  test("offers duplicate ranks for teacher resolution", () => {
    const result = importResponses('Name,Book A,Book B\nAda,First Choice,First Choice');
    expect(result.errors).toEqual([]);
    expect(result.conflicts[0]).toEqual({
      key: "row-2-rank-1",
      studentName: "Ada",
      rank: 1,
      options: [
        { bookId: "book-1", title: "Book A" },
        { bookId: "book-2", title: "Book B" },
      ],
    });
    const resolved = importResponses('Name,Book A,Book B\nAda,First Choice,First Choice', { "row-2-rank-1": "book-2" });
    expect(resolved.conflicts).toEqual([]);
    expect(resolved.data?.students[0].choices).toEqual(["book-2"]);
  });
});
