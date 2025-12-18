import React, { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Dropdown, Alert } from 'react-bootstrap';
import ConfirmModal from '../../components/ConfirmModal'; 
import PagedTable from '../../components/PagedTable';
import SearchInput from '../../components/SearchInput';
import { useDebouncedSearch } from '../../hooks/useDebounce';
import { useAllVendors, useDeleteVendor } from '../../hooks/useVendors';

const VendorList = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const [reload, setReload] = useState(false);
  
  // Fetch all vendors using React Query
  const { data: vendorsData, isLoading, error: fetchError } = useAllVendors();
  
  // Delete mutation
  const deleteMutation = useDeleteVendor();
  
  // Success/error state for UI feedback
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  
  // Debounced search functionality
  const handleSearch = useCallback((debouncedSearchTerm) => {
    setReload((prev) => !prev);
  }, []);
  
  const { searchTerm, debouncedSearchTerm, handleSearchChange, clearSearch } = useDebouncedSearch('', handleSearch, 500);
  
  const handleDelete = async () => {
    if (!vendorToDelete) return;

    try {
      await deleteMutation.mutateAsync(vendorToDelete);
      setSuccessMessage('Vendor deleted successfully!');
      setErrorMessage(null);
      setShowDeleteModal(false);
      setVendorToDelete(null);
      setReload((prev) => !prev);
    } catch (err) {
      setErrorMessage(`Error deleting vendor: ${err.message}`);
      setSuccessMessage(null);
      setShowDeleteModal(false);
      setVendorToDelete(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        Header: 'ID',
        accessor: 'id',
      },
      {
        Header: 'Vendor Name',
        accessor: 'name',
      },
      {
        Header: 'Address',
        accessor: 'address',
      },
      {
        Header: 'Contact Person',
        accessor: 'contact_name',
      },
      {
        Header: 'Email Address',
        accessor: 'contact_email',
      },
      {
        Header: 'Phone Number',
        accessor: 'contact_phone',
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
              <Dropdown.Item className="d-flex align-items-center gap-1" href={`/vendors/view/${row.original.id}`}>
                <i className="fas fa-eye me-2" style={{ color: 'var(--bs-primary)' }}></i>
                View
              </Dropdown.Item>
              <Dropdown.Item 
                className="d-flex align-items-center gap-1" 
                onClick={() => { 
                  setVendorToDelete(row.original.id); 
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
    []
  );

  // Memoize filtered data (source of truth for search)
  const filteredVendors = useMemo(() => {
    if (!vendorsData?.data) return [];
    
    if (debouncedSearchTerm) {
      return vendorsData.data.filter(
        (vendor) => vendor.name && vendor.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }
    
    return vendorsData.data;
  }, [vendorsData, debouncedSearchTerm]);

  const fetchVendors = useCallback(async (skip, limit, sortBy, search) => {
    // Apply client-side pagination on filtered data
    const paginatedData = filteredVendors.slice(skip, skip + limit);
    
    return {
      data: paginatedData,
      total: filteredVendors.length,
      skip: skip,
      limit: limit,
    };
  }, [filteredVendors]);

  return (
    <div className='px-5 py-3'>
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3">
        <h1 className="h4">Vendors</h1>
        <Link to="/vendors/create" className="btn btn-primary">
          <i className="fas fa-plus me-2" />
          New Vendor
        </Link>
      </div>
      
      {/* Search Bar */}
      <SearchInput
        value={searchTerm}
        onChange={handleSearchChange}
        onClear={clearSearch}
        placeholder="Search by vendor name..."
        id="vendor-search"
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
        fetchData={fetchVendors} 
        reload={reload} 
        key={debouncedSearchTerm} 
        noDataMesssage={'No vendors have been added yet.'} 
        noDataDescription={'Click on "New Vendor" to begin adding vendors.'}
        initialData={filteredVendors}
        initialTotal={filteredVendors.length}
        initialSkip={0}
        initialLimit={10}
        initialLoadCompleted={!isLoading}
        isExternalLoading={isLoading}
      />

      <ConfirmModal
        show={showDeleteModal}
        handleClose={() => setShowDeleteModal(false)}
        handleConfirm={handleDelete}
        message="Are you sure you want to delete this Vendor?"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default VendorList;
