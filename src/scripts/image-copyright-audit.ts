#!/usr/bin/env tsx
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

interface AuditResult {
  file: string;
  issues: string[];
  images: {
    filename: string;
    hasMetadata: boolean;
    copyright?: string;
  }[];
}

async function auditImageCopyrights() {
  const timestamp = new Date().toISOString();
  console.log(`\n🔍 IMAGE COPYRIGHT AUDIT - ${timestamp}`);
  console.log('================================================\n');
  
  const results: AuditResult[] = [];
  const metadataFiles = await glob('src/data/image-metadata/*.md');
  const imageMetadata = new Map<string, string>();
  
  // Load all image metadata
  console.log('📚 Loading image metadata...');
  for (const metaFile of metadataFiles) {
    const content = await fs.readFile(metaFile, 'utf-8');
    const filename = path.basename(metaFile, '.md');
    const copyrightMatch = content.match(/copyright:\s*"([^"]+)"/);
    if (copyrightMatch) {
      imageMetadata.set(filename, copyrightMatch[1] || '');
    }
  }
  console.log(`   Found ${imageMetadata.size} images with metadata\n`);
  
  // Check all markdown files
  console.log('📄 Checking markdown files for inline images...');
  const markdownFiles = await glob('src/data/**/*.md');
  let totalInlineImages = 0;
  let imagesWithoutMetadata = 0;
  
  for (const mdFile of markdownFiles) {
    const content = await fs.readFile(mdFile, 'utf-8');
    const relativePath = mdFile.replace('src/data/', '');
    
    // Find inline images: ![alt](url)
    const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const matches = [...content.matchAll(imagePattern)];
    
    if (matches.length > 0) {
      const result: AuditResult = {
        file: relativePath,
        issues: [],
        images: []
      };
      
      for (const match of matches) {
        const [, , url] = match;
        const filename = url?.split('/').pop() || '';
        totalInlineImages++;
        
        const hasMetadata = imageMetadata.has(filename);
        const copyright = imageMetadata.get(filename);
        
        result.images.push({
          filename,
          hasMetadata,
          copyright
        });
        
        if (!hasMetadata) {
          result.issues.push(`❌ IMAGE WITHOUT METADATA: ${filename}`);
          imagesWithoutMetadata++;
        }
      }
      
      // Check for duplicate copyright patterns
      const duplicateCopyrightPattern = /\\\*.*©.*\\\*/g;
      if (duplicateCopyrightPattern.test(content)) {
        result.issues.push('⚠️  Has manual copyright text (\\* © *\\) that may cause duplicates');
      }
      
      if (result.issues.length > 0) {
        results.push(result);
      }
    }
  }
  
  // Check HTML files for rendering issues
  console.log('\n🌐 Checking generated HTML files...');
  const htmlFiles = await glob('public/**/*.html');
  let htmlIssues = 0;
  const htmlProblems: string[] = [];
  
  for (const htmlFile of htmlFiles) {
    const content = await fs.readFile(htmlFile, 'utf-8');
    const relativePath = htmlFile.replace('public/', '');
    
    // Check for duplicate copyright on same image (unused but kept for future use)
    // const copyrightDivs = [...content.matchAll(/<div class="copyright">([^<]+)<\/div>/g)];
    // const imageDivs = [...content.matchAll(/<div class="image-container">[^]*?<\/div>\s*<\/div>/g)];
    
    // Check for italicized copyright (indicates duplicate from markdown)
    if (content.includes('<em>©')) {
      htmlProblems.push(`${relativePath}: Contains <em>©</em> - duplicate copyright as italics`);
      htmlIssues++;
    }
    
    // Check for images without containers (bare <img> tags not in logo)
    const bareImages = [...content.matchAll(/<img [^>]*src="\/i\/([^"]+)"[^>]*>/g)]
      .filter(match => !match[0].includes('logo') && !content.includes(`<div class="image-container">${match[0]}`));
    
    if (bareImages.length > 0) {
      for (const img of bareImages) {
        htmlProblems.push(`${relativePath}: Bare <img> without container: ${img[1]}`);
        htmlIssues++;
      }
    }
  }
  
  // Generate detailed report
  const reportTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `logs/image-copyright-audit-${reportTimestamp}.md`;
  
  const report = [
    '# IMAGE COPYRIGHT AUDIT REPORT',
    `Generated: ${timestamp}`,
    '',
    '## SUMMARY',
    `- Total markdown files scanned: ${markdownFiles.length}`,
    `- Total inline images found: ${totalInlineImages}`,
    `- Images WITHOUT metadata: ${imagesWithoutMetadata}`,
    `- HTML files with issues: ${htmlIssues}`,
    '',
    '## MARKDOWN FILES WITH ISSUES',
    ''
  ];
  
  if (results.length === 0) {
    report.push('✅ No issues found in markdown files!');
  } else {
    for (const result of results) {
      report.push(`### ${result.file}`);
      report.push('');
      for (const issue of result.issues) {
        report.push(`- ${issue}`);
      }
      report.push('');
      report.push('**Images in this file:**');
      for (const img of result.images) {
        const status = img.hasMetadata ? '✅' : '❌';
        const copyright = img.copyright ? ` (${img.copyright})` : ' (NO METADATA)';
        report.push(`- ${status} ${img.filename}${copyright}`);
      }
      report.push('');
    }
  }
  
  report.push('## HTML RENDERING ISSUES');
  report.push('');
  if (htmlProblems.length === 0) {
    report.push('✅ No HTML rendering issues found!');
  } else {
    for (const problem of htmlProblems) {
      report.push(`- ${problem}`);
    }
  }
  
  report.push('');
  report.push('## RECOMMENDATIONS');
  report.push('');
  if (imagesWithoutMetadata > 0) {
    report.push('1. **Add metadata for images without copyright:**');
    report.push('   - Create .md files in src/data/image-metadata/');
    report.push('   - Include copyright information');
    report.push('');
  }
  if (htmlIssues > 0) {
    report.push('2. **Fix HTML rendering issues:**');
    report.push('   - Remove manual copyright text from markdown');
    report.push('   - Regenerate site after fixes');
  }
  
  // Write report
  await fs.mkdir('logs', { recursive: true });
  await fs.writeFile(reportPath, report.join('\n'), 'utf-8');
  
  // Console output
  console.log('\n📊 AUDIT RESULTS:');
  console.log('================');
  console.log(`✅ Images with metadata: ${totalInlineImages - imagesWithoutMetadata}`);
  console.log(`❌ Images without metadata: ${imagesWithoutMetadata}`);
  console.log(`⚠️  HTML issues: ${htmlIssues}`);
  console.log(`\n📝 Detailed report saved to: ${reportPath}`);
  
  if (imagesWithoutMetadata > 0) {
    console.log('\n⚠️  WARNING: Images without metadata will NOT be rendered!');
    console.log('   See report for details.');
  }
}

auditImageCopyrights().catch(console.error);