<script lang="ts">
  import AboutPage from "./AboutPage.svelte";
  import LocalApp from "./LocalApp.svelte";
  import PrivacyPage from "./PrivacyPage.svelte";

  const path = window.location.pathname.replace(/\/$/, "") || "/";
</script>

{#if path === "/about"}
  <AboutPage />
{:else if path === "/privacy"}
  <PrivacyPage />
{:else}
  <LocalApp />
{/if}
