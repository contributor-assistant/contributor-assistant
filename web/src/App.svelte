<script lang="ts">
  import logo from "./assets/svelte.png";
  import Counter from "./lib/Counter.svelte";
  import { Button, FileDropzone } from "attractions";
  import { ChevronsRightIcon, FilePlusIcon } from "svelte-feather-icons";

  let inputFiles: File[] = [];
  // let formFiles: File[] = []

  let input: File;
  // let form: File

  $: {
    input = inputFiles[0];
    console.log("input");
    console.log(input);
  }
  // $: form = formFiles[0]
</script>

<main>
  <div class="container">
    <FileDropzone accept="image/*" max={1} bind:files={inputFiles} >
      <div slot="empty-layer" class="empty-layer">
        <FilePlusIcon size="24" class="icon" />
        <div class="title">drag & drop here or click to upload signature file</div>
      </div>
    </FileDropzone>
    <FileDropzone accept="image/*" max={1} />
    <Button filled disabled={!input}>
      Convert
      <ChevronsRightIcon size="20" class="mr" />
    </Button>
    <FileDropzone accept="image/*" max={1} />
  </div>

  <!-- <FileDropzone accept="image/*" max={1} files={formFiles} /> -->

  {#if input}
    <p>{input.name}</p>
  {/if}
</main>

<style lang="scss">
  @import url("https://fonts.googleapis.com/css2?family=Ubuntu:wght@500&display=swap");

  :global(body) {
    font-family: "Ubuntu", sans-serif;
  }

  .container {
    padding: 1em;
    display: grid;
    grid-template-columns: repeat(4, auto);
    grid-template-rows: repeat(4, 3em);
    grid-auto-flow: column;
    justify-items: start;
    align-items: center;
    gap: 0.5em;

    @media only screen and (min-width: 920px) {
      grid-template-columns: repeat(4, auto);
      grid-template-rows: repeat(4, 3em);
      grid-auto-flow: row;
    }
  }

  .empty-layer {
    display: flex;
    align-items: center;
    z-index: 1;
    padding: 2em 1em;

    .title {
      // font-weight: vars.$bold-font-weight;
      color: currentColor;
      text-align: center;
      margin-left: 0.5em;
      flex: 1;
    }
  }
</style>
