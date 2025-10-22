import React, { useState, useCallback } from 'react';
import api from '../../api/Api';
import { Button, Dropdown, Alert} from 'react-bootstrap';
import ConfirmModal from '../../components/ConfirmModal'; 
import PagedTable from '../../components/PagedTable';
import StatusChip from '../../components/status-chip/status-chip';
import InvoiceCreate from './create';
import SearchInput from '../../components/SearchInput';
import { useDebouncedSearch } from '../../hooks/useDebounce';

const InvoiceList = () => {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sowToDelete, setSowToDelete] = useState(null);
  const [reload, setReload] = useState(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Debounced search functionality
  const handleSearch = useCallback((debouncedSearchTerm) => {
    setReload((prev) => !prev);
  }, []);
  
  const { searchTerm, debouncedSearchTerm, handleSearchChange, clearSearch } = useDebouncedSearch('', handleSearch, 500);

  const handleDelete = async () => {
    if (!sowToDelete) return;

    setIsDeleting(true);
    try {
      await api.invoices.delete(sowToDelete);
      setSuccess('Invoice deleted successfully!');
      setError(null);
      setShowDeleteModal(false);
      setSowToDelete(null);
      setReload((prev) => !prev);
    } catch (err) {
      setSuccess(null);
      setError(`Error deleting invoice: ${err.message}`);
      setShowDeleteModal(false);
      setSowToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  }

  const columns = React.useMemo(
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
              <Dropdown.Item href={`${api.documents.getUrl(row.original.document)}`} target="_blank" rel="noopener noreferrer" className="d-flex align-items-center gap-1">
                <i className="fas fa-download me-2" style={{ color: 'var(--bs-primary)' }}></i>
                Download
              </Dropdown.Item>
               <Dropdown.Item href={`/invoices/${row.original.id}`} className="d-flex align-items-center gap-1">
                <i className="fas fa-edit me-2" style={{ color: 'var(--bs-primary)' }}></i>
                Edit
              </Dropdown.Item>
                <Dropdown.Item onClick={() => { setSowToDelete(row.original.id); setShowDeleteModal(true); }} className="d-flex align-items-center gap-1">
                <i className="fas fa-trash-alt me-2" style={{ color: 'var(--bs-danger)' }}></i>
                Delete
              </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        ),
      },
    ],
    []
  );

  const fetchInvoices = async (skip, limit, sortBy, search) => {
    const response = await api.invoices.list(-1, skip, limit, sortBy, search);
     // Apply frontend search filter on Invoice number if debouncedSearchTerm exists
    if (debouncedSearchTerm && response.data) {
      const filteredData = response.data.filter(
        (invoice) => invoice.number && invoice.number.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
      )
      return {
        ...response,
        data: filteredData,
        total: filteredData.length,
      }
    }
    return response;
  };

  return (
    <div className='px-5 py-3'>
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-2">
        <h1 className="h4 fw-bold">Invoices</h1>
      <Button className='primary' onClick={() => setShowCreateInvoiceModal(true)}><i className="fas fa-plus me-2" />New Invoice </Button> 
      </div>
       {/* Search Bar */}
       <SearchInput
         value={searchTerm}
         onChange={handleSearchChange}
         onClear={clearSearch}
         placeholder="Search by Invoice number..."
         id="invoice-search"
       />

       {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
         <i className="fa-solid fa-circle-exclamation" variant="danger"></i> {error}
        </Alert>
      )}
       {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
         <i className="fa-solid fa-circle-check" variant="success"></i> {success}
        </Alert>
      )}

      <PagedTable columns={columns} fetchData={fetchInvoices} reload={reload} noDataMesssage={"No Invoices have been added yet"} noDataDescription={<p className="text-muted">Click on "Add Invoice" to begin adding invoices.</p>} />

      <ConfirmModal
        show={showDeleteModal}
        handleClose={() => setShowDeleteModal(false)}
        handleConfirm={handleDelete}
        message="Are you sure you want to delete this Invoice?"
        isLoading={isDeleting}
      />
        <InvoiceCreate
          show={showCreateInvoiceModal}
          onHide={() => setShowCreateInvoiceModal(false)}
        />
    </div>
  );
};

export default InvoiceList;