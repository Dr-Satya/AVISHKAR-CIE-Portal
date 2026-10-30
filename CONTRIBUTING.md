# Contributing to AVISHKAR-v2

Thank you for your interest in contributing to **AVISHKAR-v2**, the official event management and student registration platform for GD Goenka University.

This repository enforces strict engineering, testing, and security standards to maintain production reliability on Cloudflare Workers and protect sensitive student data.

---

## 1. Code of Conduct

All contributors, maintainers, and institutional partners are expected to:
- Treat colleagues, students, and reviewers with professional respect and consideration.
- Maintain academic and engineering integrity in all contributions.
- Proactively protect student privacy (PII) and institutional confidential records.
- Comply with GD Goenka University policies and IT governance standards.

---

## 2. Git Branching Strategy

Our branching workflow ensures that production code is always verified, deployable, and traceable:

```
[ main ]           (Production - Deployed to Cloudflare Worker `avishkar-v2`)
   ▲
   │ (Validated releases via PR only)
[ develop ]        (Integration & Staging)
   ▲        ▲
   │        │
[ feature/* ] [ fix/* ]
```

### Branch Roles & Naming Conventions

| Branch Name | Base Branch | Target Branch | Purpose & Usage |
| :--- | :--- | :--- | :--- |
| `main` | — | — | **Production**: Strictly stable code deployed to Cloudflare Workers. Direct pushes are blocked. Protected branch requiring PR approval. |
| `develop` | `main` | `main` | **Integration**: Staging branch where tested features converge before production release. |
| `feature/<name>` | `develop` | `develop` | **Features**: New user stories or capabilities (e.g., `feature/attendance-scanner`, `feature/export-csv`). |
| `fix/<name>` | `develop` | `develop` | **Bug Fixes**: Defect resolutions (e.g., `fix/approval-persistence`, `fix/upload-size-guard`). |
| `docs/<name>` | `develop` / `main` | `develop` / `main` | **Documentation**: Architecture, API, and guide updates (e.g., `docs/api-spec`). |
| `hotfix/<name>` | `main` | `main` & `develop` | **Critical Hotfixes**: Urgent production-blocking fixes authorized by the repository owner. |

---

## 3. Conventional Commit Standards

All commit messages must adhere to the [Conventional Commits specification](https://www.conventionalcommits.org/):

```
<type>(<scope>): <imperative description>

[optional body]

[optional footer(s)]
```

### Allowed Commit Types

- `feat`: A new user-facing feature or API capability.
- `fix`: A bug fix or defect correction.
- `docs`: Documentation changes, architecture guides, or API specifications.
- `refactor`: Code refactoring that neither fixes a bug nor adds a feature.
- `test`: Adding missing tests or correcting existing tests.
- `chore`: Build scripts, dependencies, configuration, or CI workflow updates.

### Examples
- `feat(register): add university admission number format validation`
- `fix(approval): resolve supabase persistence error during dual verification`
- `docs(database): add migration guide for 012 email notification ledger`
- `test(upload): add unit suite for student id card signature validation`

---

## 4. Mandatory Pre-Commit Quality Gates

Before opening a Pull Request or committing changes, run the following verification pipeline locally:

```bash
# 1. Run automated test suites (All unit and integration checks must pass)
npm test

# 2. Run static code analysis (Zero warnings or errors permitted)
npm run lint

# 3. Verify Cloudflare Workers edge compilation
npm run build:vinext

# 4. Verify formatting and whitespace integrity
git diff --check
```

Any PR that fails these automated quality gates will be blocked by CI.

---

## 5. Pull Request Lifecycle

1. **Fork or Create Feature Branch**:
   - Create your branch from `develop`:
     ```bash
     git checkout develop
     git pull origin develop
     git checkout -b feature/your-feature-name
     ```

2. **Develop & Test Locally**:
   - Write clean, type-safe TypeScript code.
   - Guard against Node.js runtime assumptions to maintain Cloudflare Workers edge compatibility.
   - Add automated test assertions in `tests/` covering new logic.

3. **Open Pull Request**:
   - Open a PR targeting the `develop` branch (or `main` for hotfixes).
   - Use the standard Pull Request template provided in `.github/PULL_REQUEST_TEMPLATE.md`.
   - Provide clear reproduction steps, screenshots (for UI changes), and test evidence.

4. **Code Review & Merge**:
   - PRs must be reviewed and approved by repository owner `@Dr-Satya`.
   - All CI checks in `.github/workflows/ci.yml` must succeed.
   - Maintainers will squash-merge or rebase approved PRs into `develop`.

---

## 6. Prohibited Practices

- **Never commit credentials or secrets**: Do not commit `.env`, `.env.local`, API keys, tokens, or private keys.
- **Never expose Student PII**: Do not print student names, roll numbers, phone numbers, or document paths in server logs or git history.
- **Never use unshielded Node.js filesystem APIs**: Cloudflare Workers lacks a local disk. Always wrap `fs` calls in defensive guards.
- **Never bypass quality gates**: Do not disable tests or use `--no-verify` to bypass pre-commit checks.
