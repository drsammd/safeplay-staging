#!/bin/bash

# Simple SafePlay Documentation to PDF Converter
set -e

BASE_DIR="/home/ubuntu/safeplay-staging"
DOCS_DIR="$BASE_DIR/docs"
OUTPUT_DIR="$BASE_DIR/docs-pdf"
INDEX_FILE="$BASE_DIR/index.md"

echo "Starting SafePlay documentation conversion..."
echo "Source: $DOCS_DIR"
echo "Output: $OUTPUT_DIR"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Initialize index file
cat > "$INDEX_FILE" << 'EOF'
# SafePlay Documentation Index

**CONFIDENTIAL**

This document provides an index of all SafePlay application documentation converted to PDF format with security watermarks.

## Documentation Files

EOF

# Counter for processed files
count=0

# Process README.md first
echo "Converting: README.md"
pandoc "$DOCS_DIR/README.md" \
    -o "$OUTPUT_DIR/README.pdf" \
    --pdf-engine=xelatex \
    --variable title="SafePlay Application Documentation" \
    --variable geometry:margin=1in \
    --toc \
    --number-sections \
    --highlight-style=tango \
    -V header-includes:'\usepackage{draftwatermark} \SetWatermarkText{CONFIDENTIAL} \SetWatermarkScale{3} \SetWatermarkAngle{45} \SetWatermarkLightness{0.9}'

echo "✓ Completed: README.pdf"
echo "- **README.md** → \`README.pdf\`" >> "$INDEX_FILE"
echo "  - Title: SafePlay Application Documentation" >> "$INDEX_FILE"
echo "" >> "$INDEX_FILE"
count=$((count + 1))

# Process subdirectories
for subdir in api database demo deployment email security support; do
    if [ -d "$DOCS_DIR/$subdir" ]; then
        echo "Processing directory: $subdir"
        mkdir -p "$OUTPUT_DIR/$subdir"
        
        for md_file in "$DOCS_DIR/$subdir"/*.md; do
            if [ -f "$md_file" ]; then
                filename=$(basename "$md_file" .md)
                rel_path="$subdir/$filename.md"
                
                echo "Converting: $rel_path"
                
                # Extract title from first heading
                title=$(head -20 "$md_file" | grep -E '^#[^#]' | head -1 | sed 's/^#[[:space:]]*//' || echo "$filename")
                
                # Convert to PDF
                pandoc "$md_file" \
                    -o "$OUTPUT_DIR/$subdir/$filename.pdf" \
                    --pdf-engine=xelatex \
                    --variable title="$title" \
                    --variable geometry:margin=1in \
                    --toc \
                    --number-sections \
                    --highlight-style=tango \
                    -V header-includes:'\usepackage{draftwatermark} \SetWatermarkText{CONFIDENTIAL} \SetWatermarkScale{3} \SetWatermarkAngle{45} \SetWatermarkLightness{0.9}'
                
                echo "✓ Completed: $subdir/$filename.pdf"
                echo "- **$rel_path** → \`$subdir/$filename.pdf\`" >> "$INDEX_FILE"
                echo "  - Title: $title" >> "$INDEX_FILE"
                echo "" >> "$INDEX_FILE"
                count=$((count + 1))
            fi
        done
    fi
done

echo "" >> "$INDEX_FILE"
echo "---" >> "$INDEX_FILE"
echo "" >> "$INDEX_FILE"
echo "**Total Documents Converted:** $count" >> "$INDEX_FILE"
echo "" >> "$INDEX_FILE"
echo "**Security Notice:** All documents contain diagonal CONFIDENTIAL watermarks for security purposes." >> "$INDEX_FILE"

echo "Conversion completed! Processed $count files."
echo "Index file created: $INDEX_FILE"
