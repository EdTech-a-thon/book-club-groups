# Group Readers

Group Readers turns student book preferences into balanced reading groups without accounts or a database.

Teachers collect preferences with the Group Readers Google Form template, then either paste the response range from Google Sheets or Excel or choose a downloaded CSV. Every book is a column and each response cell contains a rank such as `First Choice` or `Second Choice`.

The response sheet is parsed and grouped entirely in the browser and is never uploaded. Imported responses, settings, and generated groups are saved in that browser's local storage so a teacher can return to their work. Teachers can clear saved groups or replace the imported sheet from the app at any time.

## Run

```bash
bun install
bun run build
bun run start
```

`bun run dev` starts the same site with live reloading while you are making changes.

## Checks

```bash
bun test
bun run check
bun run build
```
