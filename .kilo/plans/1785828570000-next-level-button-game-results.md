## Implementation Details

### Backend Changes (StudentController.php:357-377)

**Add props:**
```php
$isMaxLevel = $session->module_type === 'word'
    ? WordModule::max('level') === $module->level
    : ParagraphModule::max('level') === $module->level;

return Inertia::render('Student/GameResults', [
    'session' => $session,
    'moduleTitle' => $module->title,
    'totalItems' => $totalItems,
    'badgeProgress' => $badgeProgress,
    'nextModuleId' => $nextModule?->id,
    'isMaxLevel' => $isMaxLevel,  // NEW: indicates at maximum level
]);
```

### Frontend Changes (GameResults.jsx)

**Button group (lines 101-119):**
```jsx
<div className="flex gap-4">
  {/* Again button - always active */}
  <button onClick={() => window.location.href = `/student/${gameUrl}/${session.module_id}`} className="flex-1 ...">
    <span className="material-symbols-outlined mr-2">replay</span>Again
  </button>

  {/* Next Level / Disabled button */}
  {isMaxLevel ? (
    <button disabled className="flex-1 bg-surface-container text-on-surface-variant font-bold py-5 rounded-2xl border border-surface-variant/20 text-base uppercase tracking-wider cursor-not-allowed opacity-50" onClick={() => alert("Level Complete!")}>
      <span className="material-symbols-outlined mr-2" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_forward</span>Next Level
    </button>
  ) : nextModuleId ? (
    <Link href={`/student/${gameUrl}/${nextModuleId}`} className="flex-1 bg-primary text-on-primary font-bold py-5 rounded-2xl border border-surface-variant/20 text-base uppercase tracking-wider active:scale-[0.97] transition-all hover:brightness-110 text-center">
      <span className="material-symbols-outlined mr-2">arrow_forward</span>Next Level
    </Link>
  ) : (
    <Link href="/student/readModeLevels" className="flex-1 bg-surface-container-high text-on-surface font-bold py-5 rounded-2xl border border-surface-variant/20 text-base uppercase tracking-wider active:scale-[0.97] transition-all hover:bg-surface-variant">
      <span className="material-symbols-outlined mr-2">menu_book</span>Levels
    </Link>
  )}

  {/* Home button - always active */}
  <Link href="/student/dashboard" className="flex-1 bg-surface-container-high text-on-surface font-bold py-5 rounded-2xl border border-surface-variant/20 text-base uppercase tracking-wider active:scale-[0.97] transition-all hover:bg-surface-variant text-center">
    <span className="material-symbols-outlined mr-2">home</span>Home
  </Link>
</div>
```

## Files Changed
- `app/Http/Controllers/StudentController.php:357-377` - add `nextModuleId` and `isMaxLevel` props
- `resources/js/Pages/Student/GameResults.jsx:101-119` - 3-button layout with conditional Next Level

## Edge Cases
- Maximum level reached: Next Level button disabled with alert "Level Complete!"
- Tutorial modules: excluded from level progression logic