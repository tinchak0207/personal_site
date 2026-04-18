# Phased HUD Modules & Boot Animation Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the repeating boot animation, extend the scroll progress to 3.0 to create a "deep dive" buffer, and introduce the four HUD modules sequentially with a slow, deliberate "walk out" animation using fully visible Chinese text.

**Architecture:** 
1. `TerminalBoot.tsx`: Use `sessionStorage` to track if the boot sequence has already played.
2. `Graph.tsx`: Increase `unfoldProgress` max to 3.0. Keep D3 forces capped at 1.0.
3. `Graph.tsx`: Map the four modules (Archive, Projects, Settings, Links) to specific, non-overlapping scroll intervals between 1.5 and 3.0.
4. `Graph.tsx`: For each module, implement a two-stage visual reveal. The module container fades in, and the text (always visible, not just on hover) slowly slides out from behind the icon as if being "unlocked".
5. `Graph.tsx`: Spread the modules vertically along the left side (or alternate left/right) to give them more breathing room. Update text to Chinese ("日誌歸檔", "神經專案", "系統設定", "外部鏈接").

**Tech Stack:** React, Tailwind CSS, D3.js

---

### Task 1: Fix Boot Animation State

**Files:**
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: Use sessionStorage for boot state**
Check `sessionStorage.getItem('booted')` on initial mount. If true, skip the boot animation.

```tsx
export function Home() {
  const [booting, setBooting] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('booted') !== 'true';
    }
    return true;
  });

  const handleBootComplete = () => {
    sessionStorage.setItem('booted', 'true');
    setBooting(false);
  };

  // Update <TerminalBoot onComplete={handleBootComplete} />
```

### Task 2: Extend Scroll Range and Redefine Module Intervals

**Files:**
- Modify: `src/components/Graph.tsx`

- [ ] **Step 1: Increase unfoldProgress max to 3.0**
In `handleWheel` and `handleTouchMove`, change the clamp maximum to 3.0.

```tsx
return Math.max(0, Math.min(3, newProgress));
```

- [ ] **Step 2: Calculate specific progression intervals**
Instead of simple multiplication, create a helper function `getModuleProgress(progress, start, end)` that maps a scroll range to a `0-1` value.

```tsx
const getModuleProgress = (current: number, start: number, end: number) => {
  if (current <= start) return 0;
  if (current >= end) return 1;
  return (current - start) / (end - start);
};

// Calculate 0-1 progress for each module
const progArchive = getModuleProgress(unfoldProgress, 1.2, 1.6);
const progProjects = getModuleProgress(unfoldProgress, 1.6, 2.0);
const progSettings = getModuleProgress(unfoldProgress, 2.0, 2.4);
const progLinks = getModuleProgress(unfoldProgress, 2.4, 2.8);
```

### Task 3: Implement Phased "Walk Out" HUD Layout

**Files:**
- Modify: `src/components/Graph.tsx`

- [ ] **Step 1: Spread layout vertically**
Change the HUD container to be a full-height flex column on the left side, evenly distributing the modules.

```tsx
<div className="absolute left-6 md:left-12 top-0 bottom-0 py-32 pointer-events-none z-20 flex flex-col justify-between font-pixel">
```

- [ ] **Step 2: Implement "Walk Out" Animation for Archive**
Use `progArchive` to control opacity and a large translation. The text must be always visible (no hover required), sliding out from the icon. Update text to Chinese.

```tsx
{/* 日誌歸檔 */}
<div 
  className="pointer-events-auto flex items-center gap-4 cursor-pointer group"
  style={{ 
    opacity: progArchive,
    transform: `translateX(${(1 - progArchive) * -100}px)` // Slides in from 100px left
  }}
  onClick={() => window.location.href = '/blog'}
>
  <div className="w-12 h-12 border border-[#4ADE80] flex items-center justify-center bg-[#0a140f]/90 relative z-10 shadow-[0_0_15px_rgba(74,222,128,0.2)] group-hover:bg-[#1B3B2B] transition-colors">
    <div className="absolute inset-0 noise"></div>
    {/* SVG Icon */}
  </div>
  <div 
    className="overflow-hidden"
    style={{
      // The text container width expands based on progress
      maxWidth: `${progArchive * 200}px`,
      opacity: progArchive > 0.5 ? (progArchive - 0.5) * 2 : 0 // Text fades in during the second half of the interval
    }}
  >
    <div className="pl-2 whitespace-nowrap">
      <h3 className="text-[#4ADE80] tracking-[0.3em] text-lg md:text-xl">日誌歸檔</h3>
      <p className="text-[#4a6b57] text-xs tracking-widest mt-1">/archive_logs</p>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Implement "Walk Out" Animation for Projects**
Apply the same pattern using `progProjects`. Update text to Chinese.

```tsx
{/* 神經專案 */}
<div 
  className="pointer-events-auto flex items-center gap-4 cursor-pointer group"
  style={{ 
    opacity: progProjects,
    transform: `translateX(${(1 - progProjects) * -100}px)`
  }}
  onClick={() => window.location.href = '/blog'}
>
  {/* Same structure as above, using #81D4FA colors and Projects SVG */}
  {/* Text: "神經專案", Subtext: "/neural_projects" */}
</div>
```

- [ ] **Step 4: Implement "Walk Out" Animation for Settings**
Apply the same pattern using `progSettings`. Include the Language Toggle inside the text container. Update text to Chinese.

```tsx
{/* 系統設定 */}
<div 
  className="pointer-events-auto flex items-center gap-4 group"
  style={{ 
    opacity: progSettings,
    transform: `translateX(${(1 - progSettings) * -100}px)`
  }}
>
  {/* Same structure as above, using #B39DDB colors and Settings SVG */}
  {/* Text: "系統設定", Subtext: "/sys_config" */}
  {/* Language Toggle buttons go below the subtext */}
</div>
```

- [ ] **Step 5: Implement "Walk Out" Animation for Links**
Apply the same pattern using `progLinks`. Update text to Chinese.

```tsx
{/* 外部鏈接 */}
<div 
  className="pointer-events-auto flex items-center gap-4 cursor-pointer group"
  style={{ 
    opacity: progLinks,
    transform: `translateX(${(1 - progLinks) * -100}px)`
  }}
  onClick={() => window.open('https://github.com/tinchak0207', '_blank')}
>
  {/* Same structure as above, using #FFCC80 colors and Links SVG */}
  {/* Text: "外部鏈接", Subtext: "/external_uplinks" */}
</div>
```

- [ ] **Step 6: Commit**
```bash
git add src/pages/Home.tsx src/components/Graph.tsx
git commit -m "feat: fix boot animation state and implement phased walk-out HUD layout"
```