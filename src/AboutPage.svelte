<script lang="ts">
  import InfoPage from "./InfoPage.svelte";
  import logo from "./assets/logo.svg";
  import participants from "./assets/2026participants.jpeg";
</script>

<InfoPage
  title="About"
  lede="Group Readers turns a class's book preferences into balanced reading groups, without an account or a complicated setup."
>
  <section class="info-card">
    <div class="card-heading">
      <img class="edtech-logo" src={logo} alt="" />
      <h2>From <a href="https://teacher.dev" target="_blank" rel="noopener noreferrer">teacher.dev</a></h2>
    </div>
    <p>
      Group Readers is a project from
      <a href="https://teacher.dev" target="_blank" rel="noopener noreferrer">teacher.dev</a>, created during
      EdTech-a-thon 2026. EdTech-a-thon is a community of builders making free tools for classrooms.
    </p>
    <figure class="polaroid">
      <img src={participants} alt="Everyone who took part in EdTech-a-thon 2026." />
      <figcaption>EdTech-a-thon 2026</figcaption>
    </figure>
  </section>

  <section class="info-card">
    <h2>How it works</h2>
    <ol class="info-steps">
      <li>
        <span class="step">1</span>
        <div>
          <h3>Copy a form template</h3>
          <p>Choose how many books each student should rank, then make your own copy of the matching Google Form.</p>
        </div>
      </li>
      <li>
        <span class="step">2</span>
        <div>
          <h3>Personalize and share it</h3>
          <p>Replace the example books with your choices and collect student preferences through your form.</p>
        </div>
      </li>
      <li>
        <span class="step">3</span>
        <div>
          <h3>Bring in the responses</h3>
          <p>Paste the response range from a spreadsheet, or choose a CSV downloaded from Google Forms.</p>
        </div>
      </li>
      <li>
        <span class="step">4</span>
        <div>
          <h3>Make the groups</h3>
          <p>Choose group sizes and priorities, generate a balanced draft, then download it as a spreadsheet.</p>
        </div>
      </li>
    </ol>
  </section>

  <section class="info-card">
    <h2>Our promise</h2>
    <ul class="promise-list">
      <li>
        <span class="tick">✓</span>
        <div><strong>Free to use.</strong><span>Every part of Group Readers is free for teachers.</span></div>
      </li>
      <li>
        <span class="tick">✓</span>
        <div><strong>No ads.</strong><span>There is no advertising or ad network on the site.</span></div>
      </li>
      <li>
        <span class="tick">✓</span>
        <div>
          <strong>Student data stays local.</strong>
          <span>
            The response sheet and generated groups are processed in your browser, not uploaded to Group
            Readers. Read the <a href="/privacy">privacy page</a> for the details.
          </span>
        </div>
      </li>
    </ul>
  </section>

  <section class="info-card">
    <h2>Feedback &amp; ideas</h2>
    <p>Tell us what's working, what's not, or what would make Group Readers more useful in your classroom.</p>
    <a class="button primary" href="mailto:support@groupreaders.com?subject=Group%20Readers%20feedback">
      Email support@groupreaders.com
    </a>
  </section>
</InfoPage>
