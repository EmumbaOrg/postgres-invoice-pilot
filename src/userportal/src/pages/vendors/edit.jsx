import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import ConfirmModal from '../../components/ConfirmModal';
import PagedTable from '../../components/PagedTable';
import { useVendor } from '../../hooks/useVendors';
import { useSOWs, useDeleteSOW } from '../../hooks/useSOWs';

const VendorEdit = () => {
  const { id } = useParams(); // Extract Vendor ID from URL
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactType, setContactType] = useState('');
  const [website, setWebsite] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDeleteSowModal, setShowDeleteSowModal] = useState(false);
  const [sowToDelete, setSowToDelete] = useState(null);

  // Fetch vendor data using React Query
  const { 
    data: vendor, 
    isLoading: loadingVendor, 
    error: fetchError 
  } = useVendor(id);
  
  // Fetch SOWs for this vendor
  const { 
    data: sowsData, 
    isLoading: loadingSOWs 
  } = useSOWs({ vendorId: id, skip: 0, limit: -1 });
  
  // Delete SOW mutation
  const deleteSOWMutation = useDeleteSOW();

  // Populate form when vendor data is loaded
  useEffect(() => {
    if (vendor) {
      setName(vendor.name || '');
      setAddress(vendor.address || '');
      setContactName(vendor.contact_name || '');
      setContactEmail(vendor.contact_email || '');
      setContactPhone(vendor.contact_phone || '');
      setWebsite(vendor.website || '');
      setContactType(vendor.type || '');
    }
  }, [vendor]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Currently form is disabled, but keeping handler for future enablement
  };

  const isNonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;
  const validateEmail = (email) => {
    if (!email) return false;
    const trimmed = email.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  };
  const validatePhone = (phone) => {
    if (!phone) return false;
    const digits = (phone || '').replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
  };

  const validateFormFields = () => {
    if (!isNonEmpty(name) || !isNonEmpty(address) || !isNonEmpty(contactName) || !isNonEmpty(contactEmail) || !isNonEmpty(contactPhone) || !isNonEmpty(contactType)) {
      setError('Please fill in all required fields');
      return false;
    }
    if (!validateEmail(contactEmail)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!validatePhone(contactPhone)) {
      setError('Please enter a valid phone number');
      return false;
    }
    setError(null);
    return true;
  };

  const sowColumns = useMemo(
    () => [
      {
        Header: 'Number',
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
      },
      {
        Header: 'Actions',
        accessor: 'actions',
        Cell: ({ row }) => {
          return (
            <div>
              <a href={`/sows/${row.original.id}`} className="btn btn-link" aria-label="Edit">
                <i className="fas fa-edit"></i>
              </a>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setSowToDelete(row.original.id);
                  setShowDeleteSowModal(true);
                }}
              >
                Delete
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  const handleDeleteSow = async () => {
    if (!sowToDelete) return;

    try {
      await deleteSOWMutation.mutateAsync(sowToDelete);
      
      setSuccess('SOW deleted successfully!');
      setError(null);
      setShowDeleteSowModal(false);
      setSowToDelete(null);
    } catch (err) {
      setError(err.message || 'Error deleting SOW');
      setSuccess(null);
      setShowDeleteSowModal(false);
      setSowToDelete(null);
    }
  };

  const fetchSows = useCallback(async () => {
    if (!sowsData) {
      return {
        data: [],
        total: 0,
        skip: 0,
        limit: 10
      };
    }
    return sowsData;
  }, [sowsData]);

  // Loading state
  if (loadingVendor) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  // Error state
  if (fetchError) {
    return (
      <div className='p-4'>
        <Alert variant="danger">
          <i className="fa-solid fa-circle-exclamation"></i> Failed to load vendor data: {fetchError.message}
        </Alert>
        <Button variant="secondary" onClick={() => navigate('/vendors')}>
          <i className="fas fa-arrow-left"></i> Back to Vendors
        </Button>
      </div>
    );
  }

  return (
    <div className='p-4'>
      <h1>Edit Vendor</h1>
      <hr/>
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          <i className="fa-solid fa-circle-exclamation"></i> {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          <i className="fa-solid fa-circle-check"></i> {success}
        </Alert>
      )}
      
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Name</Form.Label>
          <Form.Control
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Address</Form.Label>
          <Form.Control
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            disabled
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Contact Name</Form.Label>
          <Form.Control
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            required
            disabled
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Contact Email</Form.Label>
          <Form.Control
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            required
            disabled
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Contact Phone</Form.Label>
          <Form.Control
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            required
            disabled
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Contact Type</Form.Label>
          <Form.Control
            type="text"
            value={contactType}
            onChange={(e) => setContactType(e.target.value)}
            required
            disabled
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Website</Form.Label>
          <Form.Control
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            required
            disabled
          />
        </Form.Group>
      </Form>

      <hr />

      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h2 className="h2">SOWs</h2>
        <Button 
          variant="primary" 
          onClick={() => navigate(`/sows/create/${id}`)}
        >
          New SOW <i className="fas fa-plus" />
        </Button>
      </div>

      <PagedTable 
        columns={sowColumns}
        fetchData={fetchSows}
        showPagination={false}
        initialData={sowsData?.data || []}
        initialTotal={sowsData?.total || 0}
        initialSkip={0}
        initialLimit={10}
        initialLoadCompleted={!loadingSOWs}
        isExternalLoading={loadingSOWs}
      />

      <ConfirmModal
        show={showDeleteSowModal}
        handleClose={() => setShowDeleteSowModal(false)}
        handleConfirm={handleDeleteSow}
        title="Delete SOW"
        message="Are you sure you want to delete this SOW?"
        isLoading={deleteSOWMutation.isPending}
      />
    </div>
  );
};

export default VendorEdit;
