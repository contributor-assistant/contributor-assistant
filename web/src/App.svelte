<script lang="ts">
  import Header from "./components/Header.svelte"
  import Lite from "./components/Lite.svelte"
  import Classic from "./components/Classic.svelte"

  let mode: "classic" | "lite";
</script>

<main>
  <Header bind:mode/>
  <div class="container">
    <section class="section">
     {#if mode === "lite"}
      <Lite/>
      {:else}
      <Classic/>
     {/if}
    </section>
  </div>
</main>

<style lang="scss" global>
  @import 'bulma/css/bulma.css';
</style>
