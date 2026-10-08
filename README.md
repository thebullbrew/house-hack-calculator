# House Hack Calculator

Buy a multi-unit property, live in one unit, let the tenants carry the mortgage.
Enter the deal — get your true out-of-pocket housing cost, line by line, plus a
verdict against renting a comparable place.

**Live:** https://thebullbrew.github.io/house-hack-calculator/

Free tool from [The Bull Brew](https://www.thebullbrew.com) — dark old-money
design, no backend, no build step. All inputs persist in the browser's
localStorage (`househack.v1`). Works offline once loaded (service worker).

## What it computes

- Monthly P&I (standard amortization), property tax, insurance, PMI
  (auto-zeroed at 20%+ down)
- Operating expenses: maintenance, CapEx reserve, owner-paid utilities,
  management
- Effective rental income from the non-owner units, less a vacancy allowance
- **Effective out-of-pocket** = total cost − rental income
- Comparison vs. renting a comparable place, with a verdict banner:
  `LIVING FREE + $X/mo` · `CHEAPER THAN RENTING by $X/mo` · `DOESN'T HACK`

## Structure

```
docs/           # GitHub Pages root
  index.html
  css/styles.css
  js/app.js
  manifest.webmanifest
  sw.js
  icons/
```

Estimates only — not financial advice.
