import { useState, useEffect } from 'react';
import { useLockBodyScroll } from './useLockBodyScroll';

export const usePdfViewerState = (show, fileUrl) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  // Lock body scroll when modal is open
  useLockBodyScroll(show);

  // Check if the file is a PDF
  const isPdfFile = (url) => {
    if (!url) return false;
    return url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('application/pdf');
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    console.log('PDF loaded successfully with', numPages, 'pages');
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error) => {
    console.log('PDF loading error:', error);
    setLoading(false);
    setError('Failed to load document. Please check if the file is a valid PDF.');
    console.error('PDF loading error:', error);
  };

  const getFileName = (url) => {
    if (!url) return 'document.pdf';
    const parts = url.split('/');
    return parts[parts.length - 1] || 'document.pdf';
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(numPages, prev + 1));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(3.0, prev + 0.2));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.2));
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  const resetState = () => {
    setError(null);
    setPageNumber(1);
    setScale(1.0);
    setNumPages(null);
    setLoading(false); // Let react-pdf handle loading states
  };

  // Reset states when modal opens/closes
  useEffect(() => {
    if (show && fileUrl) {
      resetState();
    } else if (!show) {
      // Reset everything when modal closes
      setLoading(false);
      setError(null);
      setPageNumber(1);
      setScale(1.0);
      setNumPages(null);
    }
  }, [show, fileUrl]);

  return {
    // State
    loading,
    error,
    numPages,
    pageNumber,
    scale,
    
    // Computed values
    isPdfFile: isPdfFile(fileUrl),
    fileName: getFileName(fileUrl),
    
    // Actions
    onDocumentLoadSuccess,
    onDocumentLoadError,
    goToPrevPage,
    goToNextPage,
    zoomIn,
    zoomOut,
    resetZoom,
    resetState
  };
};