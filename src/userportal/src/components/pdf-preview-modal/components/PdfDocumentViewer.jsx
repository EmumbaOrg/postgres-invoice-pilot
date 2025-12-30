import React from 'react';
import { Spinner, Alert, Button } from 'react-bootstrap';
import { Document, Page } from 'react-pdf';

const PdfDocumentViewer = ({ 
  fileUrl,
  fileName,
  isPdfFile, 
  loading,
  error,
  pageNumber,
  scale,
  onDocumentLoadSuccess,
  onDocumentLoadError,
  controls
}) => {
  if (error) {
    return (
      <div className="p-4">
        <Alert variant="danger" className="mb-0">
          <Alert.Heading className="h6">Document Error</Alert.Heading>
          <p className="mb-0 small">{error}</p>
        </Alert>
      </div>
    );
  }

  if (!fileUrl) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="text-center">
          <div className="text-muted">No document to display</div>
        </div>
      </div>
    );
  }

  if (!isPdfFile) {
    return (
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
            download={fileName}
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fas fa-download me-2"></i>
            Download Document
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="pdf-viewer-container">
      {controls}
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
          error={
            <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
              <div className="text-center">
                <Alert variant="danger">
                  <Alert.Heading className="h6">Failed to load PDF</Alert.Heading>
                  <p className="mb-0 small">Please check if the file is accessible.</p>
                </Alert>
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
  );
};

export default PdfDocumentViewer;