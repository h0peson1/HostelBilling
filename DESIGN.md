# Design System: Hostel Portal System

This design system was generated and extracted from the **Google Stitch** project `projects/9400132624252122147` (*Hostel Wi-Fi Management Portal*).

---

## Brand & Style

This design system serves a dual-purpose environment:
1. An effortless, zero-friction Wi-Fi captive onboarding portal for university students.
2. A high-density, precise management console for hostel IT administrators.

The aesthetic is **Modern Tech Minimalist** infused with high-energy digital utility. It balances student-friendly approachability with industrial-strength administrative clarity. The emotional atmosphere is dependable, instant, fast, and organized. Students feel immediate reassurance that their connection is secure and high-speed, while facility managers have an uncluttered workspace prioritizing network health, bandwidth allocation, device sessions, and authentication logs.

### Visual Characteristics
- Crisp white and deep slate background planes with subtle electric indigo borders.
- Luminous mint and emerald connectivity pulses that intuitively signal online health.
- Clear structural division between primary device controls, session timers, and usage statistics.
- Generous touch targets for fast smartphone logins combined with compact, data-dense table views on desktop viewports.

---

## Color Palette Tokens

```yaml
Primary Colors:
  primary: '#2A14B4'
  primary-container: '#4338CA'       # Electric Indigo
  on-primary: '#FFFFFF'
  on-primary-container: '#C1BEFF'
  primary-fixed: '#E3DFFF'
  primary-fixed-dim: '#C3C0FF'

Secondary Colors:
  secondary: '#006C49'
  secondary-container: '#6CF8BB'     # Radiant Mint / Emerald
  on-secondary: '#FFFFFF'
  on-secondary-container: '#00714D'
  secondary-fixed: '#6FFBBE'
  secondary-fixed-dim: '#4EDEA3'

Tertiary Colors:
  tertiary: '#00414D'
  tertiary-container: '#005A6A'      # Electric Cyan / Telemetry
  on-tertiary: '#FFFFFF'
  on-tertiary-container: '#4AD5F4'
  tertiary-fixed: '#ACEDFF'
  tertiary-fixed-dim: '#4CD7F6'

Surfaces & Canvas:
  background: '#FAF8FF'              # Cool light canvas
  on-background: '#131B2E'
  surface: '#FAF8FF'
  surface-bright: '#FAF8FF'
  surface-dim: '#D2D9F4'
  surface-container-lowest: '#FFFFFF'
  surface-container-low: '#F2F3FF'
  surface-container: '#EAEDFF'
  surface-container-high: '#E2E7FF'
  surface-container-highest: '#DAE2FD'
  on-surface: '#131B2E'
  on-surface-variant: '#464554'
  outline: '#777586'
  outline-variant: '#C7C4D7'
  surface-tint: '#5148D7'

Feedback & Alerts:
  error: '#BA1A1A'
  error-container: '#FFDAD6'
  on-error: '#FFFFFF'
  on-error-container: '#93000A'
```

---

## Typography

The type scale combines **Space Grotesk** for numerical metrics, headlines, and data badges with **Plus Jakarta Sans** for running text, policy documentation, form fields, and input instructions.

| Token | Family | Size | Weight | Line Height | Letter Spacing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `display-lg` | Space Grotesk | 48px | 700 | 56px | -0.03em |
| `display-lg-mobile` | Space Grotesk | 32px | 700 | 40px | -0.02em |
| `headline-lg` | Space Grotesk | 32px | 600 | 40px | -0.02em |
| `headline-md` | Space Grotesk | 24px | 600 | 32px | -0.01em |
| `headline-sm` | Space Grotesk | 20px | 600 | 28px | normal |
| `title-md` | Plus Jakarta Sans | 18px | 600 | 26px | normal |
| `body-lg` | Plus Jakarta Sans | 16px | 400 | 24px | normal |
| `body-md` | Plus Jakarta Sans | 14px | 400 | 20px | normal |
| `body-sm` | Plus Jakarta Sans | 12px | 400 | 16px | normal |
| `label-lg` | Space Grotesk | 14px | 600 | 20px | +0.01em |
| `label-md` | Space Grotesk | 12px | 600 | 16px | +0.02em |
| `label-sm` | Space Grotesk | 10px | 700 | 14px | +0.05em |

---

## Spatial Grid & Layout

- **Mobile (320px – 767px)**: Captive portal standard. 4-column layout, 16px outer margins, 16px gutters.
- **Tablet (768px – 1023px)**: 8-column layout, 24px margins, 16px gutters.
- **Desktop (1024px+)**: 12-column layout, 32px margins, 24px gutters. Admin sidebar: 260px fixed width.

---

## Elevation Tiers

1. **Base Surface (Level 0)**: `#FAF8FF` canvas background.
2. **Elevated Surface (Level 1)**: `#FFFFFF` cards, hairline border `1px solid #E2E8F0`, shadow `0 1px 3px 0 rgba(15, 23, 42, 0.04)`.
3. **Hover Surface (Level 2)**: Dynamic lift shadow `0 8px 16px -4px rgba(67, 56, 202, 0.08)`.
4. **Modal / Overlay Surface (Level 3)**: Bordered with `1px solid #CBD5E1`, shadow `0 20px 25px -5px rgba(15, 23, 42, 0.1)`, with `rgba(15, 23, 42, 0.4)` 8px blur backdrop.
