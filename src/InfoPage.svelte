<script lang="ts">
  import type { Snippet } from "svelte";
  import SiteFooter from "./SiteFooter.svelte";

  let { title, lede, children }: { title: string; lede: string; children: Snippet } = $props();
</script>

<svelte:head>
  <title>{title} · Group Readers</title>
</svelte:head>

<header class="topbar">
  <a class="brand" href="/"><span class="brand-mark"></span><span>Group Readers</span></a>
  <a class="text-link" href="/">← Back to Group Readers</a>
</header>

<main class="info-page shell narrow">
  <h1>{title}</h1>
  <p class="info-lede">{lede}</p>
  {@render children()}
</main>

<SiteFooter />
