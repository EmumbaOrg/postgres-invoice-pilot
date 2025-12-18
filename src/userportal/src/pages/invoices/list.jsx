import React, { useState, useCallback, useMemo } from 'react';
import { Button, Dropdown, Alert } from 'react-bootstrap';
import ConfirmModal from '../../components/ConfirmModal'; 
import PagedTable from '../../components/PagedTable';
import StatusChip from '../../components/status-chip/status-chip';
import InvoiceCreate from './create';
import SearchInput from '../../components/SearchInput';
import { useDebouncedSearch } from '../../hooks/useDebounce';
import PdfPreviewModal from '../../components/pdf-preview-modal/pdf-preview-modal';
import { useInvoices, useDeleteInvoice } from '../../hooks/useInvoices';
import { getDocumentUrl } from '../../hooks/useDocuments';

const InvoiceList = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [reload, setReload] = useState(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedDocumentUrl, setSelectedDocumentUrl] = useState(null);
  
  // Fetch invoices using React Query
  const { data: invoicesData, isLoading, error: fetchError } = useInvoices({ 
    vendorId: -1, 
    skip: 0, 
    limit: -1, 
    sortBy: '' 
  });
  
  // Delete mutation
  const deleteMutation = useDeleteInvoice();
  
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
    if (!invoiceToDelete) return;

    try {
      await deleteMutation.mutateAsync(invoiceToDelete);
      setSuccessMessage('Invoice deleted successfully!');
      setErrorMessage(null);
      setShowDeleteModal(false);
      setInvoiceToDelete(null);
      setReload((prev) => !prev);
    } catch (err) {
      setErrorMessage(`Error deleting invoice: ${err.message}`);
      setSuccessMessage(null);
      setShowDeleteModal(false);
      setInvoiceToDelete(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        Header: 'ID',
        accessor: 'id',
      },
      {
        Header: 'Invoice Number',
        accessor: 'number',
      },
      {
        Header: 'Amount',
        accessor: 'amount',
      },
      {
        Header: 'Invoice Date',
        accessor: 'invoice_date',
      },
      {
        Header: 'Payment Status',
        accessor: 'payment_status',
        Cell: ({ value }) => {
          return <StatusChip status={value} />;
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
                onClick={() => handleViewDocument(row.original.document)} 
                disabled={!row.original.document} 
                className="d-flex align-items-center gap-1"
              >
                <i className="fas fa-eye me-2" style={{ color: 'var(--bs-primary)' }}></i>
                View
              </Dropdown.Item>
              <Dropdown.Item 
                href={getDocumentUrl(row.original.document)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="d-flex align-items-center gap-1"
              >
                <i className="fas fa-download me-2" style={{ color: 'var(--bs-primary)' }}></i>
                Download
              </Dropdown.Item>
              <Dropdown.Item href={`/invoices/${row.original.id}`} className="d-flex align-items-center gap-1">
                <i className="fas fa-edit me-2" style={{ color: 'var(--bs-primary)' }}></i>
                Edit
              </Dropdown.Item>
              <Dropdown.Item 
                onClick={() => { 
                  setInvoiceToDelete(row.original.id); 
                  setShowDeleteModal(true); 
                }} 
                className="d-flex align-items-center gap-1"
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
  const filteredInvoices = useMemo(() => {
    if (!invoicesData?.data) return [];
    
    if (debouncedSearchTerm) {
      return invoicesData.data.filter(
        (invoice) => invoice.number && invoice.number.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }
    
    return invoicesData.data;
  }, [invoicesData, debouncedSearchTerm]);

  const fetchInvoices = useCallback(async (skip, limit, sortBy, search) => {
    // Apply client-side pagination on filtered data
    const paginatedData = filteredInvoices.slice(skip, skip + limit);
    
    return {
      data: paginatedData,
      total: filteredInvoices.length,
      skip: skip,
      limit: limit,
    };
  }, [filteredInvoices]);

  return (
    <div className='px-5 py-3'>
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-2">
        <h1 className="h4 fw-bold">Invoices</h1>
        <Button className='primary' onClick={() => setShowCreateInvoiceModal(true)}>
          <i className="fas fa-plus me-2" />
          New Invoice
        </Button> 
      </div>
      
      {/* Search Bar */}
      <SearchInput
        value={searchTerm}
        onChange={handleSearchChange}
        onClear={clearSearch}
        placeholder="Search by Invoice number..."
        id="invoice-search"
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
        fetchData={fetchInvoices} 
        reload={reload}
        key={debouncedSearchTerm}
        noDataMesssage={"No Invoices have been added yet"} 
        noDataDescription={<p className="text-muted">Click on "Add Invoice" to begin adding invoices.</p>}
        initialData={filteredInvoices}
        initialTotal={filteredInvoices.length}
        initialSkip={0}
        initialLimit={10}
        initialLoadCompleted={!isLoading}
        isExternalLoading={isLoading}
      />

      <ConfirmModal
        show={showDeleteModal}
        handleClose={() => setShowDeleteModal(false)}
        handleConfirm={handleDelete}
        message="Are you sure you want to delete this Invoice?"
        isLoading={deleteMutation.isPending}
      />
      
      <InvoiceCreate
        show={showCreateInvoiceModal}
        onHide={() => setShowCreateInvoiceModal(false)}
      />
      
      <PdfPreviewModal
        show={showPdfModal}
        handleClose={handleClosePdfModal}
        fileUrl={selectedDocumentUrl}
      />
    </div>
  );
};

export default InvoiceList;
