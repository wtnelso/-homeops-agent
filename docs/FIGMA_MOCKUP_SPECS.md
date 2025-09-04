# HomeOps Figma Mockup Specifications
## Mental Load Operating System - Design System

### 🎨 Color Palette

#### Primary Colors
- **Primary Purple**: `#667eea`
- **Secondary Purple**: `#8b5cf6` 
- **Accent Purple**: `#7c3aed`
- **Gradient Primary**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Gradient Secondary**: `linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)`

#### Text Colors
- **Text Dark**: `#1e1b4b`
- **Text Light**: `#6b7280`
- **Text Muted**: `#9ca3af`

#### Background Colors
- **Background Light**: `#faf5ff`
- **Background White**: `#ffffff`
- **Background Dark**: `#181c2a`

#### Status Colors
- **Success**: `#059669`
- **Warning**: `#d97706`
- **Error**: `#dc2626`
- **Info**: `#3b82f6`

### 📐 Typography

#### Font Family
- **Primary**: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Fallback**: `Montserrat, sans-serif`

#### Font Weights
- **Regular**: `400`
- **Medium**: `500`
- **Semi-Bold**: `600`
- **Bold**: `700`
- **Extra Bold**: `800`

#### Font Sizes
- **Hero Title**: `3.5rem` (56px)
- **Section Title**: `2.5rem` (40px)
- **Card Title**: `1.4rem` (22.4px)
- **Body Large**: `1.2rem` (19.2px)
- **Body**: `1rem` (16px)
- **Body Small**: `0.9rem` (14.4px)
- **Caption**: `0.8rem` (12.8px)

### 🎯 Component Specifications

#### Buttons

**Primary Button**
- Background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- Text Color: `#ffffff`
- Padding: `16px 32px`
- Border Radius: `12px`
- Font Weight: `600`
- Hover: `translateY(-2px)` + enhanced shadow

**Secondary Button**
- Background: `rgba(255, 255, 255, 0.1)`
- Text Color: `#ffffff`
- Border: `2px solid rgba(255, 255, 255, 0.2)`
- Backdrop Filter: `blur(10px)`
- Padding: `16px 32px`
- Border Radius: `12px`

**Ghost Button**
- Background: `transparent`
- Text Color: `#667eea`
- Border: `2px solid rgba(139, 92, 246, 0.12)`
- Padding: `12px 24px`
- Border Radius: `8px`

#### Cards

**Primary Card**
- Background: `#ffffff`
- Border Radius: `20px`
- Box Shadow: `0 8px 32px rgba(139, 92, 246, 0.16)`
- Border: `1px solid rgba(139, 92, 246, 0.08)`
- Padding: `32px 24px`
- Hover: `translateY(-4px)` + enhanced shadow

**Feature Card**
- Background: `#faf5ff`
- Border Radius: `16px`
- Border: `1px solid rgba(139, 92, 246, 0.08)`
- Padding: `32px 24px`
- Hover: `translateY(-4px)` + shadow

#### Input Fields

**Text Input**
- Background: `#ffffff`
- Border: `2px solid rgba(139, 92, 246, 0.12)`
- Border Radius: `12px`
- Padding: `12px 16px`
- Focus: Border color `#8b5cf6` + `box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1)`

**Search Input**
- Background: `#f8fafc`
- Border: `1px solid rgba(139, 92, 246, 0.12)`
- Border Radius: `12px`
- Padding: `12px 16px 12px 48px`
- Icon: Left-aligned, `#6b7280`

### 🏗️ Layout Specifications

#### Grid System
- **Container Max Width**: `1400px`
- **Grid Gap**: `32px`
- **Column Breakpoints**:
  - Mobile: `1fr`
  - Tablet: `repeat(auto-fit, minmax(300px, 1fr))`
  - Desktop: `repeat(auto-fit, minmax(400px, 1fr))`

#### Spacing Scale
- **XS**: `4px`
- **S**: `8px`
- **M**: `16px`
- **L**: `24px`
- **XL**: `32px`
- **XXL**: `48px`
- **XXXL**: `80px`

#### Section Padding
- **Hero Section**: `80px 16px 48px`
- **Content Section**: `80px 24px`
- **Footer**: `48px 24px 24px`

### 🎭 Component Mockups

#### 1. Chat Interface

**Chat Container**
- Background: `#faf5ff`
- Border Radius: `16px`
- Padding: `20px`
- Height: `280px`
- Overflow: `auto`

**Message Bubbles**
- **Agent Message**:
  - Background: `#ffffff`
  - Border: `1px solid rgba(139, 92, 246, 0.12)`
  - Border Left: `3px solid #8b5cf6`
  - Border Radius: `16px`
  - Padding: `12px 16px`
  - Max Width: `80%`
  - Align: `flex-start`

- **User Message**:
  - Background: `linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)`
  - Color: `#ffffff`
  - Border Radius: `16px`
  - Padding: `12px 16px`
  - Max Width: `80%`
  - Align: `flex-end`

**Chat Input**
- Display: `flex`
- Gap: `8px`
- Input: `flex: 1`
- Button: `48px` width, gradient background

#### 2. Calendar Interface

**Calendar Container**
- Background: `#ffffff`
- Border Radius: `16px`
- Padding: `20px`
- Height: `280px`

**Calendar Grid**
- Display: `grid`
- Grid Template: `repeat(7, 1fr)`
- Gap: `4px`

**Calendar Day**
- Aspect Ratio: `1:1`
- Border Radius: `8px`
- Hover: Background `#faf5ff`
- Today: Gradient background + white text
- Has Event: `rgba(139, 92, 246, 0.1)` background + purple text

**Event Tags**
- Appointment: `rgba(59, 130, 246, 0.1)` background + `#1d4ed8` text
- Personal: `rgba(139, 92, 246, 0.1)` background + `#7c3aed` text

#### 3. Email Decoder Interface

**Decoder Container**
- Background: `#ffffff`
- Border Radius: `16px`
- Padding: `20px`
- Height: `280px`
- Overflow: `auto`

**Decoder Card**
- Background: `#faf5ff`
- Border Radius: `12px`
- Border Left: `4px solid #667eea`
- Padding: `16px`
- Margin Bottom: `12px`

**Card Header**
- Display: `flex`
- Align Items: `center`
- Gap: `8px`

**Card Icon**
- Width: `20px`
- Height: `20px`
- Color: `#667eea`

**Card Type Badge**
- Font Size: `0.8rem`
- Font Weight: `600`
- Color: `#667eea`
- Text Transform: `uppercase`
- Letter Spacing: `0.5px`

**Action Button**
- Background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- Color: `#ffffff`
- Padding: `4px 12px`
- Border Radius: `6px`
- Font Size: `0.75rem`
- Font Weight: `600`

#### 4. Navigation Bar

**Top Bar**
- Background: `#ffffff`
- Border Bottom: `1px solid rgba(139, 92, 246, 0.08)`
- Padding: `1rem 2rem`
- Display: `flex`
- Justify Content: `space-between`
- Align Items: `center`

**Logo Section**
- Display: `flex`
- Align Items: `center`
- Gap: `12px`

**Logo Icon**
- Width: `48px`
- Height: `48px`
- Background: `linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)`
- Border Radius: `12px`
- Display: `flex`
- Align Items: `center`
- Justify Content: `center`

**Brand Text**
- Font Size: `1.5rem`
- Font Weight: `700`
- Background: `linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)`
- Background Clip: `text`
- Webkit Text Fill Color: `transparent`

#### 5. Sidebar Navigation

**Sidebar Container**
- Background: `linear-gradient(to bottom right, #6366f1, #8b5cf6)`
- Width: `80px` (desktop) / `240px` (mobile)
- Height: `100vh`
- Position: `fixed`
- Left: `0`
- Top: `0`
- Padding: `2rem 0`

**Nav Items**
- Display: `flex`
- Flex Direction: `column`
- Align Items: `center`
- Gap: `2.2rem`
- Margin Top: `2rem`

**Nav Item**
- Width: `3rem`
- Height: `3rem`
- Border Radius: `1.2rem`
- Background: `transparent`
- Color: `rgba(255, 255, 255, 0.7)`
- Hover: `rgba(255, 255, 255, 0.1)` background + white color
- Active: `rgba(255, 255, 255, 0.2)` background + white color + shadow

### 📱 Responsive Breakpoints

#### Mobile First Approach
- **Mobile**: `max-width: 480px`
- **Tablet**: `max-width: 768px`
- **Desktop**: `min-width: 901px`

#### Mobile Adaptations
- Hero Title: `2rem` (32px)
- Section Title: `2rem` (32px)
- Mockup Grid: `1fr` (single column)
- CTA Buttons: Full width, max-width `300px`
- Sidebar: Overlay from left, `240px` width

### 🎨 Icon Specifications

#### Icon Library
- **Primary**: Lucide Icons
- **Size Variants**: `16px`, `20px`, `24px`, `32px`, `48px`, `64px`
- **Color**: Inherit from parent or `#667eea` for primary actions

#### Common Icons
- **Chat**: `message-square`
- **Calendar**: `calendar-days`
- **Brain/AI**: `brain`
- **Mail**: `mail-check`
- **Dashboard**: `layout-dashboard`
- **Bot**: `bot`
- **Shield**: `shield-check`
- **Zap**: `zap`
- **School**: `school`
- **Shopping**: `shopping-cart`
- **Send**: `send`
- **Play**: `play`
- **Info**: `info`

### 🌟 Animation Specifications

#### Transitions
- **Default Duration**: `0.3s`
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)`
- **Hover Transform**: `translateY(-2px)` or `translateY(-4px)`

#### Keyframes
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### 📋 Figma Frame Specifications

#### Recommended Frame Sizes
- **Desktop**: `1440px × 1024px`
- **Tablet**: `768px × 1024px`
- **Mobile**: `375px × 812px`

#### Auto Layout Settings
- **Primary Direction**: Vertical
- **Spacing**: `32px` between sections
- **Padding**: `24px` horizontal, `80px` vertical for sections

#### Component Organization
1. **Hero Section** (Full width gradient background)
2. **Mockup Section** (3-column grid on desktop)
3. **Features Section** (White background, 6-column grid)
4. **Footer** (Dark background)

### 🎯 Design Principles

1. **Mental Load Reduction**: Clean, uncluttered interfaces
2. **Progressive Disclosure**: Show only what's immediately relevant
3. **Consistent Visual Hierarchy**: Clear information architecture
4. **Accessible Design**: High contrast, readable typography
5. **Mobile First**: Responsive design that works on all devices
6. **Purple Brand Identity**: Consistent use of purple gradient theme
7. **Modern UI Patterns**: Cards, gradients, subtle shadows
8. **Intelligent Automation**: Visual cues that suggest AI capabilities

### 📝 Implementation Notes

- Use CSS custom properties for consistent theming
- Implement smooth transitions for all interactive elements
- Ensure proper focus states for accessibility
- Test on multiple screen sizes and devices
- Maintain consistent spacing using the defined scale
- Use semantic HTML structure for better SEO and accessibility 