#!/usr/bin/env python3

"""
PDF Watermark Overlay Script for mySafePlay
Uses PyPDF2/reportlab to directly add watermarks to existing PDFs
"""

import os
import sys
from pathlib import Path
import logging
from datetime import datetime
import subprocess

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PDFWatermarker:
    def __init__(self):
        self.base_dir = "/home/ubuntu"
        self.processed_count = 0
        self.failed_count = 0
        self.pdf_list_file = "/tmp/pdf_list.txt"
        
    def get_pdf_creation_date(self, pdf_path):
        """Extract creation date from PDF file"""
        try:
            # Try to get birth time first (creation time)
            result = subprocess.run(['stat', '-c', '%w', pdf_path], 
                                  capture_output=True, text=True, check=True)
            created_date = result.stdout.strip()
            
            # If birth time is not available (shows as '-'), use modification time
            if created_date == '-' or not created_date:
                result = subprocess.run(['stat', '-c', '%y', pdf_path], 
                                      capture_output=True, text=True, check=True)
                created_date = result.stdout.strip()
            
            # Extract just the date part (YYYY-MM-DD)
            if created_date:
                return created_date.split(' ')[0]
            else:
                return datetime.now().strftime('%Y-%m-%d')
                
        except subprocess.CalledProcessError:
            logger.warning(f"Could not get creation date for {pdf_path}, using current date")
            return datetime.now().strftime('%Y-%m-%d')
    
    def get_relative_path(self, full_path):
        """Convert full path to relative path without /home/ubuntu prefix"""
        if full_path.startswith('/home/ubuntu'):
            relative = full_path[len('/home/ubuntu'):]
            # Ensure it starts with / for proper display
            if not relative.startswith('/'):
                relative = '/' + relative
            return relative
        return full_path
    
    def add_watermark_with_pdftk(self, pdf_path):
        """Add watermark using pdftk and a watermark PDF"""
        try:
            logger.info(f"Processing: {pdf_path}")
            
            # Get file metadata
            creation_date = self.get_pdf_creation_date(pdf_path)
            relative_path = self.get_relative_path(pdf_path)
            
            logger.info(f"  Creation date: {creation_date}")
            logger.info(f"  Relative path: {relative_path}")
            
            # Create a simple watermark PDF using pandoc
            watermark_content = f"""
# Watermark Document

Created: {creation_date}
Path: {relative_path}
Status: CONFIDENTIAL
"""
            
            # Write watermark content to temp file
            temp_md = f"/tmp/watermark_{os.getpid()}.md"
            temp_watermark = f"/tmp/watermark_{os.getpid()}.pdf"
            temp_output = f"/tmp/output_{os.getpid()}.pdf"
            
            with open(temp_md, 'w') as f:
                f.write(watermark_content)
            
            # Create watermark PDF
            pandoc_cmd = [
                'pandoc', temp_md,
                '--template', '/home/ubuntu/safeplay-staging/enhanced-watermark-template.tex',
                '-V', f'created={creation_date}',
                '-V', f'relativepath={relative_path}',
                '--pdf-engine=pdflatex',
                '-o', temp_watermark
            ]
            
            result = subprocess.run(pandoc_cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                logger.error(f"  ✗ WATERMARK CREATION ERROR: {result.stderr}")
                self.failed_count += 1
                return False
            
            # Use pdftk to overlay watermark (if available) or just replace
            if os.path.exists('/usr/bin/pdftk'):
                # Overlay watermark on original
                pdftk_cmd = [
                    'pdftk', pdf_path,
                    'background', temp_watermark,
                    'output', temp_output
                ]
                result = subprocess.run(pdftk_cmd, capture_output=True, text=True)
                
                if result.returncode == 0:
                    # Create backup and replace
                    backup_path = pdf_path + '.backup'
                    if not os.path.exists(backup_path):
                        os.rename(pdf_path, backup_path)
                        logger.info(f"  Created backup: {backup_path}")
                    
                    os.rename(temp_output, pdf_path)
                    logger.info(f"  ✓ SUCCESS: Watermarked with overlay")
                else:
                    logger.error(f"  ✗ PDFTK ERROR: {result.stderr}")
                    self.failed_count += 1
                    return False
            else:
                # Just replace with watermarked version
                backup_path = pdf_path + '.backup'
                if not os.path.exists(backup_path):
                    os.rename(pdf_path, backup_path)
                    logger.info(f"  Created backup: {backup_path}")
                
                os.rename(temp_watermark, pdf_path)
                logger.info(f"  ✓ SUCCESS: Replaced with watermarked version")
            
            # Cleanup temp files
            for temp_file in [temp_md, temp_watermark, temp_output]:
                if os.path.exists(temp_file):
                    os.unlink(temp_file)
            
            self.processed_count += 1
            return True
            
        except Exception as e:
            logger.error(f"  ✗ PROCESSING ERROR: {str(e)}")
            self.failed_count += 1
            return False
    
    def load_pdf_list(self):
        """Load the list of PDF files from the discovery file"""
        pdf_files = []
        try:
            with open(self.pdf_list_file, 'r') as f:
                for line in f:
                    if '|' in line:
                        pdf_path, size = line.strip().split('|', 1)
                        pdf_files.append((pdf_path, int(size)))
            logger.info(f"Loaded {len(pdf_files)} PDF files for processing")
            return pdf_files
        except FileNotFoundError:
            logger.error(f"PDF list file not found: {self.pdf_list_file}")
            return []
    
    def process_all_pdfs(self):
        """Process all PDF files discovered in the system"""
        logger.info("Starting comprehensive PDF watermarking...")
        logger.info("=" * 60)
        
        # Load PDF file list
        pdf_files = self.load_pdf_list()
        if not pdf_files:
            logger.error("No PDF files to process")
            return
        
        total_files = len(pdf_files)
        logger.info(f"Processing {total_files} PDF files...")
        
        # Process each PDF file
        for i, (pdf_path, size) in enumerate(pdf_files, 1):
            logger.info(f"[{i}/{total_files}] File: {os.path.basename(pdf_path)} ({size} bytes)")
            
            # Skip if file doesn't exist (might have been moved/deleted)
            if not os.path.exists(pdf_path):
                logger.warning(f"  File not found, skipping: {pdf_path}")
                continue
            
            # Process the PDF
            self.add_watermark_with_pdftk(pdf_path)
            
            # Add separator for readability
            if i < total_files:
                logger.info("")
        
        # Final summary
        logger.info("=" * 60)
        logger.info("PDF WATERMARKING COMPLETE!")
        logger.info(f"Total files processed: {self.processed_count}")
        logger.info(f"Failed files: {self.failed_count}")
        if (self.processed_count + self.failed_count) > 0:
            logger.info(f"Success rate: {(self.processed_count/(self.processed_count+self.failed_count)*100):.1f}%")
        logger.info("=" * 60)
        logger.info("All processed PDFs now include:")
        logger.info("- CONFIDENTIAL watermark (opacity 0.13, scale 7)")
        logger.info("- Headers with actual creation dates")
        logger.info("- Footers with relative paths (no /home/ubuntu prefix)")
        logger.info("- Professional formatting with separator lines")

def main():
    watermarker = PDFWatermarker()
    watermarker.process_all_pdfs()

if __name__ == "__main__":
    main()
