export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Extract filename from a path
 * @param {string} path - The full path or blob name
 * @returns {string} - Just the filename
 */
export const extractFileName = (path) => {
  if (!path) return '';
  return path.split('/').pop() || path;
};

/**
 * Determine document type based on filename
 * @param {string} filename - The filename to analyze
 * @returns {string} - Document type (Invoice, SOW, or Document)
 */
export const getDocumentType = (filename) => {
  if (!filename) return 'Document';
  
  const lowerFilename = filename.toLowerCase();
  
  if (lowerFilename.includes('inv-') || lowerFilename.includes('invoice')) {
    return 'Invoice';
  }
  
  if (lowerFilename.includes('sow') || lowerFilename.includes('statement_of_work')) {
    return 'SOW';
  }
  
  return 'Document';
};

/**
 * Format document display name with type prefix
 * @param {string} path - The full path or blob name
 * @param {boolean} showTypeLabel - Whether to show type label prefix
 * @returns {string} - Formatted display name
 */
export const formatDocumentDisplayName = (path, showTypeLabel = true) => {
  const filename = extractFileName(path);
  
  if (!showTypeLabel) {
    return filename;
  }
  
  const docType = getDocumentType(filename);
  return `${docType}: ${filename}`;
};

/**
 * Get appropriate icon class for document type
 * @param {string} filename - The filename to analyze
 * @returns {string} - Icon class name
 */
export const getDocumentIconClass = (filename) => {
  const docType = getDocumentType(filename);
  
  switch (docType) {
    case 'Invoice':
      return 'fa-solid fa-file-invoice';
    case 'SOW':
      return 'fa-solid fa-file-contract';
    default:
      return 'fa-solid fa-file-pdf';
  }
};
