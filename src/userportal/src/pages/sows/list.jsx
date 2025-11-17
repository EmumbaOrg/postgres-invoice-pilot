import React, { useState, useCallback, useMemo } from 'react';
import { Button, Alert, Dropdown } from 'react-bootstrap';

import ConfirmModal from '../../components/ConfirmModal'; 
import PagedTable from '../../components/PagedTable';
import SearchInput from '../../components/SearchInput';
import SOWCreateModal from './create';
import { useDebouncedSearch } from '../../hooks/useDebounce';
import PdfPreviewModal from '../../components/pdf-preview-modal/pdf-preview-modal';
import { useSOWs, useDeleteSOW } from '../../hooks/useSOWs';
import { getDocumentUrl } from '../../hooks/useDocuments';

const SOWList = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sowToDelete, setSowToDelete] = useState(null);
  const [reload, setReload] = useState(false);
  const [showCreateSOWModal, setShowCreateSOWModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedDocumentUrl, setSelectedDocumentUrl] = useState(null);
  
  // Fetch SOWs using React Query
  const { data: sowsData, isLoading, error: fetchError } = useSOWs({ 
    vendorId: -1, 
    skip: 0, 
    limit: -1, 
    sortBy: '' 
  });
  
  // Delete mutation
  const deleteMutation = useDeleteSOW();
  
  // Success/error state for UI feedback
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  
  // Debounced search functionality
  const handleSearch = useCallback((debouncedSearchTerm) => {
    setReload((prev) => !prev);
  }, []);
  
  const { searchTerm, debouncedSearchTerm, handleSearchChange, clearSearch } = useDebouncedSearch('', handleSearch, 500);

  const handleViewDocument = useCallback((documentName) => {
    if (!documentName) return;

    const url = getDocumentUrl(documentName);
    setSelectedDocumentUrl(url);
    setShowPdfModal(true);
  }, []);

  const handleClosePdfModal = useCallback(() => {
    setShowPdfModal(false);
    setSelectedDocumentUrl(null);
  }, []);

  const handleDelete = async () => {
    if (!sowToDelete) return;

    try {
      await deleteMutation.mutateAsync(sowToDelete);
      setSuccessMessage('SOW successfully deleted!');
      setErrorMessage(null);
      setShowDeleteModal(false);
      setSowToDelete(null);
      setReload((prev) => !prev);
    } catch (err) {
      setErrorMessage(`Error deleting SOW: ${err.message}`);
      setSuccessMessage(null);
      setShowDeleteModal(false);
      setSowToDelete(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        Header: 'ID',
        accessor: 'id',
      },
      {
        Header: 'SOW Number',
        accessor: 'number',
      },
      {
        Header: 'Start Date',
        accessor: 'start_date',
      },
      {
        Header: 'End Date',
        accessor: 'end_date',
      },
      {
        Header: 'Budget',
        accessor: 'budget',
        Cell: ({ value }) => {
          const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          });
          return formatter.format(value);
        },
      },
      {
        Header: '',
        accessor: 'actions',
        Cell: ({ row }) => (
          <Dropdown>
            <Dropdown.Toggle
              variant="outline-primary"
              size="sm"
              id={`dropdown-${row.original.id}`}
              className="border-0"
            >
              <i className="fas fa-ellipsis-v"></i>
            </Dropdown.Toggle>
            <Dropdown.Menu align="end">
              <Dropdown.Item 
                className="d-flex align-items-center gap-1" 
                onClick={() => handleViewDocument(row.original.document)} 
                disabled={!row.original.document}
              >
                <i className="fas fa-eye me-2" style={{ color: 'var(--bs-primary)' }}></i>
                View
              </Dropdown.Item>
              <Dropdown.Item 
                className="d-flex align-items-center gap-1" 
                href={getDocumentUrl(row.original.document)} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <i className="fas fa-download me-2" style={{ color: 'var(--bs-primary)' }}></i>
                Download
              </Dropdown.Item>
              <Dropdown.Item className="d-flex align-items-center gap-1" href={`/sows/${row.original.id}`}>
                <i className="fas fa-edit me-2" style={{ color: 'var(--bs-primary)' }}></i>
                Edit
              </Dropdown.Item>
              <Dropdown.Item 
                className="d-flex align-items-center gap-1" 
                onClick={() => { 
                  setSowToDelete(row.original.id); 
                  setShowDeleteModal(true); 
                }}
              >
                <i className="fas fa-trash-alt me-2" style={{ color: 'var(--bs-danger)' }}></i>
                Delete
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        ),
      },
    ],
    [handleViewDocument]
  );

  // Memoize filtered data (source of truth for search)
  const filteredSOWs = useMemo(() => {
    if (!sowsData?.data) return [];
    
    if (debouncedSearchTerm) {
      return sowsData.data.filter(
        (sow) => sow.number && sow.number.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }
    
    return sowsData.data;
  }, [sowsData, debouncedSearchTerm]);

  const fetchSOWs = useCallback(async (skip, limit, sortBy, search) => {
    // Apply client-side pagination on filtered data
    const paginatedData = filteredSOWs.slice(skip, skip + limit);
    
    return {
      data: paginatedData,
      total: filteredSOWs.length,
      skip: skip,
      limit: limit,
    };
  }, [filteredSOWs]);

  return (
    <div className='px-5 py-3'>
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-2">
        <h1 className="h4 fw-bold">SOWs</h1>
        <Button className='primary' onClick={() => setShowCreateSOWModal(true)}>
          <i className="fas fa-plus me-2" />
          New SOW
        </Button> 
      </div>

      {/* Search Bar */}
      <SearchInput
        value={searchTerm}
        onChange={handleSearchChange}
        onClear={clearSearch}
        placeholder="Search by SOW number..."
        id="sow-search"
      />

      {/* Error message from fetch or delete */}
      {(errorMessage || fetchError) && (
        <Alert variant="danger" dismissible onClose={() => { setErrorMessage(null); }}>
          <i className="fa-solid fa-circle-exclamation" variant="danger"></i>{' '}
          {errorMessage || fetchError?.message}
        </Alert>
      )}
      
      {/* Success message */}
      {successMessage && (
        <Alert variant="success" dismissible onClose={() => setSuccessMessage(null)}>
          <i className="fa-solid fa-circle-check" variant="success"></i>{' '}
          {successMessage}
        </Alert>
      )}

      <PagedTable 
        columns={columns} 
        fetchData={fetchSOWs} 
        reload={reload} 
        key={debouncedSearchTerm} 
        noDataMesssage={'No SOWs have been added yet.'} 
        noDataDescription={'Click on "New SOW" to begin adding SOWs.'}
        initialData={filteredSOWs}
        initialTotal={filteredSOWs.length}
        initialSkip={0}
        initialLimit={10}
        initialLoadCompleted={!isLoading}
        isExternalLoading={isLoading}
      />

      <ConfirmModal
        show={showDeleteModal}
        handleClose={() => setShowDeleteModal(false)}
        handleConfirm={handleDelete}
        message="Are you sure you want to delete this SOW?"
        isLoading={deleteMutation.isPending}
      />

      <SOWCreateModal 
        show={showCreateSOWModal} 
        onHide={() => setShowCreateSOWModal(false)} 
      />

      <PdfPreviewModal
        show={showPdfModal}
        handleClose={handleClosePdfModal}
        fileUrl={selectedDocumentUrl}
      />
    </div>
  );
};

export default SOWList;
