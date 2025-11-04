/**
 * File utility functions
 */

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const isValidFileType = (filename: string, allowedTypes: string[]): boolean => {
  const extension = getFileExtension(filename);
  return allowedTypes.includes(extension);
};

export const ALLOWED_FILE_TYPES = [
  'pdf',
  'docx',
  'txt',
  'md',
  'csv',
  'xlsx',
  'json'
];

export const getFileTypeLabel = (extension: string): string => {
  const labels: Record<string, string> = {
    pdf: 'PDF Document',
    docx: 'Word Document',
    txt: 'Text File',
    md: 'Markdown',
    csv: 'CSV Spreadsheet',
    xlsx: 'Excel Spreadsheet',
    json: 'JSON Data'
  };
  return labels[extension] || 'Unknown File';
};

