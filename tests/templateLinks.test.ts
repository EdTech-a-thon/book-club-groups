import { describe, expect, test } from "bun:test";
import { formTemplateLinks } from "../src/templateLinks";

describe("Google Form templates", () => {
  test("has one direct copy link for every choice count", () => {
    expect(Object.keys(formTemplateLinks).map(Number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(Object.values(formTemplateLinks).every((link) => /^https:\/\/docs\.google\.com\/forms\/d\/[\w-]+\/copy$/.test(link))).toBe(true);
  });
});
