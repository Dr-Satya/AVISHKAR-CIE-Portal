# ==============================================================================
# AVISHKAR-v2 GitHub Issue Labels Setup Script (PowerShell)
# ==============================================================================
# Usage:
#   Ensure the GitHub CLI (gh) is authenticated:
#     gh auth login
#   Run this script from the repository root:
#     pwsh .github/scripts/setup-labels.ps1
# ==============================================================================

$labels = @(
    @{ name = "bug";             color = "d73a4a"; description = "Something isn't working as expected" },
    @{ name = "feature";         color = "a2eeef"; description = "New user-facing feature or API enhancement" },
    @{ name = "documentation";   color = "0075ca"; description = "Improvements or additions to technical documentation" },
    @{ name = "security";        color = "e11d48"; description = "Security vulnerabilities, access control, or PII protection" },
    @{ name = "cloudflare-edge"; color = "f6821f"; description = "Cloudflare Workers & Vinext edge runtime compatibility" },
    @{ name = "database";        color = "008672"; description = "Supabase PostgreSQL schema, migrations, RLS, or storage" },
    @{ name = "testing";         color = "bfdadc"; description = "Automated test suites, unit, integration, and E2E QA" },
    @{ name = "verification";    color = "7057ff"; description = "Student ID card and payment receipt verification workflow" },
    @{ name = "email";           color = "1d76db"; description = "Transactional email notifications and Resend integration" },
    @{ name = "blocked";         color = "b60205"; description = "Work is blocked by external dependencies or awaiting review" },
    @{ name = "good first issue";color = "7057ff"; description = "Good for newcomers and student developers" },
    @{ name = "priority: high";  color = "b60205"; description = "Critical path item or production release blocker" }
)

Write-Host "Creating / Updating AVISHKAR-v2 GitHub Labels..." -ForegroundColor Cyan

foreach ($label in $labels) {
    Write-Host "Syncing label: $($label.name)..." -NoNewline
    gh label create $label.name --color $label.color --description $label.description --force
    Write-Host " [OK]" -ForegroundColor Green
}

Write-Host "All 12 GitHub labels have been synchronized successfully." -ForegroundColor Green
