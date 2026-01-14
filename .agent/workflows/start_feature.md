---
description: Start a new feature branch
---

1. Ensure the user's `task.md` is updated or creating a new item for this feature.
2. Switch to main and update.
   ```bash
   git checkout main && git pull origin main
   ```
3. Create the feature branch.
   ```bash
   git checkout -b feature/{{feature_name}}
   ```
