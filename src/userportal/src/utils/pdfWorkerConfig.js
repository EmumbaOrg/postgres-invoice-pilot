/**
 * Utility for loading PDF.js worker with multiple fallback strategies
 */

const WORKER_SOURCES = [
  // Local files first (working solution)
  '/pdf.worker.min.js',
  '/pdf.worker.min.mjs',
  // CDN sources as fallback (may have CORS issues)
  'https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.js'
];

/**
 * Test if a worker source is accessible
 */
const testWorkerSource = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Create a blob URL for the worker as a last resort
 */
const createWorkerBlob = async () => {
  try {
    // Fetch worker code from a CDN
    const response = await fetch('https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.js');
    if (!response.ok) throw new Error('Failed to fetch worker code');
    
    const workerCode = await response.text();
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Failed to create worker blob:', error);
    return null;
  }
};

/**
 * Configure PDF.js worker with optimized fallback strategy
 */
export const configurePdfWorker = async (pdfjs) => {
  // Try each worker source in order
  for (const workerSrc of WORKER_SOURCES) {
    try {
      // For local files, try direct configuration first (faster)
      if (workerSrc.startsWith('/')) {
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
        return workerSrc;
      }
      
      // For CDN sources, test accessibility first
      const isAccessible = await testWorkerSource(workerSrc);
      if (isAccessible) {
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
        return workerSrc;
      } else {
        console.warn(`🚫 Worker source not accessible: ${workerSrc}`);
      }
    } catch (error) {
      console.warn(`❌ Failed to configure worker from ${workerSrc}:`, error);
    }
  }

  // Final fallback: create blob URL
  console.warn('🔄 All predefined sources failed, trying blob fallback...');
  const blobUrl = await createWorkerBlob();
  if (blobUrl) {
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = blobUrl;
      return blobUrl;
    } catch (error) {
      console.error('❌ Failed to configure worker from blob:', error);
    }
  }

  throw new Error('All PDF worker configuration strategies failed');
};

export default configurePdfWorker;