---
trigger: When auditing or fixing HTML styling in blog posts before publishing
description: Visual style rules for openclaws.blog — ensures tables and other elements match brand styling
---
# Style Audit

Audit the draft HTML for visual consistency before publishing. Fix any elements that don't match the brand styles below.

## Tables

Every `<table>` must use this exact inline style. If a table is missing these styles, rewrite it to match.

```html
<table style="width:100%; border-collapse:collapse; font-size:15px; margin:1.5em 0;">
  <thead>
    <tr style="background:#2563eb; color:#fff;">
      <th style="padding:12px 16px; text-align:left; font-weight:700;">Column</th>
      <!-- repeat for each column -->
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom:1px solid #e5e7eb;">
      <td style="padding:12px 16px;">Cell</td>
      <!-- repeat for each cell -->
    </tr>
    <!-- last row omits border-bottom -->
  </tbody>
</table>
```

### Checklist

- [ ] `<table>` has `width:100%; border-collapse:collapse; font-size:15px; margin:1.5em 0;`
- [ ] Header row `<tr>` has `background:#2563eb; color:#fff;`
- [ ] Every `<th>` has `padding:12px 16px; text-align:left; font-weight:700;`
- [ ] Every `<td>` has `padding:12px 16px;`
- [ ] Every body `<tr>` except the last has `border-bottom:1px solid #e5e7eb;`
- [ ] Table uses `<thead>` and `<tbody>` wrappers
