---
name: 🐛 Bug Report
about: Create a report to help us fix a defect in AVISHKAR-v2
title: '[BUG]: '
labels: ['bug']
assignees: ''
---

## 🐛 Defect Description
A clear and concise description of what the bug is.

---

## 🔁 Steps to Reproduce
1. Navigate to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

---

## 🎯 Expected Behavior
A clear and concise description of what you expected to happen.

---

## ⚠️ Actual Behavior & Error Messages
Include console logs, network error codes, or screenshots.
> **Security Notice**: Ensure that student personal information (names, roll numbers, phone numbers), access tokens, and API keys are completely redacted before submitting.

```text
// Paste sanitized error logs or HTTP response here
```

---

## 🏛️ Affected Portal / Component
- [ ] Public Portal (`/`, `/events`)
- [ ] Student Registration Wizard (`/register`)
- [ ] Live Status Tracker (`/status`)
- [ ] System Admin Roster & Modals (`/admin/registrations`)
- [ ] Presidential Desk (`/admin/president`)
- [ ] VP Logistics Desk (`/admin/vice-president`)
- [ ] Member Workspace (`/admin/member`)
- [ ] Document Storage & Signed URLs (`student-id-cards`, `payment-receipts`)
- [ ] Email Notifications (`Resend`)
- [ ] Cloudflare Workers Edge Runtime (`avishkar-v2`)

---

## 🖥️ Environment & Context
- **OS**: [e.g. Windows 11, macOS Sonoma, Ubuntu 22.04]
- **Browser**: [e.g. Chrome 124, Safari 17, Firefox 125]
- **Node.js Version**: [e.g. v20.18.0]
- **Target Environment**: [e.g. Local `dev:vinext`, Staging, Production Worker]

---

## 📊 Severity Level
- [ ] **Critical** (Production down, data corruption, security vulnerability)
- [ ] **High** (Core feature blocked e.g. student registration or approval failing)
- [ ] **Medium** (Non-blocking feature defect or edge-case failure)
- [ ] **Low** (UI cosmetic issue or minor typo)
