
#!/bin/bash

# SafePlay Documentation to PDF Converter with CONFIDENTIAL Watermark
# This script converts all markdown files to PDF with diagonal watermarks

set -e

BASE_DIR="/home/ubuntu/safeplay-staging"
DOCS_DIR="$BASE_DIR/docs"
OUTPUT_DIR="$BASE_DIR/docs-pdf"
TEMPLATE="$BASE_DIR/watermark-template.tex"
INDEX_FILE="$BASE_DIR/index.md"

echo "Starting SafePlay documentation conversion..."
echo "Source: $DOCS_DIR"
echo "Output: $OUTPUT_DIR"

# Initialize index file
cat > "$INDEX_FILE" << 'EOF'
# SafePlay Documentation Index

**CONFIDENTIAL**

This document provides an index of all SafePlay application documentation converted to PDF format with security watermarks.

Generated: $(date)

---

## Documentation Files

EOF

# Counter for processed files
count=0

# Find all markdown files and process them
find "$DOCS_DIR" -name "*.md" -type f | sort | while read -r md_file; do
    # Calculate relative path from docs directory
    rel_path="${md_file#$DOCS_DIR/}"
    
    # Create corresponding PDF path
    pdf_path="$OUTPUT_DIR/${rel_path%.md}.pdf"
    
    # Create directory structure in output
    pdf_dir="$(dirname "$pdf_path")"
    mkdir -p "$pdf_dir"
    
    echo "Converting: $rel_path"
    
    # Extract title from first heading (if exists)
    title=$(head -20 "$md_file" | grep -E '^#[^#]' | head -1 | sed 's/^#[[:space:]]*//' || echo "$(basename "${md_file%.md}")")
    
    # Convert markdown to PDF with watermark template
    pandoc "$md_file" \
        -o "$pdf_path" \
        --pdf-engine=xelatex \
        --template="$TEMPLATE" \
        --variable title="$title" \
        --variable geometry:margin=1in \
        --toc \
        --number-sections \
        --highlight-style=tango \
        --verbose
    
    # Add entry to index
    echo "- **$rel_path** → \`${rel_path%.md}.pdf\`" >> "$INDEX_FILE"
    echo "  - Title: $title" >> "$INDEX_FILE"
    echo "" >> "$INDEX_FILE"
    
    count=$((count + 1))
    echo "✓ Completed: $pdf_path"
done

echo "" >> "$INDEX_FILE"
echo "---" >> "$INDEX_FILE"
echo "" >> "$INDEX_FILE"
echo "**Total Documents Converted:** $count" >> "$INDEX_FILE"
echo "" >> "$INDEX_FILE"
echo "**Security Notice:** All documents contain diagonal CONFIDENTIAL watermarks for security purposes." >> "$INDEX_FILE"

echo "Conversion completed! Processed $count files."
echo "Index file created: $INDEX_FILE"
