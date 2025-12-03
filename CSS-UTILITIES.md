# CSS Utility Classes Reference

This document outlines the utility class system for Photo Hunt to maintain consistency and reduce CSS duplication.

## Architecture

- **style.css** - Base reset, CSS variables, and utility classes
- **layout.css** - Structural positioning and layout (no colors/styling)
- **themes/*.css** - Colors, backgrounds, and visual styling only

## Utility Classes

### Shadow Utilities
Use `var(--shadow-color)` from the active theme.

- `.shadow-lg` - `5px 5px 0` - For main containers (header-bar, timer-bar)
- `.shadow-md` - `3px 3px 0` - For medium elements
- `.shadow-sm` - `2px 2px 0` - For nested elements (buttons, score boxes)
- `.shadow-xs` - `1px 1px 0` - For active/pressed states

### Border Utilities
Use `var(--border-dark)` from the active theme.

- `.border-dark` - 3px solid border (default)
- `.border-dark-thin` - 2px solid border
- `.border-dark-thick` - 4px solid border

### Border Radius Utilities

- `.rounded` - `8px` - Standard rounding
- `.rounded-lg` - `12px` - Large rounding
- `.rounded-full` - `50%` - Circular elements

### Flexbox Utilities

- `.flex` - Basic flex container
- `.flex-center` - Center items horizontally and vertically
- `.flex-between` - Space items between with aligned centers

### Text Utilities

- `.text-bold` - Bold font weight
- `.text-upper` - Uppercase transformation

### Visibility Utilities

- `.hidden` - Hide element completely
- `.sr-only` - Screen reader only (accessible but invisible)

## Usage Examples

```html
<!-- Score box with small shadow, border, and rounded corners -->
<div class="total-score shadow-sm border-dark rounded">
  <span class="label">SCORE</span>
  <span class="value">1000</span>
</div>

<!-- Timer bar with large shadow, thick border, and large rounding -->
<div class="timer-bar shadow-lg border-dark-thick rounded-lg">
  <!-- Content -->
</div>

<!-- Circular hint button with small shadow and dark border -->
<button class="hint-btn shadow-sm border-dark rounded-full">
  ?
</button>
```

## Benefits

1. **Consistency** - All shadows, borders, and radii use the same values
2. **Maintainability** - Change in one place affects all instances
3. **Cleaner Code** - Less CSS duplication
4. **Theme Support** - Uses CSS variables that themes can customize
5. **Visual Hierarchy** - Shadow sizes clearly indicate element nesting

## Theme Integration

Themes only need to define:
- Colors and backgrounds
- Typography (font families, sizes)
- Theme-specific CSS variables (`--shadow-color`, `--border-dark`)

Themes should NOT define:
- Border widths (use utilities)
- Border radius values (use utilities)
- Shadow sizes (use utilities)
- Layout/positioning (use layout.css)
