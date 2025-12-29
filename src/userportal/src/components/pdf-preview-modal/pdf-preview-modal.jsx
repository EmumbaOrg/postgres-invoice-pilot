import React, { useState } from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './pdf-preview-modal.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

const PdfPreviewModal = ({ show, handleClose, fileUrl }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  // Check if the file is a PDF
  const isPdfFile = (url) => {
    if (!url) return false;
    return url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('application/pdf');
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error) => {
    setLoading(false);
    setError('Failed to load document. Please check if the file is a valid PDF.');
    console.error('PDF loading error:', error);
  };

  const handleModalClose = () => {
    setLoading(true);
    setError(null);
    setPageNumber(1);
    setScale(1.0);
    handleClose();
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

  // Reset states when modal opens/closes and handle body scrolling
  React.useEffect(() => {
    if (show && fileUrl) {
      setLoading(true);
      setError(null);
      setPageNumber(1);
      setScale(1.0);
    }
    
    // Prevent body scrolling when modal is open (especially important on mobile)
    if (show) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    
    // Cleanup function
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [show, fileUrl]);

  return (
    <Modal 
      show={show} 
      onHide={handleModalClose} 
      size="xl" 
      centered 
      dialogClassName="modern-pdf-modal"
      backdrop="static"
      fullscreen="md-down"
    >
      <Modal.Header closeButton className="border-0 pb-2">
        <Modal.Title className="fs-5 fw-semibold text-dark">
          <i className="fas fa-file-pdf me-2 text-danger"></i>
          {getFileName(fileUrl)}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-0 modern-pdf-body">
        {loading && (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
            <div className="text-center">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <p className="text-muted">Loading document...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="p-4">
            <Alert variant="danger" className="mb-0">
              <Alert.Heading className="h6">Document Error</Alert.Heading>
              <p className="mb-0 small">{error}</p>
            </Alert>
          </div>
        )}
        
        {fileUrl && !error && (
          <>
            {!isPdfFile(fileUrl) ? (
              <div className="p-4 text-center">
                <Alert variant="info" className="mb-4">
                  <Alert.Heading className="h6">
                    <i className="fas fa-info-circle me-2"></i>
                    Document Preview Not Available
                  </Alert.Heading>
                  <p className="mb-3 small">
                    This document format cannot be previewed directly. You can download it to view with an appropriate application.
                  </p>
                  <Button
                    variant="primary"
                    href={fileUrl}
                    download={getFileName(fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="fas fa-download me-2"></i>
                    Download Document
                  </Button>
                </Alert>
              </div>
            ) : (
              <div className="pdf-viewer-container">
                {/* PDF Controls */}
                <div className="pdf-controls d-flex justify-content-between align-items-center p-3 border-bottom bg-light">
                  <div className="d-flex gap-2 align-items-center">
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={goToPrevPage}
                      disabled={pageNumber <= 1}
                    >
                      <i className="fas fa-chevron-left"></i>
                    </Button>
                    <span className="px-3 py-1 bg-white border rounded">
                      Page {pageNumber} of {numPages || 0}
                    </span>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={goToNextPage}
                      disabled={pageNumber >= numPages}
                    >
                      <i className="fas fa-chevron-right"></i>
                    </Button>
                  </div>
                  
                  <div className="d-flex gap-2 align-items-center">
                    <Button variant="outline-secondary" size="sm" onClick={zoomOut} disabled={scale <= 0.5}>
                      <i className="fas fa-minus"></i>
                    </Button>
                    <span className="px-2 small">{Math.round(scale * 100)}%</span>
                    <Button variant="outline-secondary" size="sm" onClick={zoomIn} disabled={scale >= 3.0}>
                      <i className="fas fa-plus"></i>
                    </Button>
                    <Button variant="outline-secondary" size="sm" onClick={resetZoom}>
                      <i className="fas fa-expand-arrows-alt"></i>
                    </Button>
                  </div>
                </div>

                {/* PDF Document */}
                <div className="pdf-document-container text-center p-2 p-md-3" style={{ maxHeight: '70vh', overflowY: 'auto', overflowX: 'auto' }}>
                  <Document
                    file={fileUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                        <div className="text-center">
                          <Spinner animation="border" variant="primary" className="mb-2" />
                          <p className="text-muted small">Loading PDF...</p>
                        </div>
                      </div>
                    }
                  >
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      renderAnnotationLayer={true}
                      renderTextLayer={true}
                      loading={
                        <div className="d-flex justify-content-center p-4">
                          <Spinner animation="border" variant="primary" size="sm" />
                        </div>
                      }
                    />
                  </Document>
                </div>
              </div>
            )}
          </>
        )}
      </Modal.Body>
      
      <Modal.Footer className="border-0 pt-2">
        <div className="d-flex justify-content-between w-100 align-items-center">
          <small className="text-muted">
            <i className="fas fa-info-circle me-1"></i>
            Use controls above to navigate and zoom
          </small>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" onClick={handleModalClose}>
              Close
            </Button>
            {fileUrl && (
              <Button
                variant="primary"
                href={fileUrl}
                download={getFileName(fileUrl)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fas fa-download me-2"></i>
                Download
              </Button>
            )}
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default PdfPreviewModal;
