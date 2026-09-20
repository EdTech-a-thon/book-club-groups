<script lang="ts">
  import SiteFooter from "./SiteFooter.svelte";
  import { downloadGroups } from "./export";
  import { createGroups, type GroupingResult, type GroupingStrategy } from "./grouping";
  import { importResponses, type ImportedResponses, type RankConflict } from "./spreadsheet";

  let pasted = $state("");
  let imported = $state<ImportedResponses>();
  let importErrors = $state<string[]>([]);
  let conflicts = $state<RankConflict[]>([]);
  let resolutions = $state<Record<string, string>>({});
  let error = $state("");
  let minimumSize = $state(3);
  let maximumSize = $state(4);
  let strategy = $state<GroupingStrategy>("overall");
  let bookLimits = $state<Record<string, number>>({});
  let result = $state<GroupingResult>();

  function readResponses(text = pasted, keepResolutions = false) {
    error = "";
    result = undefined;
    if (!keepResolutions) resolutions = {};
    const parsed = importResponses(text, resolutions);
    importErrors = parsed.errors;
    conflicts = parsed.conflicts;
    imported = parsed.data;
    if (imported) bookLimits = Object.fromEntries(imported.books.map((book) => [book.id, 1]));
  }

  async function openFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    pasted = await file.text();
    readResponses(pasted);
    input.value = "";
  }

  function generate() {
    if (!imported) return;
    error = "";
    if (!Number.isInteger(minimumSize) || !Number.isInteger(maximumSize) || minimumSize < 2 || maximumSize > 12 || minimumSize > maximumSize) {
      error = "Choose a minimum of at least 2, and make sure the maximum is not smaller than the minimum.";
      return;
    }
    try {
      result = createGroups(imported.books, imported.students, { minimumSize, maximumSize, strategy, bookLimits }, imported.rankedBooks);
    } catch {
      error = "A grouping could not be created with these settings. Try allowing more groups or a smaller minimum.";
    }
  }

  function reset() {
    pasted = "";
    imported = undefined;
    importErrors = [];
    conflicts = [];
    resolutions = {};
    result = undefined;
    error = "";
  }

  function titleFor(bookId: string) {
    return imported?.books.find((book) => book.id === bookId)?.title || "Book";
  }

  function studentName(firstName: string, lastInitial: string) {
    return lastInitial ? `${firstName} ${lastInitial}.` : firstName;
  }

  function ordinal(place: number) {
    const teens = place % 100;
    const suffix = teens >= 11 && teens <= 13 ? "th" : ["th", "st", "nd", "rd"][place % 10] || "th";
    return `${place}${suffix}`;
  }

  function chooseResolution(key: string, bookId: string) {
    resolutions = { ...resolutions, [key]: bookId };
  }
</script>

<header class="local-topbar">
  <a class="brand" href="/"><span class="brand-mark"></span><span>Group Readers</span></a>
  <span class="privacy-pill">Runs in your browser</span>
</header>

<main class="local-home">
  <section class="local-hero shell">
    <div>
      <p class="eyebrow">Book club group maker</p>
      <h1>Turn student choices into balanced reading groups.</h1>
      <p class="local-lede">Collect preferences with your Google Form, paste the spreadsheet here, and get a balanced grouping you can download and adjust.</p>
      <div class="local-promises" aria-label="Privacy details"><span>No account</span><span>No student uploads</span><span>No saved data</span></div>
    </div>
    <div class="local-start-card">
      <p class="eyebrow">1 · Add responses</p>
      <h2>Paste your response sheet.</h2>
      <p>Copy the full range from Google Sheets or Excel, including the header row, or choose its downloaded CSV file.</p>
      <textarea bind:value={pasted} rows="8" aria-label="Spreadsheet responses" placeholder="Paste spreadsheet rows here…"></textarea>
      <div class="import-actions">
        <button class="button primary" disabled={!pasted.trim()} onclick={() => readResponses()}>Read responses</button>
        <label class="button subtle file-button">Choose CSV<input type="file" accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values" onchange={openFile} /></label>
      </div>
      <p class="local-note">Your response sheet stays on this device. It is never uploaded or saved.</p>
    </div>
  </section>

  {#if importErrors.length}
    <section class="shell import-errors" aria-live="polite">
      <div><p class="eyebrow">Check the response sheet</p><h2>{importErrors.length === 1 ? "One response needs attention." : `${importErrors.length} responses need attention.`}</h2><p>Fix these cells in the spreadsheet, then copy and paste it again.</p></div>
      <ul>{#each importErrors as problem}<li>{problem}</li>{/each}</ul>
    </section>
  {/if}

  {#if conflicts.length}
    <section class="shell conflict-panel" aria-live="polite">
      <div class="conflict-heading"><div><p class="eyebrow">Resolve tied choices</p><h2>Which book should keep each duplicated rank?</h2><p>The other book will be treated as unselected for that student.</p></div></div>
      <div class="conflict-list">
        {#each conflicts as conflict}
          <fieldset>
            <legend><strong>{conflict.studentName}</strong> marked more than one book as their {ordinal(conflict.rank)} choice. Which one should they get?</legend>
            <div>
              {#each conflict.options as option}
                <label class:chosen={resolutions[conflict.key] === option.bookId}>
                  <input type="radio" name={conflict.key} checked={resolutions[conflict.key] === option.bookId} onchange={() => chooseResolution(conflict.key, option.bookId)} />
                  <span>{option.title}</span>
                </label>
              {/each}
            </div>
          </fieldset>
        {/each}
      </div>
      <button class="button primary" disabled={conflicts.some((conflict) => !resolutions[conflict.key])} onclick={() => readResponses(pasted, true)}>Use these choices</button>
    </section>
  {/if}

  {#if imported}
    <section class="local-workspace shell">
      <div class="workspace-heading">
        <div><p class="eyebrow">2 · Shape the groups</p><h2>{imported.students.length} students and {imported.books.length} books are ready.</h2><p>Each student ranked {imported.rankedBooks} books. Choose the group sizes and how the best fit should be decided.</p></div>
        <button class="button text" onclick={reset}>Use a different sheet</button>
      </div>
      {#if error}<p class="message error" role="alert">{error}</p>{/if}
      <div class="group-settings">
        <div class="size-settings">
          <label>Minimum students per group <input type="number" min="2" max="12" bind:value={minimumSize} onchange={() => (result = undefined)} /></label>
          <label>Maximum students per group <input type="number" min="2" max="12" bind:value={maximumSize} onchange={() => (result = undefined)} /></label>
        </div>
        <fieldset class="strategy-settings">
          <legend>How should choices be optimized?</legend>
          <label class:chosen={strategy === "overall"}><input type="radio" name="strategy" value="overall" bind:group={strategy} onchange={() => (result = undefined)} /><span><strong>Best overall fit</strong><small>Balance all preferences, valuing higher choices more.</small></span></label>
          <label class:chosen={strategy === "first"}><input type="radio" name="strategy" value="first" bind:group={strategy} onchange={() => (result = undefined)} /><span><strong>Maximize first choices</strong><small>Place as many students as possible with their first-choice book.</small></span></label>
          <label class:chosen={strategy === "last"}><input type="radio" name="strategy" value="last" bind:group={strategy} onchange={() => (result = undefined)} /><span><strong>Minimize last choices</strong><small>Avoid {ordinal(imported.rankedBooks)}-choice placements where possible.</small></span></label>
        </fieldset>
      </div>
      <section class="book-limits text-book-limits">
        <div class="section-row"><div><h3>Maximum groups per book</h3><p>Set a book to 0 to leave it out. A book may still receive no group when there is not a good fit.</p></div></div>
        <div class="text-limit-grid">
          {#each imported.books as book}<label><span>{book.title}</span><input aria-label={`Maximum groups for ${book.title}`} type="number" min="0" max="5" bind:value={bookLimits[book.id]} onchange={() => (result = undefined)} /></label>{/each}
        </div>
      </section>
      <div class="generate-bar"><div><strong>{imported.students.length} students ready</strong><span>Books without enough matching students will not form a group.</span></div><button class="button accent large" onclick={generate}>Generate best groups</button></div>

      {#if result}
        <section class="group-results">
          <div class="results-head"><div><p class="eyebrow">3 · Your result</p><h2>{result.placed} of {imported.students.length} students placed</h2></div><button class="button primary" onclick={() => downloadGroups(result!, imported!.books, "Book club")}>Download spreadsheet</button></div>
          <p class="export-note">The download opens in Excel or Google Sheets, where you can move anyone by hand.</p>
          <div class="placement-summary">{#each result.rankCounts as count, index}<span><strong>{count}</strong>{ordinal(index + 1)} choice</span>{/each}<span class:attention={result.unplaced.length > 0}><strong>{result.unplaced.length}</strong>need help</span></div>
          <div class="generated-groups local-generated-groups">
            {#each result.groups as group}<article class="generated-group text-group"><header><div class="group-number"><span>Group</span><strong>{group.groupNumber}</strong></div><div class="group-book"><span>Book</span><h3>{titleFor(group.bookId)}</h3></div><div class="group-size"><strong>{group.members.length}</strong><span>{group.members.length === 1 ? "student" : "students"}</span></div></header><ul>{#each group.members as member}<li><span>{studentName(member.firstName, member.lastInitial)}</span><small class:last-rank={member.rank === imported.rankedBooks}>{ordinal(member.rank)} choice</small></li>{/each}</ul></article>{/each}
          </div>
          {#if result.unplaced.length}<aside class="unplaced-card"><div><p class="eyebrow">Needs teacher placement</p><h3>{result.unplaced.length} {result.unplaced.length === 1 ? "student could" : "students could"} not fit</h3><p>Adjust the settings and generate again, or place them manually after downloading.</p></div><ul>{#each result.unplaced as student}<li>{studentName(student.firstName, student.lastInitial)}</li>{/each}</ul></aside>{/if}
        </section>
      {/if}
    </section>
  {/if}

  <section id="how-it-works" class="local-info shell"><div><p class="eyebrow">How it works</p><h2>Form in. Groups out.</h2></div><ol><li><b>1</b><span><strong>Collect choices</strong>Use the Group Readers Google Form template with your own book titles.</span></li><li><b>2</b><span><strong>Paste the responses</strong>Copy the sheet into this page or choose the exported CSV.</span></li><li><b>3</b><span><strong>Download the groups</strong>Generate a draft, then adjust the spreadsheet however you like.</span></li></ol></section>
  <section id="privacy" class="local-privacy shell"><div><p class="eyebrow light">Privacy by design</p><h2>Nothing leaves your browser.</h2></div><p>Group Readers does not create an account, upload the response sheet, or save student names. Closing or refreshing this page clears the imported responses and generated groups.</p></section>
</main>

<SiteFooter />
