import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Modal, Button, Row, Col } from 'react-bootstrap';

import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';

pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker();

const PdfPreviewModal = ({ show, handleClose, fileUrl }) => {
  const [numPages, setNumPages] = useState(0);
  const [selectedPage, setSelectedPage] = useState(1);

  const onLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setSelectedPage(1);
  };
  
  return (
    <Modal show={show} onHide={handleClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>Document Preview</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ height: '80vh', overflow: 'hidden' }}>
        <Row className="h-100">
          {/* Thumbnails */}
          <Col md={3} className="overflow-auto border-end" style={{ background: '#f8f9fa' }}>
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
          <Col md={9} className="d-flex justify-content-center align-items-center overflow-auto bg-white">
            <Document file={fileUrl}>
              <Page pageNumber={selectedPage} width={600} />
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
