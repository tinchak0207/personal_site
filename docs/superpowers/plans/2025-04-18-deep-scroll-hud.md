# Scroll Animation & Deep UI Modules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the D3 graph scroll animation (`unfoldProgress`) from 1.0 to 2.0, fading the graph into the background while incrementally revealing four HUD-style modules (Archive, Projects, Settings, Links) and a color-shifting "scroll down" prompt.

**Architecture:** 
1. Modify the scroll event listeners in `Graph.tsx` to allow `unfoldProgress` to reach 2.0.
2. At progress > 1.0, reduce graph opacity and disable pointer events to sink it into the background.
3. Introduce four new absolute-positioned React components that map their opacity and transform properties to `unfoldProgress` (e.g., Module 1 fades in at 1.2, Module 2 at 1.4, etc.).
4. Replace existing text/emoji icons with custom minimal pixel-art SVG icons.
5. Update the "Scroll Down" prompt to stay visible but interpolate its color from green (`#4ADE80`) to cyan (`#81D4FA`) as progress approaches 2.0.
6. Add a functional Language Toggle (`[ 繁 ] [ 简 ] [ EN ]`) inside the Settings module.

**Tech Stack:** React, Tailwind CSS, framer-motion, D3.js

---

### Task 1: Extend Scroll Progress Range and Fade Graph

**Files:**
- Modify: `src/components/Graph.tsx`

- [ ] **Step 1: Update scroll limits**
In the `handleWheel` and `handleTouchMove` functions, change `Math.min(1, newProgress)` to `Math.min(2, newProgress)`.

```tsx
// Inside handleWheel:
let newProgress = prev + delta;
return Math.max(0, Math.min(2, newProgress));

// Inside handleTouchMove:
let newProgress = prev + delta;
return Math.max(0, Math.min(2, newProgress));
```

- [ ] **Step 2: Cap D3 physics and scale at 1.0**
The D3 forces and graph scaling should stop evolving after 1.0. Create a clamped variable `cappedProgress = Math.min(1, unfoldProgress)` and use it for D3 charge, distance, and the main `<g>` scale transform.

```tsx
const cappedProgress = Math.min(1, unfoldProgress);
const easeProgress = Math.pow(cappedProgress, 8);
// Use easeProgress and cappedProgress for all D3 force calculations
```

- [ ] **Step 3: Fade out graph and disable interaction past 1.0**
In the main foreground `<g>` wrapper for the graph, map opacity to decrease from 1.0 to 0.15 as `unfoldProgress` goes from 1.0 to 2.0. Also, disable `pointer-events` if `unfoldProgress > 1.1`.

```tsx
<g style={{
  opacity: unfoldProgress > 1.0 ? Math.max(0.15, 1 - (unfoldProgress - 1.0) * 1.5) : 1,
  pointerEvents: unfoldProgress > 1.1 ? 'none' : 'auto',
  // keep existing transforms but use cappedProgress
}}>
```

### Task 2: Implement HUD Modules with Custom SVGs

**Files:**
- Modify: `src/components/Graph.tsx`

- [ ] **Step 1: Create HUD layout container**
Add a new fixed container overlay inside `Graph.tsx` (sibling to the SVG graph) that only appears when `unfoldProgress > 1.0`.

- [ ] **Step 2: Implement Archive (Blog) Module**
Fades in at `1.2`. Left side.
Icon: Minimal floppy disk SVG.

```tsx
const opacityArchive = Math.max(0, Math.min(1, (unfoldProgress - 1.2) * 5));
// SVG: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
```

- [ ] **Step 3: Implement Projects Module**
Fades in at `1.4`. Left side, below Archive.
Icon: Minimal microchip SVG.

```tsx
const opacityProjects = Math.max(0, Math.min(1, (unfoldProgress - 1.4) * 5));
// SVG: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>
```

- [ ] **Step 4: Implement Settings Module**
Fades in at `1.6`. Right side.
Icon: Minimal gear SVG.

```tsx
const opacitySettings = Math.max(0, Math.min(1, (unfoldProgress - 1.6) * 5));
// SVG: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
```

- [ ] **Step 5: Implement Links Module**
Fades in at `1.8`. Right side, below Settings.
Icon: Minimal terminal/link SVG.

```tsx
const opacityLinks = Math.max(0, Math.min(1, (unfoldProgress - 1.8) * 5));
// SVG: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
```

### Task 3: Color-shifting Scroll Prompt and Language Toggle

**Files:**
- Modify: `src/components/Graph.tsx`

- [ ] **Step 1: Color shift logic for scroll hint**
Calculate an interpolated color based on `unfoldProgress` from 1.0 to 2.0.

```tsx
// Calculate color: Green (#4ADE80) to Cyan (#81D4FA)
const calculateHintColor = () => {
  if (unfoldProgress < 1.0) return '#4ADE80';
  const ratio = Math.min(1, unfoldProgress - 1.0);
  
  // R: 74 -> 129
  // G: 222 -> 212
  // B: 128 -> 250
  const r = Math.round(74 + (129 - 74) * ratio);
  const g = Math.round(222 + (212 - 222) * ratio);
  const b = Math.round(128 + (250 - 128) * ratio);
  
  return `rgb(${r}, ${g}, ${b})`;
};
const hintColor = calculateHintColor();
```

- [ ] **Step 2: Update Scroll Hint element**
Keep the scroll hint visible at `unfoldProgress > 1.0`. Apply the calculated `hintColor` to text and SVGs. Add occasional glitch characters to the text using a `useEffect` interval when `unfoldProgress > 1.0`.

- [ ] **Step 3: Add Language Toggle UI to Settings**
Inside the Settings module (Task 2, Step 4), implement the language state and UI.

```tsx
const [lang, setLang] = useState('繁');
// Inside Settings module:
<div className="flex gap-2 font-pixel text-xs">
  {['繁', '简', 'EN'].map(l => (
    <button 
      key={l}
      onClick={() => setLang(l)}
      className={`px-2 py-1 border ${lang === l ? 'border-[#4ADE80] text-[#4ADE80] animate-pulse' : 'border-transparent text-[#4a6b57] hover:text-[#A5D6B7]'}`}
    >
      [ {l} ]
    </button>
  ))}
</div>
```

- [ ] **Step 4: Commit**
```bash
git add src/components/Graph.tsx
git commit -m "feat: deep layer HUD modules and extended scroll animation"
```