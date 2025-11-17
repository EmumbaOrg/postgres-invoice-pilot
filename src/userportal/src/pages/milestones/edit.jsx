import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Form, Button, Dropdown, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import SelectFormField from '../../components/SelectFormField';
import ConfirmModal from '../../components/ConfirmModal';
import PagedTable from '../../components/PagedTable';
import { useMilestone, useUpdateMilestone } from '../../hooks/useMilestones';
import { useDeliverables, useDeleteDeliverable } from '../../hooks/useDeliverables';
import { useStatusList } from '../../hooks/useStatuses';

const MilestoneEdit = () => {
  const { id } = useParams(); // Extract ID from URL
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDeleteDeliverableModal, setShowDeleteDeliverableModal] = useState(false);
  const [deliverableToDelete, setDeliverableToDelete] = useState(null);
  const [reloadDeliverables, setReloadDeliverables] = useState(false);

  // Fetch milestone data using React Query
  const { 
    data: milestone, 
    isLoading: loadingMilestone, 
    error: fetchError 
  } = useMilestone(id);
  
  // Fetch statuses using React Query
  const { data: statuses = [], isLoading: loadingStatuses } = useStatusList();
  
  // Fetch deliverables for this milestone
  const { 
    data: deliverablesData, 
    isLoading: loadingDeliverables 
  } = useDeliverables({ 
    milestoneId: id, 
    skip: 0, 
    limit: -1 
  });
  
  // Update mutation
  const updateMutation = useUpdateMilestone();
  
  // Delete deliverable mutation
  const deleteDeliverableMutation = useDeleteDeliverable();

  // Populate form when milestone data is loaded
  useEffect(() => {
    if (milestone) {
      setName(milestone.name || '');
      setStatus(milestone.status || '');
    }
  }, [milestone]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        name: name,
        status: status
      };
      
      await updateMutation.mutateAsync({ id, data });
      
      setSuccess('Milestone updated successfully!');
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update Milestone');
      setSuccess(null);
    }
  };

  const handleDeleteDeliverable = async () => {
    if (!deliverableToDelete) return;

    try {
      await deleteDeliverableMutation.mutateAsync(deliverableToDelete);
      
      setSuccess('Deliverable deleted successfully!');
      setError(null);
      setShowDeleteDeliverableModal(false);
      setDeliverableToDelete(null);
      setReloadDeliverables((prev) => !prev);
    } catch (err) {
      setError(err.message || 'Error deleting deliverable');
      setSuccess(null);
      setShowDeleteDeliverableModal(false);
      setDeliverableToDelete(null);
    }
  };

  const deliverableColumns = useMemo(
    () => [
      {
        Header: 'Description',
        accessor: 'description',
      },
      {
        Header: 'Amount',
        accessor: 'amount',
        Cell: ({ value }) => {
          const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          });
          return formatter.format(value);
        },
      },
      {
        Header: 'Status',
        accessor: 'status',
      },
      {
        Header: 'Due Date',
        accessor: 'due_date',
      },
      {
        Header: '',
        accessor: 'actions',
        Cell: ({ row }) => {
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
                <Dropdown.Item 
                  href={`/deliverables/${row.original.id}`} 
                  className="d-flex align-items-center gap-1"
                >
                  <i className="fas fa-edit me-2" style={{ color: 'var(--bs-primary)' }}></i>
                  Edit
                </Dropdown.Item>
                <Dropdown.Item 
                  onClick={() => {  
                    setDeliverableToDelete(row.original.id); 
                    setShowDeleteDeliverableModal(true);
                  }} 
                  className="d-flex align-items-center gap-1"
                >
                  <i className="fas fa-trash-alt me-2" style={{ color: 'var(--bs-danger)' }}></i>
                  Delete
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          );
        },
      },
    ],
    []
  );

  const fetchDeliverables = useCallback(async () => {
    if (!deliverablesData) {
      return {
        data: [],
        total: 0,
        skip: 0,
        limit: 10
      };
    }
    return deliverablesData;
  }, [deliverablesData]);

  // Loading state
  if (loadingMilestone || loadingStatuses) {
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
          <i className="fa-solid fa-circle-exclamation"></i> Failed to load milestone data: {fetchError.message}
        </Alert>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className='p-4'>
      <h3>Edit Milestone</h3>
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
          <Form.Label>Name <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={updateMutation.isPending}
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Status</Form.Label>
          <SelectFormField
            options={statuses.map(s => ({ value: s.name, label: s.name }))}
            value={statuses.find(s => s.name === status) ? { value: status, label: status } : null}
            onChange={(opt) => setStatus(opt?.value || '')}
            placeholder="Select Status"
            isSearchable
            isDisabled={updateMutation.isPending}
          />
        </Form.Group>
        
        <Button 
          type="submit" 
          variant="primary"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Saving...
            </>
          ) : (
            <>
              <i className="fas fa-save"></i> Save
            </>
          )}
        </Button>
        
        <a 
          href={`/sows/${milestone?.sow_id}`} 
          className="btn btn-secondary ms-2" 
          aria-label="Back to SOW"
        >
          <i className="fas fa-arrow-left"></i> Back to SOW
        </a>
      </Form>

      <hr />

      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h3>Deliverables</h3>
        <Button 
          variant="primary" 
          onClick={() => navigate(`/deliverables/create/${id}`)}
        >
          <i className="fas fa-plus" /> New Deliverable 
        </Button>
      </div>

      <PagedTable 
        columns={deliverableColumns}
        fetchData={fetchDeliverables}
        reload={reloadDeliverables}
        showPagination={false}
        noDataMesssage={'No deliverables have been added yet.'}
        noDataDescription={'Click on "New Deliverable" to begin adding deliverables.'}
        initialData={deliverablesData?.data || []}
        initialTotal={deliverablesData?.total || 0}
        initialSkip={0}
        initialLimit={10}
        initialLoadCompleted={!loadingDeliverables}
        isExternalLoading={loadingDeliverables}
      />

      <ConfirmModal
        show={showDeleteDeliverableModal}
        handleClose={() => setShowDeleteDeliverableModal(false)}
        handleConfirm={handleDeleteDeliverable}
        title="Delete Deliverable"
        message="Are you sure you want to delete this deliverable?"
        isLoading={deleteDeliverableMutation.isPending}
      />
    </div>
  );
};

export default MilestoneEdit;
