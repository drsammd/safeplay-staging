#!/bin/bash

# Robust SafePlay Documentation to PDF Converter
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

# Function to convert a single file
convert_file() {
    local input_file="$1"
    local output_file="$2"
    local title="$3"
    
    echo "Converting: $(basename "$input_file")"
    
    # Use a simpler pandoc command that's more reliable
    pandoc "$input_file" \
        -o "$output_file" \
        --pdf-engine=xelatex \
        --variable title="$title - CONFIDENTIAL" \
        --variable geometry:margin=1in \
        --variable fontsize=11pt \
        --variable documentclass=article \
        --variable header-includes='\usepackage{draftwatermark} \SetWatermarkText{CONFIDENTIAL} \SetWatermarkScale{2.5} \SetWatermarkAngle{45} \SetWatermarkLightness{0.85} \usepackage{fancyhdr} \pagestyle{fancy} \fancyhead[L]{SafePlay Documentation} \fancyhead[R]{CONFIDENTIAL} \fancyfoot[C]{\thepage}' \
        --toc \
        --number-sections \
        2>/dev/null || {
            echo "Warning: Failed to convert $input_file, trying simpler approach..."
            pandoc "$input_file" \
                -o "$output_file" \
                --pdf-engine=xelatex \
                --variable title="$title - CONFIDENTIAL" \
                --variable geometry:margin=1in \
                --variable header-includes='\usepackage{draftwatermark} \SetWatermarkText{CONFIDENTIAL} \SetWatermarkScale{2.5} \SetWatermarkAngle{45} \SetWatermarkLightness{0.85}' \
                2>/dev/null || {
                echo "Error: Could not convert $input_file"
                return 1
            }
        }
    
    echo "✓ Completed: $(basename "$output_file")"
    return 0
}

# Process README.md first
if convert_file "$DOCS_DIR/README.md" "$OUTPUT_DIR/README.pdf" "SafePlay Application Documentation"; then
    echo "- **README.md** → \`README.pdf\`" >> "$INDEX_FILE"
    echo "  - Title: SafePlay Application Documentation" >> "$INDEX_FILE"
    echo "" >> "$INDEX_FILE"
    count=$((count + 1))
fi

# Process subdirectories
for subdir in api database demo deployment email security support; do
    if [ -d "$DOCS_DIR/$subdir" ]; then
        echo "Processing directory: $subdir"
        mkdir -p "$OUTPUT_DIR/$subdir"
        
        for md_file in "$DOCS_DIR/$subdir"/*.md; do
            if [ -f "$md_file" ]; then
                filename=$(basename "$md_file" .md)
                rel_path="$subdir/$filename.md"
                
                # Extract title from first heading, clean it up
                title=$(head -20 "$md_file" | grep -E '^#[^#]' | head -1 | sed 's/^#[[:space:]]*//' | sed 's/[&]//g' | sed 's/[📚🔐📧🎧🎮🔌🗄️🚀🔄📞]//g' || echo "$filename")
                
                if convert_file "$md_file" "$OUTPUT_DIR/$subdir/$filename.pdf" "$title"; then
                    echo "- **$rel_path** → \`$subdir/$filename.pdf\`" >> "$INDEX_FILE"
                    echo "  - Title: $title" >> "$INDEX_FILE"
                    echo "" >> "$INDEX_FILE"
                    count=$((count + 1))
                fi
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
echo "" >> "$INDEX_FILE"
echo "Generated on: $(date)" >> "$INDEX_FILE"

echo "Conversion completed! Processed $count files."
echo "Index file created: $INDEX_FILE"
