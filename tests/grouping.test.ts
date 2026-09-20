import { describe, expect, test } from "bun:test";
import { createGroups } from "../src/grouping";

describe("generated groups", () => {
  test("numbers groups sequentially across different books", () => {
    const books = [
      { id: "a", position: 1, title: "Book A" },
      { id: "b", position: 2, title: "Book B" },
    ];
    const students = [
      { id: "1", firstName: "One", lastInitial: "", choices: ["a"] },
      { id: "2", firstName: "Two", lastInitial: "", choices: ["a"] },
      { id: "3", firstName: "Three", lastInitial: "", choices: ["b"] },
      { id: "4", firstName: "Four", lastInitial: "", choices: ["b"] },
    ];
    const result = createGroups(books, students, {
      minimumSize: 2,
      maximumSize: 2,
      strategy: "overall",
      bookLimits: { a: 1, b: 1 },
    }, 1);

    expect(result.groups.map((group) => group.groupNumber)).toEqual([1, 2]);
  });
});
