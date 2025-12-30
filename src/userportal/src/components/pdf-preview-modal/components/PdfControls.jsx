import React from 'react';
import { Button } from 'react-bootstrap';

const PdfControls = ({ 
  pageNumber, 
  numPages, 
  scale, 
  onPrevPage, 
  onNextPage, 
  onZoomIn, 
  onZoomOut, 
  onResetZoom 
}) => {
  return (
    <div className="pdf-controls d-flex justify-content-between align-items-center p-3 border-bottom bg-light">
      <div className="d-flex gap-2 align-items-center">
        <Button 
          variant="outline-primary" 
          size="sm"
          onClick={onPrevPage}
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
          onClick={onNextPage}
          disabled={pageNumber >= numPages}
        >
          <i className="fas fa-chevron-right"></i>
        </Button>
      </div>
      
      <div className="d-flex gap-2 align-items-center">
        <Button 
          variant="outline-secondary" 
          size="sm" 
          onClick={onZoomOut} 
          disabled={scale <= 0.5}
        >
          <i className="fas fa-minus"></i>
        </Button>
        <span className="px-2 small">{Math.round(scale * 100)}%</span>
        <Button 
          variant="outline-secondary" 
          size="sm" 
          onClick={onZoomIn} 
          disabled={scale >= 3.0}
        >
          <i className="fas fa-plus"></i>
        </Button>
        <Button 
          variant="outline-secondary" 
          size="sm" 
          onClick={onResetZoom}
        >
          <i className="fas fa-expand-arrows-alt"></i>
        </Button>
      </div>
    </div>
  );
};

export default PdfControls;