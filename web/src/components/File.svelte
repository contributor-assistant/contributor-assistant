<script lang="ts" context="module">
  export function readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = function () {
        resolve(reader.result as string);
      };

      reader.onerror = function () {
        reject();
      };

      reader.readAsText(file);
    });
  }
</script>

<script lang="ts">
  export let download: string;
  export let content: string;

  let href: string;

  $: href = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
</script>

<a {download} {href}>
  <slot />
</a>
