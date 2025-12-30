import React from 'react';
import { Modal } from 'react-bootstrap';

const PdfHeader = ({ fileName, onClose }) => {
  return (
    <Modal.Header closeButton className="border-0 pb-2" onHide={onClose}>
      <Modal.Title className="fs-5 fw-semibold text-dark">
        <i className="fas fa-file-pdf me-2 text-danger"></i>
        {fileName}
      </Modal.Title>
    </Modal.Header>
  );
};

export default PdfHeader;