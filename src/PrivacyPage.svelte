<script lang="ts">
  import InfoPage from "./InfoPage.svelte";
</script>

<InfoPage title="Privacy" lede="What Group Readers processes, what it stores, and what leaves your browser.">
  <section class="info-card">
    <h2>No Group Readers account</h2>
    <p>
      Group Readers does not ask teachers or students to create an account. We do not collect an email
      address, password, school ID, birthday, or profile.
    </p>
    <p>
      Students submit their book preferences through a form managed by the teacher. The teacher then brings
      that form's response sheet into Group Readers as pasted spreadsheet cells or a CSV file.
    </p>
  </section>

  <section class="info-card">
    <h2>What happens to classroom data</h2>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Information</th><th>How it is used</th><th>Where it goes</th></tr></thead>
        <tbody>
          <tr>
            <th>Student names and book rankings</th>
            <td>To check the response sheet and create balanced groups.</td>
            <td>Saved in that browser's local storage. It is not uploaded to Group Readers.</td>
          </tr>
          <tr>
            <th>Book titles and grouping settings</th>
            <td>To understand the sheet and generate the requested groups.</td>
            <td>Saved in that browser's local storage.</td>
          </tr>
          <tr>
            <th>Generated groups</th>
            <td>To show the draft and create the teacher's download.</td>
            <td>Saved in that browser's local storage. A CSV is also saved to the device when the teacher downloads it.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      Local storage keeps this work available after a refresh or after the browser closes. It stays on that
      browser and is not synchronized to another device. A teacher can clear only the generated groups, or use
      a different sheet to clear the saved workspace. Clearing this site's browser data also removes it.
    </p>
  </section>

  <section class="info-card">
    <h2>Website analytics and services</h2>
    <p>
      Group Readers has no advertising and does not use analytics to follow people across websites. On the
      published site, Cloudflare Web Analytics may collect privacy-focused, cookieless visit measurements so
      we can understand whether the tool is being used. Those measurements do not include the response sheet
      or generated groups. See Cloudflare's
      <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">privacy policy</a>.
    </p>
    <p>
      The site loads its typefaces from Google Fonts, so a visitor's browser connects to Google's servers to
      retrieve those files. See Google's
      <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">privacy policy</a>.
      If a teacher uses a Google Form template, Google separately handles the form and its responses under the
      teacher's Google account and settings.
    </p>
  </section>

  <section class="info-card">
    <h2>Questions or concerns?</h2>
    <p>Ask us anything about this page or how Group Readers handles classroom information.</p>
    <a class="button primary" href="mailto:support@groupreaders.com?subject=Group%20Readers%20privacy">
      Email support@groupreaders.com
    </a>
  </section>
</InfoPage>
