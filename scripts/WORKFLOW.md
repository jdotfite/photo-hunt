# Photo Hunt - Workflow Diagram

## 📊 Complete Workflow

```
┌─────────────────────────────────────────────────────────┐
│                   SETUP (One Time)                      │
├─────────────────────────────────────────────────────────┤
│  1. Install Python packages:                            │
│     pip install -r scripts/requirements.txt             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              ADDING NEW IMAGE SETS                      │
└─────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────┴──────────────────┐
        ↓                                     ↓
┌──────────────────┐              ┌──────────────────────┐
│  Single Set      │              │  Multiple Sets       │
├──────────────────┤              ├──────────────────────┤
│ Create:          │              │ Create:              │
│ images/setN/     │              │ images/set2/         │
│   image1.png     │              │ images/set3/         │
│   image2.png     │              │ images/set4/         │
│                  │              │ (each with images)   │
└──────────────────┘              └──────────────────────┘
        ↓                                     ↓
┌──────────────────┐              ┌──────────────────────┐
│ python find_     │              │ python batch_        │
│ differences.py   │              │ process.py           │
│ --set N          │              │                      │
│ --tags ...       │              │ (auto-processes all) │
│ --visualize      │              │                      │
└──────────────────┘              └──────────────────────┘
        └─────────────────┬──────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              VALIDATION & TESTING                       │
├─────────────────────────────────────────────────────────┤
│  python validate_sets.py                                │
│  ✓ Check all files exist                               │
│  ✓ Validate coordinates                                │
│  ✓ Check metadata                                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              PLAY & ENJOY                               │
├─────────────────────────────────────────────────────────┤
│  Open index.html in browser                             │
│  New sets automatically available!                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Script Interactions

```
┌─────────────────┐
│  Your Images    │
│  images/setN/   │
└────────┬────────┘
         ↓
┌─────────────────┐      ┌─────────────────┐
│ find_           │      │ batch_          │
│ differences.py  │─────→│ process.py      │
│                 │      │ (uses find_     │
│ • Detects diffs │      │  differences)   │
│ • Updates JSON  │      └─────────────────┘
└────────┬────────┘
         ↓
┌─────────────────┐
│  sets.json      │←─────┐
│  (Central DB)   │      │
└────────┬────────┘      │
         ↓               │
┌─────────────────┐      │
│ validate_       │      │
│ sets.py         │──────┘
│                 │
│ • Checks files  │
│ • Validates     │
│ • Reports       │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Game           │
│  (loads sets    │
│   from JSON)    │
└─────────────────┘
```

---

## 📝 Data Flow

```
Images (PNG files)
       ↓
[Computer Vision Detection]
       ↓
Difference Coordinates (x, y, width, height)
       ↓
sets.json (Central Database)
       ↓
Game JavaScript (loads & displays)
       ↓
Player sees differences!
```

---

## 🎯 Decision Tree: Which Script to Use?

```
START: Do you need to add image sets?
│
├─ YES → How many sets?
│        │
│        ├─ One set
│        │  └─→ Use: find_differences.py --set N --visualize
│        │
│        └─ Multiple sets
│           └─→ Use: batch_process.py
│
├─ NO → Want to check for problems?
│       │
│       └─ YES
│          └─→ Use: validate_sets.py
│
└─ Just want to play?
   └─→ Open: index.html
```

---

## 🔧 Parameter Selection Guide

```
Detection Quality

Too many differences? ──→ Increase --min-area (900 → 1500)
                     └──→ Increase --merge-distance (50 → 80)

Too few differences? ───→ Decrease --min-area (900 → 600)
                    └───→ Decrease --merge-distance (50 → 30)

Perfect! ───────────────→ Use defaults or save your settings
```

---

## 📋 Status Indicators

### ✅ Success Indicators
- `✓` - Check passed
- Green text - All good
- "Successfully processed" - No errors

### ⚠️ Warning Indicators
- `⚠` - Review needed
- Yellow text - May need attention
- "Warning" - Not critical but check it

### ❌ Error Indicators
- `❌` - Must fix
- Red text - Critical issue
- "Error" - Will prevent operation

---

## 🚦 Typical Session Flow

```
1. CREATE
   mkdir images/set6
   copy images to set6/

2. PROCESS
   python find_differences.py --set 6 --visualize
   [Preview opens, looks good]

3. VALIDATE
   python validate_sets.py
   ✓ All validation checks passed!

4. TEST
   Open index.html
   Play set 6 - works perfectly!

5. DEPLOY
   Commit to git / Deploy to server
   Done! 🎉
```

---

## 💾 File Management

```
YOUR WORKFLOW                    WHAT SCRIPTS DO
─────────────────               ─────────────────
Create PNG files        →       Read images
                                Detect differences
                                ↓
                                Write to sets.json
                                ↓
Validate (optional)     ←       Read sets.json
                                Check everything
                                Report issues
                                ↓
Play game              ←       Load sets.json
                                Display images
                                Track clicks
```

---

## 🎮 Game Integration

```
sets.json Structure:
{
  "sets": [
    {
      "id": 1,
      "image1": "images/set1/image1.png",    ← Game loads these
      "image2": "images/set1/image2.png",    ← Game loads these
      "tags": ["outdoor", "nature"],
      "difficulty": "easy",
      "differences": [                        ← Game checks clicks
        {"x": 268, "y": 1262, "w": 151, "h": 356},
        ...
      ]
    }
  ]
}

Game Logic:
1. Fetch sets.json
2. Shuffle sets randomly
3. Display current set's images
4. Wait for player clicks
5. Check if click is inside any difference box
6. If yes → Mark found, play success sound
7. If no → Shake screen, deduct time
8. When all found → Next set!
```

---

## 🎨 Visual Reference

```
BEFORE (Manual):                 AFTER (Automated):
─────────────────               ─────────────────
1. Create images                1. Create images
2. Open both in editor          2. Run script ✨
3. Find differences manually        - Auto-detects
4. Measure coordinates              - Auto-calculates
5. Write JSON manually              - Auto-updates JSON
6. Test in game                 3. Validate ✨
7. Fix mistakes                 4. Play! 🎮
8. Repeat...

Time: ~30-60 min per set        Time: ~30 seconds per set
Error-prone: Yes                Error-prone: No
Fun: Not really                 Fun: Much better!
```

---

**You now have a professional, automated workflow! 🚀**
