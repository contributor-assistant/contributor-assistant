## CLA Assistant

```yml
name: Signature Assistant

on:
  issues:
    types: [labeled]
  issue_comment:
  pull_request_target:
    types: [opened,synchronize,labeled,unlabeled]

jobs:
  Signature Assistant:
    runs-on: ubuntu-latest
    steps:
      - name: "Signature Assistant"
        if : github.event.label.name == 'signature form' || github.event.issue.pull_request || github.event_name == 'pull_request_target'
        uses: oganexon/CLA-experiments/actions/signatures@main
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PERSONAL_ACCESS_TOKEN : ${{ secrets.PERSONAL_ACCESS_TOKEN }}
        with:
          form-path: 'signatures.yml'
```
