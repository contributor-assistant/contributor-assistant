## Request Signatures from Contributors

### Manual

1. Create `.github/workflows/request-signatures-from-contributors.yml` action and paste the code from below
2. Create `.github/ISSUE_TEMPLATE/signatures-form.yml` issue form (simple template)
3. Create `signature form` issue label 
 
  

```yml
name: Contributor Assistant - Contributor License Agreement Signature

on:
  issues:
    types: [labeled]
  issue_comment:
    types: [created]
  pull_request_target:
    types: [opened,synchronize,closed,reopened,labeled,unlabeled]

jobs:
  signature_assistant:
    runs-on: ubuntu-latest
    steps:
      - name: "Signature Assistant"
        if : github.event.label.name == 'signature form' || github.event.comment.body == 'recheck' || github.event.issue.pull_request || github.event_name == 'pull_request_target'
        uses: oganexon/CLA-experiments/actions/signatures@main
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PERSONAL_ACCESS_TOKEN : ${{ secrets.PERSONAL_ACCESS_TOKEN }}
        with:
          form-path: 'signatures.yml'
```

| input                            | description                                                                                                                                                                                             | default value                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `signature-path`                 | The path where the signatures will be stored.                                                                                                                                                           | `".github/contributor-assistant/signatures.json"`                                                                                                                                                 |
| `signature-branch`               | The branch where the signatures will be stored.                                                                                                                                                         | *default branch*                                                                                                                                                                                  |
| `signature-remote-repo`          | The name of another repository to store the signatures.                                                                                                                                                 | *none*                                                                                                                                                                                            |
| `signature-remote-owner`         | The owner of the remote repository, can be an organization. Leave empty to default to this repository owner.                                                                                            | *none*                                                                                                                                                                                            |
| `re-run-path`                    | The path where the re-run cache will be stored.                                                                                                                                                         | `".github/contributor-assistant/signatures-re-run.json"`                                                                                                                                          |
| `re-run-branch`                  | The branch where the re-run cache will be stored.                                                                                                                                                       | *default branch*                                                                                                                                                                                  |
| `form-path`                      | The document which shall be signed by the contributor(s). Must be an issue form (yml file).                                                                                                             | **required**                                                                                                                                                                                      |
| `ignore-list`                    | A list of users that will be ignored when checking for signatures. They are not required for the signature checks to pass. The separator between the patterns is a comma.                               | `""`                                                                                                                                                                                              |
| `prevent-signature-invalidation` | Prevent signature invalidation if the form has been modified. Signatures will still be marked as invalidated in the signature file but committers won't need to re-sign the document. Default to false. | `false`                                                                                                                                                                                           |
| `re-trigger`                     | The keyword to re-trigger signature checks.                                                                                                                                                             | `"recheck"`                                                                                                                                                                                       |
| `all-signed-comment`             | The posted comment when each committer has signed the document.                                                                                                                                         | `"All contributors have signed the CLA  ✍️ ✅"`                                                                                                                                                     |
| `comment-header`                 | Usually a message thanking the committers and asking them to sign the document. Variable: `${you}`: "you" when only there's only one committer, "you all" otherwise                                     | `"Thank you for your submission, we appreciate it. Like many open-source projects, we ask that ${you} sign our **Contributor License Agreement** before we can accept your contribution."` |
| `signed-label`                   | A label that will be applied once all committers have signed the document                                                                                                                               | *none*                                                                                                                                                                                            |
| `unsigned-label`                 | A label that will be applied until all committers have signed the document                                                                                                                              | *none*                                                                                                                                                                                            |
| `ignore-label`                   | Add this label to skip the signature checks                                                                                                                                                             | *none*                                                                                                                                                                                            |
| `form-label`                     | The label used to find the document form.                                                                                                                                                               | `"signature form"`                                                                                                                                                                                |

More customization available in the config file.

## License

Contributor License Agreement assistant

Copyright (c) 2021 [SAP SE](http://www.sap.com) or an SAP affiliate company. All rights reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.


Credits
=======

<p align="center">
    <img src="../../assets/sap.png" title="SAP" />
<p align="center">
