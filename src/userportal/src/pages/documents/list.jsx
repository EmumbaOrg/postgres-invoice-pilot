import React, { useState, useMemo } from 'react';
import { useTable, useSortBy } from 'react-table';
import { Table, Button, Modal, Form, Spinner, Alert } from 'react-bootstrap';

import ConfirmModal from '../../components/ConfirmModal'; 
import { formatFileSize, formatDocumentDisplayName } from '../../utils/common-functions';
import { useDocuments, useUploadDocument, useDeleteDocument, getDocumentUrl } from '../../hooks/useDocuments';

const DocumentList = () => {
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [file, setFile] = useState(null);
  const [blobToDelete, setBlobToDelete] = useState(null);

  // Fetch documents using React Query
  const { data: documents = [], isLoading, error: fetchError } = useDocuments();
  
  // Mutations
  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();

  // Success/error state for UI feedback
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      await uploadMutation.mutateAsync(file);
      setSuccessMessage('Document uploaded successfully!');
      setErrorMessage(null);
      setShowModal(false);
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('fileInput');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setErrorMessage(`Error uploading document: ${err.message}`);
      setSuccessMessage(null);
    }
  };

  const handleDelete = async () => {
    if (!blobToDelete) return;

    try {
      await deleteMutation.mutateAsync(blobToDelete);
      setSuccessMessage('Document deleted successfully!');
      setErrorMessage(null);
      setShowConfirmModal(false);
      setBlobToDelete(null);
    } catch (err) {
      setErrorMessage(`Error deleting document: ${err.message}`);
      setSuccessMessage(null);
      setShowConfirmModal(false);
      setBlobToDelete(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        Header: 'Document Name',
        accessor: 'blob_name',
        Cell: ({ value }) => formatDocumentDisplayName(value),
      },
      {
        Header: 'Content Type',
        accessor: 'content_type',
      },
      {
        Header: 'Created',
        accessor: 'created',
        Cell: ({ value }) => new Date(value).toLocaleString(),
      },
      {
        Header: "Size",
        accessor: 'size',
        Cell: ({ value }) => formatFileSize(value),
      },
      {
        Header: 'Actions',
        accessor: 'actions',
        Cell: ({ row }) => (
          <div>
            <a 
              href={getDocumentUrl(row.original.blob_name)} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-link" 
              aria-label="Download"
            >
              <i className="fas fa-download"></i>
            </a>
            <Button 
              variant="danger" 
              onClick={() => { 
                setBlobToDelete(row.original.blob_name); 
                setShowConfirmModal(true); 
              }} 
              aria-label="Delete"
              disabled={deleteMutation.isPending}
            >
              <i className="fas fa-trash-alt"></i>
            </Button>
          </div>
        ),
      },
    ],
    [deleteMutation.isPending]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data: documents }, useSortBy);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  const error = fetchError || errorMessage;

  return (
    <div>
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h1 className="h2">Documents</h1>
        {/* Uncomment to enable upload functionality */}
        {/* <Button variant="primary" onClick={() => setShowModal(true)}>Upload</Button> */}
      </div>

      {/* Error message */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => { setErrorMessage(null); }}>
          <i className="fa-solid fa-circle-exclamation" variant="danger"></i>{' '}
          {typeof error === 'string' ? error : error?.message}
        </Alert>
      )}
      
      {/* Success message */}
      {successMessage && (
        <Alert variant="success" dismissible onClose={() => setSuccessMessage(null)}>
          <i className="fa-solid fa-circle-check" variant="success"></i>{' '}
          {successMessage}
        </Alert>
      )}

      <Table striped bordered hover {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                  {column.render('Header')}
                  <span>
                    {column.isSorted
                      ? column.isSortedDesc
                        ? <i className="ms-2 fas fa-sort-down text-muted"></i>
                        : <i className="ms-2 fas fa-sort-up text-muted"></i>
                      : <i className="ms-2 fas fa-sort text-muted"></i>}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map(row => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map(cell => {
                  return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </Table>

      {/* Upload Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload Document</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Choose document</Form.Label>
              <Form.Control 
                type="file" 
                id="fileInput"
                onChange={handleFileChange} 
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpload}
            disabled={!file || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={showConfirmModal}
        handleClose={() => setShowConfirmModal(false)}
        handleConfirm={handleDelete}
        message={`Are you sure you want to delete this document?\n\n"${blobToDelete ? formatDocumentDisplayName(blobToDelete) : ''}"`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default DocumentList;
