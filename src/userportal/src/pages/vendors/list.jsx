import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/Api';
import { Dropdown } from 'react-bootstrap';
import ConfirmModal from '../../components/ConfirmModal'; 
import PagedTable from '../../components/PagedTable';
import SearchInput from '../../components/SearchInput';
import { useDebouncedSearch } from '../../hooks/useDebounce';

const VendorList = () => {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const [reload, setReload] = useState(false);
  
  // Debounced search functionality
  const handleSearch = useCallback((debouncedSearchTerm) => {
    setReload((prev) => !prev);
  }, []);
  
  const { searchTerm, debouncedSearchTerm, handleSearchChange, clearSearch } = useDebouncedSearch('', handleSearch, 500);
  
  const handleDelete = async () => {
    if (!vendorToDelete) return;

    try {
      await api.vendors.delete(vendorToDelete);
      setSuccess('Vendor deleted successfully!');
      setError(null);
      setShowDeleteModal(false);
      setReload(true); // Refresh the data
    } catch (err) {
      setSuccess(null);
      setError(err.message);
    }
  }

  const columns = React.useMemo(
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
            <Dropdown.Menu>
              <Dropdown.Item className="d-flex align-items-center gap-1" href={`/vendors/view/${row.original.id}`}>
                <i className="fas fa-eye me-2" style={{ color: 'var(--bs-primary)' }}></i>
                View
              </Dropdown.Item>
               <Dropdown.Item className="d-flex align-items-center gap-1" onClick={() => { setVendorToDelete(row.original.id); setShowDeleteModal(true); }}>
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


  const fetchVendors = async (skip, limit, sortBy, search) => {
    const response = await api.vendors.list(skip, limit, sortBy, search)

    // Apply frontend search filter on vendor name if debouncedSearchTerm exists
    if (debouncedSearchTerm && response.data) {
      const filteredData = response.data.filter(
        (vendor) => vendor.name && vendor.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
      )
      return {
        ...response,
        data: filteredData,
        total: filteredData.length,
      }
    }

    return response
  }

  return (
    <div className='px-5 py-3'>
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3">
        <h1 className="h4">Vendors</h1>
        <Link to="/vendors/create" className="btn btn-primary"><i className="fas fa-plus me-2" />New Vendor </Link>
      </div>
        {/* Search Bar */}
        <SearchInput
          value={searchTerm}
          onChange={handleSearchChange}
          onClear={clearSearch}
          placeholder="Search by vendor name..."
          id="vendor-search"
        />
      <PagedTable columns={columns} fetchData={fetchVendors} reload={reload} key={debouncedSearchTerm} noDataMesssage={'No vendors have been added yet.'} noDataDescription={'Click on "New Vendor" to begin adding vendors.'} />

      <ConfirmModal
        show={showDeleteModal}
        handleClose={() => setShowDeleteModal(false)}
        handleConfirm={handleDelete}
        message="Are you sure you want to delete this Vendor?"
      />
    </div>
  );
};

export default VendorList;