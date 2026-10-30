#!/usr/bin/env bash
# ==============================================================================
# AVISHKAR-v2 GitHub Issue Labels Setup Script (Bash)
# ==============================================================================
# Usage:
#   Ensure the GitHub CLI (gh) is authenticated:
#     gh auth login
#   Run this script from the repository root:
#     bash .github/scripts/setup-labels.sh
# ==============================================================================

set -euo pipefail

echo "Creating / Updating AVISHKAR-v2 GitHub Labels..."

sync_label() {
  local name="$1"
  local color="$2"
  local desc="$3"
  echo "Syncing label: ${name}..."
  gh label create "${name}" --color "${color}" --description "${desc}" --force
}

sync_label "bug" "d73a4a" "Something isn't working as expected"
sync_label "feature" "a2eeef" "New user-facing feature or API enhancement"
sync_label "documentation" "0075ca" "Improvements or additions to technical documentation"
sync_label "security" "e11d48" "Security vulnerabilities, access control, or PII protection"
sync_label "cloudflare-edge" "f6821f" "Cloudflare Workers & Vinext edge runtime compatibility"
sync_label "database" "008672" "Supabase PostgreSQL schema, migrations, RLS, or storage"
sync_label "testing" "bfdadc" "Automated test suites, unit, integration, and E2E QA"
sync_label "verification" "7057ff" "Student ID card and payment receipt verification workflow"
sync_label "email" "1d76db" "Transactional email notifications and Resend integration"
sync_label "blocked" "b60205" "Work is blocked by external dependencies or awaiting review"
sync_label "good first issue" "7057ff" "Good for newcomers and student developers"
sync_label "priority: high" "b60205" "Critical path item or production release blocker"

echo "All 12 GitHub labels have been synchronized successfully."
