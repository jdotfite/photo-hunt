#!/usr/bin/env python3
"""
Photo Hunt - Batch Processor
Automatically processes all image sets in the images/ directory

Usage:
    python batch_process.py
    python batch_process.py --visualize
    python batch_process.py --force  # Reprocess existing sets
"""

import argparse
import sys
from pathlib import Path
from find_differences import (
    load_sets_json, 
    find_differences, 
    update_sets_json,
    PROJECT_ROOT,
    IMAGES_DIR
)


def get_existing_set_ids():
    """Get list of set IDs already in sets.json"""
    data = load_sets_json()
    return {s["id"] for s in data.get("sets", [])}


def find_all_sets():
    """Find all setN directories in images/"""
    if not IMAGES_DIR.exists():
        return []
    
    sets = []
    for item in IMAGES_DIR.iterdir():
        if item.is_dir() and item.name.startswith('set'):
            try:
                # Extract set number from 'setN'
                set_num = int(item.name[3:])
                
                # Check if both images exist
                img1 = item / "image1.png"
                img2 = item / "image2.png"
                
                if img1.exists() and img2.exists():
                    sets.append(set_num)
                else:
                    missing = []
                    if not img1.exists():
                        missing.append("image1.png")
                    if not img2.exists():
                        missing.append("image2.png")
                    print(f"⚠ Skipping set{set_num}: Missing {', '.join(missing)}")
            except ValueError:
                print(f"⚠ Skipping {item.name}: Invalid set name format")
    
    return sorted(sets)


def process_set(set_id, min_area=900, merge_distance=50, visualize=False):
    """Process a single set and return result"""
    set_dir = IMAGES_DIR / f"set{set_id}"
    image1_path = set_dir / "image1.png"
    image2_path = set_dir / "image2.png"
    
    try:
        print(f"\n  Processing set {set_id}...", end=" ")
        
        differences = find_differences(
            image1_path,
            image2_path,
            min_contour_area=min_area,
            merge_distance=merge_distance,
            visualize=visualize
        )
        
        if not differences:
            print("⚠ No differences found!")
            return {
                "set_id": set_id,
                "status": "warning",
                "differences": 0,
                "message": "No differences detected"
            }
        
        # Auto-detect tags based on folder (you can enhance this)
        tags = ["default"]
        
        # Auto-detect difficulty based on number of differences
        if len(differences) <= 3:
            difficulty = "easy"
        elif len(differences) <= 5:
            difficulty = "medium"
        else:
            difficulty = "hard"
        
        update_sets_json(set_id, differences, tags, difficulty)
        
        print(f"✓ {len(differences)} differences found")
        
        return {
            "set_id": set_id,
            "status": "success",
            "differences": len(differences),
            "difficulty": difficulty
        }
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return {
            "set_id": set_id,
            "status": "error",
            "differences": 0,
            "message": str(e)
        }


def main():
    parser = argparse.ArgumentParser(
        description='Batch process all image sets',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python batch_process.py              # Process only new sets
  python batch_process.py --force      # Reprocess all sets
  python batch_process.py --visualize  # Show previews
        """
    )
    
    parser.add_argument('--force', action='store_true',
                        help='Reprocess sets that already exist in sets.json')
    parser.add_argument('--visualize', action='store_true',
                        help='Show visual preview of detected differences')
    parser.add_argument('--min-area', type=int, default=900,
                        help='Minimum contour area to detect (default: 900)')
    parser.add_argument('--merge-distance', type=int, default=50,
                        help='Distance to merge nearby differences (default: 50)')
    
    args = parser.parse_args()
    
    print(f"\n{'='*60}")
    print(f"Photo Hunt - Batch Processor")
    print(f"{'='*60}\n")
    
    # Find all sets
    all_sets = find_all_sets()
    
    if not all_sets:
        print("❌ No image sets found in images/ directory")
        print("   Create folders like images/set1/, images/set2/, etc.")
        print("   Each folder should contain image1.png and image2.png")
        sys.exit(1)
    
    print(f"Found {len(all_sets)} image set(s): {all_sets}")
    
    # Get existing sets
    existing_sets = get_existing_set_ids()
    
    # Determine which sets to process
    if args.force:
        to_process = all_sets
        print(f"Force mode: Processing all {len(to_process)} set(s)")
    else:
        to_process = [s for s in all_sets if s not in existing_sets]
        if not to_process:
            print(f"\n✓ All sets already processed!")
            print(f"  Use --force to reprocess existing sets")
            sys.exit(0)
        print(f"Processing {len(to_process)} new set(s): {to_process}")
    
    # Process each set
    print(f"\n{'='*60}")
    results = []
    for set_id in to_process:
        result = process_set(
            set_id,
            min_area=args.min_area,
            merge_distance=args.merge_distance,
            visualize=args.visualize
        )
        results.append(result)
    
    # Summary report
    print(f"\n{'='*60}")
    print(f"BATCH PROCESSING COMPLETE")
    print(f"{'='*60}\n")
    
    success_count = sum(1 for r in results if r["status"] == "success")
    warning_count = sum(1 for r in results if r["status"] == "warning")
    error_count = sum(1 for r in results if r["status"] == "error")
    
    print(f"✓ Successfully processed: {success_count}")
    if warning_count > 0:
        print(f"⚠ Warnings: {warning_count}")
    if error_count > 0:
        print(f"❌ Errors: {error_count}")
    
    # Detailed results
    if results:
        print(f"\nDetailed Results:")
        for r in results:
            status_icon = {
                "success": "✓",
                "warning": "⚠",
                "error": "❌"
            }.get(r["status"], "?")
            
            if r["status"] == "success":
                print(f"  {status_icon} Set {r['set_id']}: {r['differences']} differences ({r['difficulty']})")
            else:
                print(f"  {status_icon} Set {r['set_id']}: {r.get('message', 'Unknown error')}")
    
    print(f"\n{'='*60}\n")
    
    if error_count > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
