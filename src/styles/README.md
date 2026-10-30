# AVISHKAR-v2 Styling System

This directory documents the styling conventions and design tokens used throughout the **AVISHKAR 2026** portal at GD Goenka University.

## 🎨 Institutional Color Palette

The platform adheres to GD Goenka University's official ceremonial and academic identity:

- **Primary Deep Navy:** `#0A2047` (`bg-[#0A2047]`, `text-[#0A2047]`) — Used for top headers, hero gradients, and primary buttons.
- **Secondary Midnight Blue:** `#132E57` (`bg-[#132E57]`) — Used for card backgrounds and elevated components.
- **Accent University Gold:** `#D4AF37` (`text-[#D4AF37]`, `border-[#D4AF37]`) — Used for badges, borders, key highlights, and active indicators.
- **Light Gold / Warning Tint:** `#FEF3C7` / `#92400E` — Used for pending verification indicators.
- **Success Emerald:** `#10B981` / `#D1FAE5` — Used for approved registrations and payment confirmations.
- **Destructive Rose:** `#EF4444` / `#FEE2E2` — Used for rejection badges and error notices.
- **Neutral Background:** `#F8FAFC` (Slate 50) — High-contrast page backgrounds.

## 📐 Tailwind CSS v4 Configuration

Global styles, utilities, and font definitions are configured in [`src/app/globals.css`](file:///C:/Users/tinku/OneDrive/Desktop/AVISHKAR-v2/src/app/globals.css) and compiled via `@tailwindcss/postcss`.

## 🛡️ Guidelines

1. Never hardcode random colors; use the established `#0A2047` and `#D4AF37` design palette.
2. For interactive elements, always include focus rings (`focus:ring-2 focus:ring-[#D4AF37]`).
3. For text contrast, ensure all white-on-navy and navy-on-white text meets WCAG AA standards.
