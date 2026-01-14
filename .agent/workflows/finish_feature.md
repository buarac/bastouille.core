---
description: Finish a feature, merge to main, and cleanup
---

1. Ensure all changes are committed.
   ```bash
   git status
   ```
2. Switch to main and update.
   ```bash
   git checkout main && git pull origin main
   ```
3. Merge the feature branch.
   ```bash
   git merge feature/{{feature_name}}
   ```
4. Push to remote.
   ```bash
   git push origin main
   ```
5. Cleanup local branch.
   ```bash
   git branch -d feature/{{feature_name}}
   ```
6. Cleanup remote branch (if it exists).
   ```bash
   git push origin --delete feature/{{feature_name}} || true
   ```
