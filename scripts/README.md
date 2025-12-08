# Photo Hunt - Image Set Processing

Scripts to automatically detect differences between images and manage game sets.

## 📋 Quick Start

### 1. Install Requirements

```powershell
pip install opencv-python numpy
```

### 2. Create Image Sets

Create folders for each set with two images:

```
images/
  set1/
    image1.png
    image2.png
  set2/
    image1.png
    image2.png
  set3/
    image1.png
    image2.png
```

### 3. Process Images

#### Option A: Process Single Set

```powershell
python scripts/find_differences.py --set 1 --tags outdoor,nature --difficulty easy
```

#### Option B: Batch Process All Sets

```powershell
python scripts/batch_process.py
```

### 4. Validate Everything

```powershell
python scripts/validate_sets.py
```

---

## 🛠️ Script Reference

### `find_differences.py` - Single Set Processor

Process individual image sets and detect differences automatically.

**Basic Usage:**
```powershell
python scripts/find_differences.py --set 1
```

**With Options:**
```powershell
python scripts/find_differences.py --set 2 --tags indoor,furniture --difficulty medium --visualize
```

**Parameters:**
- `--set N` - Set number to process (required)
- `--tags` - Comma-separated tags (default: "default")
- `--difficulty` - Difficulty level: easy/medium/hard (default: medium)
- `--min-area` - Minimum difference size in pixels (default: 900)
- `--merge-distance` - Distance to merge nearby differences (default: 50)
- `--visualize` - Show visual preview before saving

**Examples:**
```powershell
# Basic processing
python scripts/find_differences.py --set 3

# With custom tags and difficulty
python scripts/find_differences.py --set 4 --tags beach,vacation --difficulty hard

# Fine-tune detection
python scripts/find_differences.py --set 5 --min-area 1200 --merge-distance 60

# Preview before saving
python scripts/find_differences.py --set 6 --visualize
```

---

### `batch_process.py` - Batch Processor

Process multiple sets automatically. Scans the `images/` folder and processes all unprocessed sets.

**Basic Usage:**
```powershell
python scripts/batch_process.py
```

**Process All Sets (including existing):**
```powershell
python scripts/batch_process.py --force
```

**With Visualization:**
```powershell
python scripts/batch_process.py --visualize
```

**Parameters:**
- `--force` - Reprocess sets already in sets.json
- `--visualize` - Show visual preview for each set
- `--min-area` - Minimum difference size (default: 900)
- `--merge-distance` - Merge distance (default: 50)

**What it does:**
1. Scans `images/` for `setN` folders
2. Checks each folder for `image1.png` and `image2.png`
3. Skips sets already in `sets.json` (unless `--force`)
4. Auto-detects difficulty based on difference count
5. Updates `data/sets.json` automatically

---

### `validate_sets.py` - Validator

Checks your sets for common issues and errors.

**Usage:**
```powershell
python scripts/validate_sets.py
```

**What it checks:**
- ✓ All image files exist
- ✓ No duplicate set IDs
- ✓ Valid difference coordinates
- ✓ Proper difficulty values
- ✓ Orphaned image folders
- ✓ Missing metadata

**Example Output:**
```
✓ Set 1: OK
✓ Set 2: OK
⚠ Set 3: Only 2 difference(s) - may be too easy
❌ Set 4: Image 1 not found: images/set4/image1.png
```

---

## 📁 File Structure

```
photo-hunt/
├── images/                    # Image sets
│   ├── set1/
│   │   ├── image1.png        # First image
│   │   └── image2.png        # Second image (with differences)
│   ├── set2/
│   └── ...
├── data/
│   └── sets.json             # Central configuration (auto-generated)
└── scripts/
    ├── find_differences.py   # Single set processor
    ├── batch_process.py      # Batch processor
    ├── validate_sets.py      # Validator
    └── README.md            # This file
```

---

## 🎮 Workflow Example

### Adding New Sets

**Step 1:** Create images
```
Create: images/set5/image1.png
Create: images/set5/image2.png
```

**Step 2:** Process the set
```powershell
python scripts/find_differences.py --set 5 --tags city,street --difficulty medium --visualize
```

**Step 3:** Validate
```powershell
python scripts/validate_sets.py
```

**Step 4:** Test in game
- Open `index.html` in browser
- Your new set should appear in rotation!

---

### Batch Adding Multiple Sets

**Step 1:** Create multiple image folders
```
images/set5/, set6/, set7/ (each with image1.png & image2.png)
```

**Step 2:** Process all at once
```powershell
python scripts/batch_process.py
```

**Step 3:** Review and validate
```powershell
python scripts/validate_sets.py
```

---

## ⚙️ Fine-Tuning Detection

If the script detects too many or too few differences, adjust these parameters:

### Too Many Differences Found
```powershell
# Increase minimum area (only detect larger differences)
python scripts/find_differences.py --set 1 --min-area 1500

# Increase merge distance (merge nearby differences)
python scripts/find_differences.py --set 1 --merge-distance 80
```

### Too Few Differences Found
```powershell
# Decrease minimum area (detect smaller differences)
python scripts/find_differences.py --set 1 --min-area 600

# Decrease merge distance
python scripts/find_differences.py --set 1 --merge-distance 30
```

### Visual Preview
Always use `--visualize` to see what the script detected before saving:
```powershell
python scripts/find_differences.py --set 1 --visualize
```

---

## 🐛 Troubleshooting

### "Import cv2 could not be resolved"
Install OpenCV:
```powershell
pip install opencv-python
```

### "No differences found"
Your images might be too similar or identical. Try:
1. Use `--visualize` to see detection
2. Reduce `--min-area` to detect smaller differences
3. Check that image2 actually has differences from image1

### "Image dimensions don't match"
Both images must be the same size. Resize one to match the other.

### Script can't find images
Make sure you're running from the project root:
```powershell
cd c:\_websites\photo-hunt
python scripts/find_differences.py --set 1
```

---

## 📊 sets.json Format

The scripts automatically generate and maintain this file:

```json
{
    "sets": [
        {
            "id": 1,
            "image1": "images/set1/image1.png",
            "image2": "images/set1/image2.png",
            "tags": ["outdoor", "nature"],
            "difficulty": "easy",
            "differences": [
                { "x": 268, "y": 1262, "width": 151, "height": 356 },
                { "x": 164, "y": 928, "width": 124, "height": 126 },
                ...
            ]
        }
    ]
}
```

**Don't edit manually** - use the scripts to maintain data integrity!

---

## 🎯 Tips & Best Practices

1. **Create Clear Differences** - Make them obvious but not trivial
2. **Aim for 3-5 Differences** - Sweet spot for gameplay
3. **Use High Resolution** - Minimum 1200x1600 pixels
4. **Match Image Dimensions** - Both images must be identical size
5. **Test in Game** - Always play-test new sets
6. **Use Visualize Mode** - Preview detection before committing
7. **Batch Process** - Process multiple sets in one go

---

## 📝 Need Help?

Run any script with `--help` for detailed information:
```powershell
python scripts/find_differences.py --help
python scripts/batch_process.py --help
python scripts/validate_sets.py --help
```
