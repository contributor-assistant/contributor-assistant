<script lang="ts">
  import { stringify as stringifyYaml } from "yaml";
  import Upload from "./Upload.svelte";
  import Save, { readTextFile } from "./File.svelte";
  import convertClassic from "../../../src/signature-functions/compatibility/classic/mod";
  // https://github.com/octokit/octokit.js/issues/2126
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
  You can download your signatures on
  <a href="https://cla-assistant.io/">cla-assistant.io</a>
  by clicking on the number of contributors, then select
  <strong>Export as JSON</strong>.
</h2>

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
    <label class="label" for="document-input"
      >Gist CLA <span class="tag is-info is-light">Optional</span></label
    >
  </div>
  <div class="field-body">
    <div class="field">
      <div class="control">
        <Upload
          bind:file={documentInput}
          control="document-input"
          accept=".yml,.yaml"
        />
      </div>
    </div>
  </div>
</div>

<div class="field is-horizontal">
  <div class="field-label is-normal">
    <label class="label" for="metadata-input"
      >Gist Metadata <span class="tag is-info is-light">Optional</span></label
    >
  </div>
  <div class="field-body">
    <div class="field">
      <div class="control">
        <Upload
          bind:file={metadataInput}
          control="metadata-input"
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

<div class="field is-horizontal">
  <div class="field-label" />
  <div class="field-body">
    {#each errors.output as { username, reason }}
      <div class="notification is-danger is-light">
        <strong>Error</strong> with user <strong>{username}</strong><br />
        {reason}
      </div>
    {/each}
  </div>
</div>
