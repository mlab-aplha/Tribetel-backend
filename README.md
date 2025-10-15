# Team Git Branching Strategy — Feature-Branch Workflow (Beginner Guide)

### Audience
This guide is for junior developers working together on a project using Git and GitHub via SSH. It explains how to create and manage branches safely, avoid conflicts, and collaborate smoothly.

---

## Summary — Purpose & Golden Rules

Our goal is to work in parallel without breaking main. Each developer works on their own branch, merges through Pull Requests (PRs), and keeps their code updated with the latest from `main`.

**Golden Rules:**
1. Never commit directly to `main`.
2. Always pull the latest changes before pushing.
3. Keep branches small and focused on one feature or fix.
4. Use clear commit messages.
5. Delete merged branches to keep the repo clean.

---

## Branch Model Overview

| Branch Type | Example Name | Purpose |
|--------------|--------------|----------|
| **Main (protected)** | `main` | Stable production-ready code. PRs only. |
| **Develop (optional)** | `develop` | Used for staging or testing combined features. |
| **Feature branches** | `feature/login-page` | For new features or enhancements. |
| **Hotfix branches** | `hotfix/001-fix-login-bug` | Urgent fixes to production code. |
| **Release branches** | `release/v1.0` | Prepares code for deployment. |

### Naming Convention
- Use lowercase and hyphens to separate words.  
- Examples:  
  - `feature/payment-integration`  
  - `hotfix/user-session-timeout`  
  - `release/v1.2`

---

## Complete Step-by-Step Workflow (Start → Finish)

### 1. Clone the Repository (SSH Setup)
If you haven’t set up SSH yet:
```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Start SSH agent and add your key
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copy your public key to clipboard
cat ~/.ssh/id_ed25519.pub
# Then add it to your GitHub account (Settings → SSH and GPG keys)
Now clone the repository:

bash
Copy code
git clone git@github.com:your-org/your-repo.git
cd your-repo
2. Create a New Feature Branch
Always start from main:

bash
Copy code
git checkout main
git pull origin main
git checkout -b feature/short-descriptive-name
Example:

bash
Copy code
git checkout -b feature/login-page
3. Work Locally and Commit
Make your changes, then:

bash
Copy code
git add .
git commit -m "feat(login): add login form UI"
Good Commit Message Format:

makefile
Copy code
<type>(<area>): <short imperative summary>

# Examples:
feat(auth): add login API integration
fix(ui): correct button alignment
docs(readme): update setup instructions
4. Keep Branch Updated with Main (Before Pushing)
Option 1 — Safe for Beginners (Fetch + Rebase):

bash
Copy code
git fetch origin
git rebase origin/main
Option 2 — Quick Pull with Rebase Shortcut:

bash
Copy code
git pull --rebase origin main
If conflicts appear:

bash
Copy code
git status                 # shows which files conflict
# open and fix the files manually
git add <resolved-file>
git rebase --continue
If it becomes messy:

bash
Copy code
git rebase --abort         # undo and restart rebase
5. Push Your Branch to GitHub
bash
Copy code
git push -u origin feature/login-page
6. Open a Pull Request (PR)
Go to GitHub and open a PR from your branch into main.

PR Checklist:

 Small, single-purpose PR

 Code builds and passes tests

 Proper commit message

 Includes description and screenshots (if UI)

 No console logs or debug code

7. Update Branch After Review
If main has new commits:

bash
Copy code
git fetch origin
git rebase origin/main
git push --force-with-lease
--force-with-lease ensures you don’t overwrite others’ work accidentally.

8. Merge & Cleanup
After approval:

Merge PR into main using “Squash and Merge” (recommended).

Update your local main and delete the feature branch.

bash
Copy code
git checkout main
git pull origin main
git branch -d feature/login-page
git push origin --delete feature/login-page
Conflict Scenarios — How to Resolve
Situation	Command / Action
During rebase	git status → fix files → git add <file> → git rebase --continue
During merge	git status → fix → git add <file> → git commit
Abort merge/rebase	git merge --abort or git rebase --abort
Check what changed	git diff or git log --oneline --graph

Merge Commit vs Rebase vs Squash
Strategy	What it does	When to use
Merge commit	Combines branches with all history	For large team merges or long-term branches
Rebase	Moves your commits on top of main	Keeps clean, linear history (use before PR)
Squash	Combines all commits into one	Recommended for PRs → one commit per feature

Default team rule: Rebase before PR, Squash and merge on GitHub.

Best Practices & Team Rules
Pull often before coding and before pushing.

One feature per branch — small, focused work.

Run tests locally before PR.

Protect main — only merge through PRs.

Keep commit messages clean (imperative mood).

CI/CD integration must pass before merging.

Never force push to main.

Keep branch names short and descriptive.

Branching Policy Wheel (Text Visualization)
pgsql
Copy code
        +------------+
        |   main     | ← stable code
        +-----+------+
              |
      +-------+-------+
      | feature/login |
      | feature/auth  |
      | hotfix/bug-42 |
      +-------+-------+
              ↓
        Merge via PR
              ↓
         Back to main
Troubleshooting Commands
Undo last commit (keep changes staged):

bash
Copy code
git reset --soft HEAD~1
Recover deleted branch:

bash
Copy code
git reflog
git checkout -b feature/recovered <commit-hash>
Abort merge or rebase:

bash
Copy code
git merge --abort
git rebase --abort
If your main branch has diverged badly:

bash
Copy code
git fetch origin
git reset --hard origin/main
This discards local changes — use with caution.

Git Cheat Sheet (Most Used Commands)
bash
Copy code
# Setup SSH (first time)
ssh-keygen -t ed25519 -C "email@example.com"
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Clone repo
git clone git@github.com:your-org/your-repo.git
cd your-repo

# Create branch
git checkout main
git pull origin main
git checkout -b feature/short-name

# Commit work
git add .
git commit -m "feat(module): short description"

# Keep up-to-date
git fetch origin
git rebase origin/main

# Push branch
git push -u origin feature/short-name

# Update after review
git fetch origin
git rebase origin/main
git push --force-with-lease

# After merge
git checkout main
git pull origin main
git branch -d feature/short-name
git push origin --delete feature/short-name
Final Notes
Communicate with your teammates — don’t push blindly.

Commit frequently but logically (every 1–2 hours of progress).

Rebase often to avoid merge conflicts later.

PRs should be easy to review — less than 300 lines ideally.

After merging, always clean your local branches.

Small, frequent updates reduce conflicts and improve collaboration.

Author: Frank D
Document Type: Internal Git Workflow Standard
Version: 1.0 — October 2025
Applies To: All frontend teams (React.TS projects)
