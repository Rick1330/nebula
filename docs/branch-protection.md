# Branch Protection — main

Option A — GitHub CLI (preferred)
```bash
# Install: https://cli.github.com/
# Authenticate
gh auth login

# Create repo if not created yet
# gh repo create <OWNER>/nebula --private --source=. --remote=origin --push

# Apply protection
OWNER="<OWNER>" REPO="nebula"
 gh api -X PUT repos/$OWNER/$REPO/branches/main/protection \
  -f enforce_admins=true \
  -f required_pull_request_reviews='{"required_approving_review_count":1}' \
  -f required_status_checks='{"strict":true,"checks":[{"context":"build"},{"context":"lint"},{"context":"typecheck"},{"context":"test"}]}' \
  -f restrictions='null' \
  -H "Accept: application/vnd.github+json"
```

Option B — REST API with Personal Access Token
```bash
# Create a classic token with repo + admin:repo_hook at https://github.com/settings/tokens
export GITHUB_TOKEN=__REPLACE_ME__
export OWNER=<OWNER>
export REPO=nebula

curl -s -X PUT \
 -H "Authorization: token $GITHUB_TOKEN" \
 -H "Accept: application/vnd.github+json" \
 https://api.github.com/repos/$OWNER/$REPO/branches/main/protection \
 -d '{
   "enforce_admins": true,
   "required_pull_request_reviews": {"required_approving_review_count": 1},
   "required_status_checks": {"strict": true, "contexts": ["build","lint","typecheck","test"]},
   "restrictions": null
 }'
```
