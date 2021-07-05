## Contributor License Agreements
  
  
You can copy the following code and add it to a file in your .github/workflows folder ([example](https://github.com/michael-spengler/demo-contributor-assistant/blob/main/.github/workflows/contributor-license-agreement.yml)) in order to ensure contributors sign your Contributor License Agreement.
  
  

```yml
name: Contributor Assistant - Contributor License Agreement Signature

on:
  issues:
    types: [labeled]
  issue_comment:
    types: [created]
  pull_request_target:
    types: [opened,synchronize,labeled,unlabeled]

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
