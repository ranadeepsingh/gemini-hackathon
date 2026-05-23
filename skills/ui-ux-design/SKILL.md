---
name: ui-ux-design
description: Design principles, custom theme tokens, typography, layout structures, and Framer Motion animation configurations for AntiCode.
---

# AntiCode Futuristic UI/UX Design System

This skill outlines the styling guidelines, color themes, grid classes, and animations required to maintain and extend the high-fidelity cyberpunk aesthetic across the AntiCode platform.

## 1. Color Palette & Typography
The interface is designed with a premium, sleek developer cockpit aesthetic. Avoid generic browser defaults. Use the following CSS variables and classes (defined in [src/app/globals.css](file:///Users/rana-ms-work/Documents/gemini-hackathon/src/app/globals.css)):

- **Primary Background (`bg-bg-dark`)**: Deep charcoal/space-slate (`#0b0f19`) to keep contrast high and minimize eye strain.
- **Glass Panel Background (`bg-bg-panel`)**: Translucent dark slate (`#131a26`) with blur backdrops (`backdrop-blur-xl`).
- **Cyber Lime (`agy-green`)**: Cyberpunk neon green (`#00ff66`) used for success states, completed tests, and active indicators.
- **Laser Cyan (`agy-cyan`)**: High-contrast blue (`#00f0ff`) used for telemetry statistics, highlight details, and primary action buttons.
- **Neon Violet (`agy-violet`)**: Laser purple (`#8b5cf6`) representing hard difficulty, advanced agent steps, or special AI models.
- **Alert Red (`text-red`)**: Cyber-red (`#ef4444`) representing blocked access, data leaks, or compile errors.

## 2. Atmospheric Layering (The Retro-Future Touch)
We create depth using layered background patterns. Every main view must feature:
1.  **Grid Overlay**: CSS cyber-grid representing virtual wireframes.
    ```html
    <div className="absolute inset-0 bg-cyber-grid bg-[size:40px_40px] opacity-10 pointer-events-none" />
    ```
2.  **Scanline CRT Effect**: Very low opacity horizontal line pattern to give a monitor glow.
    ```html
    <div className="absolute inset-0 bg-scanlines opacity-[0.02] pointer-events-none" />
    ```
3.  **Neon Glow Shadows**: Accent buttons or cards should utilize custom box shadows for maximum premium feedback (e.g. `shadow-[0_0_15px_rgba(0,240,255,0.25)]`).

## 3. High-Fidelity Micro-Animations
We use **Framer Motion** for micro-interactions to make the workspace feel alive:

*   **Simulation Progress Bar**: Graduated progress tracker increments utilizing a CSS background gradient:
    ```tsx
    <motion.div 
      className="h-full bg-gradient-to-r from-agy-cyan via-agy-green to-agy-green-bright"
      animate={{ width: `${completionProgress}%` }}
      transition={{ duration: 0.5 }}
    />
    ```
*   **Presence HUD (WebRTC Video Mock)**: Displayed on the workspace sidebar, representing candidate and interviewer connections. It incorporates:
    - Blinking indicators (`animate-ping`) for active voice logs.
    - Mini CSS sound wave nodes animating concurrently.
    - Custom active recording HUD tracking live frames.
*   **Step Updates**: Simulating interactive typewriter effects when streaming thoughts into the "Agent Thought Trace Observability" stream.

## 4. Guidelines for Future Updates
> [!IMPORTANT]
> - Never use default browser buttons. All interactive controls must have hover transitions (`transition-all duration-300`), focus outlines, and appropriate pointers.
> - Utilize **Lucide React** icons extensively to annotate metrics (e.g., `Cpu` for VM properties, `TrendingUp` for cost trackers, `Activity` for network, `Lock` for DB rules).
> - All pages must support responsive fluid design. Grid components should collapse from 12-column layouts on desktops (`lg:grid-cols-12`) to single-columns on mobile.
