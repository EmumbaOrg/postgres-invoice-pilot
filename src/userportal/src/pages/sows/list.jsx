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

// Helper function to get user-friendly error messages
const getErrorMessage = (error) => {
  if (!error) return '';
  
  if (error.response?.status === 404) {
    return 'SOWs not found. The data may have been moved or deleted.';
  } else if (error.response?.status === 403) {
    return 'You do not have permission to access SOWs.';
  } else if (error.response?.status >= 500) {
    return 'Server error occurred. Our team has been notified. Please try again later.';
  } else if (error.code === 'NETWORK_ERROR') {
    return 'Unable to connect to the server. Please check your internet connection.';
  } else if (error.name === 'TimeoutError') {
    return 'Request timed out. The server is taking too long to respond.';
  }
  
  return error.response?.data?.detail || error.message || 'An unexpected error occurred.';
};

const SOWList = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sowToDelete, setSowToDelete] = useState(null);
  const [reload, setReload] = useState(false);
  const [showCreateSOWModal, setShowCreateSOWModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedDocumentUrl, setSelectedDocumentUrl] = useState(null);
  
  // Memoize query parameters to ensure stable query key (prevents duplicate calls in StrictMode)
  const sowQueryParams = useMemo(() => ({ 
    vendorId: -1, 
    skip: 0, 
    limit: -1, 
    sortBy: '' 
  }), []);
  
  // Fetch SOWs using React Query with retry functionality
  const { data: sowsData, isLoading, error: fetchError, refetch } = useSOWs({
    ...sowQueryParams,
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors, but not for 4xx errors
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false; // Don't retry client errors
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Handle retry manually
  const handleRetry = async () => {
    setIsRetrying(true);
    setErrorMessage(null);
    try {
      await refetch();
      setRetryCount(0);
    } catch (err) {
      setRetryCount(prev => prev + 1);
    } finally {
      setIsRetrying(false);
    }
  };
  
  // Delete mutation
  const deleteMutation = useDeleteSOW();
  
  // Enhanced success/error state for better UI feedback
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Auto-dismiss success message after 5 seconds
  React.useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  
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

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await deleteMutation.mutateAsync(sowToDelete);
      setSuccessMessage('SOW successfully deleted!');
      setShowDeleteModal(false);
      setSowToDelete(null);
      setRetryCount(0);
      setReload((prev) => !prev);
    } catch (err) {
      console.error('Delete SOW error:', err);
      
      // Provide specific error messages based on error type
      let errorMsg = 'Failed to delete SOW. ';
      
      if (err.response?.status === 404) {
        errorMsg += 'SOW not found. It may have already been deleted.';
      } else if (err.response?.status === 403) {
        errorMsg += 'You do not have permission to delete this SOW.';
      } else if (err.response?.status === 409) {
        errorMsg += 'SOW cannot be deleted because it has associated data.';
      } else if (err.response?.status >= 500) {
        errorMsg += 'Server error occurred. Please try again later.';
      } else if (err.code === 'NETWORK_ERROR') {
        errorMsg += 'Network connection error. Check your internet connection.';
      } else {
        errorMsg += err.response?.data?.detail || err.message || 'Unknown error occurred.';
      }
      
      setErrorMessage(errorMsg);
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
        <h1 className="h4 fw-bold mb-0">SOWs</h1>
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

      {/* Enhanced error message with retry capability */}
      {(errorMessage || fetchError) && (
        <Alert variant="danger" className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <i className="fa-solid fa-circle-exclamation me-2" style={{color: 'var(--bs-danger)'}}></i>
            <div>
              <strong>Error:</strong> {errorMessage || getErrorMessage(fetchError)}
              {retryCount > 0 && (
                <div className="small text-muted mt-1">
                  Retry attempt: {retryCount}/3
                </div>
              )}
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            {fetchError && (
              <Button 
                variant="outline-danger" 
                size="sm" 
                onClick={handleRetry}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Retrying...
                  </>
                ) : (
                  <>
                    <i className="fas fa-redo me-2"></i>
                    Retry
                  </>
                )}
              </Button>
            )}
            <Button 
              variant="link" 
              size="sm" 
              className="text-danger" 
              onClick={() => { setErrorMessage(null); }}
            >
              <i className="fas fa-times"></i>
            </Button>
          </div>
        </Alert>
      )}
      
      {/* Enhanced success message with auto-dismiss */}
      {successMessage && (
        <Alert variant="success" className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <i className="fa-solid fa-circle-check me-2" style={{color: 'var(--bs-success)'}}></i>
            <strong>{successMessage}</strong>
          </div>
          <Button 
            variant="link" 
            size="sm" 
            className="text-success" 
            onClick={() => setSuccessMessage(null)}
          >
            <i className="fas fa-times"></i>
          </Button>
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
