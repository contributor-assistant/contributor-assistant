## CLA Assistant

```yml
name: "CLA Assistant"
on:
  issue_comment:
  pull_request_target:
    types: [opened,synchronize,labeled,unlabeled]

jobs:
  CLAssistant:
    runs-on: ubuntu-latest
    steps:
      - name: "CLA Assistant"
        if: ${{ github.event.issue.pull_request || github.event_name == 'pull_request_target' }}
        uses:  cla-assistant/contributor-assistant/actions/cla@releases
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PERSONAL_ACCESS_TOKEN : ${{ secrets.PERSONAL_ACCESS_TOKEN }}
        with:
          cla-path: 'https://github.com/cla-assistant/github-action/blob/master/SAPCLA.md'
```
