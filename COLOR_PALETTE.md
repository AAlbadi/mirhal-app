# Mirhal Color Palette - Visual Reference

## Complete Color System

### PRIMARY BROWN PALETTE (Warm & Earthy)

```
┌─────────────────────────────────────────────────────────┐
│ brand-brown-dark                                        │
│ CSS: bg-brand-brown-dark, text-brand-brown-dark        │
│ Hex: #4a2c2a                                           │
│ Use: Headers, dark sections, primary text              │
│ RGB: rgb(74, 44, 42)                                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ brand-brown-medium                                      │
│ CSS: bg-brand-brown-medium, text-brand-brown-medium    │
│ Hex: #a37b73                                           │
│ Use: Header background, medium emphasis                │
│ RGB: rgb(163, 123, 115)                                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ brand-brown-light                                       │
│ CSS: bg-brand-brown-light, text-brand-brown-light      │
│ Hex: #d5b9b2                                           │
│ Use: Borders, secondary text, subtle backgrounds       │
│ RGB: rgb(213, 185, 178)                                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ brand-sand                                              │
│ CSS: bg-brand-sand, text-brand-sand                    │
│ Hex: #f3e9e1                                           │
│ Use: Page backgrounds, warm light backgrounds          │
│ RGB: rgb(243, 233, 225)                                │
└─────────────────────────────────────────────────────────┘
```

### ACCENT COLORS (Interactive Elements)

```
┌─────────────────────────────────────────────────────────┐
│ brand-accent-teal                                       │
│ CSS: bg-brand-accent-teal, text-brand-accent-teal      │
│ Hex: #008080                                           │
│ Use: Primary buttons, primary actions, links           │
│ RGB: rgb(0, 128, 128)                                  │
│ Notes: Teal/cyan color, high contrast with browns      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ brand-accent-orange                                     │
│ CSS: bg-brand-accent-orange, text-brand-accent-orange  │
│ Hex: #d95f02                                           │
│ Use: Secondary actions, secondary highlights           │
│ RGB: rgb(217, 95, 2)                                   │
│ Notes: Warm orange, complements teal                   │
└─────────────────────────────────────────────────────────┘
```

### SEMANTIC COLORS (Status & Feedback)

```
┌─────────────────────────────────────────────────────────┐
│ brand-success                                           │
│ CSS: bg-brand-success, text-brand-success              │
│ Hex: #2a9d8f                                           │
│ Use: Success messages, positive feedback               │
│ RGB: rgb(42, 157, 143)                                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ brand-error                                             │
│ CSS: bg-brand-error, text-brand-error                  │
│ Hex: #e76f51                                           │
│ Use: Error messages, warnings, destructive actions     │
│ RGB: rgb(231, 111, 81)                                 │
└─────────────────────────────────────────────────────────┘
```

---

## Typical Usage Patterns

### Components

```jsx
// Header Component
<header className="bg-brand-brown-medium">
  <h1 className="text-white font-extrabold text-3xl">Mirhal</h1>
</header>

// Footer Component
<footer className="bg-brand-brown-dark">
  <p className="text-brand-sand">Copyright 2024</p>
</footer>

// VehicleCard Component
<div className="bg-white border border-brand-brown-light rounded-2xl">
  <img className="bg-brand-sand" src={photo} />
  <h3 className="text-brand-brown-dark font-bold">{title}</h3>
  <span className="text-brand-brown-medium">{subtitle}</span>
  <span className="text-brand-brown-dark font-bold">${price}</span>
</div>

// Primary Button
<button className="bg-brand-accent-teal text-white">
  Search
</button>

// Secondary Button
<button className="border-2 border-brand-accent-teal text-brand-accent-teal">
  Filter
</button>

// Input with Teal Accent
<input className="border-2 border-brand-brown-light focus:ring-2 focus:ring-brand-accent-teal" />

// Page Background
<div className="bg-brand-sand">
  {/* Page content */}
</div>
```

---

## Color Harmony Reference

### Warm Brown Tones (Premium Feel)
- Dark Brown (#4a2c2a) - Sophisticated, professional
- Medium Brown (#a37b73) - Balanced, approachable
- Light Brown (#d5b9b2) - Soft, subtle
- Sand (#f3e9e1) - Warm, inviting

### Accent Pairings
- Teal (#008080) on Browns = Fresh, modern contrast
- Orange (#d95f02) on Browns = Energetic, warm accent
- Both together = Complementary color scheme

### Light Mode Palette
- The entire design is light-themed
- White cards (#ffffff) on sand backgrounds (#f3e9e1)
- Brown text on light backgrounds
- No dark mode currently implemented

---

## Implementation Notes

### In Tailwind Config (index.html)
```javascript
colors: {
  'brand-brown-dark': '#4a2c2a',
  'brand-brown-medium': '#a37b73',
  'brand-brown-light': '#d5b9b2',
  'brand-sand': '#f3e9e1',
  'brand-accent-teal': '#008080',
  'brand-accent-orange': '#d95f02',
  'brand-success': '#2a9d8f',
  'brand-error': '#e76f51',
}
```

### How to Use in Components
```jsx
// All available as Tailwind classes:
className="text-brand-brown-dark"           // Text color
className="bg-brand-sand"                   // Background
className="border-brand-brown-light"        // Border color
className="hover:bg-brand-accent-teal"      // Hover state
className="focus:ring-brand-accent-teal"    // Focus ring
className="shadow-lg"                       // Shadows (standard Tailwind)
```

---

## Color Contrast (WCAG Compliance)

For text readability:
- Dark brown text (#4a2c2a) on sand (#f3e9e1): Good contrast (7:1+)
- Dark brown text (#4a2c2a) on white (#ffffff): Excellent contrast (8+:1)
- Brown medium text (#a37b73) on sand: Moderate contrast
- White text on teal (#008080): Good contrast (6:1+)
- White text on brown-dark: Excellent contrast (7+:1)

---

## Export for Design Tools

### Hex Values (Quick Copy)
```
#4a2c2a  brown-dark
#a37b73  brown-medium
#d5b9b2  brown-light
#f3e9e1  sand
#008080  accent-teal
#d95f02  accent-orange
#2a9d8f  success
#e76f51  error
```

### RGB Values
```
rgb(74, 44, 42)     brown-dark
rgb(163, 123, 115)  brown-medium
rgb(213, 185, 178)  brown-light
rgb(243, 233, 225)  sand
rgb(0, 128, 128)    accent-teal
rgb(217, 95, 2)     accent-orange
rgb(42, 157, 143)   success
rgb(231, 111, 81)   error
```

---

## Recommended Do's and Don'ts

### Do
- Use brown-dark for main text and headers
- Use teal for primary actions and CTAs
- Use sand for page backgrounds
- Use light brown for borders and separators
- Combine brown + teal for professional modern look
- Maintain white cards for contrast

### Don't
- Don't use orange as a background for main text
- Don't use more than 2 accent colors in one view
- Don't apply dark brown as page background (too dark)
- Don't mix standard gray colors with brand browns
- Don't use light brown text on sand background (low contrast)
- Don't add dark mode without careful color adjustments

