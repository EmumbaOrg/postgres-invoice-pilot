import React, { useState, useCallback } from 'react';
import { Button, Alert, Dropdown} from 'react-bootstrap';

import ConfirmModal from '../../components/ConfirmModal'; 
import PagedTable from '../../components/PagedTable';
import SearchInput from '../../components/SearchInput';
import api from '../../api/Api';
import SOWCreateModal from './create';
import { useDebouncedSearch } from '../../hooks/useDebounce';

const SOWList = () => {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sowToDelete, setSowToDelete] = useState(null);
  const [reload, setReload] = useState(false);
  const [showCreateSOWModal, setShowCreateSOWModal] = useState(false);
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
      await api.sows.delete(sowToDelete);
      setReload((prev) => !prev);
      setError(null);
      setShowDeleteModal(false);
      setSowToDelete(null);
      setSuccess('SOW successfully deleted!');
    } catch (err) {
      setSuccess(null);
      setError(`Error deleting SOW: ${err.message}`);
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
        Cell: ({ row }) => 
          {
            return (
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
              <Dropdown.Item className="d-flex align-items-center gap-1" href={`${api.documents.getUrl(row.original.document)}`} target="_blank" rel="noopener noreferrer">
                <i className="fas fa-download me-2" style={{ color: 'var(--bs-primary)' }}></i>
                Download
              </Dropdown.Item>
               <Dropdown.Item className="d-flex align-items-center gap-1" href={`/sows/${row.original.id}`} >
                <i className="fas fa-edit me-2" style={{ color: 'var(--bs-primary)' }}></i>
                Edit
              </Dropdown.Item>
                <Dropdown.Item className="d-flex align-items-center gap-1" onClick={() => { setSowToDelete(row.original.id); setShowDeleteModal(true); }} >
                <i className="fas fa-trash-alt me-2" style={{ color: 'var(--bs-danger)' }}></i>
                Delete
              </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
            )
          }
         
      },
    ],
    []
  );

  const fetchSOWs = async (skip, limit, sortBy, search) => {
    const response = await api.sows.list(-1, skip, limit, sortBy, search);
      // Apply frontend search filter on SOW number if debouncedSearchTerm exists
    if (debouncedSearchTerm && response.data) {
      const filteredData = response.data.filter(
        (sow) => sow.number && sow.number.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
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
        <h1 className="h4 fw-bold">SOWs</h1>
        <Button className='primary' onClick={() => setShowCreateSOWModal(true)}><i className="fas fa-plus me-2" />New SOW </Button> 
      </div>
      {/* Search Bar */}
      <SearchInput
        value={searchTerm}
        onChange={handleSearchChange}
        onClear={clearSearch}
        placeholder="Search by SOW number..."
        id="sow-search"
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

      <PagedTable columns={columns} fetchData={fetchSOWs} reload={reload} key={debouncedSearchTerm} noDataMesssage={'No SOWs have been added yet.'} noDataDescription={'Click on "New SOW" to begin adding SOWs.'} />

      <ConfirmModal
        show={showDeleteModal}
        handleClose={() => setShowDeleteModal(false)}
        handleConfirm={handleDelete}
        message="Are you sure you want to delete this SOW?"
        isLoading={isDeleting}
      />
         <SOWCreateModal 
        show={showCreateSOWModal} 
        onHide={() => setShowCreateSOWModal(false)} 
        
      />
    </div>
  );
};

export default SOWList;