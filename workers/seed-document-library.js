/**
 * Document Library Seeding Script
 *
 * This script uploads all documents from the local Document Library folder
 * to the OHCS E-Library system (R2 storage + D1 database).
 *
 * Usage:
 *   node seed-document-library.js [--local|--remote]
 *
 * Prerequisites:
 *   - For local: The API server must be running (npm run dev)
 *   - Migration 032_update_document_categories.sql must be applied
 */

const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE = process.argv.includes('--remote')
  ? 'https://api.ohcselibrary.xyz/api/v1'
  : 'http://127.0.0.1:8787/api/v1';

const DOCUMENT_LIBRARY_PATH = path.join(__dirname, '..', 'Document Library');

// Category mapping based on folder names
const CATEGORY_MAP = {
  'Administrative Instruments': 'administrative',
  'Compliance & Legal': 'compliance',
  'Induction Materials': 'induction',
  'Newsletters & Bulletins': 'newsletters',
  'Performance Management': 'performance',
  'Policies & Guidelines': 'policies',
  'Recruitment & Examination': 'recruitment',
  'Research & Surveys': 'research',
  'Strategic Planning': 'strategic',
  'Templates & Forms': 'templates',
  'Training & Development': 'training',
};

// MIME type mapping
const MIME_TYPES = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

// Files to skip
const SKIP_PATTERNS = [
  '~$', // Temp Office files
  '.DS_Store',
  'Thumbs.db',
  '.zip', // Skip zip files
];

/**
 * Clean up a filename to create a readable title
 */
function createTitle(filename) {
  const name = path.basename(filename, path.extname(filename));
  let title = name
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize first letter of each word
  title = title.replace(/\b\w/g, (char) => char.toUpperCase());
  return title;
}

/**
 * Create a description based on folder and file context
 */
function createDescription(category, subcategory, filename) {
  const title = createTitle(filename);
  const categoryName = Object.keys(CATEGORY_MAP).find(k => CATEGORY_MAP[k] === category) || category;

  if (subcategory) {
    return `${title} - ${subcategory} document from the ${categoryName} collection.`;
  }
  return `${title} - Document from the ${categoryName} collection.`;
}

/**
 * Check if file should be skipped
 */
function shouldSkip(filename) {
  return SKIP_PATTERNS.some(pattern =>
    filename.startsWith(pattern) || filename.endsWith(pattern)
  );
}

/**
 * Recursively get all files in a directory
 */
function getAllFiles(dirPath, category, subcategory = null) {
  const files = [];

  if (!fs.existsSync(dirPath)) {
    console.warn(`Directory not found: ${dirPath}`);
    return files;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (shouldSkip(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      const newSubcategory = entry.name;
      files.push(...getAllFiles(fullPath, category, newSubcategory));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      const mimeType = MIME_TYPES[ext];

      if (mimeType) {
        files.push({
          path: fullPath,
          name: entry.name,
          category,
          subcategory,
          mimeType,
          ext,
        });
      } else {
        console.warn(`   Skipping unsupported file type: ${entry.name}`);
      }
    }
  }

  return files;
}

/**
 * Create multipart form data boundary
 */
function createMultipartBody(fields, file) {
  const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
  const CRLF = '\r\n';

  let body = '';

  // Add text fields
  for (const [key, value] of Object.entries(fields)) {
    body += `--${boundary}${CRLF}`;
    body += `Content-Disposition: form-data; name="${key}"${CRLF}${CRLF}`;
    body += `${value}${CRLF}`;
  }

  // Add file field
  body += `--${boundary}${CRLF}`;
  body += `Content-Disposition: form-data; name="file"; filename="${file.name}"${CRLF}`;
  body += `Content-Type: ${file.mimeType}${CRLF}${CRLF}`;

  // Convert body to buffer and concatenate with file content
  const bodyBuffer = Buffer.from(body, 'utf8');
  const fileBuffer = fs.readFileSync(file.path);
  const endBuffer = Buffer.from(`${CRLF}--${boundary}--${CRLF}`, 'utf8');

  return {
    body: Buffer.concat([bodyBuffer, fileBuffer, endBuffer]),
    boundary,
  };
}

/**
 * Upload a single document to the API
 */
async function uploadDocument(file, token, fileIndex, totalFiles) {
  try {
    const title = createTitle(file.name);
    const description = createDescription(file.category, file.subcategory, file.name);
    const tags = file.subcategory ? file.subcategory : '';

    const fields = {
      title,
      description,
      category: file.category,
      accessLevel: 'internal',
      tags,
      isDownloadable: 'true',
    };

    const { body, boundary } = createMultipartBody(fields, file);

    const response = await fetch(`${API_BASE}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log(`[${fileIndex}/${totalFiles}] Uploaded: ${title}`);
    return result;
  } catch (error) {
    console.error(`[${fileIndex}/${totalFiles}] Failed: ${file.name} - ${error.message}`);
    return null;
  }
}

/**
 * Main seeding function
 */
async function seedDocumentLibrary() {
  console.log('='.repeat(60));
  console.log('OHCS E-Library Document Seeding Script');
  console.log('='.repeat(60));
  console.log(`API: ${API_BASE}`);
  console.log(`Source: ${DOCUMENT_LIBRARY_PATH}`);

  // Step 1: Login to get auth token
  console.log('\n1. Authenticating...');
  try {
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@ohcs.gov.gh',
        password: 'angels2G9@84?'
      })
    });

    if (!loginRes.ok) {
      const errText = await loginRes.text();
      throw new Error(`Login failed: ${loginRes.status} - ${errText}`);
    }

    const loginData = await loginRes.json();
    if (!loginData.accessToken) {
      throw new Error('No access token received');
    }

    const token = loginData.accessToken;
    console.log('   Authentication successful!');

    // Step 2: Scan Document Library folders
    console.log('\n2. Scanning Document Library...');
    const allFiles = [];

    if (!fs.existsSync(DOCUMENT_LIBRARY_PATH)) {
      throw new Error(`Document Library not found at: ${DOCUMENT_LIBRARY_PATH}`);
    }

    const categoryFolders = fs.readdirSync(DOCUMENT_LIBRARY_PATH, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);

    for (const folderName of categoryFolders) {
      const category = CATEGORY_MAP[folderName];
      if (!category) {
        console.warn(`   Unknown category folder: ${folderName}`);
        continue;
      }

      const folderPath = path.join(DOCUMENT_LIBRARY_PATH, folderName);
      const files = getAllFiles(folderPath, category);
      allFiles.push(...files);
      console.log(`   ${folderName}: ${files.length} files`);
    }

    console.log(`\n   Total files to upload: ${allFiles.length}`);

    if (allFiles.length === 0) {
      console.log('\n   No files found to upload.');
      return;
    }

    // Step 3: Upload documents
    console.log('\n3. Uploading documents...');
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < allFiles.length; i++) {
      const result = await uploadDocument(allFiles[i], token, i + 1, allFiles.length);
      if (result) {
        successCount++;
      } else {
        failCount++;
      }

      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Step 4: Summary
    console.log('\n' + '='.repeat(60));
    console.log('SEEDING COMPLETE');
    console.log('='.repeat(60));
    console.log(`Total files processed: ${allFiles.length}`);
    console.log(`Successfully uploaded:  ${successCount}`);
    console.log(`Failed:                 ${failCount}`);

    // Print category breakdown
    console.log('\nDocuments by category:');
    const categoryCounts = {};
    for (const file of allFiles) {
      categoryCounts[file.category] = (categoryCounts[file.category] || 0) + 1;
    }
    for (const [cat, count] of Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])) {
      const catName = Object.keys(CATEGORY_MAP).find(k => CATEGORY_MAP[k] === cat) || cat;
      console.log(`   ${catName}: ${count}`);
    }

  } catch (error) {
    console.error('\nFATAL ERROR:', error.message);
    process.exit(1);
  }
}

// Run the script
seedDocumentLibrary();
