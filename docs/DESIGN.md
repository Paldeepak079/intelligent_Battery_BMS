# KAVACH-BMS — Design System

## 1. Design Direction
**Tactical Liquid Glassmorphism:** a dark, spatial command interface combining translucent glass panels, restrained glow, high-contrast telemetry and clear operational hierarchy.

The interface should feel like a modern avionics monitoring console—not a generic admin dashboard.

## 2. Visual Principles
- Dark abyss background with subtle cyan, emerald and violet ambient gradients.
- Frosted-glass cards with visible borders and layered depth.
- Bright semantic status colors used consistently.
- Dense technical data presented with strong alignment and readable labels.
- Animations should clarify state changes, not distract from alarms.
- Avoid excessive glow, clutter and decorative motion around critical warnings.

## 3. Color Tokens

```css
:root {
  --bg-abyss: #050811;
  --bg-radial-cyan: rgba(14, 165, 233, 0.16);
  --bg-radial-emerald: rgba(16, 185, 129, 0.12);
  --bg-radial-violet: rgba(139, 92, 246, 0.10);

  --glass-primary: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.09),
    rgba(255, 255, 255, 0.02)
  );
  --glass-elevated: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.14),
    rgba(255, 255, 255, 0.04)
  );
  --glass-blur: blur(24px) saturate(180%);
  --glass-border: rgba(255, 255, 255, 0.18);
  --glass-border-subtle: rgba(255, 255, 255, 0.07);

  --accent-cyan: #00F2FE;
  --accent-emerald: #10B981;
  --accent-amber: #F59E0B;
  --accent-crimson: #F43F5E;
  --accent-violet: #8B5CF6;

  --text-primary: #F8FAFC;
  --text-secondary: #CBD5E1;
  --text-muted: #94A3B8;

  --font-display: "Space Grotesk", "Plus Jakarta Sans", system-ui, sans-serif;
  --font-body: "Plus Jakarta Sans", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}
```

## 4. Components
- **Navigation:** sticky glass navigation with clear active-section state.
- **KPI cards:** label, value, unit, status and optional trend.
- **Cell cards:** cell ID, voltage, resistance, surface/core temperature and bypass state.
- **Status banners:** severity, concise message and timestamp.
- **Charts:** labelled axes, units, legend, readable tooltips and empty/loading states.
- **Fault console:** explicit simulation label and confirmation for disruptive actions.
- **Audit log:** timestamp, severity, event and source.
- **Report preview:** summary, measured inputs, assumptions and limitations.

## 5. Interaction and Motion
- Card hover: subtle perspective tilt and cursor-following specular highlight.
- Primary buttons: restrained magnetic movement, disabled on touch devices.
- Section reveal: short staggered fade/translate animation.
- Live values: animate only when values change; avoid flashing.
- Critical alarms: use color plus text/icon; never rely on color alone.
- Respect `prefers-reduced-motion`.

Suggested easing: `cubic-bezier(0.16, 1, 0.3, 1)`.
Suggested card transition: 250–300 ms.
Suggested cursor interaction radius for magnetic buttons: approximately 60 px.

## 6. Accessibility and Responsiveness
- Maintain WCAG 2.1 AA contrast targets.
- Provide keyboard navigation and visible focus indicators.
- Use semantic headings and button labels.
- Charts must have text summaries or accessible data alternatives.
- Support narrow screens with stacked cards and horizontally scrollable chart regions.
- Ensure critical status text remains readable without blur effects.
