import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './pdf-preview-modal.css';
import { usePdfViewerState } from './hooks/usePdfViewerState';
import PdfHeader from './components/PdfHeader';
import PdfControls from './components/PdfControls';
import PdfDocumentViewer from './components/PdfDocumentViewer';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

const PdfPreviewModal = ({ show, handleClose, fileUrl }) => {
  const {
    loading,
    error,
    numPages,
    pageNumber,
    scale,
    isPdfFile,
    fileName,
    onDocumentLoadSuccess,
    onDocumentLoadError,
    goToPrevPage,
    goToNextPage,
    zoomIn,
    zoomOut,
    resetZoom,
    resetState
  } = usePdfViewerState(show, fileUrl);

  const handleModalClose = () => {
    resetState();
    handleClose();
  };

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
      <PdfHeader 
        fileName={fileName}
        onClose={handleModalClose}
      />
      
      <Modal.Body className="p-0 modern-pdf-body">
        <PdfDocumentViewer
          fileUrl={fileUrl}
          fileName={fileName}
          isPdfFile={isPdfFile}
          loading={loading}
          error={error}
          pageNumber={pageNumber}
          scale={scale}
          onDocumentLoadSuccess={onDocumentLoadSuccess}
          onDocumentLoadError={onDocumentLoadError}
          controls={
            fileUrl && isPdfFile && !error ? (
              <PdfControls
                pageNumber={pageNumber}
                numPages={numPages}
                scale={scale}
                onPrevPage={goToPrevPage}
                onNextPage={goToNextPage}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onResetZoom={resetZoom}
              />
            ) : null
          }
        />
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
                download={fileName}
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
