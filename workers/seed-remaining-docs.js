/**
 * Retry script for failed document uploads
 */

const fs = require('fs');
const path = require('path');

const API_BASE = 'https://api.ohcselibrary.xyz/api/v1';
const DOCUMENT_LIBRARY_PATH = path.join(__dirname, '..', 'Document Library');

// Files that failed due to rate limiting
const FAILED_FILES = [
  'Templates & Forms/Standardized Templates/2025-Chief-Directors-Performance-Agreement-Template-.docx',
  'Templates & Forms/Standardized Templates/OHCS DOC TEMPLATE/CDs SEC_.docx',
  'Templates & Forms/Standardized Templates/OHCS DOC TEMPLATE/F&A.docx',
  'Templates & Forms/Standardized Templates/OHCS DOC TEMPLATE/IAU.docx',
  'Templates & Forms/Standardized Templates/OHCS DOC TEMPLATE/PBMED.docx',
  'Templates & Forms/Standardized Templates/OHCS DOC TEMPLATE/PRU.docx',
  'Templates & Forms/Standardized Templates/OHCS DOC TEMPLATE/RSIMD.docx',
  'Templates & Forms/Standardized Templates/OHCS DOC TEMPLATE/RTDD.docx',
  'Templates & Forms/Standardized Templates/RTDD-Training-Plan-template.xlsx',
  'Templates & Forms/Standardized Templates/Service-Wide-Training-Plan-Template-2016-1.xlsx',
  'Templates & Forms/Standardized Templates/STAFF-PERFORMANCE-APPRAISAL-REPORT-TEMPLATE.xlsx',
  'Training & Development/Training Reports/OUTLINE-FOR-2023-ANNUAL-TRAINING-REPORT.docx',
];

const MIME_TYPES = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

function createTitle(filename) {
  const name = path.basename(filename, path.extname(filename));
  let title = name.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
  title = title.replace(/\b\w/g, (char) => char.toUpperCase());
  return title;
}

function createMultipartBody(fields, filePath, fileName, mimeType) {
  const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
  const CRLF = '\r\n';

  let body = '';
  for (const [key, value] of Object.entries(fields)) {
    body += `--${boundary}${CRLF}`;
    body += `Content-Disposition: form-data; name="${key}"${CRLF}${CRLF}`;
    body += `${value}${CRLF}`;
  }

  body += `--${boundary}${CRLF}`;
  body += `Content-Disposition: form-data; name="file"; filename="${fileName}"${CRLF}`;
  body += `Content-Type: ${mimeType}${CRLF}${CRLF}`;

  const bodyBuffer = Buffer.from(body, 'utf8');
  const fileBuffer = fs.readFileSync(filePath);
  const endBuffer = Buffer.from(`${CRLF}--${boundary}--${CRLF}`, 'utf8');

  return {
    body: Buffer.concat([bodyBuffer, fileBuffer, endBuffer]),
    boundary,
  };
}

async function uploadFile(filePath, category, subcategory, token, index, total) {
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName).toLowerCase();
  const mimeType = MIME_TYPES[ext];
  const title = createTitle(fileName);

  const fields = {
    title,
    description: `${title} - ${subcategory || category} document from the Templates & Forms collection.`,
    category,
    accessLevel: 'internal',
    tags: subcategory || '',
    isDownloadable: 'true',
  };

  const { body, boundary } = createMultipartBody(fields, filePath, fileName, mimeType);

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

  console.log(`[${index}/${total}] Uploaded: ${title}`);
  return await response.json();
}

async function main() {
  console.log('Retrying failed uploads with longer delays...\n');

  // Login
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@ohcs.gov.gh',
      password: 'angels2G9@84?'
    })
  });

  const loginData = await loginRes.json();
  const token = loginData.accessToken;
  console.log('Authenticated!\n');

  let success = 0;
  let failed = 0;

  for (let i = 0; i < FAILED_FILES.length; i++) {
    const relativePath = FAILED_FILES[i];
    const fullPath = path.join(DOCUMENT_LIBRARY_PATH, relativePath);

    // Determine category and subcategory from path
    const parts = relativePath.split('/');
    const category = 'templates'; // All failed files are from Templates & Forms
    const subcategory = parts.length > 2 ? parts[parts.length - 2] : parts[1];

    try {
      await uploadFile(fullPath, category, subcategory, token, i + 1, FAILED_FILES.length);
      success++;
    } catch (error) {
      console.error(`[${i + 1}/${FAILED_FILES.length}] Failed: ${path.basename(relativePath)} - ${error.message}`);
      failed++;
    }

    // Wait 3 seconds between uploads to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log(`\nDone! Success: ${success}, Failed: ${failed}`);
}

main().catch(console.error);
