# HomeOps Dashboard - CSS Style Guide

This document outlines the common CSS classes available for consistent styling across the HomeOps dashboard.

## Quick Start

All dashboard components should use the CSS classes defined in `dashboard.css` instead of inline Tailwind classes for consistency and maintainability.

### Before (Inline Tailwind)
```jsx
<button className="flex items-center gap-2 px-4 py-2 border border-blue-500 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-sm font-medium">
  Save Changes
</button>
```

### After (CSS Classes)
```jsx
<button className="btn-primary">
  Save Changes
</button>
```

## Button Classes

### Primary Actions
- `btn-primary` - Blue button for primary actions (Save, Connect, etc.)
- `btn-success` - Green button for positive actions (Add, Create, etc.)
- `btn-secondary` - Gray button for secondary actions (Cancel, Details, etc.)

### Destructive Actions
- `btn-danger` - Red button for destructive actions (Delete, Disconnect, etc.)
- `btn-warning` - Orange button for warning actions

### Button Variants
- `btn-sm` - Small button
- `btn-lg` - Large button
- `btn-icon` - Icon-only button without border
- `btn-icon-bordered` - Small icon button with border
- `btn-disabled` - Add to any button for disabled styling

### Tab Buttons
- `btn-tab-active` - Active tab styling
- `btn-tab-inactive` - Inactive tab styling

### Examples
```jsx
// Primary save button
<button className="btn-primary btn-disabled" disabled={saving}>
  {saving ? 'Saving...' : 'Save Changes'}
</button>

// Delete button
<button className="btn-danger btn-sm" onClick={handleDelete}>
  Delete
</button>

// Tab navigation
<button className={activeTab === 'profile' ? 'btn-tab-active' : 'btn-tab-inactive'}>
  Profile
</button>

// Icon button
<button className="btn-icon" title="Edit">
  <Edit className="w-4 h-4" />
</button>
```

## Layout Classes

### Containers
- `settings-container` - Standard settings page container (44rem height with spacing)
- `card-base` - Basic card styling
- `card-elevated` - Card with shadow and hover effects
- `modal-backdrop` - Modal backdrop styling
- `modal-content` - Modal content container

### Grids
- `grid-cards` - Responsive grid for cards (1-2-3 columns)
- `grid-form` - Two-column form layout
- `flex-header` - Flex layout for section headers
- `flex-actions` - Flex layout for action buttons

### Examples
```jsx
// Settings page structure
<div className="settings-container">
  <div className="flex-header">
    <h2 className="heading-md">Settings</h2>
    <div className="flex-actions">
      <button className="btn-primary">Save</button>
    </div>
  </div>

  <div className="grid-form">
    <input className="input-base" />
    <select className="select-base" />
  </div>
</div>
```

## Form Elements

### Inputs
- `input-base` - Standard input field
- `select-base` - Select dropdown
- `textarea-base` - Textarea field
- `checkbox-base` - Checkbox styling

### Toggles
- `toggle-base` - Base toggle switch
- `toggle-active` / `toggle-inactive` - Toggle states
- `toggle-thumb` - Toggle thumb element
- `toggle-thumb-active` / `toggle-thumb-inactive` - Thumb positions

### Examples
```jsx
// Form fields
<input type="text" className="input-base" placeholder="Enter name" />
<select className="select-base">
  <option>Select option</option>
</select>

// Toggle switch
<button className={isActive ? 'toggle-active' : 'toggle-inactive'}>
  <span className={isActive ? 'toggle-thumb-active' : 'toggle-thumb-inactive'} />
</button>
```

## Typography

### Headings
- `heading-lg` - Large heading (2xl, bold)
- `heading-md` - Medium heading (lg, semibold)
- `heading-sm` - Small heading (base, medium)

### Body Text
- `text-body` - Standard body text
- `text-body-sm` - Small body text
- `text-body-xs` - Extra small body text

### Labels
- `label-base` - Standard form label
- `label-sm` - Small label

## Badges & Indicators

### Badge Colors
- `badge-blue` - Blue badge
- `badge-green` - Green badge
- `badge-red` - Red badge
- `badge-orange` - Orange badge
- `badge-purple` - Purple badge
- `badge-gray` - Gray badge

### Examples
```jsx
<span className="badge-green">Active</span>
<span className="badge-red">Expired</span>
<span className="badge-blue">Schedule</span>
```

## State Classes

### Messages
- `error-message` - Red error message container
- `success-message` - Green success message container
- `warning-message` - Yellow warning message container
- `info-message` - Blue info message container

### Animations
- `skeleton` - Loading skeleton animation
- `hover-bg` - Standard hover background
- `hover-bg-subtle` - Subtle hover background

### Examples
```jsx
// Error message
<div className="error-message">
  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
  <span>Something went wrong</span>
</div>

// Loading skeleton
<div className="skeleton h-6 w-32"></div>
```

## Accordion Components

### Accordion Classes
- `accordion-trigger` - Clickable accordion header
- `accordion-content-open` - Expanded content
- `accordion-content-closed` - Collapsed content

### Examples
```jsx
<button className="accordion-trigger" onClick={toggle}>
  <span>Section Title</span>
  <ChevronDown className="w-4 h-4" />
</button>
<div className={isOpen ? 'accordion-content-open' : 'accordion-content-closed'}>
  Content here
</div>
```

## Best Practices

### 1. Use Semantic Classes
Choose classes based on the semantic meaning, not appearance:
- Use `btn-primary` for the main action, not because you want blue
- Use `btn-danger` for destructive actions, not because you want red

### 2. Combine Classes
Classes are designed to work together:
```jsx
<button className="btn-primary btn-sm btn-disabled" disabled={loading}>
  {loading ? 'Loading...' : 'Save'}
</button>
```

### 3. Override When Necessary
If you need custom styling, you can still add Tailwind classes:
```jsx
<button className="btn-primary w-full">
  Full Width Primary Button
</button>
```

### 4. Consistent Spacing
Use the predefined spacing classes:
- `space-y-section` for section spacing
- `space-y-form` for form element spacing

## Customization

To change the global appearance, edit `src/styles/dashboard.css`:

### Example: Change Primary Color Scheme
```css
.btn-primary {
  @apply btn-base border border-purple-500 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-400 dark:hover:bg-purple-900/20;
}
```

### Example: Change Border Radius
```css
.btn-base {
  @apply flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors; /* Changed from rounded-lg to rounded-xl */
}
```

This centralized approach makes it easy to maintain consistent styling and implement design changes across the entire dashboard.