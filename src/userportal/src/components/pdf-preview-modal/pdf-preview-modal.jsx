import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import './pdf-preview-modal.css';

import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';

pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker();

const PdfPreviewModal = ({ show, handleClose, fileUrl }) => {
  const [numPages, setNumPages] = useState(0);
  const [selectedPage, setSelectedPage] = useState(1);
  const pageWidth = 600;

  const onLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setSelectedPage(1);
  };
  
  return (
    <Modal show={show} onHide={handleClose} size="xl" centered dialogClassName="modal-fixed-height">
      <Modal.Header closeButton>
        <Modal.Title>Document Preview</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        <Row className="preview-layout g-0 h-100">
          {/* Thumbnails */}
          <Col xs={4} md={3} className="thumbs-col border-end">
            <Document file={fileUrl} onLoadSuccess={onLoadSuccess}>
              {Array.from(new Array(numPages), (_, i) => (
                <div
                  key={i}
                  className={`p-2 cursor-pointer ${selectedPage === i + 1 ? 'border border-primary rounded' : ''}`}
                  onClick={() => setSelectedPage(i + 1)}
                  style={{ cursor: 'pointer' }}
                >
                  <Page pageNumber={i + 1} width={100} />
                </div>
              ))}
            </Document>
          </Col>

          {/* Main Page View */}
          <Col xs={8} md={9} className="page-col">
            <Document file={fileUrl}>
              <Page
                pageNumber={selectedPage}
                width={pageWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <a href={fileUrl} download className="btn btn-primary">
          Download
        </a>
      </Modal.Footer>
    </Modal>
  );
};

export default PdfPreviewModal;
