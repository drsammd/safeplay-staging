#!/bin/bash

# Robust SafePlay Documentation to PDF Converter with CONFIDENTIAL Watermark
# This script converts all markdown files to PDF with diagonal watermarks (scale=6)

set -e

BASE_DIR="/home/ubuntu/safeplay-staging"
DOCS_DIR="$BASE_DIR/docs"
OUTPUT_DIR="$BASE_DIR/docs-pdf"
TEMPLATE="$BASE_DIR/watermark-template.tex"
INDEX_FILE="$BASE_DIR/index.md"

echo "Starting SafePlay documentation conversion with scale=6 watermark..."
echo "Source: $DOCS_DIR"
echo "Output: $OUTPUT_DIR"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Initialize index file
cat > "$INDEX_FILE" << 'EOF'
# SafePlay Documentation Index

**CONFIDENTIAL**

This document provides an index of all SafePlay application documentation converted to PDF format with security watermarks (scale=6).

Generated: $(date)

---

## Documentation Files

EOF

# Counter for processed files
count=0

# Function to convert a single file with error handling
convert_file() {
    local input_file="$1"
    local output_file="$2"
    local title="$3"
    local rel_path="$4"
    
    echo "Converting: $rel_path"
    
    # Create directory structure in output
    local pdf_dir="$(dirname "$output_file")"
    mkdir -p "$pdf_dir"
    
    # First, preprocess the markdown to remove problematic characters
    local temp_file="/tmp/$(basename "$input_file")"
    
    # Clean up problematic LaTeX characters and checkbox symbols
    sed 's/\$\\square\$/☐/g; s/\\square/☐/g; s/\[\]/☐/g; s/\[x\]/☑/g; s/\[X\]/☑/g' "$input_file" > "$temp_file"
    
    # Try conversion with our watermark template
    if pandoc "$temp_file" \
        -o "$output_file" \
        --pdf-engine=xelatex \
        --template="$TEMPLATE" \
        --variable title="$title" \
        --variable geometry:margin=1in \
        --toc \
        --number-sections \
        --highlight-style=tango \
        2>/dev/null; then
        
        echo "✓ Completed: $output_file"
        rm -f "$temp_file"
        return 0
    else
        echo "Warning: Template conversion failed for $rel_path, trying fallback..."
        
        # Fallback: simpler conversion without template but with inline watermark
        if pandoc "$temp_file" \
            -o "$output_file" \
            --pdf-engine=xelatex \
            --variable title="$title - CONFIDENTIAL" \
            --variable geometry:margin=1in \
            --variable header-includes='\usepackage{tikz} \usepackage{eso-pic} \AddToShipoutPicture{\begin{tikzpicture}[remember picture,overlay] \node[rotate=45,scale=6,text opacity=0.15,gray] at (current page.center) {CONFIDENTIAL}; \end{tikzpicture}} \usepackage{fancyhdr} \pagestyle{fancy} \fancyhead[L]{\textbf{mySafePlay™ Documentation}} \fancyhead[R]{\textbf{CONFIDENTIAL}} \fancyfoot[C]{\thepage}' \
            --toc \
            --number-sections \
            2>/dev/null; then
            
            echo "✓ Completed with fallback: $output_file"
            rm -f "$temp_file"
            return 0
        else
            echo "Error: Could not convert $rel_path"
            rm -f "$temp_file"
            return 1
        fi
    fi
}

# Process all markdown files
find "$DOCS_DIR" -name "*.md" -type f | sort | while read -r md_file; do
    # Calculate relative path from docs directory
    rel_path="${md_file#$DOCS_DIR/}"
    
    # Create corresponding PDF path
    pdf_path="$OUTPUT_DIR/${rel_path%.md}.pdf"
    
    # Extract title from first heading (if exists), clean it up
    title=$(head -20 "$md_file" | grep -E '^#[^#]' | head -1 | sed 's/^#[[:space:]]*//' | sed 's/[&]//g' | sed 's/[📚🔐📧🎧🎮🔌🗄️🚀🔄📞]//g' || echo "$(basename "${md_file%.md}")")
    
    if convert_file "$md_file" "$pdf_path" "$title" "$rel_path"; then
        # Add entry to index
        echo "- **$rel_path** → \`${rel_path%.md}.pdf\`" >> "$INDEX_FILE"
        echo "  - Title: $title" >> "$INDEX_FILE"
        echo "" >> "$INDEX_FILE"
        
        count=$((count + 1))
    fi
done

echo "" >> "$INDEX_FILE"
echo "---" >> "$INDEX_FILE"
echo "" >> "$INDEX_FILE"
echo "**Total Documents Converted:** $count" >> "$INDEX_FILE"
echo "" >> "$INDEX_FILE"
echo "**Security Notice:** All documents contain diagonal CONFIDENTIAL watermarks (scale=6) for security purposes." >> "$INDEX_FILE"
echo "" >> "$INDEX_FILE"
echo "Generated on: $(date)" >> "$INDEX_FILE"

echo "Conversion completed! Processed $count files."
echo "Index file created: $INDEX_FILE"

# Convert the index file itself to PDF
echo "Converting index file to PDF..."
if convert_file "$INDEX_FILE" "$OUTPUT_DIR/SAFEPLAY-PDF-INDEX.pdf" "SafePlay Documentation Index" "index.md"; then
    echo "✓ Index PDF created: $OUTPUT_DIR/SAFEPLAY-PDF-INDEX.pdf"
    count=$((count + 1))
fi

echo "Final count: $count PDFs generated with scale=6 watermarks."
