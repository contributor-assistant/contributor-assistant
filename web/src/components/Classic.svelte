<script lang="ts">
  import { stringify as stringifyYaml } from "yaml";
  import Upload from "./Upload.svelte";
  import Save, { readTextFile } from "./File.svelte";
  import convertClassic from "../../../src/signature-functions/compatibility/classic/mod";
  import { Octokit as Core } from "https://cdn.skypack.dev/@octokit/core@3.4.0";
  import { restEndpointMethods } from "https://cdn.skypack.dev/@octokit/plugin-rest-endpoint-methods@5.3.1";
  import { paginateRest } from "https://cdn.skypack.dev/@octokit/plugin-paginate-rest@2.13.3";
  import type {
    OutdatedStorage,
    OutdatedCustomFields,
    Output,
  } from "../../../src/signature-functions/compatibility/classic/mod";

  const Octokit = Core.plugin(restEndpointMethods, paginateRest);
  const octokit = new Octokit();

  let signatureInput: File;
  let documentInput: File;
  let metadataInput: File;

  let conversion = false;

  let signatureOutput: string;
  let formOutput: string;

  let errors = {
    signature: false,
    metadata: false,
    output: [] as Output["errors"],
  };

  async function startConversion() {
    conversion = true;
    await convert();
    conversion = false;
  }

  async function convert() {
    errors.signature = false;
    errors.metadata = false;
    const rawSignatures = await readTextFile(signatureInput);

    let signatures: OutdatedStorage;
    let document: string | undefined = undefined;
    let metadata: OutdatedCustomFields | undefined = undefined;

    try {
      signatures = JSON.parse(rawSignatures);
    } catch {
      errors.signature = true;
      return;
    }

    if (documentInput) {
      document = await readTextFile(documentInput);
    }

    if (metadataInput) {
      const rawMetadata = await readTextFile(metadataInput);
      try {
        metadata = JSON.parse(rawMetadata);
      } catch {
        errors.metadata = true;
        return;
      }
    }

    const result = await convertClassic(
      octokit,
      signatures,
      document,
      metadata
    );
    signatureOutput = JSON.stringify(result.signatures);
    formOutput = stringifyYaml(result.form);
    errors.output = result.errors;
  }
</script>

<h1 class="title">CLA Assistant Classic</h1>
<h2 class="subtitle">
  If you have added <a
    href="https://github.com/cla-assistant/contributor-assistant/tree/main/actions/signatures#custom-fields"
    >custom fields</a
  >
  to your form, it is <strong>recommended</strong> that you upload it as well to
  properly format the signatures.
</h2>

<!-- <div class="field is-horizontal">
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
</div> -->

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
      {#if errors.signature}
        <p class="help is-danger">This file does not contain valid JSON</p>
      {/if}
    </div>
  </div>
</div>

<div class="field is-horizontal">
  <div class="field-label is-normal">
    <label class="label" for="form-input"
      >Gist Document <span class="tag is-info is-light">Optional</span></label
    >
  </div>
  <div class="field-body">
    <div class="field">
      <div class="control">
        <Upload
          bind:file={documentInput}
          control="form-input"
          accept=".yml,.yaml"
        />
      </div>
    </div>
  </div>
</div>

<div class="field is-horizontal">
  <div class="field-label is-normal">
    <label class="label" for="form-input"
      >Gist Metadata <span class="tag is-info is-light">Optional</span></label
    >
  </div>
  <div class="field-body">
    <div class="field">
      <div class="control">
        <Upload
          bind:file={metadataInput}
          control="form-input"
          accept=".yml,.yaml"
        />
      </div>
      {#if errors.metadata}
        <p class="help is-danger">This file does not contain valid JSON</p>
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
          disabled={!signatureInput}>Convert</button
        >
      </div>
      <div class="control">
        {#if signatureOutput}
          <Save
            download="signatures.json"
            content={signatureOutput}
            type="application/json"
          >
            <button class="button is-success">
              <span class="icon">
                <i class="fas fa-download" />
              </span>
              <span>Save Signatures</span>
            </button>
          </Save>
        {/if}
        {#if formOutput}
          <Save download="form.yml" content={formOutput} type="text/vnd.yaml">
            <button class="button is-success">
              <span class="icon">
                <i class="fas fa-download" />
              </span>
              <span>Save Form</span>
            </button>
          </Save>
        {/if}
      </div>
    </div>
  </div>
</div>
