#!/usr/bin/env python3
"""
Photo Hunt - Difference Finder
Automatically detects differences between two images and updates sets.json

Usage:
    python find_differences.py --set 1 --tags outdoor,nature --difficulty easy
    python find_differences.py --set 2 --visualize
    python find_differences.py --help
"""

import cv2
import numpy as np
import json
import argparse
import os
import sys
from pathlib import Path

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent
IMAGES_DIR = PROJECT_ROOT / "images"
DATA_DIR = PROJECT_ROOT / "data"
SETS_JSON = DATA_DIR / "sets.json"


def load_sets_json():
    """Load existing sets.json or create new structure"""
    if SETS_JSON.exists():
        with open(SETS_JSON, 'r') as f:
            return json.load(f)
    return {"sets": []}


def save_sets_json(data):
    """Save data to sets.json with proper formatting"""
    DATA_DIR.mkdir(exist_ok=True)
    with open(SETS_JSON, 'w') as f:
        json.dump(data, f, indent=4)


def find_differences(image1_path, image2_path, min_contour_area=900, merge_distance=50, visualize=False, target_count=5):
    """
    Find differences between two images using computer vision
    
    Args:
        image1_path: Path to first image
        image2_path: Path to second image
        min_contour_area: Minimum area to consider as a difference
        merge_distance: Distance to merge nearby differences
        visualize: Show visual preview of detected differences
        target_count: Target number of differences (default: 5)
        
    Returns:
        List of difference dictionaries with x, y, width, height
    """
    # Validate files exist
    if not os.path.exists(image1_path):
        raise FileNotFoundError(f"Image 1 not found: {image1_path}")
    if not os.path.exists(image2_path):
        raise FileNotFoundError(f"Image 2 not found: {image2_path}")
    
    # Load the images
    image1 = cv2.imread(str(image1_path))
    image2 = cv2.imread(str(image2_path))
    
    if image1 is None:
        raise ValueError(f"Failed to load image: {image1_path}")
    if image2 is None:
        raise ValueError(f"Failed to load image: {image2_path}")
    
    # Check dimensions match
    if image1.shape != image2.shape:
        raise ValueError(
            f"Image dimensions don't match!\n"
            f"  Image 1: {image1.shape}\n"
            f"  Image 2: {image2.shape}"
        )
    
    print(f"✓ Loaded images: {image1.shape[1]}x{image1.shape[0]} pixels")

    # Convert images to grayscale
    gray1 = cv2.cvtColor(image1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(image2, cv2.COLOR_BGR2GRAY)

    # Compute the absolute difference between the two images
    diff = cv2.absdiff(gray1, gray2)

    # Threshold the difference image
    _, thresh = cv2.threshold(diff, 30, 255, cv2.THRESH_BINARY)

    # Dilate the image to merge nearby differences
    kernel = np.ones((merge_distance, merge_distance), np.uint8)
    dilated = cv2.dilate(thresh, kernel, iterations=1)

    # Find contours of the differences
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Get all differences sorted by area (largest first)
    all_differences = []
    for contour in contours:
        area = cv2.contourArea(contour)
        if area >= min_contour_area:
            x, y, w, h = cv2.boundingRect(contour)
            all_differences.append({
                "x": int(x), 
                "y": int(y), 
                "width": int(w), 
                "height": int(h),
                "area": area
            })
    
    # Sort by area (largest first)
    all_differences.sort(key=lambda d: d['area'], reverse=True)
    
    # Remove area field before returning
    differences = [{k: v for k, v in d.items() if k != 'area'} for d in all_differences[:target_count]]
    
    found_count = len(all_differences)
    print(f"✓ Found {found_count} differences (using top {len(differences)})")
    
    # Warn if not exactly target count
    if found_count != target_count:
        if found_count < target_count:
            print(f"⚠ WARNING: Only found {found_count} differences (expected {target_count})")
            print(f"   Try decreasing --min-area or --merge-distance")
        else:
            print(f"⚠ WARNING: Found {found_count} differences (expected {target_count})")
            print(f"   Using the {target_count} largest differences")
            print(f"   Consider increasing --min-area or --merge-distance")
    
    # Visualize if requested
    if visualize and differences:
        visualize_differences(image1, image2, differences)
    
    return differences


def visualize_differences(image1, image2, differences):
    """Show visual preview of detected differences"""
    # Create copies for drawing
    img1_marked = image1.copy()
    img2_marked = image2.copy()
    
    # Draw rectangles on both images
    for i, diff in enumerate(differences, 1):
        x, y, w, h = diff['x'], diff['y'], diff['width'], diff['height']
        cv2.rectangle(img1_marked, (x, y), (x + w, y + h), (0, 255, 0), 3)
        cv2.rectangle(img2_marked, (x, y), (x + w, y + h), (0, 255, 0), 3)
        
        # Add number label
        cv2.putText(img1_marked, str(i), (x + 5, y + 25), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        cv2.putText(img2_marked, str(i), (x + 5, y + 25), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    
    # Resize for display (if images are too large)
    max_height = 800
    if img1_marked.shape[0] > max_height:
        scale = max_height / img1_marked.shape[0]
        new_width = int(img1_marked.shape[1] * scale)
        img1_marked = cv2.resize(img1_marked, (new_width, max_height))
        img2_marked = cv2.resize(img2_marked, (new_width, max_height))
    
    # Stack images side by side
    combined = np.hstack([img1_marked, img2_marked])
    
    # Display
    cv2.imshow('Detected Differences (Press any key to continue)', combined)
    cv2.waitKey(0)
    cv2.destroyAllWindows()


def update_sets_json(set_id, differences, tags=None, difficulty="medium"):
    """
    Update or add a set to sets.json
    
    Args:
        set_id: Set number (integer)
        differences: List of difference dictionaries
        tags: List of tags (default: ["default"])
        difficulty: Difficulty level (easy/medium/hard)
    """
    if tags is None:
        tags = ["default"]
    
    # Load existing data
    data = load_sets_json()
    
    # Create new set entry
    new_set = {
        "id": set_id,
        "image1": f"images/set{set_id}/image1.png",
        "image2": f"images/set{set_id}/image2.png",
        "tags": tags,
        "difficulty": difficulty,
        "differences": differences
    }
    
    # Check if set already exists
    existing_index = None
    for i, s in enumerate(data["sets"]):
        if s["id"] == set_id:
            existing_index = i
            break
    
    if existing_index is not None:
        print(f"⚠ Set {set_id} already exists. Updating...")
        data["sets"][existing_index] = new_set
    else:
        print(f"✓ Adding new set {set_id}")
        data["sets"].append(new_set)
        # Sort by ID
        data["sets"].sort(key=lambda x: x["id"])
    
    # Save
    save_sets_json(data)
    print(f"✓ Successfully saved to {SETS_JSON}")
    
    return new_set


def main():
    parser = argparse.ArgumentParser(
        description='Find differences between two images and update sets.json',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python find_differences.py --set 1 --tags outdoor,nature --difficulty easy
  python find_differences.py --set 2 --visualize
  python find_differences.py --set 3 --min-area 1200 --merge-distance 60
        """
    )
    
    parser.add_argument('--set', type=int, required=True,
                        help='Set number (e.g., 1 for set1)')
    parser.add_argument('--tags', type=str, default='default',
                        help='Comma-separated tags (e.g., "outdoor,nature")')
    parser.add_argument('--difficulty', type=str, default='medium',
                        choices=['easy', 'medium', 'hard'],
                        help='Difficulty level')
    parser.add_argument('--min-area', type=int, default=900,
                        help='Minimum contour area to detect (default: 900)')
    parser.add_argument('--merge-distance', type=int, default=50,
                        help='Distance to merge nearby differences (default: 50)')
    parser.add_argument('--target-count', type=int, default=5,
                        help='Target number of differences (default: 5)')
    parser.add_argument('--visualize', action='store_true',
                        help='Show visual preview of detected differences')
    
    args = parser.parse_args()
    
    # Parse tags
    tags = [tag.strip() for tag in args.tags.split(',')]
    
    # Build image paths
    set_dir = IMAGES_DIR / f"set{args.set}"
    image1_path = set_dir / "image1.png"
    image2_path = set_dir / "image2.png"
    
    print(f"\n{'='*60}")
    print(f"Photo Hunt - Processing Set {args.set}")
    print(f"{'='*60}\n")
    
    # Check if directory exists
    if not set_dir.exists():
        print(f"❌ Error: Directory not found: {set_dir}")
        print(f"   Please create the directory and add image1.png and image2.png")
        sys.exit(1)
    
    try:
        # Find differences
        differences = find_differences(
            image1_path, 
            image2_path,
            min_contour_area=args.min_area,
            merge_distance=args.merge_distance,
            visualize=args.visualize,
            target_count=args.target_count
        )
        
        if not differences:
            print("\n❌ Error: No differences found!")
            print("   Try adjusting --min-area or --merge-distance parameters")
            sys.exit(1)
        
        if len(differences) != args.target_count:
            print(f"\n⚠ Warning: Found {len(differences)} differences (expected {args.target_count})")
            response = input("   Continue anyway? (y/N): ")
            if response.lower() != 'y':
                sys.exit(0)
        
        # Update sets.json
        update_sets_json(
            set_id=args.set,
            differences=differences,
            tags=tags,
            difficulty=args.difficulty
        )
        
        print(f"\n{'='*60}")
        print(f"✓ Set {args.set} processed successfully!")
        print(f"  - Differences found: {len(differences)}")
        print(f"  - Tags: {', '.join(tags)}")
        print(f"  - Difficulty: {args.difficulty}")
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
