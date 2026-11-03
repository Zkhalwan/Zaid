/**
 * Google Drive API v3 Client-Side Service
 * Uses Bearer token authentication obtained from Firebase Auth with Drive scopes.
 */

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
  modifiedTime?: string;
}

export interface DriveListResponse {
  files: DriveFileItem[];
  nextPageToken?: string;
}

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';

/**
 * List files from the user's Google Drive.
 * Supports filtering by mimeType or name search query.
 */
export async function listDriveFiles(
  accessToken: string,
  searchQuery?: string,
  folderId?: string
): Promise<DriveFileItem[]> {
  const queryParts: string[] = ['trashed = false'];

  if (folderId) {
    queryParts.push(`'${folderId}' in parents`);
  }

  if (searchQuery && searchQuery.trim()) {
    const sanitized = searchQuery.trim().replace(/'/g, "\\'");
    queryParts.push(`name contains '${sanitized}'`);
  }

  const q = encodeURIComponent(queryParts.join(' and '));
  const fields = encodeURIComponent(
    'files(id, name, mimeType, size, webViewLink, iconLink, thumbnailLink, createdTime, modifiedTime)'
  );
  const url = `${DRIVE_API_URL}/files?q=${q}&fields=${fields}&orderBy=modifiedTime desc&pageSize=50`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Drive API Error (${response.status}): ${errorText}`);
  }

  const data: DriveListResponse = await response.json();
  return data.files || [];
}

/**
 * Find or create a specific folder in Google Drive (e.g. "موسوعة أدوات الذكاء الاصطناعي - AI Tools Atlas")
 */
export async function getOrCreateAtlasFolder(accessToken: string): Promise<string> {
  const folderName = 'موسوعة أدوات الذكاء الاصطناعي - AI Tools Atlas';
  const q = encodeURIComponent(
    `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`
  );

  const searchRes = await fetch(`${DRIVE_API_URL}/files?q=${q}&fields=files(id, name)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
  }

  // Create folder if not found
  const createRes = await fetch(`${DRIVE_API_URL}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'مجلد حفظ وتصدير شروحات ونماذج أوامر الذكاء الاصطناعي',
    }),
  });

  if (!createRes.ok) {
    throw new Error('Failed to create folder in Google Drive');
  }

  const folderData = await createRes.json();
  return folderData.id;
}

/**
 * Upload a file (Text, Markdown, JSON, etc.) to Google Drive using multipart upload
 */
export async function uploadFileToDrive(
  accessToken: string,
  fileName: string,
  content: string,
  mimeType: string = 'text/markdown',
  folderId?: string
): Promise<DriveFileItem> {
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata: any = {
    name: fileName,
    mimeType: mimeType,
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
    content +
    closeDelimiter;

  const response = await fetch(
    `${DRIVE_UPLOAD_URL}/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,size,createdTime,modifiedTime`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to upload to Google Drive: ${err}`);
  }

  return await response.json();
}

/**
 * Delete a file from Google Drive
 * (Note: Caller MUST show an explicit confirmation modal before invoking this function)
 */
export async function deleteDriveFile(accessToken: string, fileId: string): Promise<void> {
  const response = await fetch(`${DRIVE_API_URL}/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const err = await response.text();
    throw new Error(`Failed to delete Google Drive file: ${err}`);
  }
}

/**
 * Helper to generate and save a formatted Prompts export file into Google Drive
 */
export async function exportPromptsListToDrive(
  accessToken: string,
  prompts: Array<{ toolName: string; title: string; category?: string; prompt: string }>,
  customTitle: string = 'بنك أوامر الذكاء الاصطناعي - AI Prompts Atlas'
): Promise<DriveFileItem> {
  const folderId = await getOrCreateAtlasFolder(accessToken);
  const now = new Date().toISOString().split('T')[0];
  const fileName = `${customTitle} (${now}).md`;

  let markdownContent = `# ${customTitle}\n`;
  markdownContent += `> تم التصدير تلقائياً من موسوعة أدوات الذكاء الاصطناعي في: ${new Date().toLocaleString('ar-EG')}\n\n`;
  markdownContent += `إجمالي عدد الأوامر: ${prompts.length}\n\n---\n\n`;

  prompts.forEach((p, idx) => {
    markdownContent += `## ${idx + 1}. ${p.title} (${p.toolName})\n`;
    if (p.category) {
      markdownContent += `**التصنيف:** ${p.category}\n\n`;
    }
    markdownContent += '```prompt\n';
    markdownContent += `${p.prompt}\n`;
    markdownContent += '```\n\n---\n\n';
  });

  return await uploadFileToDrive(accessToken, fileName, markdownContent, 'text/markdown', folderId);
}

/**
 * Helper to export a complete Tool Study Guide & Cheat Sheet to Google Drive
 */
export async function exportToolGuideToDrive(
  accessToken: string,
  tool: {
    name: string;
    arabicName: string;
    developer: string;
    category: string;
    pricing: string;
    description: string;
    keyFeatures: string[];
    useCases: string[];
    pros: string[];
    cons: string[];
    samplePrompts: Array<{ title: string; prompt: string; category: string }>;
    officialUrl: string;
  }
): Promise<DriveFileItem> {
  const folderId = await getOrCreateAtlasFolder(accessToken);
  const fileName = `دليل أداة ${tool.name} الشامل - AI Atlas.md`;

  let content = `# دليل شامل: أداة ${tool.name} (${tool.arabicName})\n\n`;
  content += `- **المطور:** ${tool.developer}\n`;
  content += `- **التصنيف:** ${tool.category}\n`;
  content += `- **الباقة:** ${tool.pricing}\n`;
  content += `- **الموقع الرسمي:** ${tool.officialUrl}\n\n`;

  content += `## 1. نبذة تعريفية\n${tool.description}\n\n`;

  content += `## 2. أبرز الميزات\n`;
  tool.keyFeatures.forEach((f) => {
    content += `- ${f}\n`;
  });
  content += '\n';

  content += `## 3. حالات الاستخدام المثلى\n`;
  tool.useCases.forEach((u) => {
    content += `- ${u}\n`;
  });
  content += '\n';

  content += `## 4. الإيجابيات ونقاط القوة\n`;
  tool.pros.forEach((p) => {
    content += `- ✅ ${p}\n`;
  });
  content += '\n';

  content += `## 5. القيود والسلبيات\n`;
  tool.cons.forEach((c) => {
    content += `- ⚠️ ${c}\n`;
  });
  content += '\n';

  if (tool.samplePrompts && tool.samplePrompts.length > 0) {
    content += `## 6. نماذج برومبت جاهزة للاستخدام\n\n`;
    tool.samplePrompts.forEach((sp, i) => {
      content += `### ${i + 1}. ${sp.title} (${sp.category})\n`;
      content += '```\n' + sp.prompt + '\n```\n\n';
    });
  }

  content += `\n---\n*تم التصدير إلى Google Drive عبر موسوعة أدوات الذكاء الاصطناعي - 2026*\n`;

  return await uploadFileToDrive(accessToken, fileName, content, 'text/markdown', folderId);
}
