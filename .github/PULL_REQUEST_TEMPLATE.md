## 📋 Pull Request Description

### 1. Summary of Changes
<!-- Provide a clear, high-level summary of what this pull request modifies or adds. -->

### 2. Motivation & Context
<!-- Explain the problem this PR solves or the enhancement it introduces. -->

### 3. Related Issue(s)
<!-- Link issues resolved by this PR (e.g., Closes #42 or Fixes #15). -->
Closes #

---

## 🏷️ Type of Change
<!-- Mark all checkboxes that apply. -->
- [ ] 🐛 **Bug fix** (non-breaking change fixing a defect)
- [ ] ✨ **New feature** (non-breaking change adding functionality)
- [ ] 💥 **Breaking change** (fix or feature causing existing features to not work as expected)
- [ ] 📝 **Documentation** (updates to `README.md`, `docs/`, or code comments)
- [ ] ♻️ **Refactoring** (structural code improvements without functional change)
- [ ] ⚡ **Performance / Edge optimization** (improving latency or Cloudflare bundle size)
- [ ] 🧪 **Tests** (adding unit, integration, or E2E tests)

---

## ✅ Quality & Pre-Submission Verification Checklist
<!-- All items must be checked before merging. -->
- [ ] Code follows the style guidelines in `CONTRIBUTING.md`.
- [ ] Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/).
- [ ] `npm test` executed and all unit & integration tests pass (73/73 checks).
- [ ] `npm run lint` executed with zero warnings or errors.
- [ ] `npm run build:vinext` executed and edge compilation succeeded.
- [ ] `git diff --check` executed with zero whitespace or line-ending errors.

---

## 🔒 Security & Edge Runtime Compliance
- [ ] **No Secrets Exposed**: Verified no API keys, tokens, `.env`, or service role secrets are committed.
- [ ] **Student PII Protected**: Verified no student names, roll numbers, phone numbers, or private documents are logged in plain text.
- [ ] **Edge Compatibility**: Verified that filesystem (`fs`) operations are defensively guarded for Cloudflare Workers.
- [ ] **Storage Buckets**: Verified that private document uploads stream directly to authenticated Supabase Storage.

---

## 📸 Verification & Testing Evidence
<!-- Paste test terminal output, screenshots, or screen recordings demonstrating the fix/feature. -->
```text
// Paste npm test output or verification logs here
```
