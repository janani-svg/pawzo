# PAWZO DESIGN SYSTEM
## Complete Visual & Interaction Design Guidelines
### *Charming. Cute. Whimsical. Happy Energy.*

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Design Principles](#2-design-principles)
3. [Color System](#3-color-system)
4. [Typography System](#4-typography-system)
5. [Spacing & Layout](#5-spacing--layout)
6. [Components Library](#6-components-library)
7. [Buttons & CTAs](#7-buttons--ctas)
8. [Micro-Interactions](#8-micro-interactions)
9. [Animation & Transitions](#9-animation--transitions)
10. [Sound Design](#10-sound-design)
11. [Icons & Imagery](#11-icons--imagery)
12. [Patterns & Best Practices](#12-patterns--best-practices)
13. [Implementation Guide](#13-implementation-guide)
14. [Brand Voice](#14-brand-voice)
15. [Consistency Checklist](#15-consistency-checklist)

---

## 1. DESIGN PHILOSOPHY

### 1.1 The Pawzo Experience
PAWZO is more than a pet tracking app—it's a delightful companion that celebrates the joy of pet parenting. Every pixel, animation, and sound should evoke:

- **Warmth** - Like petting a soft, happy pet
- **Joy** - Celebrating moments with your furry friend
- **Trust** - You're caring for something precious
- **Energy** - Happy, playful, alive

### 1.2 Core Design Aesthetic
```
Visual Style: Soft, rounded, playful
Mood: Cheerful, energetic, whimsical
Personality: Friendly, trustworthy, fun-loving
Feel: Like a warm hug from your pet
```

### 1.3 Design Pillars
1. **Delight** - Every interaction should make the user smile
2. **Clarity** - Information should be scannable and intuitive
3. **Playfulness** - Subtle humor and charm throughout
4. **Accessibility** - Inclusive design for all users
5. **Consistency** - Predictable, reliable experience across the app

---

## 2. DESIGN PRINCIPLES

### 2.1 The 5 Core Principles

#### Principle 1: ROUND & SOFT
All UI elements embrace rounded corners:
- **Buttons:** 24px-32px border radius
- **Cards:** 16px-24px border radius
- **Inputs:** 12px-16px border radius
- **Modals:** 24px-32px border radius
- **Widget corners:** 16px-20px border radius

*Why:* Rounded corners feel friendly, approachable, and less harsh—perfect for a pet-focused app.

#### Principle 2: SMOOTH & FLUID
Every transition is intentional and smooth:
- **Default transition:** 300ms ease-out
- **Quick interactions:** 150ms ease-out
- **Slow reveals:** 500ms-800ms ease-out
- **No hard cuts:** Always use easing functions (cubic-bezier)

*Why:* Smooth motion reduces cognitive load and creates a polished, premium feel.

#### Principle 3: TINGLY & HAPPY
Sound design adds personality:
- **Soft, playful sounds** (not mechanical)
- **Happy tones** (no sad or harsh sounds)
- **Subtle, not intrusive** (doesn't startle)
- **Optional** (always allow mute/disable)

*Why:* Sound creates emotional connection and makes mundane actions feel special.

#### Principle 4: ENERGETIC & UPLIFTING
Colors, typography, and imagery all energize:
- **Bright, cheerful colors** (no dark, muted tones)
- **Playful animations** (bouncy, not rigid)
- **Happy facial expressions** in imagery
- **Positive, celebratory messaging**

*Why:* The app should lift your mood, just like thinking about your pet does.

#### Principle 5: CONSISTENT & PREDICTABLE
Users always know what to expect:
- **Same button style** across all pages
- **Consistent spacing** and alignment
- **Familiar patterns** from other pages
- **Logical information architecture**

*Why:* Consistency builds trust and reduces friction.

---

## 3. COLOR SYSTEM

### 3.1 Color Palette (Pawzo Signature Colors)

#### Primary Colors

| Color | Hex | RGB | Usage | Vibes |
|-------|-----|-----|-------|-------|
| **Soft Sky** | #BCF4F5 | rgb(188, 244, 245) | Light backgrounds, accents | Calm, peaceful |
| **Minty Fresh** | #B4EBCA | rgb(180, 235, 202) | Success, healthy, growth | Fresh, alive |
| **Sunshine Yellow** | #D9F2B4 | rgb(217, 242, 180) | Positivity, happy moments | Cheerful, bright |
| **Grass Green** | #D3FAC7 | rgb(211, 250, 199) | Progress, growth, nature | Natural, growth |
| **Blush Pink** | #FFB7C3 | rgb(255, 183, 195) | Alerts, attention, love | Gentle, caring |

#### Accent Colors

| Color | Hex | RGB | Usage | Vibes |
|-------|-----|-----|-------|-------|
| **Fire Red** | #D62839 | rgb(214, 40, 57) | Critical alerts, errors, urgent | Bold, attention |
| **Rose Pink** | #BA324F | rgb(186, 50, 79) | Primary CTAs, important actions | Warm, inviting |
| **Ocean Blue** | #175676 | rgb(23, 86, 118) | Text, headings, primary actions | Trustworthy, calm |
| **Sky Blue** | #4BA3C3 | rgb(75, 163, 195) | Links, secondary actions | Friendly, open |
| **Cloud Soft** | #CCE6F4 | rgb(204, 230, 244) | Subtle backgrounds, disabled | Gentle, subtle |

#### Extended Colors

| Color | Hex | RGB | Usage | Vibes |
|-------|-----|-----|-------|-------|
| **Deep Blue** | #3A6EA5 | rgb(58, 110, 165) | Primary interactions | Strong, reliable |
| **Coral Pink** | #F56476 | rgb(245, 100, 118) | Highlights, emphasis | Energetic, playful |
| **Magenta** | #E43F6F | rgb(228, 63, 111) | Bold emphasis, featured | Fun, vibrant |
| **Sage Green** | #92AA83 | rgb(146, 170, 131) | Nature elements, pet icons | Organic, natural |
| **Lemon Light** | #E7F59E | rgb(231, 245, 158) | Positive highlights | Happy, bright |
| **Purple Haze** | #809BCE | rgb(128, 171, 206) | Borders, subtle elements | Calm, creative |

### 3.2 How to Use Colors

#### Background Colors
- **Primary Background:** #FFFFFF (white)
- **Secondary Background:** #BCF4F5 (soft sky - for cards, sections)
- **Tertiary Background:** #CCE6F4 (cloud soft - for subtle areas)
- **Dark Background (Night Mode):** #1A2D3F (dark blue)

#### Text Colors
- **Primary Text:** #175676 (ocean blue - headings, body)
- **Secondary Text:** #4BA3C3 (sky blue - supporting text)
- **Tertiary Text:** #809BCE (purple haze - captions, metadata)
- **Inverted Text:** #FFFFFF (white on dark backgrounds)

#### Interactive Colors
- **Primary CTA:** #BA324F (rose pink - main actions)
- **Secondary CTA:** #3A6EA5 (deep blue - alternative actions)
- **Hover State:** Lighten by 15%
- **Pressed State:** Darken by 15%
- **Disabled State:** #CCE6F4 (cloud soft, 50% opacity)

#### Status Colors
- **Success:** #B4EBCA (minty fresh)
- **Warning:** #FFB7C3 (blush pink)
- **Error:** #D62839 (fire red)
- **Info:** #4BA3C3 (sky blue)

#### Pet-Specific Colors
- **Dog Icon/Border:** #BA324F (rose pink)
- **Cat Icon/Border:** #4BA3C3 (sky blue)
- **Other Pets:** Rotate through accent colors

### 3.3 Color Combinations (for pairing)

#### High Energy Combinations
- Sunshine Yellow (#D9F2B4) + Rose Pink (#BA324F) → Playful, joyful
- Minty Fresh (#B4EBCA) + Deep Blue (#3A6EA5) → Fresh, energetic
- Blush Pink (#FFB7C3) + Ocean Blue (#175676) → Warm, trusting

#### Calm Combinations
- Soft Sky (#BCF4F5) + Sky Blue (#4BA3C3) → Peaceful, open
- Grass Green (#D3FAC7) + Sage Green (#92AA83) → Natural, soothing
- Cloud Soft (#CCE6F4) + Purple Haze (#809BCE) → Gentle, subtle

#### Alert Combinations
- Fire Red (#D62839) + White → Critical attention
- Blush Pink (#FFB7C3) + Ocean Blue (#175676) → Medium attention
- Lemon Light (#E7F59E) + Deep Blue (#3A6EA5) → Gentle reminder

### 3.4 Color Accessibility
- All text should maintain minimum 4.5:1 contrast ratio
- Use color + additional indicator (icon, text) for status
- Test color combinations for colorblind users
- Never rely on color alone to convey information

---

## 4. TYPOGRAPHY SYSTEM

### 4.1 Font Families
*[Reference the Typography Document]*

- **Primary Font:** Inter (400, 500, 600, 700)
- **Secondary Font:** Poppins (600, 700)
- **Fallback:** System fonts (San Francisco, Segoe UI, Roboto)

### 4.2 Font Sizes & Hierarchy

| Level | Font | Size | Weight | Usage |
|-------|------|------|--------|-------|
| **Display** | Poppins | 40px | 700 | Landing page hero |
| **H1** | Poppins | 32px | 700 | Page titles |
| **H2** | Poppins | 24px | 700 | Section headers |
| **H3** | Poppins | 20px | 600 | Card titles |
| **H4** | Inter | 18px | 600 | Subheadings |
| **Body Large** | Inter | 16px | 400 | Main content |
| **Body Regular** | Inter | 14px | 400 | Standard text |
| **Body Small** | Inter | 13px | 400 | Secondary info |
| **Label** | Inter | 14px | 500 | Form labels, buttons |
| **Caption** | Inter | 11px | 400 | Timestamps, metadata |

### 4.3 Line Height & Spacing

- **Headings:** 1.0-1.25 line height
- **Body Text:** 1.5 line height (comfortable reading)
- **Captions:** 1.25 line height
- **Letter Spacing:** Normal (0em) for most, 0.025em for labels

---

## 5. SPACING & LAYOUT

### 5.1 Spacing Scale (8px Grid System)

```
0px   - No space
2px   - Minimal (between icons and text)
4px   - Tiny (subtle spacing)
8px   - XSmall (default minimum)
12px  - Small
16px  - Medium (most common)
24px  - Large
32px  - XLarge (section spacing)
40px  - 2XLarge
48px  - 3XLarge
56px  - 4XLarge
64px  - 5XLarge
```

### 5.2 Common Spacing Values

| Component | Top | Right | Bottom | Left |
|-----------|-----|-------|--------|------|
| **Card Padding** | 24px | 24px | 24px | 24px |
| **Modal Padding** | 32px | 32px | 32px | 32px |
| **Button Padding** | 12px | 24px | 12px | 24px |
| **Section Margin** | 32px | 0 | 32px | 0 |
| **Field Margin** | 0 | 0 | 16px | 0 |
| **Icon Margin** | 0 | 8px | 0 | 0 |

### 5.3 Layout Grid

- **Mobile (320px-479px):** 4-column grid, 16px gutters
- **Tablet (480px-1024px):** 8-column grid, 20px gutters
- **Desktop (1024px+):** 12-column grid, 24px gutters

### 5.4 Responsive Breakpoints

```
Mobile XS:     320px
Mobile SM:     375px
Mobile MD:     414px
Tablet SM:     480px
Tablet MD:     768px
Desktop SM:    1024px
Desktop MD:    1440px
Desktop LG:    1920px
```

---

## 6. COMPONENTS LIBRARY

### 6.1 Card Component

```
STRUCTURE:
├─ Header (optional)
│  ├─ Icon/Avatar
│  ├─ Title
│  └─ Action Menu
├─ Content Area
│  ├─ Description
│  ├─ Data/Values
│  └─ Images
└─ Footer (optional)
   ├─ Helper Text
   └─ Action Buttons

STYLING:
• Background: #FFFFFF or #BCF4F5
• Border Radius: 20px
• Padding: 24px
• Box Shadow: 0 2px 8px rgba(0, 0, 0, 0.08)
• Hover Shadow: 0 4px 12px rgba(0, 0, 0, 0.12)
• Border: Optional 1px #CCE6F4
```

**Example Card Code:**
```jsx
<Card className="pet-card" style={{
  background: '#FFFFFF',
  borderRadius: '20px',
  padding: '24px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
}}>
  <h3 style={{ color: '#175676', marginBottom: '12px' }}>Fluffy</h3>
  <p style={{ color: '#4BA3C3' }}>Healthy & Happy</p>
</Card>
```

### 6.2 Container / Section Component

```
STRUCTURE:
├─ Background (full width or contained)
├─ Header (optional)
│  └─ Section Title
└─ Content Area
   └─ Multiple Cards/Components

STYLING:
• Background: #FFFFFF, #BCF4F5, or color gradient
• Border Radius: 24px (if contained)
• Padding: 32px (top/bottom), 24px (left/right)
• Margin: 32px 0 (between sections)
• Max Width: 1200px (desktop)
```

### 6.3 List Item Component

```
STRUCTURE:
├─ Icon/Avatar (left)
├─ Content
│  ├─ Title
│  ├─ Subtitle
│  └─ Value/Status
└─ Action (right)
   ├─ Icon Button
   └─ Chevron/Arrow

STYLING:
• Background: Transparent or #FFFFFF
• Height: 64px-80px
• Padding: 12px 16px
• Border-Bottom: 1px solid #CCE6F4
• Last Item: No border
• Hover: Background #BCF4F5, transition 200ms
```

### 6.4 Badge / Tag Component

```
STYLING:
• Background: Color-coded (#B4EBCA, #FFB7C3, #D9F2B4)
• Font Size: 11px-12px, Semi-Bold
• Padding: 4px 12px
• Border Radius: 16px
• Text Color: #175676 or white (if dark background)
• Optional Icon: 2px margin

VARIANTS:
• Success: Minty Fresh background
• Warning: Blush Pink background
• Info: Sky Blue background
• New: Fire Red background
```

### 6.5 Modal / Dialog Component

```
STRUCTURE:
├─ Overlay (semi-transparent backdrop)
└─ Modal Container
   ├─ Header
   │  ├─ Title
   │  └─ Close Button (X)
   ├─ Content
   └─ Footer
      ├─ Secondary Button
      └─ Primary Button

STYLING:
• Background: #FFFFFF
• Border Radius: 28px
• Padding: 32px
• Overlay: rgba(0, 0, 0, 0.4)
• Max Width: 90vw (mobile), 500px (desktop)
• Animation: Scale + Fade in (300ms ease-out)
• Z-Index: 1000
```

### 6.6 Tab Navigation Component

```
STRUCTURE:
├─ Tab Bar Container
│  ├─ Tab 1
│  ├─ Tab 2
│  └─ Tab 3
└─ Content Area
   └─ Active Tab Content

STYLING:
• Background: #FFFFFF
• Tab Height: 48px
• Font Size: 14px, Medium
• Text Color: #4BA3C3 (inactive), #175676 (active)
• Indicator: 3px solid #BA324F (bottom border)
• Indicator Animation: 300ms ease-out slide
• Hover: Background #BCF4F5
```

### 6.7 Input Field Component

```
STRUCTURE:
├─ Label
├─ Input Container
│  ├─ Icon (optional)
│  ├─ Input Field
│  └─ Clear Button (optional)
└─ Helper Text or Error Message

STYLING:
• Background: #F9FBFC (very light)
• Border: 1px solid #CCE6F4
• Border Radius: 14px
• Padding: 12px 16px
• Font Size: 14px
• Focus State: Border #BA324F, Box Shadow #BA324F 0 0 0 3px (20% opacity)
• Hover: Border #4BA3C3
• Error: Border #D62839
• Disabled: Background #CCE6F4 (20% opacity), Color gray
```

---

## 7. BUTTONS & CTAs

### 7.1 Button Styles

#### PRIMARY BUTTON (Main CTA)

```
STYLING:
• Background: #BA324F (Rose Pink)
• Text Color: #FFFFFF (white)
• Font: Inter, 16px, Semi-Bold, 0.025em letter-spacing
• Padding: 12px 32px
• Border Radius: 24px
• Height: 48px
• Box Shadow: 0 2px 8px rgba(186, 50, 79, 0.2)
• Transition: 300ms cubic-bezier(0.4, 0, 0.2, 1)

STATES:
├─ Default: #BA324F
├─ Hover: #A01E3E (darken 15%)
│  └─ Box Shadow: 0 4px 12px rgba(186, 50, 79, 0.3)
│  └─ Transform: translateY(-2px)
├─ Active/Pressed: #8B1B33 (darken 25%)
│  └─ Box Shadow: 0 1px 4px rgba(186, 50, 79, 0.2)
│  └─ Transform: translateY(0)
├─ Loading: Background #BA324F with spinner
│  └─ Disabled interaction
├─ Disabled: Background #CCE6F4
│  └─ Text Color: #809BCE (50% opacity)
│  └─ Cursor: Not allowed

EXAMPLE:
<button className="btn-primary" onClick={handleClick}>
  Add Pet
</button>
```

#### SECONDARY BUTTON (Alternative CTA)

```
STYLING:
• Background: #FFFFFF (white)
• Border: 2px solid #3A6EA5 (Deep Blue)
• Text Color: #3A6EA5
• Font: Inter, 16px, Semi-Bold
• Padding: 10px 30px (adjusted for border)
• Border Radius: 24px
• Height: 48px
• Transition: 300ms cubic-bezier(0.4, 0, 0.2, 1)

STATES:
├─ Default: White background, Deep Blue border
├─ Hover: Background #F0F4F8 (very light blue)
│  └─ Border Color: #1A4E80 (darker blue)
│  └─ Transform: translateY(-2px)
├─ Active: Background #E0E8F0
│  └─ Transform: translateY(0)
└─ Disabled: Background #F5F5F5, Border #CCE6F4
```

#### TERTIARY BUTTON (Text/Link Button)

```
STYLING:
• Background: Transparent
• Text Color: #3A6EA5 (Deep Blue)
• Font: Inter, 14px, Medium, 0.025em letter-spacing
• No padding (inline button)
• Border Radius: 8px
• Transition: 200ms cubic-bezier(0.4, 0, 0.2, 1)

STATES:
├─ Default: Blue text
├─ Hover: Background #BCF4F5 (soft sky)
│  └─ Text Color: #175676 (darker)
├─ Active: Background #4BA3C3
│  └─ Text Color: White
└─ Disabled: Color #CCE6F4
```

#### ICON BUTTON

```
STYLING:
• Size: 40px × 40px (or 48px × 48px)
• Background: #BCF4F5 (soft sky) or transparent
• Border Radius: 50% (circular) or 12px (rounded square)
• Icon Size: 24px (centered)
• Icon Color: #175676 or #BA324F
• Transition: 300ms ease-out
• Touch Target: Minimum 44px × 44px

STATES:
├─ Default: Icon color #175676
├─ Hover: Background #D9F2B4 (sunshine yellow)
│  └─ Scale: 1.1
├─ Active: Background #BA324F
│  └─ Icon Color: White
└─ Disabled: Opacity 0.5
```

#### FLOATING ACTION BUTTON (FAB)

```
STYLING:
• Size: 56px × 56px (mobile), 64px × 64px (desktop)
• Background: #BA324F (Rose Pink)
• Border Radius: 50% (perfect circle)
• Icon: 28px, white, centered
• Position: Fixed bottom-right, 24px from edges
• Box Shadow: 0 4px 12px rgba(186, 50, 79, 0.3)
• Transition: 300ms cubic-bezier(0.4, 0, 0.2, 1)
• Z-Index: 50

STATES:
├─ Default: Rose Pink (#BA324F)
├─ Hover: Scale 1.15
│  └─ Box Shadow: 0 8px 20px rgba(186, 50, 79, 0.4)
├─ Active: Scale 1, No shadow
└─ On Scroll: Slide down on mobile (show on scroll up)
```

### 7.2 Button Size Variants

| Size | Height | Padding | Font Size | Usage |
|------|--------|---------|-----------|-------|
| **Large** | 56px | 16px 40px | 18px | Important CTAs |
| **Medium** | 48px | 12px 32px | 16px | Standard buttons |
| **Small** | 40px | 8px 24px | 14px | Secondary actions |
| **XSmall** | 32px | 6px 16px | 12px | Compact areas |

### 7.3 Button Layout

**Horizontal Layout (Desktop):**
```
[Secondary Button]  [Primary Button]
   (Left-aligned)     (Right-aligned)
```

**Vertical Layout (Mobile):**
```
[Primary Button - full width]
[Secondary Button - full width]
```

**Mixed Layout:**
```
[Icon Button] [Text Button] [Primary Button]
```

---

## 8. MICRO-INTERACTIONS

### 8.1 Loading States

#### Spinner/Loader Animation

```
STYLING:
• Size: 24px (inline), 48px (page-level)
• Color: #BA324F (Rose Pink)
• Animation: Smooth rotation 2s linear infinite
• Background: Optional light circle (#BCF4F5)
• Padding: 12px (for breathing room)

CODE:
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loader {
  animation: spin 2s linear infinite;
  border: 3px solid #BCF4F5;
  border-top-color: #BA324F;
  border-radius: 50%;
}
```

#### Skeleton Loading

```
STYLING:
• Background: #E0E8F0 (light blue-gray)
• Border Radius: 12px
• Height: Match actual content
• Animation: Gentle shimmer

CODE:
@keyframes shimmer {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

.skeleton {
  background: #E0E8F0;
  animation: shimmer 2s infinite;
  border-radius: 12px;
}
```

### 8.2 Success States

```
VISUAL:
• Icon: Checkmark in circle
• Icon Color: #B4EBCA (Minty Fresh)
• Animation: Pop + Bounce (300ms)
• Text: "Success!" or specific message
• Text Color: #175676 (Ocean Blue)

CODE:
@keyframes popBounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.success-icon {
  animation: popBounce 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### 8.3 Error/Validation States

```
VISUAL:
• Icon: Warning triangle or X
• Icon Color: #D62839 (Fire Red)
• Background: #FFB7C3 (Blush Pink, 20% opacity)
• Border: 1px solid #FFB7C3
• Shake Animation: 300ms (alert attention)
• Text: Error message in #D62839

CODE:
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

.error-state {
  animation: shake 300ms cubic-bezier(0.36, 0, 0.66, -0.56);
  border-color: #D62839;
}
```

### 8.4 Empty States

```
VISUAL:
• Icon: Large, friendly (90px+)
• Icon Color: #4BA3C3 (Sky Blue)
• Heading: Friendly, encouraging
• Description: Why it's empty + what to do
• CTA: "Get Started" or "Add Your First Pet"

EXAMPLE:
"Looks like you don't have any pets yet! 🐾
Click below to add your first furry friend."
```

### 8.5 Toast Notifications

```
STYLING:
• Position: Bottom-center or top-center
• Background: Color-coded (#B4EBCA, #FFB7C3, #D9F2B4)
• Text Color: #175676 (Ocean Blue)
• Font: 13px, Medium
• Padding: 12px 16px
• Border Radius: 12px
• Box Shadow: 0 4px 12px rgba(0, 0, 0, 0.15)
• Animation: Slide in (300ms), stay 3s, slide out (300ms)
• Z-Index: 5000

VARIANTS:
├─ Success: #B4EBCA background, Checkmark icon
├─ Error: #FFB7C3 background, Warning icon
├─ Info: #D9F2B4 background, Info icon
└─ Warning: #FFB7C3 background, Alert icon

CODE:
@keyframes slideInUp {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.toast {
  animation: slideInUp 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### 8.6 Bounce & Celebration Animations

```
USAGE: Pet added successfully, milestone reached, achievements unlocked

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

@keyframes celebration {
  0% { transform: scale(0) rotate(0deg); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: scale(1) rotate(360deg); opacity: 0; }
}

.bounce-icon {
  animation: bounce 600ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.celebration-particle {
  animation: celebration 800ms ease-out forwards;
}
```

---

## 9. ANIMATION & TRANSITIONS

### 9.1 Timing Functions

```css
/* Default: Smooth, natural motion */
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);

/* Quick interactions: Snappy, responsive */
--ease-quick: cubic-bezier(0.4, 0, 0.6, 1);

/* Entrance: Easing in (slow start) */
--ease-in: cubic-bezier(0.4, 0, 1, 1);

/* Exit: Easing out (slow end) */
--ease-out: cubic-bezier(0, 0, 0.2, 1);

/* Bouncy: Playful, energetic */
--ease-bouncy: cubic-bezier(0.34, 1.56, 0.64, 1);

/* Anticipation: Builds tension before action */
--ease-anticipate: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### 9.2 Duration Standards

| Interaction | Duration | Timing Function | Usage |
|-------------|----------|-----------------|-------|
| **Quick** | 150ms | ease-quick | Hover states, icon changes |
| **Standard** | 300ms | ease-default | Button clicks, card expand |
| **Deliberate** | 500ms | ease-out | Page transitions, modals |
| **Entrance** | 600ms-800ms | ease-in/bouncy | Page load, celebration |
| **Long** | 1000ms+ | ease-out | Slow reveals, animations |

### 9.3 Transition Examples

#### Button Hover Transition
```css
button {
  background-color: #BA324F;
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(186, 50, 79, 0.2);
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

button:hover {
  background-color: #A01E3E;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(186, 50, 79, 0.3);
}
```

#### Card Expand Transition
```css
.card {
  max-height: 200px;
  overflow: hidden;
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.card.expanded {
  max-height: 500px;
}
```

#### Fade In Transition
```css
.content {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeIn 500ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes fadeIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 9.4 Page Transition

```css
/* Fade out current page, fade in new page */
@keyframes pageTransitionOut {
  to {
    opacity: 0;
    transform: translateY(20px);
  }
}

@keyframes pageTransitionIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page {
  animation: pageTransitionIn 500ms cubic-bezier(0.4, 0, 0.2, 1);
}

.page.exit {
  animation: pageTransitionOut 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 9.5 Scroll Animations

```css
/* Parallax scroll effect for hero images */
.hero-image {
  transform: translateY(calc(var(--scroll) * 0.5px));
}

/* Fade elements on scroll */
.fade-on-scroll {
  opacity: calc(max(0, 1 - (var(--scroll) - 100px) / 300px));
}

/* Scale elements on scroll */
.scale-on-scroll {
  transform: scale(calc(max(0.8, 1 - (var(--scroll) - 100px) / 500px)));
}
```

---

## 10. SOUND DESIGN

### 10.1 Sound Design Philosophy

**Pawzo Sound Principles:**
- **Tingly & Delightful:** Soft, pleasant, never harsh
- **Happy Energy:** Uplifting tones, positive vibes
- **Organic:** Natural sounds, not digital/robotic
- **Subtle:** Doesn't dominate, complements visuals
- **Controllable:** Users can mute/disable sounds

**Tone References:**
- Similar to: Apple notification sounds, Slack reactions, Nintendo game SFX
- Avoid: Harsh beeps, sad tones, loud alarms (except for critical alerts)
- Duration: 200ms-600ms (short, punchy)

### 10.2 Sound Categories

#### SUCCESS SOUNDS
**When:** Action completed successfully, pet added, data saved

- **Name:** "positive-ping"
- **Duration:** 300ms
- **Frequency:** Light, rising chime (A4 to C5)
- **Emotion:** Celebratory, rewarding
- **Example Sound:** Apple "Bell" or similar bright tone
- **File:** `success-ping.mp3` (10-15 KB)

#### BUTTON CLICK
**When:** Button pressed, interaction confirmed

- **Name:** "soft-click"
- **Duration:** 150ms
- **Frequency:** Medium-high click (F4 to A4)
- **Emotion:** Responsive, tactile
- **Example Sound:** Soft wooden click or muted bell tone
- **File:** `button-click.mp3` (8-12 KB)

#### NOTIFICATION
**When:** Alert, reminder, new data

- **Name:** "gentle-alert"
- **Duration:** 400ms
- **Frequency:** Double-tone (C4 then E4)
- **Emotion:** Attention-getting but pleasant
- **Example Sound:** Mellow notification tone (like iMessage)
- **File:** `notification-alert.mp3` (12-18 KB)

#### PET MOMENT
**When:** Pet added, milestone, memory saved, widget update

- **Name:** "pet-moment"
- **Duration:** 500ms
- **Frequency:** Playful, bouncy chime sequence
- **Emotion:** Joyful, whimsical, celebratory
- **Example Sound:** Ascending chimes (C4, E4, G4, C5)
- **File:** `pet-moment.mp3` (15-20 KB)

#### ERROR SOUND
**When:** Something went wrong, validation error

- **Name:** "soft-error"
- **Duration:** 300ms
- **Frequency:** Gentle descending tone (D4 to C4)
- **Emotion:** Cautionary, but not scary
- **Example Sound:** Soft "boop" or descending tone
- **File:** `soft-error.mp3` (10-15 KB)

#### EMERGENCY ALERT
**When:** Critical pet alert, emergency vet button pressed

- **Name:** "urgent-alert"
- **Duration:** 600ms
- **Frequency:** Rapid, escalating tone
- **Emotion:** Urgent, attention-demanding
- **Example Sound:** Two-tone emergency-like sound (but musical, not loud)
- **File:** `urgent-alert.mp3` (15-20 KB)

#### UNLOCK / PAGE TRANSITION
**When:** Page transition, unlock premium feature

- **Name:** "whoosh"
- **Duration:** 250ms
- **Frequency:** Upward sweep sound
- **Emotion:** Movement, flow, progress
- **Example Sound:** Subtle whoosh or transition sound
- **File:** `whoosh.mp3` (8-12 KB)

### 10.3 Implementation

#### HTML Integration
```html
<!-- Sound Effects Container (muted by default) -->
<div id="sounds" hidden>
  <audio id="sound-click" src="/sounds/button-click.mp3"></audio>
  <audio id="sound-success" src="/sounds/success-ping.mp3"></audio>
  <audio id="sound-notification" src="/sounds/notification-alert.mp3"></audio>
  <audio id="sound-pet-moment" src="/sounds/pet-moment.mp3"></audio>
  <audio id="sound-error" src="/sounds/soft-error.mp3"></audio>
  <audio id="sound-emergency" src="/sounds/urgent-alert.mp3"></audio>
  <audio id="sound-whoosh" src="/sounds/whoosh.mp3"></audio>
</div>
```

#### JavaScript Implementation
```javascript
// Sound Manager
const SoundManager = {
  enabled: localStorage.getItem('sounds-enabled') !== 'false',
  
  play: (soundId) => {
    if (!SoundManager.enabled) return;
    const audio = document.getElementById(`sound-${soundId}`);
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.log('Sound play failed:', e));
    }
  },
  
  toggle: () => {
    SoundManager.enabled = !SoundManager.enabled;
    localStorage.setItem('sounds-enabled', SoundManager.enabled);
    return SoundManager.enabled;
  }
};

// Usage Examples:
SoundManager.play('click');           // Button click
SoundManager.play('success');         // Success action
SoundManager.play('notification');    // New alert
SoundManager.play('pet-moment');      // Pet milestone
SoundManager.play('error');           // Validation error
SoundManager.play('emergency');       // Critical alert
SoundManager.play('whoosh');          // Page transition
```

#### React Component Example
```jsx
import { useEffect } from 'react';

function Button({ onClick, children }) {
  const handleClick = () => {
    SoundManager.play('click');
    onClick?.();
  };
  
  return (
    <button onClick={handleClick}>
      {children}
    </button>
  );
}

// Pet form submission
function PetForm() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate...
    if (isValid) {
      SoundManager.play('pet-moment');
      // Add pet...
    } else {
      SoundManager.play('error');
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 10.4 Sound Settings

**User Controls:**
```
Settings > Audio & Notifications
├─ Sound Effects: Toggle On/Off
├─ Volume Level: Slider (0-100%)
├─ Sound Type: Preview buttons for each sound
├─ Test Sound: Play example
└─ Reset to Default: Restore default settings
```

**Default Behavior:**
- Sounds ON for new users (with prompt)
- Respects device mute switch
- Disables automatically in silent mode
- Saves preference to localStorage

---

## 11. ICONS & IMAGERY

### 11.1 Icon Style

**Icon Characteristics:**
- **Style:** Line-based (2px stroke width)
- **Roundness:** 4px-6px rounded corners
- **Size:** 24px (standard), 32px (large), 16px (small)
- **Color:** #175676 (primary), #BA324F (accent), #B4EBCA (success)
- **Stroke Cap:** Round (softer appearance)

**Icon Categories:**
1. **Navigation Icons:** Home, Health, Feeding, Memories, etc.
2. **Action Icons:** Add, Delete, Edit, Share, etc.
3. **Status Icons:** Healthy, Alert, Emergency, etc.
4. **Pet Icons:** Dog, Cat, Bird, Rabbit, etc.
5. **Functional Icons:** Clock, Calendar, Settings, etc.

**Icon Library:** 
- Use: Heroicons, Feather Icons, or custom Pawzo set
- All icons: 24px × 24px grid
- Consistency: Same stroke weight, corner radius, proportions

### 11.2 Pet Avatars

**Avatar Style:**
- **Shape:** Circle or soft square (16px radius)
- **Size:** 40px (thumbnail), 80px (profile), 160px (hero)
- **Style:** Pixelated or simplified illustration
- **Color Background:** Pet-specific accent color
- **Animation:** Slight bounce on load (300ms)

**Pet Avatar Examples:**
```
DOG: Rose Pink (#BA324F) background
CAT: Sky Blue (#4BA3C3) background
BIRD: Sunshine Yellow (#D9F2B4) background
RABBIT: Minty Fresh (#B4EBCA) background
OTHER: Sage Green (#92AA83) background
```

### 11.3 Illustration Style

**Pawzo Illustration Guide:**
- **Approach:** Friendly, approachable, charming
- **Style:** Simplified shapes, soft lines
- **Color:** Use Pawzo color palette
- **Emotion:** Happy, healthy, energetic
- **Examples:**
  - Pet with happy expression
  - Owner with pet (bonding moment)
  - Healthy indicators (hearts, stars)
  - Growth visualization (upward arrows)
  - Empty states (cute mascots)

**Illustration Sources:**
- Create custom Pawzo characters
- Use: Illustration libraries (Undraw, DrawKit) with customization
- Ensure: Brand consistency, happy emotions, rounded edges

### 11.4 Images & Photography

**Photography Style:**
- **Focus:** Happy, healthy pets
- **Editing:** Warm, slightly saturated colors
- **Subject:** Close-ups, genuine moments, natural lighting
- **Mood:** Joyful, candid, authentic

**Image Specifications:**
- **Format:** WebP (primary), JPEG (fallback)
- **Compression:** Optimized (<200 KB per image)
- **Dimensions:** 16:9 or 1:1 aspect ratio
- **Alt Text:** Always include for accessibility

---

## 12. PATTERNS & BEST PRACTICES

### 12.1 Common Patterns

#### Pet Card Pattern
```jsx
<Card className="pet-card">
  <img src={petAvatar} alt={petName} className="pet-avatar" />
  <h3>{petName}</h3>
  <Badge status={healthStatus}>{statusLabel}</Badge>
  <p className="last-activity">{lastActivity}</p>
  <Button>View Details</Button>
</Card>
```

#### Health Dashboard Pattern
```jsx
<Section title="Health Overview">
  <MetricCard icon="heart" label="Heart Rate" value="72 bpm" />
  <MetricCard icon="activity" label="Activity" value="High" />
  <MetricCard icon="alert" label="Status" value="Healthy" />
  <CTAButton>Schedule Vet Visit</CTAButton>
</Section>
```

#### Pet Status Widget Pattern
```jsx
<Widget title="Pet Status">
  <PetStatus pet={pet} />
  <LastUpdate time={lastUpdate} />
  <Button size="small">View Full Profile</Button>
</Widget>
```

#### Onboarding Pattern
```jsx
<OnboardingStep
  icon={icon}
  title="Add Your First Pet"
  description="Tell us about your furry friend"
  action={<Button>Get Started</Button>}
/>
```

### 12.2 Interaction Patterns

#### Pull-to-Refresh
- Drag down from top
- Show icon animation (rotate)
- Refresh data
- Snap back with success sound

#### Swipe Actions
- Swipe left: Edit, Archive
- Swipe right: Favorite, Share
- Provide haptic feedback
- Clear undo option

#### Long Press
- 500ms press to trigger
- Highlight item
- Show context menu
- Cancel on swipe away

#### Infinite Scroll
- Load more items as user scrolls
- Show skeleton while loading
- Smooth transition
- "Load More" button as fallback

### 12.3 Best Practices

**Visual Consistency:**
- ✅ Use design tokens (colors, spacing, fonts)
- ✅ Maintain component library
- ✅ Follow naming conventions
- ✅ Document all components
- ❌ Don't create new colors/sizes on-the-fly

**Animation Best Practices:**
- ✅ Use animations purposefully
- ✅ Keep animations under 500ms (usually)
- ✅ Provide non-animated alternative
- ✅ Respect `prefers-reduced-motion`
- ❌ Don't animate everything

**Accessibility:**
- ✅ Use semantic HTML
- ✅ Test with screen readers
- ✅ Maintain color contrast (4.5:1+)
- ✅ Provide alt text for images
- ✅ Include focus states (visible outline)
- ❌ Don't rely on color alone

**Performance:**
- ✅ Optimize images (<200 KB)
- ✅ Use CSS animations (faster than JS)
- ✅ Lazy load below-the-fold content
- ✅ Compress sounds (8-20 KB)
- ❌ Don't auto-play sounds without permission

**Mobile-First:**
- ✅ Design for 320px first
- ✅ Touch targets minimum 44px
- ✅ Responsive font sizes
- ✅ Test on real devices
- ❌ Don't forget mobile users

---

## 13. IMPLEMENTATION GUIDE

### 13.1 Design System File Structure

```
design-system/
├── README.md                          # Overview & quick start
├── DESIGN_SYSTEM.md                   # This file
├── tokens.json                        # Design tokens (colors, spacing, etc.)
├── colors/
│   ├── palette.json                   # Color definitions
│   └── usage-guide.md                 # When to use each color
├── typography/
│   ├── fonts.css                      # Font imports & definitions
│   ├── scales.json                    # Font sizes, weights
│   └── TYPOGRAPHY.md                  # Font specifications
├── components/
│   ├── Button.jsx                     # Button component
│   ├── Button.module.css              # Button styles
│   ├── Card.jsx                       # Card component
│   ├── Card.module.css                # Card styles
│   ├── Input.jsx                      # Input component
│   ├── Modal.jsx                      # Modal component
│   └── [other components]
├── animations/
│   ├── transitions.css                # Transition definitions
│   ├── keyframes.css                  # Keyframe animations
│   └── timing.json                    # Duration & easing
├── sounds/
│   ├── button-click.mp3               # Click sound
│   ├── success-ping.mp3               # Success sound
│   ├── notification-alert.mp3         # Alert sound
│   ├── pet-moment.mp3                 # Pet milestone sound
│   ├── soft-error.mp3                 # Error sound
│   ├── urgent-alert.mp3               # Emergency sound
│   ├── whoosh.mp3                     # Transition sound
│   └── SoundManager.js                # Sound utility
├── icons/
│   ├── home.svg                       # Icon files
│   ├── heart.svg
│   └── [other icons]
├── illustrations/
│   ├── empty-state.svg
│   ├── onboarding-step-1.svg
│   └── [other illustrations]
├── templates/
│   ├── PageTemplate.jsx               # Standard page layout
│   ├── DashboardTemplate.jsx          # Dashboard layout
│   └── [other templates]
├── utils/
│   ├── theme.js                       # Theme utilities
│   ├── spacing.js                     # Spacing utilities
│   └── animations.js                  # Animation utilities
└── CHANGELOG.md                       # Version history & updates
```

### 13.2 Design Tokens (tokens.json)

```json
{
  "colors": {
    "primary": {
      "soft-sky": "#BCF4F5",
      "minty-fresh": "#B4EBCA",
      "sunshine-yellow": "#D9F2B4",
      "grass-green": "#D3FAC7",
      "blush-pink": "#FFB7C3"
    },
    "accent": {
      "fire-red": "#D62839",
      "rose-pink": "#BA324F",
      "ocean-blue": "#175676",
      "sky-blue": "#4BA3C3",
      "cloud-soft": "#CCE6F4"
    }
  },
  "spacing": {
    "xs": "2px",
    "sm": "4px",
    "md": "8px",
    "lg": "12px",
    "xl": "16px",
    "2xl": "24px",
    "3xl": "32px"
  },
  "typography": {
    "sizes": {
      "xs": "10px",
      "sm": "12px",
      "base": "14px",
      "lg": "16px",
      "xl": "18px",
      "2xl": "20px"
    },
    "weights": {
      "regular": 400,
      "medium": 500,
      "semibold": 600,
      "bold": 700
    }
  },
  "borderRadius": {
    "sm": "8px",
    "md": "12px",
    "lg": "16px",
    "xl": "20px",
    "2xl": "24px",
    "full": "50%"
  },
  "shadows": {
    "sm": "0 2px 8px rgba(0, 0, 0, 0.08)",
    "md": "0 4px 12px rgba(0, 0, 0, 0.12)",
    "lg": "0 8px 20px rgba(0, 0, 0, 0.15)"
  },
  "transitions": {
    "quick": "150ms cubic-bezier(0.4, 0, 0.6, 1)",
    "default": "300ms cubic-bezier(0.4, 0, 0.2, 1)",
    "slow": "500ms cubic-bezier(0.4, 0, 0.2, 1)"
  }
}
```

### 13.3 Creating New Components

**Component Checklist:**
```
Before creating a new component:

1. ✅ Check if existing component can be reused
2. ✅ Define clear purpose & use cases
3. ✅ Create component spec document
4. ✅ Design multiple states (default, hover, active, disabled, loading, error)
5. ✅ Implement accessibility (ARIA, keyboard nav, focus states)
6. ✅ Add sound effects (where appropriate)
7. ✅ Include animation/transitions
8. ✅ Create responsive versions
9. ✅ Write clear usage documentation
10. ✅ Add to component library
11. ✅ Test across browsers & devices
12. ✅ Update design system documentation
```

### 13.4 Color Implementation

```css
/* CSS Variables (Recommended) */
:root {
  --color-primary-sky: #BCF4F5;
  --color-accent-rose: #BA324F;
  --color-text-primary: #175676;
  --color-text-secondary: #4BA3C3;
  
  --radius-sm: 8px;
  --radius-lg: 20px;
  
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.12);
  
  --duration-quick: 150ms;
  --duration-default: 300ms;
  --easing-default: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Usage in components */
.button-primary {
  background-color: var(--color-accent-rose);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--duration-default) var(--easing-default);
}

.button-primary:hover {
  box-shadow: var(--shadow-md);
}
```

---

## 14. BRAND VOICE

### 14.1 Tone & Personality

**Pawzo's Voice:**
- **Friendly:** Like chatting with a pet-loving friend
- **Playful:** Hints of humor and whimsy
- **Encouraging:** Supportive and motivating
- **Clear:** Simple, direct, easy to understand
- **Warm:** Caring, compassionate, understanding

### 14.2 Writing Guidelines

**DO:**
- ✅ Use conversational language ("Let's add your first pet!")
- ✅ Include emoji occasionally (🐾, ❤️, 😊)
- ✅ Be encouraging ("Great job tracking Fluffy's health!")
- ✅ Use "you" and "we" (inclusive)
- ✅ Keep it short and scannable
- ✅ Use exclamation points sparingly (max 1-2 per message)

**DON'T:**
- ❌ Be formal or corporate ("Please submit your pet information")
- ❌ Use technical jargon (unless explained)
- ❌ Be condescending or patronizing
- ❌ Use all caps (unless for emergency)
- ❌ Make it too long (keep under 100 characters)

### 14.3 Example Copy

**Good:**
- "Meet Fluffy! 🐾 Let's track her health journey."
- "No pets yet? Add your first furry friend to get started."
- "Fluffy's doing great! Last fed 2 hours ago. 💙"
- "Oops! Please check your email format."
- "Emergency vet found! Tap to call now."

**Avoid:**
- "Please input your pet's information in the designated field."
- "ERROR: Invalid input detected."
- "No pets currently registered in the system."
- "ALERT! CRITICAL MEDICATION OVERDUE!"

---

## 15. CONSISTENCY CHECKLIST

### 15.1 Before Launching Any Page/Feature

Use this checklist to ensure consistency:

**Visual Consistency:**
- [ ] All buttons use rounded styles (24px+ radius)
- [ ] Spacing follows 8px grid system
- [ ] Colors match design system palette
- [ ] Typography uses Inter/Poppins only
- [ ] Icons are all same style/weight
- [ ] Card border radius is 16px-24px
- [ ] Box shadows match standard sizes

**Animation Consistency:**
- [ ] All transitions use defined easing functions
- [ ] Durations are 150ms, 300ms, or 500ms (standard)
- [ ] No animations longer than 800ms (unless critical)
- [ ] Hover states have smooth transitions
- [ ] Loading states use smooth spinner animation
- [ ] Success/error states have appropriate animation

**Sound Consistency:**
- [ ] Success actions play "success-ping" sound
- [ ] Buttons play "button-click" sound
- [ ] Errors play "soft-error" sound
- [ ] Pet moments play "pet-moment" sound
- [ ] Sounds are under 600ms duration
- [ ] Sound Manager is implemented

**Interaction Consistency:**
- [ ] Primary CTAs use rose pink (#BA324F)
- [ ] Secondary CTAs use deep blue (#3A6EA5)
- [ ] Destructive actions use fire red (#D62839)
- [ ] Disabled states are visually distinct
- [ ] Loading states are clear
- [ ] Error messages are helpful

**Accessibility Consistency:**
- [ ] All text meets WCAG AA contrast (4.5:1+)
- [ ] Interactive elements have visible focus states
- [ ] Semantic HTML is used (h1, h2, h3, etc.)
- [ ] Alt text on all images
- [ ] Form labels associated with inputs
- [ ] Animations respect `prefers-reduced-motion`

**Mobile Consistency:**
- [ ] All fonts readable at 320px width
- [ ] Touch targets minimum 44px
- [ ] No horizontal scrolling
- [ ] Bottom buttons/FAB positioned for thumb reach
- [ ] Responsive images (srcset included)
- [ ] Tested on real mobile devices

**Documentation Consistency:**
- [ ] Component documented with usage examples
- [ ] States documented (default, hover, active, disabled, etc.)
- [ ] Accessibility notes included
- [ ] Code examples provided
- [ ] Updated design system version
- [ ] Changelog entry created

**Performance Consistency:**
- [ ] Images optimized (<200 KB)
- [ ] Sounds optimized (<20 KB each)
- [ ] CSS animations used (not JS where possible)
- [ ] No unnecessary re-renders
- [ ] Lazy loading implemented
- [ ] Page load time under 3 seconds

### 15.2 Quarterly Design System Review

**Every 3 months:**
1. Review new components created
2. Check for consistency violations
3. Update design tokens if needed
4. Document new patterns
5. Review user feedback on design
6. Update version number
7. Create changelog entry
8. Share updates with team

---

## 16. VERSION CONTROL & UPDATES

```
PAWZO Design System v1.0.0

Latest Version: 1.0.0
Release Date: June 2026
Status: Active

Changelog:
v1.0.0 (June 2026) - Initial design system launch
- Complete color system with 16 colors
- Typography guide (Inter + Poppins)
- Button styles (Primary, Secondary, Tertiary, Icon, FAB)
- Component library (Card, Container, List Item, Badge, Modal, Tab)
- Animation & transition standards
- Sound design specifications (7 sounds)
- Micro-interaction patterns
- Icon and imagery guidelines
- Implementation guide with file structure
- Consistency checklist for team

Next Review: September 2026
```

---

## 17. QUICK REFERENCE CARD

### Color Quick Ref
```
Primary CTA:        #BA324F (Rose Pink)
Secondary CTA:      #3A6EA5 (Deep Blue)
Success:            #B4EBCA (Minty Fresh)
Error:              #D62839 (Fire Red)
Warning:            #FFB7C3 (Blush Pink)
Text:               #175676 (Ocean Blue)
Light Background:   #BCF4F5 (Soft Sky)
Disabled:           #CCE6F4 (Cloud Soft)
```

### Spacing Quick Ref
```
Button Padding:     12px 32px
Card Padding:       24px
Modal Padding:      32px
Section Gap:        32px
Field Gap:          16px
Icon Gap:           8px
```

### Animation Quick Ref
```
Quick:              150ms ease-out
Standard:           300ms ease-out
Slow:               500ms ease-out
Easing:             cubic-bezier(0.4, 0, 0.2, 1)
Bounce:             cubic-bezier(0.34, 1.56, 0.64, 1)
```

### Border Radius Quick Ref
```
Button:             24px
Card:               20px
Input:              14px
Modal:              28px
Icon Button:        50% (circle)
Badge:              16px
```

---

## 18. SUPPORT & RESOURCES

### Design Tools
- **Figma:** Design system UI kit & components
- **Storybook:** Interactive component documentation
- **GitHub:** Design system source code & issues

### Getting Help
1. Check this Design System document
2. Review Figma UI kit
3. Look at existing components in codebase
4. Ask design team in #design Slack channel
5. Create issue on GitHub if finding inconsistency

### Contributing
To propose changes to the design system:
1. Create a design proposal (Figma file)
2. Present to design team for review
3. Update this document
4. Update Figma UI kit
5. Update components in codebase
6. Announce changes to team
7. Update version number & changelog

---

## APPENDIX: Full Component Spec Template

**Use this template for any new component:**

```markdown
# [Component Name]

## Purpose
What is this component used for?

## Usage
When and where to use this component.

## Variants
- Variant 1: [description]
- Variant 2: [description]

## States
- Default: [styling]
- Hover: [styling]
- Active: [styling]
- Disabled: [styling]
- Loading: [styling]
- Error: [styling]

## Props
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|

## Accessibility
- ARIA labels: [if needed]
- Keyboard nav: [if interactive]
- Screen reader: [announcements]
- Color contrast: [ratio]

## Animation
- Entrance: [animation description]
- Interaction: [animation description]
- Exit: [animation description]

## Sound
- Trigger: [when sound plays]
- Sound: [which sound effect]

## Code Example
```jsx
[example code]
```

## Browser Support
- Chrome: ✅
- Safari: ✅
- Firefox: ✅
- Edge: ✅
- Mobile Safari: ✅
```

---

*Document Version: 1.0.0*  
*Created: June 2026*  
*Status: Active & Ready for Development*  
*Owner: Design Team*  
*Next Review: September 2026*

**This Design System is the single source of truth for Pawzo's visual design, interactions, and brand voice. All team members should reference this document when building pages and features.**
