import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const ConfirmModal = ({ show, handleClose, handleConfirm, message, title='Confirm', isLoading = false }) => {
  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton={!isLoading}>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ 
        wordBreak: 'break-word', 
        overflowWrap: 'break-word',
        whiteSpace: 'pre-wrap',
        lineHeight: '1.5',
        padding: '20px'
      }}>
        {message}
      </Modal.Body>
      <Modal.Footer>
        <Button 
          variant="outline-primary" 
          onClick={handleClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          variant="danger" 
          onClick={handleConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Deleting...
            </>
          ) : (
            'Delete'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmModal;