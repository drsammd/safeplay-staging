#!/usr/bin/env bash
set -e

echo "Starting PDF regeneration with watermarks, headers, and footers..."
echo "Template: watermark-template.tex"
echo "Target directory: docs-pdf"

# Create output directory
mkdir -p docs-pdf

# Counter for tracking progress
count=0
total=$(find docs -name "*.md" | wc -l)

echo "Found $total markdown files to process"
echo "----------------------------------------"

# Process all markdown files in docs directory and subdirectories
find docs -name "*.md" | while read -r file; do
    count=$((count + 1))
    
    # Get relative path and create corresponding directory structure
    rel_path="${file#docs/}"
    dir_path=$(dirname "$rel_path")
    base_name=$(basename "${file%.*}")
    
    # Create subdirectory if needed
    if [ "$dir_path" != "." ]; then
        mkdir -p "docs-pdf/$dir_path"
        output_file="docs-pdf/$dir_path/$base_name.pdf"
    else
        output_file="docs-pdf/$base_name.pdf"
    fi
    
    echo "[$count/$total] Processing: $file -> $output_file"
    
    # Convert markdown to PDF using our watermark template
    pandoc -s "$file" --template watermark-template.tex -o "$output_file"
    
    if [ $? -eq 0 ]; then
        echo "  ✓ Success: $output_file"
    else
        echo "  ✗ Failed: $file"
    fi
done

echo "----------------------------------------"
echo "PDF regeneration complete!"
echo "Output directory: docs-pdf/"
echo "All files processed with:"
echo "  - CONFIDENTIAL watermark (opacity 0.11, scale 7)"
echo "  - Headers with filename (left) and CONFIDENTIAL (right)"
echo "  - Footers with page numbers (center)"
echo "  - Horizontal separator lines"
