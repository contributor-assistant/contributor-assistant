# Test scenarios

> Delete the signature file on steps with the symbol 🔁 if you don't have more
> than 2 users to test the action.

## Basic features

1. Create a PR with one user
   - A comment is created
   - `Failing` status

2. Sign the CLA
   - The comment is updated
   - `Success` status

3. Create a PR with multiple users
   - A comment is created, with a list of signatures
   - `Failing` status

4. Sign the CLA
   - The comment is updated
   - `Success` status

5. Create a PR with a user who has already signed
   - No comment is created
   - `Success` status

## Inputs

1. Remove `GITHUB_TOKEN`, `PERSONAL_ACCESS_TOKEN`, and `cla-path` one after the
   other

2. Create a PR with one user
   - Should fail with an explicit error message

3. Put `GITHUB_TOKEN` and `PERSONAL_ACCESS_TOKEN` in the `with` object instead
   of `env`

4. Create a PR with one user
   - Should work as expected

## Edge cases

1. 🔁 Create a PR with a co-authored commit
   - _Basic features step 3 and 4_

2. 🔁 Create a PR with a co-authored commit (unknown user)
   - A comment is created, with some warnings
   - `Failing` status

3. Sign the CLA (logged in user)
   - The comment is updated
   - `Success` status
   - The associated signatures are removed from the storage file

4. Update or delete the signature
   - The comment is updated
   - `Failing` status

5. 🔁 Create a PR with an unknown user
   - A comment is created, with some warnings
   - `Success` status

6. 🔁 Create a PR with email notifications enabled
7. Sign the CLA from email
   - The comment is updated
   - `Success` status

8. Merge the PR
   - The PR is locked

## Advanced features

1. 🔁 Add a user to the ignore list and create a new PR with this user
   - No comment is created
   - `Success` status

2. Set `unsigned-label`
   - Label should be applied until everyone has signed the CLA
   - No label when signed

3. Set `signed-label`
   - Label should be applied when everyone has signed the CLA
   - No label until then

4. Set `unsigned-label` and `signed-label`
   - Labels should swap when
     - Everyone has signed the CLA
     - Someone has withdrawn their signature

5. Set `lock-pr-after-merge` to false and merge a PR
   - The PR is not locked

## Storage

> Create a new PR at each step and it should work as for the _Basic features_
> step 1 and 2.

1. Set `storage-path`

2. Set `storage-branch`

3. Set `storage-remote-repo` (same user)

4. Set `storage-remote-repo` and `storage-remote-owner`

## Customization

1. Set `input-signature`
   - A different text is displayed in the comment
   - This text successfully signs the CLA

2. Set `input-re-trigger`
   - A different text is displayed in the comment
   - This text successfully re-run the action
