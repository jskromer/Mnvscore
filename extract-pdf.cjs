// extract-pdf.cjs
// Usage: node extract-pdf.cjs path/to/plan.pdf

const fs = require('fs');
const { PDFParse } = require('pdf-parse');

const MAX_CHARS = 15000;

async function extractPlan(filePath) {
  console.log(`\nReading: ${filePath}\n`);

  const buffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const data = await parser.getText();

  // Clean extraction artifacts
  let text = data.text
    .replace(/\f/g, '\n')                    // form feeds
    .replace(/[ \t]+\n/g, '\n')              // trailing whitespace
    .replace(/\n{3,}/g, '\n\n')              // excessive blank lines
    .replace(/([a-z])-\n([a-z])/g, '$1$2')   // hyphenated line breaks
    .trim();

  console.log(`Pages: ${data.total}`);
  console.log(`Raw characters: ${data.text.length}`);
  console.log(`Cleaned characters: ${text.length}`);

  if (text.length > MAX_CHARS) {
    const original = text.length;
    text = text.substring(0, MAX_CHARS);
    const lastPeriod = text.lastIndexOf('.');
    if (lastPeriod > MAX_CHARS * 0.9) {
      text = text.substring(0, lastPeriod + 1);
    }
    console.log(`⚠ Truncated: ${original} → ${text.length} characters`);
  } else {
    console.log(`✓ Within 15,000 character limit`);
  }

  // Check for potential issues
  if (text.length < 100) {
    console.log(`\n⚠ WARNING: Very little text extracted.`);
    console.log(`  This PDF may be scanned (image-only) with no text layer.`);
    console.log(`  Consider using OCR or pasting text manually.\n`);
    return;
  }

  // Preview
  console.log(`\n--- First 500 characters ---\n`);
  console.log(text.substring(0, 500));
  console.log(`\n--- Last 300 characters ---\n`);
  console.log(text.substring(text.length - 300));

  // Save extracted text
  const outPath = filePath.replace('.pdf', '_extracted.txt');
  fs.writeFileSync(outPath, text);
  console.log(`\n✓ Saved to: ${outPath}`);
  console.log(`  Ready to paste into the Scorecard at https://mnvscore.vercel.app\n`);

  await parser.destroy();
}

// Run
const filePath = process.argv[2];
if (!filePath) {
  console.log('Usage: node extract-pdf.cjs <path-to-pdf>');
  process.exit(1);
}
if (!fs.existsSync(filePath)) {
  console.log(`File not found: ${filePath}`);
  process.exit(1);
}

extractPlan(filePath).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
