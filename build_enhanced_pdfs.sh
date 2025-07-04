
#!/bin/bash

# Enhanced PDF Build Script for mySafePlay Documentation
# Updates all PDFs with new watermark (opacity 0.13), headers with creation dates, and footers with full paths

echo "Starting enhanced PDF generation for mySafePlay documentation..."
echo "Watermark: CONFIDENTIAL (opacity 0.13, scale 7)"
echo "Headers: Creation date (left) + CONFIDENTIAL (right)"
echo "Footers: Full path (left) + Page number (right)"
echo "=========================================="

# Set the base directory
BASE_DIR="/home/ubuntu/safeplay-staging"
DOCS_DIR="$BASE_DIR/docs"
TEMPLATE="$BASE_DIR/enhanced-watermark-template.tex"

# Counter for processed files
count=0
total=0

# First, count total files
total=$(find "$DOCS_DIR" -name "*.md" -type f | wc -l)
echo "Found $total markdown files to process"
echo ""

# Process each markdown file
find "$DOCS_DIR" -name "*.md" -type f | while read -r src_file; do
    count=$((count + 1))
    
    # Get the base name without extension
    base_name=$(basename "$src_file" .md)
    dir_name=$(dirname "$src_file")
    
    # Output PDF path (same directory as source)
    pdf_file="${src_file%.md}.pdf"
    
    # Get file creation date (try %w first, fallback to %y if not available)
    created_date=$(stat -c %w "$src_file" 2>/dev/null)
    if [ "$created_date" = "-" ] || [ -z "$created_date" ]; then
        created_date=$(stat -c %y "$src_file" 2>/dev/null)
    fi
    
    # Format the date nicely (extract just the date part)
    if [ -n "$created_date" ]; then
        formatted_date=$(echo "$created_date" | cut -d' ' -f1)
    else
        formatted_date=$(date +%Y-%m-%d)
    fi
    
    # Get full absolute path for footer
    full_path=$(realpath "$pdf_file")
    
    echo "[$count/$total] Processing: $base_name"
    echo "  Source: $src_file"
    echo "  Output: $pdf_file"
    echo "  Created: $formatted_date"
    echo "  Full path: $full_path"
    
    # Run pandoc with enhanced template and variables
    if pandoc "$src_file" \
        --template="$TEMPLATE" \
        -V created="$formatted_date" \
        -V fullpath="$full_path" \
        --pdf-engine=pdflatex \
        -o "$pdf_file"; then
        echo "  ✓ SUCCESS: Generated $pdf_file"
    else
        echo "  ✗ ERROR: Failed to generate $pdf_file"
    fi
    echo ""
done

echo "=========================================="
echo "Enhanced PDF generation completed!"
echo "All documents now have:"
echo "- Watermark with opacity 0.13 (increased from 0.11)"
echo "- Headers showing creation dates and CONFIDENTIAL"
echo "- Footers showing full document paths and page numbers"
echo "- Horizontal separator lines for headers and footers"
echo "=========================================="
