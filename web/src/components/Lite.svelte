<script lang="ts">
  import { parse as parseYaml } from "yaml";
  import Upload from "./Upload.svelte";
  import Save, { readTextFile } from "./File.svelte";
  import convertLite from "../../../src/signature-functions/compatibility/lite/mod";
  import type {
    Form,
    OutdatedStorage,
  } from "../../../src/signature-functions/compatibility/lite/mod";

  let signatureInput: File;
  let formInput: File;

  let owner: string;
  let repo: string;

  let conversion = false;

  let signatureOutput: string;

  let errors = {
    signatureInput: false,
    formInput: false,
  };

  async function startConversion() {
    conversion = true;
    await convert();
    conversion = false;
  }

  async function convert() {
    errors.signatureInput = false;
    errors.formInput = false;
    const rawSignatures = await readTextFile(signatureInput);

    let signatures: OutdatedStorage;
    let form: Form | undefined = undefined;

    try {
      signatures = JSON.parse(rawSignatures);
    } catch {
      errors.signatureInput = true;
      return;
    }

    if (formInput) {
      const rawForm = await readTextFile(formInput);
      try {
        form = parseYaml(rawForm);
      } catch {
        errors.formInput = true;
        return;
      }
    }

    signatureOutput = JSON.stringify(
      convertLite(signatures, { owner, repo }, form)
    );
  }
</script>

<h1 class="title">CLA Assistant Lite</h1>
<h2 class="subtitle">
  If you have added <a
    href="https://github.com/cla-assistant/contributor-assistant/tree/main/actions/signatures#custom-fields"
    >custom fields</a
  >
  to your form, it is <strong>recommended</strong> that you upload it as well to
  properly format the signatures.
</h2>

<div class="field is-horizontal">
  <div class="field-label is-normal" />
  <div class="field-body">
    <div class="field is-narrow">
      <p class="control has-icons-left">
        <input
          class="input"
          type="text"
          placeholder="Owner"
          bind:value={owner}
        />
        <span class="icon is-small is-left">
          <i class="fas fa-user" />
        </span>
      </p>
    </div>
    <div class="field is-narrow">
      <p class="control has-icons-left has-icons-right">
        <input
          class="input"
          type="text"
          placeholder="Repository"
          bind:value={repo}
        />
        <span class="icon is-small is-left">
          <i class="fas fa-bookmark" />
        </span>
      </p>
    </div>
  </div>
</div>

<div class="field is-horizontal">
  <div class="field-label is-normal">
    <label class="label" for="signature-input">JSON Signature file</label>
  </div>
  <div class="field-body">
    <div class="field">
      <div class="control">
        <Upload
          bind:file={signatureInput}
          control="signature-input"
          accept="application/json"
        />
      </div>
      {#if errors.signatureInput}
        <p class="help is-danger">This file does not contain valid JSON</p>
      {/if}
    </div>
  </div>
</div>

<div class="field is-horizontal">
  <div class="field-label is-normal">
    <label class="label" for="form-input"
      >YAML form file <span class="tag is-info is-light">Optional</span></label
    >
  </div>
  <div class="field-body">
    <div class="field">
      <div class="control">
        <Upload bind:file={formInput} control="form-input" accept=".yml,.yaml" />
      </div>
      {#if errors.formInput}
        <p class="help is-danger">This file does not contain valid YAML</p>
      {/if}
    </div>
  </div>
</div>

<div class="field is-horizontal">
  <div class="field-label" />
  <div class="field-body">
    <div class="field is-grouped">
      <div class="control">
        <button
          class="button is-link"
          class:is-loading={conversion}
          on:click={startConversion}
          disabled={!(signatureInput && owner && repo)}>Convert</button
        >
      </div>
      <div class="control">
        {#if signatureOutput}
          <Save download="signatures.json" content={signatureOutput}>
            <button class="button is-success">
              <span class="icon">
                <i class="fas fa-download" />
              </span>
              <span>Save</span>
            </button>
          </Save>
        {/if}
      </div>
    </div>
  </div>
</div>
