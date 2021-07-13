<script lang="ts">
  let files: FileList;
  export let file: File = undefined;
  export let control: string
  export let accept: string

  $: {
    if (files && files[0]) {
      file = files[0];
      // let reader = new FileReader();
      // reader.onload = function(evt) {
      //     data = new Uint8Array(evt.target.result);
      // }
      // reader.readAsArrayBuffer(binfile);
    }
  }
</script>

<div class="file" class:has-name={file}>
  <label class="file-label">
    <input class="file-input" type="file" name="resume" bind:files id={control} {accept} />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload" />
      </span>
      <span class="file-label"> Choose a file… </span>
    </span>
    {#if file}
    <span class="file-name"> {file.name} </span>
    {/if}
  </label>
</div>
