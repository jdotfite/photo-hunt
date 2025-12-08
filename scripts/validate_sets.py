#!/usr/bin/env python3
"""
Photo Hunt - Set Validator
Validates all image sets and checks for issues

Usage:
    python validate_sets.py
    python validate_sets.py --fix  # Auto-fix some issues
"""

import argparse
import json
import sys
from pathlib import Path
from find_differences import load_sets_json, PROJECT_ROOT, IMAGES_DIR, SETS_JSON


class ValidationIssue:
    def __init__(self, severity, set_id, issue_type, message):
        self.severity = severity  # 'error', 'warning', 'info'
        self.set_id = set_id
        self.issue_type = issue_type
        self.message = message
    
    def __str__(self):
        icons = {
            'error': '❌',
            'warning': '⚠',
            'info': 'ℹ'
        }
        icon = icons.get(self.severity, '?')
        return f"{icon} Set {self.set_id}: {self.message}"


def validate_image_files(data):
    """Check if all referenced image files exist"""
    issues = []
    
    for set_entry in data.get("sets", []):
        set_id = set_entry.get("id", "?")
        
        # Check image1
        img1_path = PROJECT_ROOT / set_entry.get("image1", "")
        if not img1_path.exists():
            issues.append(ValidationIssue(
                'error', set_id, 'missing_file',
                f"Image 1 not found: {set_entry.get('image1')}"
            ))
        
        # Check image2
        img2_path = PROJECT_ROOT / set_entry.get("image2", "")
        if not img2_path.exists():
            issues.append(ValidationIssue(
                'error', set_id, 'missing_file',
                f"Image 2 not found: {set_entry.get('image2')}"
            ))
    
    return issues


def validate_differences(data):
    """Check difference coordinates"""
    issues = []
    
    for set_entry in data.get("sets", []):
        set_id = set_entry.get("id", "?")
        differences = set_entry.get("differences", [])
        
        # Check if differences exist
        if not differences:
            issues.append(ValidationIssue(
                'error', set_id, 'no_differences',
                "No differences defined"
            ))
            continue
        
        # Check difference count (typical game has 3-7 differences)
        if len(differences) < 2:
            issues.append(ValidationIssue(
                'warning', set_id, 'few_differences',
                f"Only {len(differences)} difference(s) - may be too easy"
            ))
        elif len(differences) > 10:
            issues.append(ValidationIssue(
                'warning', set_id, 'many_differences',
                f"{len(differences)} differences - may be too hard"
            ))
        
        # Check each difference
        for i, diff in enumerate(differences, 1):
            # Check required fields
            required = ['x', 'y', 'width', 'height']
            missing = [f for f in required if f not in diff]
            if missing:
                issues.append(ValidationIssue(
                    'error', set_id, 'invalid_difference',
                    f"Difference {i} missing fields: {', '.join(missing)}"
                ))
            
            # Check for negative or zero values
            if diff.get('x', 0) < 0 or diff.get('y', 0) < 0:
                issues.append(ValidationIssue(
                    'error', set_id, 'invalid_coords',
                    f"Difference {i} has negative coordinates"
                ))
            
            if diff.get('width', 0) <= 0 or diff.get('height', 0) <= 0:
                issues.append(ValidationIssue(
                    'error', set_id, 'invalid_size',
                    f"Difference {i} has invalid size (width/height <= 0)"
                ))
    
    return issues


def validate_metadata(data):
    """Check set metadata (tags, difficulty, etc.)"""
    issues = []
    
    valid_difficulties = ['easy', 'medium', 'hard']
    
    for set_entry in data.get("sets", []):
        set_id = set_entry.get("id", "?")
        
        # Check difficulty
        difficulty = set_entry.get("difficulty", "")
        if not difficulty:
            issues.append(ValidationIssue(
                'warning', set_id, 'missing_difficulty',
                "No difficulty specified"
            ))
        elif difficulty not in valid_difficulties:
            issues.append(ValidationIssue(
                'warning', set_id, 'invalid_difficulty',
                f"Invalid difficulty '{difficulty}' (should be: easy/medium/hard)"
            ))
        
        # Check tags
        tags = set_entry.get("tags", [])
        if not tags:
            issues.append(ValidationIssue(
                'info', set_id, 'no_tags',
                "No tags specified"
            ))
    
    return issues


def validate_set_ids(data):
    """Check for duplicate or invalid set IDs"""
    issues = []
    seen_ids = set()
    
    for set_entry in data.get("sets", []):
        set_id = set_entry.get("id")
        
        # Check if ID exists
        if set_id is None:
            issues.append(ValidationIssue(
                'error', '?', 'missing_id',
                "Set missing ID field"
            ))
            continue
        
        # Check for duplicates
        if set_id in seen_ids:
            issues.append(ValidationIssue(
                'error', set_id, 'duplicate_id',
                f"Duplicate set ID: {set_id}"
            ))
        seen_ids.add(set_id)
        
        # Check if ID is positive integer
        if not isinstance(set_id, int) or set_id < 1:
            issues.append(ValidationIssue(
                'error', set_id, 'invalid_id',
                f"Invalid set ID: {set_id} (should be positive integer)"
            ))
    
    return issues


def check_orphaned_folders():
    """Check for image folders not in sets.json"""
    issues = []
    
    if not IMAGES_DIR.exists():
        return issues
    
    data = load_sets_json()
    existing_ids = {s.get("id") for s in data.get("sets", [])}
    
    for item in IMAGES_DIR.iterdir():
        if item.is_dir() and item.name.startswith('set'):
            try:
                set_num = int(item.name[3:])
                if set_num not in existing_ids:
                    # Check if images exist
                    img1 = item / "image1.png"
                    img2 = item / "image2.png"
                    if img1.exists() and img2.exists():
                        issues.append(ValidationIssue(
                            'warning', set_num, 'orphaned_folder',
                            f"Folder exists but not in sets.json (run batch_process.py)"
                        ))
            except ValueError:
                pass
    
    return issues


def print_report(issues):
    """Print validation report"""
    if not issues:
        print(f"\n✓ All validation checks passed!\n")
        return
    
    # Group by severity
    errors = [i for i in issues if i.severity == 'error']
    warnings = [i for i in issues if i.severity == 'warning']
    infos = [i for i in issues if i.severity == 'info']
    
    # Print summary
    print(f"\n{'='*60}")
    print(f"VALIDATION REPORT")
    print(f"{'='*60}\n")
    print(f"Total Issues Found: {len(issues)}")
    print(f"  ❌ Errors: {len(errors)}")
    print(f"  ⚠  Warnings: {len(warnings)}")
    print(f"  ℹ  Info: {len(infos)}")
    
    # Print errors
    if errors:
        print(f"\n{'='*60}")
        print(f"ERRORS (must be fixed)")
        print(f"{'='*60}")
        for issue in errors:
            print(f"  {issue}")
    
    # Print warnings
    if warnings:
        print(f"\n{'='*60}")
        print(f"WARNINGS (should be reviewed)")
        print(f"{'='*60}")
        for issue in warnings:
            print(f"  {issue}")
    
    # Print info
    if infos:
        print(f"\n{'='*60}")
        print(f"INFORMATION")
        print(f"{'='*60}")
        for issue in infos:
            print(f"  {issue}")
    
    print(f"\n{'='*60}\n")


def main():
    parser = argparse.ArgumentParser(
        description='Validate Photo Hunt image sets',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument('--fix', action='store_true',
                        help='Auto-fix some issues (future feature)')
    
    args = parser.parse_args()
    
    print(f"\n{'='*60}")
    print(f"Photo Hunt - Set Validator")
    print(f"{'='*60}\n")
    
    # Check if sets.json exists
    if not SETS_JSON.exists():
        print(f"❌ Error: {SETS_JSON} not found!")
        print(f"   Run batch_process.py to create it")
        sys.exit(1)
    
    print(f"Loading {SETS_JSON}...", end=" ")
    data = load_sets_json()
    set_count = len(data.get("sets", []))
    print(f"✓ {set_count} set(s) found\n")
    
    # Run validations
    print("Running validation checks...")
    all_issues = []
    
    print("  • Checking set IDs...", end=" ")
    issues = validate_set_ids(data)
    all_issues.extend(issues)
    print(f"{'✓' if not issues else f'{len(issues)} issue(s)'}")
    
    print("  • Checking image files...", end=" ")
    issues = validate_image_files(data)
    all_issues.extend(issues)
    print(f"{'✓' if not issues else f'{len(issues)} issue(s)'}")
    
    print("  • Checking differences...", end=" ")
    issues = validate_differences(data)
    all_issues.extend(issues)
    print(f"{'✓' if not issues else f'{len(issues)} issue(s)'}")
    
    print("  • Checking metadata...", end=" ")
    issues = validate_metadata(data)
    all_issues.extend(issues)
    print(f"{'✓' if not issues else f'{len(issues)} issue(s)'}")
    
    print("  • Checking for orphaned folders...", end=" ")
    issues = check_orphaned_folders()
    all_issues.extend(issues)
    print(f"{'✓' if not issues else f'{len(issues)} issue(s)'}")
    
    # Print report
    print_report(all_issues)
    
    # Exit with error code if errors found
    error_count = sum(1 for i in all_issues if i.severity == 'error')
    if error_count > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
