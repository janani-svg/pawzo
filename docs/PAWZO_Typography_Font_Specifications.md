# PAWZO - Typography & Font Specifications
## Complete Font System Guide

---

## 1. Typeface Selection

### 1.1 Primary Typeface: Inter
**Why Inter?**
- Highly legible on mobile screens and widgets
- Excellent for small sizes (widget optimization)
- Modern, friendly, approachable tone
- Free and open-source (Google Fonts)
- Perfect for health/wellness apps
- Supports multiple weights (100-900)

**Download:** https://fonts.google.com/specimen/Inter

### 1.2 Secondary Typeface: Poppins
**Why Poppins?**
- Friendly, rounded letterforms (pet-friendly feel)
- Great for headings and display text
- Strong visual personality
- Good contrast with Inter for hierarchy
- Supports weights (100-900)

**Download:** https://fonts.google.com/specimen/Poppins

### 1.3 Fallback Stack
```css
/* Primary Font Stack */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Secondary Font Stack */
font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Fallback for system fonts */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
```

---

## 2. Font Scale & Sizing

### 2.1 Complete Font Size Scale

| Size Name | Size (px) | Size (rem) | Usage |
|-----------|-----------|-----------|-------|
| **XS** | 10 | 0.625 | Captions, timestamps (widget) |
| **S** | 12 | 0.75 | Helper text, secondary info |
| **SM** | 13 | 0.8125 | Small body text, labels |
| **M** | 14 | 0.875 | Body text, standard paragraph |
| **L** | 16 | 1 | Large body, emphasis text |
| **XL** | 18 | 1.125 | Subheadings, card titles |
| **2XL** | 20 | 1.25 | Section titles |
| **3XL** | 24 | 1.5 | Page headers |
| **4XL** | 28 | 1.75 | Major headings |
| **5XL** | 32 | 2 | Large page titles |
| **6XL** | 36 | 2.25 | Landing page heroes |
| **7XL** | 40 | 2.5 | Large hero text |

---

## 3. Font Weights

### 3.1 Weight Specifications

| Weight | Name | Usage | Examples |
|--------|------|-------|----------|
| **400** | Regular | Standard body text, paragraphs | Description text, explanations |
| **500** | Medium | Emphasis, labels, important text | Field labels, button text |
| **600** | Semi-Bold | Subheadings, card titles | Widget titles, section headers |
| **700** | Bold | Page titles, key information | Main headings, call-to-action |
| **800** | Extra-Bold | Hero text, prominence | Landing page title |

**Note:** Only load weights 400, 500, 600, 700 to optimize performance. Avoid 300, 800+ for app use.

---

## 4. Line Height & Spacing

### 4.1 Line Height Scale

| Name | Line Height | Usage | Example Text Sizes |
|------|------------|-------|-------------------|
| **Tight** | 1 | Headlines, single-line text | 3XL - 7XL |
| **Normal** | 1.25 | Subheadings, short titles | 2XL - 3XL |
| **Relaxed** | 1.5 | Body text, readable paragraphs | M - XL |
| **Loose** | 1.75 | Long-form content | M |

### 4.2 Letter Spacing

| Name | Letter Spacing | Usage |
|------|----------------|-------|
| **Tight** | -0.01em | Headlines, condensed |
| **Normal** | 0 | Body text, standard |
| **Wide** | 0.025em | Labels, emphasis |
| **Extra Wide** | 0.05em | All-caps text, labels |

---

## 5. Typography Styles Guide

### 5.1 HEADINGS & TITLES

#### Display / Hero (Large Page Title)
```
Font Family: Poppins
Font Size: 40px (2.5rem)
Font Weight: 700 (Bold)
Line Height: 1 (40px)
Letter Spacing: -0.01em
Color: #175676 (Dark Blue)
Usage: Landing page hero, app title
```

#### Heading 1 (Page Title)
```
Font Family: Poppins
Font Size: 32px (2rem)
Font Weight: 700 (Bold)
Line Height: 1 (32px)
Letter Spacing: -0.01em
Color: #175676
Usage: Page headers, major sections
```

#### Heading 2 (Section Title)
```
Font Family: Poppins
Font Size: 24px (1.5rem)
Font Weight: 700 (Bold)
Line Height: 1.25 (30px)
Letter Spacing: -0.01em
Color: #175676
Usage: Section headers, dashboard tiles
```

#### Heading 3 (Card Title / Widget Title)
```
Font Family: Poppins
Font Size: 20px (1.25rem)
Font Weight: 600 (Semi-Bold)
Line Height: 1.25 (25px)
Letter Spacing: 0
Color: #175676
Usage: Card titles, widget headers, modal titles
```

#### Heading 4 (Subheading)
```
Font Family: Inter
Font Size: 18px (1.125rem)
Font Weight: 600 (Semi-Bold)
Line Height: 1.25 (22.5px)
Letter Spacing: 0
Color: #175676
Usage: Subheadings, emphasis text
```

---

### 5.2 BODY TEXT

#### Body Text - Large
```
Font Family: Inter
Font Size: 16px (1rem)
Font Weight: 400 (Regular)
Line Height: 1.5 (24px)
Letter Spacing: 0
Color: #175676
Usage: Main body content, descriptions, explanations
```

#### Body Text - Regular
```
Font Family: Inter
Font Size: 14px (0.875rem)
Font Weight: 400 (Regular)
Line Height: 1.5 (21px)
Letter Spacing: 0
Color: #175676
Usage: Standard paragraphs, card descriptions
```

#### Body Text - Small
```
Font Family: Inter
Font Size: 13px (0.8125rem)
Font Weight: 400 (Regular)
Line Height: 1.5 (19.5px)
Letter Spacing: 0
Color: #4BA3C3 (Secondary Blue)
Usage: Secondary information, helper text
```

---

### 5.3 LABELS & CONTROLS

#### Label - Standard
```
Font Family: Inter
Font Size: 14px (0.875rem)
Font Weight: 500 (Medium)
Line Height: 1.25 (17.5px)
Letter Spacing: 0.025em
Color: #175676
Usage: Form labels, field names, buttons
```

#### Label - Small
```
Font Family: Inter
Font Size: 12px (0.75rem)
Font Weight: 600 (Semi-Bold)
Line Height: 1.25 (15px)
Letter Spacing: 0.05em
Color: #4BA3C3
Usage: Tags, badges, category labels
```

#### Label - All Caps
```
Font Family: Inter
Font Size: 12px (0.75rem)
Font Weight: 700 (Bold)
Line Height: 1 (12px)
Letter Spacing: 0.05em
Color: #D62839 (Red/Alert)
Usage: Alert labels, critical badges, status indicators
```

---

### 5.4 WIDGET-SPECIFIC TEXT

#### Widget Title
```
Font Family: Poppins
Font Size: 16px (1rem)
Font Weight: 700 (Bold)
Line Height: 1 (16px)
Letter Spacing: -0.01em
Color: #175676
Usage: Widget headers (lock screen, home screen)
```

#### Widget Value / Number
```
Font Family: Inter
Font Size: 28px (1.75rem)
Font Weight: 700 (Bold)
Line Height: 1 (28px)
Letter Spacing: -0.01em
Color: #3A6EA5 (Primary Blue)
Usage: Large data values in widgets (count, time)
Example: "2" (pets), "95%" (health)
```

#### Widget Subtitle
```
Font Family: Inter
Font Size: 12px (0.75rem)
Font Weight: 400 (Regular)
Line Height: 1.25 (15px)
Letter Spacing: 0
Color: #4BA3C3 (Secondary Blue)
Usage: Widget descriptions, timestamps
Example: "Last fed 2 hours ago"
```

#### Widget Status Indicator
```
Font Family: Inter
Font Size: 11px (0.6875rem)
Font Weight: 600 (Semi-Bold)
Line Height: 1 (11px)
Letter Spacing: 0.025em
Color: #175676 (on light background)
Usage: Pet status, health status tags
Examples: "Healthy", "Medication Due", "Feeding Time"
```

---

### 5.5 BUTTONS & CTAs

#### Primary Button Text
```
Font Family: Inter
Font Size: 16px (1rem)
Font Weight: 600 (Semi-Bold)
Line Height: 1.25 (20px)
Letter Spacing: 0.025em
Color: White (#FFFFFF)
Usage: Main call-to-action buttons
Example: "Add Pet", "Log Feeding", "Call Vet"
```

#### Secondary Button Text
```
Font Family: Inter
Font Size: 14px (0.875rem)
Font Weight: 500 (Medium)
Line Height: 1.25 (17.5px)
Letter Spacing: 0
Color: #3A6EA5
Usage: Secondary actions, links
Example: "Cancel", "Learn More", "View Details"
```

#### Small Button Text
```
Font Family: Inter
Font Size: 12px (0.75rem)
Font Weight: 600 (Semi-Bold)
Line Height: 1 (12px)
Letter Spacing: 0.025em
Color: White
Usage: Small action buttons, icon buttons
Example: "Save", "Delete", "Snooze"
```

---

### 5.6 FORM ELEMENTS

#### Input Placeholder Text
```
Font Family: Inter
Font Size: 14px (0.875rem)
Font Weight: 400 (Regular)
Line Height: 1.5 (21px)
Letter Spacing: 0
Color: #CCE6F4 (Light gray)
Opacity: 0.6
Usage: Form input placeholders
Example: "Search pet name..."
```

#### Input Text (Filled)
```
Font Family: Inter
Font Size: 14px (0.875rem)
Font Weight: 400 (Regular)
Line Height: 1.5 (21px)
Letter Spacing: 0
Color: #175676
Usage: User-entered text in form fields
```

#### Error Text
```
Font Family: Inter
Font Size: 12px (0.75rem)
Font Weight: 400 (Regular)
Line Height: 1.25 (15px)
Letter Spacing: 0
Color: #D62839 (Red)
Usage: Form validation errors
Example: "This field is required"
```

---

### 5.7 NOTIFICATIONS & ALERTS

#### Alert Title
```
Font Family: Poppins
Font Size: 18px (1.125rem)
Font Weight: 700 (Bold)
Line Height: 1.25 (22.5px)
Letter Spacing: 0
Color: #D62839 (Red - Error)
Color: #BA324F (Warning - Orange)
Color: #B4EBCA (Success - Green)
Usage: Notification/alert titles
```

#### Alert Message
```
Font Family: Inter
Font Size: 14px (0.875rem)
Font Weight: 400 (Regular)
Line Height: 1.5 (21px)
Letter Spacing: 0
Color: #175676
Usage: Notification/alert content
```

---

### 5.8 ADDITIONAL ELEMENTS

#### Tab Text
```
Font Family: Inter
Font Size: 14px (0.875rem)
Font Weight: 500 (Medium)
Line Height: 1.5 (21px)
Letter Spacing: 0
Color: #4BA3C3 (Inactive)
Color: #175676 (Active)
Usage: Tab navigation labels
```

#### Breadcrumb Text
```
Font Family: Inter
Font Size: 12px (0.75rem)
Font Weight: 400 (Regular)
Line Height: 1.25 (15px)
Letter Spacing: 0
Color: #4BA3C3
Usage: Breadcrumb navigation
```

#### Caption / Metadata
```
Font Family: Inter
Font Size: 11px (0.6875rem)
Font Weight: 400 (Regular)
Line Height: 1.25 (13.75px)
Letter Spacing: 0
Color: #809BCE (Tertiary Blue)
Usage: Timestamps, photo captions, metadata
Example: "Updated 2 hours ago"
```

#### Toast/Snackbar Text
```
Font Family: Inter
Font Size: 13px (0.8125rem)
Font Weight: 500 (Medium)
Line Height: 1.25 (16.25px)
Letter Spacing: 0
Color: White
Usage: Quick notification toasts
Example: "Feeding logged successfully"
```

---

## 6. Font Usage by Component

### 6.1 Navigation Components

#### Top Navigation Bar
- Title: Heading 2 (24px, Bold)
- Subtitle: Body Small (13px, Regular)
- Menu Items: Label Standard (14px, Medium)

#### Sidebar Navigation
- Section Title: Label Standard (14px, Semi-Bold)
- Menu Item: Body Text - Regular (14px, Regular)
- Active Item: Body Text - Regular (14px, Regular, color: #3A6EA5)

#### Bottom Tab Navigation
- Tab Label: Label Small (12px, Medium)
- Badge Count: Caption (11px, Semi-Bold)

---

### 6.2 Card Components

#### Pet Card (Dashboard)
- Pet Name: Heading 3 (20px, Semi-Bold)
- Status: Widget Status Indicator (11px, Semi-Bold)
- Last Activity: Widget Subtitle (12px, Regular)
- Metadata: Caption (11px, Regular)

#### Health Card
- Title: Heading 3 (20px, Semi-Bold)
- Value: Widget Value/Number (28px, Bold) [if numeric]
- Description: Body Small (13px, Regular)
- Timestamp: Caption (11px, Regular)

#### Memory/Photo Card
- Caption: Body Text - Regular (14px, Regular)
- Date: Caption (11px, Regular)
- Like Count: Label Small (12px, Medium)

---

### 6.3 Modal & Dialog Components

#### Modal Title
- Font: Heading 2 (24px, Bold)
- Close Button: Label Standard (14px, Medium)

#### Modal Content
- Body Text: Body Text - Regular (14px, Regular)
- Subsections: Heading 4 (18px, Semi-Bold)

#### Modal Buttons
- Primary Button: Primary Button Text (16px, Semi-Bold)
- Secondary Button: Secondary Button Text (14px, Medium)

---

### 6.4 Form Components

#### Form Label
- Font: Label Standard (14px, Medium)
- Required Indicator: Label Standard (14px, Medium, color: #D62839)

#### Input Field
- Placeholder: Input Placeholder Text (14px, Regular, opacity: 0.6)
- Filled Text: Input Text (14px, Regular)
- Helper Text: Body Small (13px, Regular, color: #4BA3C3)
- Error Text: Error Text (12px, Regular, color: #D62839)

#### Checkbox/Radio Label
- Font: Label Standard (14px, Regular)

---

### 6.5 Widget Typography

#### Lock Screen Widget (iOS/Android)
- Title: Widget Title (16px, Bold)
- Large Value: Widget Value/Number (28px, Bold)
- Subtitle: Widget Subtitle (12px, Regular)
- Status: Widget Status Indicator (11px, Semi-Bold)
- Max recommended text: ~3 lines

#### Home Screen Widget (iOS/Android)
- Widget Title: Widget Title (16px, Bold)
- Section Headers: Label Standard (14px, Medium)
- Values: Widget Value/Number (24px, Bold)
- Descriptions: Widget Subtitle (12px, Regular)
- Metadata: Caption (11px, Regular)

#### Smartwatch Widget (Apple Watch/Wear OS)
- Title: Label Standard (12px, Medium)
- Large Value: Widget Value/Number (20px, Bold)
- Subtitle: Caption (10px, Regular)
- **Note:** Use larger line heights due to small screen size

---

## 7. Color + Typography Combinations

### 7.1 Text on Color Backgrounds

#### On Primary Blue (#3A6EA5)
```
Heading Text: White (FFFFFF)
Body Text: White (FFFFFF)
Caption: #E7F59E (Light yellow)
```

#### On Light Background (#BCF4F5)
```
Heading Text: #175676 (Dark blue)
Body Text: #175676
Links: #3A6EA5 (Primary blue)
Caption: #4BA3C3 (Secondary blue)
```

#### On Success Color (#B4EBCA)
```
Heading Text: #175676
Body Text: #175676
Label: #175676
```

#### On Alert Color (#FFB7C3)
```
Heading Text: White (FFFFFF)
Body Text: White (FFFFFF)
Label: #D62839
```

#### On Dark Color (#175676)
```
Heading Text: White (FFFFFF)
Body Text: #E7F59E (Light yellow)
Label: White (FFFFFF)
Caption: #CCE6F4
```

---

## 8. Responsive Typography

### 8.1 Mobile (320px - 479px)
Scale down headings:
- H1 (Display): 32px → 28px
- H2: 24px → 20px
- H3: 20px → 18px
- Body: 16px → 14px

Increase line height for readability:
- Body text: 1.5 → 1.75 (easier reading on small screens)
- Headings: 1 → 1.2

### 8.2 Tablet (480px - 1024px)
Maintain standard scale, adjust spacing:
- Padding increases
- Line heights remain standard
- Column width optimization

### 8.3 Desktop (1024px+)
Full font scale:
- All sizes as specified above
- Optimize for readability
- Wider line lengths allow tighter line heights

---

## 9. Accessibility & Legibility

### 9.1 Minimum Font Sizes
- **Mobile:** Body text minimum 14px
- **Widget:** Text minimum 11px (optimized with higher contrast)
- **Caption:** Minimum 10px only for timestamps

### 9.2 Contrast Ratios (WCAG AA)

| Text Color | Background | Contrast Ratio | WCAG Level |
|-----------|-----------|----------------|-----------|
| #175676 (Dark) | #FFFFFF (White) | 10.5:1 | AAA |
| #175676 | #BCF4F5 (Light Blue) | 8.2:1 | AAA |
| #3A6EA5 (Primary) | #FFFFFF | 5.8:1 | AA |
| #D62839 (Error) | #FFFFFF | 5.1:1 | AA |
| #4BA3C3 (Secondary) | #FFFFFF | 4.3:1 | AA |

### 9.3 Font Features for Accessibility
- Anti-aliasing: Enabled
- Font smoothing: Optimized for readability
- Letter spacing: Adequate (avoid negative tracking on body text)
- Line height: Minimum 1.25 for body text
- No excessive italics (use sparingly for emphasis)
- Sufficient weight contrast between text weights

---

## 10. Dark Mode Typography

### 10.1 Text Colors (Dark Theme)

| Element | Light Mode | Dark Mode | Purpose |
|---------|-----------|----------|---------|
| Primary Text | #175676 | #FFFFFF | Main content |
| Secondary Text | #4BA3C3 | #CCE6F4 | Supporting info |
| Tertiary Text | #809BCE | #809BCE | Metadata, captions |
| Disabled Text | #CCE6F4 | #4BA3C3 | Inactive elements |
| Link Color | #3A6EA5 | #4BA3C3 | Interactive text |
| Error Color | #D62839 | #FF6B6B | Alerts |
| Success Color | #B4EBCA | #92AA83 | Positive feedback |

### 10.2 Dark Mode Adjustments
- Increase letter spacing slightly for better readability
- Slightly reduce font weights (bold feels heavier on dark backgrounds)
- Increase line height by 0.1-0.2 for comfort
- Use softer text colors (avoid pure white #FFFFFF, use #F5F5F5)

---

## 11. Implementation Guidelines

### 11.1 CSS Variables
```css
:root {
  /* Font Families */
  --font-primary: 'Inter', sans-serif;
  --font-secondary: 'Poppins', sans-serif;
  
  /* Font Sizes */
  --text-xs: 0.625rem;
  --text-sm: 0.75rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.75rem;
  --text-4xl: 2rem;
  --text-5xl: 2.25rem;
  --text-6xl: 2.5rem;
  
  /* Font Weights */
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
  
  /* Line Heights */
  --lh-tight: 1;
  --lh-normal: 1.25;
  --lh-relaxed: 1.5;
  --lh-loose: 1.75;
  
  /* Letter Spacing */
  --ls-tight: -0.01em;
  --ls-normal: 0;
  --ls-wide: 0.025em;
  --ls-extra: 0.05em;
}
```

### 11.2 SCSS Mixins
```scss
// Heading 1
@mixin h1 {
  font-family: var(--font-secondary);
  font-size: var(--text-4xl);
  font-weight: var(--weight-bold);
  line-height: var(--lh-tight);
  letter-spacing: var(--ls-tight);
}

// Body Text
@mixin body {
  font-family: var(--font-primary);
  font-size: var(--text-base);
  font-weight: var(--weight-regular);
  line-height: var(--lh-relaxed);
  letter-spacing: var(--ls-normal);
}

// Widget Title
@mixin widget-title {
  font-family: var(--font-secondary);
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
  line-height: var(--lh-tight);
  letter-spacing: var(--ls-tight);
}
```

### 11.3 Web Font Loading (Google Fonts)
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet">
```

**Font Loading Strategy:**
- Load only weights 400, 500, 600, 700
- Use `display=swap` for faster font display fallback
- Preconnect to Google Fonts servers
- Consider variable fonts (Inter) for future optimization

---

## 12. Widget-Specific Font Optimization

### 12.1 Lock Screen Widget Constraints
- **Max characters per line:** 15-20
- **Max lines:** 2-3
- **Minimum font size:** 11px
- **Recommended hierarchy:** Title (16px) → Value (28px) → Subtitle (12px)
- **Use high contrast:** #175676 on #FFFFFF or #BCF4F5

### 12.2 Home Screen Widget Constraints
- **Max characters per line:** 25-30
- **Max lines:** 4-5
- **Minimum font size:** 11px
- **Recommended hierarchy:** Title (16px) → Section (14px) → Content (14px) → Meta (11px)

### 12.3 Smartwatch Widget Constraints
- **Max characters per line:** 10-12
- **Max lines:** 2
- **Minimum font size:** 10px (with higher contrast)
- **Recommended hierarchy:** Title (12px) → Large value (20px) → Subtitle (10px)
- **Increase spacing:** Use 1.5-1.75 line height

---

## 13. Font Pairing Examples

### 13.1 Display Text (Hero)
```
Poppins 40px Bold + Inter 16px Regular
"Never Miss a Moment"
"Stay connected to your pet"
```

### 13.2 Card Title & Description
```
Poppins 20px Semi-Bold + Inter 14px Regular
"Fluffy's Health"
"Healthy - Last checked 2 hours ago"
```

### 13.3 Widget Entry
```
Poppins 16px Bold + Inter 28px Bold + Inter 12px Regular
"Health Status"
"95%"
"Last updated 30 mins ago"
```

### 13.4 Alert/Notification
```
Poppins 18px Bold + Inter 14px Regular
"Medication Due"
"Fluffy needs antibiotics now"
```

---

## 14. Typography Checklist

### 14.1 Implementation Checklist
- [ ] Inter font loaded (weights 400, 500, 600, 700)
- [ ] Poppins font loaded (weights 600, 700)
- [ ] CSS variables defined for all font sizes
- [ ] SCSS mixins created for common styles
- [ ] Dark mode color adjustments applied
- [ ] Responsive typography rules set for mobile/tablet/desktop
- [ ] Contrast ratios verified (minimum AA, target AAA)
- [ ] Widget typography tested on actual devices
- [ ] Font fallback stacks implemented
- [ ] Line height optimization for readability
- [ ] Letter spacing applied appropriately
- [ ] Web font loading strategy optimized

### 14.2 Testing Checklist
- [ ] Typography readable on small screens (320px)
- [ ] Headings stand out visually
- [ ] Body text comfortable to read (line length, height)
- [ ] Widget text fits without truncation
- [ ] Dark mode text legible
- [ ] Font sizes accessible (all >= 14px except captions)
- [ ] Button text clear and prominent
- [ ] Form labels and help text visible
- [ ] Error messages stand out
- [ ] Contrast meets WCAG AA minimum

---

## 15. Font Specification Reference Table

### Quick Lookup Table

| Component | Font | Size | Weight | Line Height | Letter Spacing |
|-----------|------|------|--------|-------------|----------------|
| **Display/Hero** | Poppins | 40px | 700 | 1 | -0.01em |
| **H1** | Poppins | 32px | 700 | 1 | -0.01em |
| **H2** | Poppins | 24px | 700 | 1.25 | -0.01em |
| **H3** | Poppins | 20px | 600 | 1.25 | 0 |
| **H4** | Inter | 18px | 600 | 1.25 | 0 |
| **Body Large** | Inter | 16px | 400 | 1.5 | 0 |
| **Body Regular** | Inter | 14px | 400 | 1.5 | 0 |
| **Body Small** | Inter | 13px | 400 | 1.5 | 0 |
| **Label** | Inter | 14px | 500 | 1.25 | 0.025em |
| **Label Small** | Inter | 12px | 600 | 1.25 | 0.05em |
| **Widget Title** | Poppins | 16px | 700 | 1 | -0.01em |
| **Widget Value** | Inter | 28px | 700 | 1 | -0.01em |
| **Widget Subtitle** | Inter | 12px | 400 | 1.25 | 0 |
| **Button Primary** | Inter | 16px | 600 | 1.25 | 0.025em |
| **Button Secondary** | Inter | 14px | 500 | 1.25 | 0 |
| **Caption** | Inter | 11px | 400 | 1.25 | 0 |
| **Alert Title** | Poppins | 18px | 700 | 1.25 | 0 |
| **Alert Message** | Inter | 14px | 400 | 1.5 | 0 |
| **Error Text** | Inter | 12px | 400 | 1.25 | 0 |
| **Input Label** | Inter | 14px | 500 | 1.25 | 0.025em |
| **Input Text** | Inter | 14px | 400 | 1.5 | 0 |
| **Placeholder** | Inter | 14px | 400 | 1.5 | 0 |

---

## 16. Accessibility Notes

### 16.1 For Developers
- Always use semantic HTML (h1, h2, h3, etc.)
- Don't skip heading levels (h1 → h3 is confusing)
- Use `line-height` >= 1.5 for body text
- Ensure sufficient color contrast (4.5:1 minimum for text)
- Don't rely on color alone (use weight, size, or icon)
- Test with screen readers

### 16.2 For Designers
- Use type size as primary hierarchy tool
- Combine size + weight for emphasis
- Maintain consistent vertical rhythm
- Use color as secondary emphasis (after size/weight)
- Test headings in both light and dark modes
- Ensure focus states visible on interactive text

### 16.3 For Users (Pet Owners)
- Font sizes optimized for quick scanning
- Widget text readable at arm's length
- High contrast for outdoor use
- Clear buttons and calls-to-action
- Easy-to-read health/status information
- Accessible on all device sizes

---

## 17. Font Updates & Versioning

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | June 2026 | Initial typography system |
| Future | TBD | Variable fonts optimization |
| Future | TBD | Multi-language support |
| Future | TBD | Dyslexia-friendly font option |

---

## Appendix: Font Files & Imports

### A1. Google Fonts Import
```html
<!-- Optimized Google Fonts import -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet">
```

### A2. Self-Hosted Fonts (Alternative)
If using self-hosted fonts, include these files:
- `inter-regular.woff2` (Inter 400)
- `inter-medium.woff2` (Inter 500)
- `inter-semibold.woff2` (Inter 600)
- `inter-bold.woff2` (Inter 700)
- `poppins-semibold.woff2` (Poppins 600)
- `poppins-bold.woff2` (Poppins 700)

### A3. iOS Font Configuration
For iOS app, add to Info.plist:
```xml
<key>UIAppFonts</key>
<array>
  <string>Inter-Regular.ttf</string>
  <string>Inter-Medium.ttf</string>
  <string>Inter-SemiBold.ttf</string>
  <string>Inter-Bold.ttf</string>
  <string>Poppins-SemiBold.ttf</string>
  <string>Poppins-Bold.ttf</string>
</array>
```

### A4. Android Font Configuration
Place fonts in `res/font/`:
```xml
<!-- font_family.xml -->
<font-family
  xmlns:android="http://schemas.android.com/apk/res/android">
  <font
    android:fontStyle="normal"
    android:fontWeight="400"
    android:font="@font/inter_regular" />
  <font
    android:fontStyle="normal"
    android:fontWeight="700"
    android:font="@font/poppins_bold" />
</font-family>
```

---

*Document Version: 1.0*  
*Created: June 2026*  
*Format: Complete Typography & Font System for Pawzo*  
*Status: Ready for Implementation*

