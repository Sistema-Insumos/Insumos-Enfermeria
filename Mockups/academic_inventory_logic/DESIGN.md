---
name: Academic Inventory Logic
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f5'
  surface-container: '#f0edef'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464d'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#0b1c30'
  on-tertiary-container: '#75859d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  table-header:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-bold:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
  mono-data:
    fontFamily: Courier Prime
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 24px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system focuses on **Utility-Driven Minimalism**. It is tailored for the academic environment where precision, clarity, and reliability are paramount. The interface must feel like a high-performance tool—unobtrusive, systematic, and incredibly efficient for data entry and audit trails.

The style leverages a **Corporate Modern** aesthetic with a heavy emphasis on structural hierarchy. It uses a card-based layout to compartmentalize information, ensuring that even with high data density, the user can scan and identify supply levels at a glance. The emotional response should be one of "controlled order"—reducing the cognitive load of managing thousands of unique SKUs through organized whitespace and logical grouping.

## Colors

This design system utilizes a "Trustworthy Blue" palette grounded by slate grays to maintain a professional, institutional feel.

- **Primary:** A deep Slate Blue-Black used for navigation, primary headers, and core brand elements to establish authority.
- **Secondary:** A bright, functional blue used for primary actions, links, and active states.
- **Status Indicators:** High-saturation Green, Orange, and Red are used strictly for inventory states (Available, Low Stock, Out of Stock). They must never be used for decorative purposes to ensure their semantic meaning remains clear.
- **Surface Colors:** Uses a subtle off-white (`#F8FAFC`) for the page background to reduce eye strain, while pure white is reserved for high-density data cards and tables.

## Typography

**Inter** is the workhorse of this system, chosen for its exceptional legibility in data-heavy contexts and its neutral, professional tone. 

- **Data Density:** Use `body-md` for standard table rows and `body-sm` for secondary metadata. 
- **Tabular Figures:** When displaying numerical quantities (stock counts, SKU numbers), use tabular lining figures to ensure columns of numbers align vertically for easy scanning.
- **Visual Hierarchy:** Section headers use `headline-sm` in the Primary Slate color to anchor the page. `table-header` uses uppercase styling with increased tracking to distinguish the chrome of the UI from the user data.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a max-width container of 1440px for desktop to prevent line lengths from becoming unreadable.

- **Grid:** A 12-column grid is used for dashboard layouts. Data tables typically span the full width of the container.
- **Density:** To accommodate high information density, we use a compact spacing rhythm based on a 4px baseline. Table row padding is set to 12px (vertical) and 16px (horizontal).
- **Mobile Adaptation:** On mobile devices, the 12-column grid collapses to a single column. Cards that appear side-by-side on desktop will stack vertically. Data tables should transition to a "record card" format or include a horizontal scroll with the first column (Item Name) frozen.

## Elevation & Depth

This design system uses **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows to maintain a clean, flat aesthetic that doesn't distract from the data.

- **Level 0 (Background):** `#F8FAFC` - The base canvas.
- **Level 1 (Cards/Surface):** White `#FFFFFF` with a 1px solid border in `#E2E8F0`. This is the primary container for inventory lists and forms.
- **Level 2 (Overlays):** Modals and dropdowns use a subtle ambient shadow (0px 4px 12px rgba(15, 23, 42, 0.08)) to indicate depth without appearing "heavy."
- **Interactive States:** Hovering over a table row or card should trigger a subtle background color shift to `#F1F5F9` rather than an elevation change.

## Shapes

The shape language is **Soft** and professional. 

- **Primary Radius:** 0.25rem (4px) is applied to buttons, input fields, and small UI components to provide a modern feel without looking overly casual.
- **Container Radius:** 0.5rem (8px) is used for large information cards and modal windows to gently soften the high-density layout.
- **Status Pills:** Status indicators (e.g., "In Stock") use a fully rounded (pill) shape to distinguish them from interactive buttons.

## Components

- **Inventory Tables:** The core component. Features include sticky headers, sortable columns, and a fixed right-hand "Actions" column. Use zebra-striping (alternate rows with `#F8FAFC`) to improve horizontal scanning.
- **Status Chips:** Small, pill-shaped badges.
    - *Success:* Light green background with dark green text.
    - *Warning:* Light orange background with dark orange text.
    - *Danger:* Light red background with dark red text.
- **Action Buttons:**
    - *Primary:* Solid Secondary Blue with white text for "Add Item" or "Save."
    - *Secondary:* Ghost style (slate outline) for "Cancel" or "Export."
- **Input Fields:** Use a 1px border (`#CBD5E1`). On focus, the border transitions to Secondary Blue with a subtle 2px blue outer glow (ring). Labels are always positioned above the field for clarity during rapid data entry.
- **Category Icons:** Use a consistent 20px icon set (e.g., Lucide or Heroicons). Each subject category (Science, Math, Art) should be paired with a specific icon to allow for non-linguistic identification of supply types.
- **Search & Filter Bar:** A persistent top-anchored bar on inventory screens with integrated "Search by SKU" and "Filter by Location" dropdowns.