<script lang="ts">
  import { onMount } from "svelte";
  import SiteFooter from "./SiteFooter.svelte";
  import { downloadGroups } from "./export";
  import { createGroups, type GroupingResult, type GroupingStrategy } from "./grouping";
  import { importResponses, type ImportedResponses, type RankConflict } from "./spreadsheet";
  import { formTemplateLinks } from "./templateLinks";

  const storageKey = "group-readers-workspace-v1";

  type SavedWorkspace = {
    version: 1;
    imported: ImportedResponses;
    minimumSize: number;
    maximumSize: number;
    strategy: GroupingStrategy;
    bookLimits: Record<string, number>;
    result?: GroupingResult;
  };

  let pasted = $state("");
  let imported = $state<ImportedResponses>();
  let importErrors = $state<string[]>([]);
  let conflicts = $state<RankConflict[]>([]);
  let resolutions = $state<Record<string, string>>({});
  let error = $state("");
  let minimumSize = $state(3);
  let maximumSize = $state(4);
  let strategy = $state<GroupingStrategy>("overall");
  let responseMethod = $state<"csv" | "sheet">("sheet");
  let selectedTemplateRanks = $state<number>();
  let bookLimits = $state<Record<string, number>>({});
  let result = $state<GroupingResult>();
  let storageReady = $state(false);
  const numberWords = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  const selectedTemplateLink = $derived(selectedTemplateRanks ? formTemplateLinks[selectedTemplateRanks] : undefined);

  onMount(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null") as SavedWorkspace | null;
      if (saved?.version === 1 && saved.imported && Array.isArray(saved.imported.books) && Array.isArray(saved.imported.students)) {
        imported = saved.imported;
        minimumSize = saved.minimumSize;
        maximumSize = saved.maximumSize;
        strategy = saved.strategy;
        bookLimits = saved.bookLimits;
        result = saved.result;
      }
    } catch {
      // A damaged browser entry should never prevent Group Readers from opening.
    }
    storageReady = true;
  });

  $effect(() => {
    if (!storageReady) return;
    if (!imported) {
      localStorage.removeItem(storageKey);
      return;
    }
    const saved: SavedWorkspace = { version: 1, imported, minimumSize, maximumSize, strategy, bookLimits, result };
    try {
      localStorage.setItem(storageKey, JSON.stringify(saved));
    } catch {
      // Grouping still works when browser storage is unavailable or full.
    }
  });

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

  function clearGroups() {
    if (!confirm("Clear the generated groups saved in this browser? Your imported responses will stay ready so you can generate again.")) return;
    result = undefined;
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
      <div class="local-promises" aria-label="Privacy details"><span>No account</span><span>No student uploads</span><span>Saved only on this device</span></div>
    </div>
    <div id="import-responses" class="local-start-card">
      <p class="eyebrow">Add responses</p>
      <h2>Paste your response sheet.</h2>
      <p>Copy the full range from Google Sheets or Excel, including the header row, or choose its downloaded CSV file.</p>
      <textarea bind:value={pasted} rows="8" aria-label="Spreadsheet responses" placeholder="Paste spreadsheet rows here…"></textarea>
      <div class="import-actions">
        <button class="button primary" disabled={!pasted.trim()} onclick={() => readResponses()}>Read responses</button>
        <label class="button subtle file-button">Choose CSV<input type="file" accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values" onchange={openFile} /></label>
      </div>
      <p class="local-note">Your response sheet stays on this device. This browser remembers it until you clear it or use a different sheet.</p>
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
      <div class="conflict-heading"><div><p class="eyebrow">Complete the rankings</p><h2>A few choices need your decision.</h2><p>Choose a book for every duplicated or missing rank. You do not need to edit and import the spreadsheet again.</p></div></div>
      <div class="conflict-list">
        {#each conflicts as conflict}
          <fieldset>
            <legend>{#if conflict.kind === "duplicate"}<strong>{conflict.studentName}</strong> marked more than one book as their {ordinal(conflict.rank)} choice. Which one should they get?{:else}<strong>{conflict.studentName}</strong> is missing a {ordinal(conflict.rank)} choice. Choose one of their unranked books to fill it.{/if}</legend>
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
        <div><p class="eyebrow">Shape the groups</p><h2>{imported.students.length} students and {imported.books.length} books are ready.</h2><p>Each student ranked {imported.rankedBooks} books. Choose the group sizes and how the best fit should be decided.</p></div>
        <button class="button text" onclick={reset}>Clear and use a different sheet</button>
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
          <div class="results-head"><div><p class="eyebrow">Your result</p><h2>{result.placed} of {imported.students.length} students placed</h2><span class="browser-saved">Saved in this browser</span></div><div class="result-buttons"><button class="button subtle" onclick={clearGroups}>Clear saved groups</button><button class="button primary" onclick={() => downloadGroups(result!, imported!.books, "Book club")}>Download spreadsheet</button></div></div>
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

  <section id="how-it-works" class="instruction-guide shell">
    <header><p class="eyebrow">Instruction guide</p><h2>From a form copy to finished groups.</h2><p>Set the form up once, collect your class’s choices, then bring the responses into Group Readers in the way that works best for you.</p></header>
    <ol class="guide-steps">
      <li class="guide-step">
        <div class="guide-number">1</div>
        <div class="guide-copy full"><p class="eyebrow">Copy the form</p><h3>How many books should each student rank?</h3><p>Select a number first. Group Readers will give you the matching form template.</p><div class="template-counts" role="group" aria-label="Number of books each student should rank">{#each Array.from({ length: 10 }, (_, index) => index + 1) as count}<button class:chosen={selectedTemplateRanks === count} aria-pressed={selectedTemplateRanks === count} onclick={() => (selectedTemplateRanks = count)}><strong>{count}</strong><span>{count === 1 ? "choice" : "choices"}</span></button>{/each}</div>
          {#if selectedTemplateRanks}
            {#if selectedTemplateLink}
              <div class="template-result ready"><div><span>Your template</span><strong>Students rank their top {numberWords[selectedTemplateRanks - 1]} {selectedTemplateRanks === 1 ? "book" : "books"}</strong><small>Google will ask you to name the copy and save it in your Drive.</small></div><a class="button primary" href={selectedTemplateLink} target="_blank" rel="noopener noreferrer">Copy this form</a></div>
            {:else}
              <div class="template-result pending"><div><span>Your template</span><strong>Students rank their top {numberWords[selectedTemplateRanks - 1]} {selectedTemplateRanks === 1 ? "book" : "books"}</strong><small>This template link is being prepared and will appear here when it is ready.</small></div></div>
            {/if}
          {/if}
        </div>
      </li>
      <li class="guide-step">
        <div class="guide-number">2</div>
        <div class="guide-copy"><p class="eyebrow">Edit the form</p><h3>Personalize it for your class.</h3><p>Update the form title and replace the example book titles and descriptions with your own. You can duplicate a question to add more books to the form.</p><aside class="edit-warning"><strong>Leave the name question and "First Choice", "Second Choice", etc. labels unchanged so Group Readers can read the responses correctly.</strong></aside></div>
      </li>
      <li class="guide-step highlighted">
        <div class="guide-number">3</div>
        <div class="guide-copy full"><p class="eyebrow">Move the responses</p><h3>How do you want to bring the responses into Group Readers?</h3><p>Choose one method to see the complete path from Google Forms into the importer.</p>
          <div class="method-options" role="group" aria-label="Response export method">
            <button class:chosen={responseMethod === "sheet"} aria-pressed={responseMethod === "sheet"} onclick={() => (responseMethod = "sheet")}><span class="method-icon sheet-icon">▦</span><span><strong>Link to spreadsheet</strong><small>Copy directly from the response spreadsheet.</small></span><b aria-hidden="true">{responseMethod === "sheet" ? "✓" : ""}</b></button>
            <button class:chosen={responseMethod === "csv"} aria-pressed={responseMethod === "csv"} onclick={() => (responseMethod = "csv")}><span class="method-icon">CSV</span><span><strong>Download as CSV</strong><small>Download a file you can keep and import.</small></span><b aria-hidden="true">{responseMethod === "csv" ? "✓" : ""}</b></button>
          </div>
          {#if responseMethod === "csv"}
            <div class="method-instructions"><strong>Download, then import:</strong><ol><li>In Google Forms, open the <b>Responses</b> tab.</li><li>Open the three-dot menu and choose <b>Download responses (.csv)</b>.</li><li>Unzip the downloaded folder if necessary.</li><li>Return to Group Readers and select <b>Choose CSV</b>.</li><li>Open the CSV you just downloaded.</li></ol><a class="button primary guide-action" href="#import-responses">Go to Choose CSV</a></div>
          {:else}
            <div class="method-instructions"><strong>Open, copy, then paste:</strong><ol><li>In Google Forms, open the <b>Responses</b> tab and select the green spreadsheet icon.</li><li>Create a response spreadsheet or open the one already linked.</li><li>Select the complete response range, including the header row and every student row, then copy it.</li><li>Return to Group Readers, paste it into the response box, and select <b>Read responses</b>.</li></ol><div class="shortcut-row"><span><kbd>Ctrl</kbd> + <kbd>A</kbd>, then <kbd>Ctrl</kbd> + <kbd>C</kbd></span><small>On a Mac, use ⌘ instead of Ctrl.</small></div><a class="button primary guide-action" href="#import-responses">Go to the paste box</a></div>
          {/if}
        </div>
      </li>
      <li class="guide-step">
        <div class="guide-number">4</div>
        <div class="guide-copy"><p class="eyebrow">Create the groups</p><h3>Review, generate, and download.</h3><p>Resolve any repeated ranks, choose your minimum and maximum group sizes, and generate the best fit. Download the finished CSV to make any final changes in your spreadsheet.</p></div>
      </li>
    </ol>
  </section>
</main>

<SiteFooter />
