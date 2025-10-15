import React, { useState, useEffect } from 'react';
import { Form, Button, Dropdown, Alert } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import api from '../../api/Api';
import ConfirmModal from '../../components/ConfirmModal';
import PagedTable from '../../components/PagedTable';

const MilestoneEdit = () => {
    const { id } = useParams(); // Extract ID from URL
    const [sowId, setSowId] = useState('');
    const [name, setName] = useState('');
    const [status, setStatus] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const [showDeleteDeliverableModal, setShowDeleteDeliverableModal] = useState(false);
    const [deliverableToDelete, setDeliverableToDelete] = useState(null);
    const [reloadDeliverables, setReloadDeliverables] = useState(false);
    const [isDeletingDeliverable, setIsDeletingDeliverable] = useState(false);

    const [statuses, setStatuses] = useState([]);


    useEffect(() => {
        // Fetch data when component mounts
        const fetchData = async () => {
            try {
                const data = await api.milestones.get(id);
                updateDisplay(data);
            } catch (err) {
                console.error(err);
                setError('Failed to load Milestone data');
            }
        };
        fetchData();

        const fetchStatuses = async () => {
            try {
            const data = await api.statuses.list();
            setStatuses(data);
            } catch (err) {
            setError('Failed to load statuses');
            }
        }
        fetchStatuses();
    }, [id]);

    const updateDisplay = (data) => {
        setSowId(data.sow_id);
        setName(data.name);
        setStatus(data.status);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            var data = {
                name: name,
                status: status
            };
            var updatedItem = await api.milestones.update(id, data);
            updateDisplay(updatedItem);
            setSuccess('Milestone updated successfully!');
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Failed to update Milestone');
            setSuccess(null);
        }
    };

    const handleDeleteDeliverable = async () => {
        setIsDeletingDeliverable(true);
        try {
            await api.deliverables.delete(deliverableToDelete);
            setSuccess('Deliverable deleted successfully!');
            setError(null);
            setShowDeleteDeliverableModal(false);
            setDeliverableToDelete(null);
            setReloadDeliverables(true);
        } catch (err) {
            setSuccess(null);
            setError(`Error deleting deliverable: ${err.message}`);
            setShowDeleteDeliverableModal(false);
            setDeliverableToDelete(null);
        } finally {
            setIsDeletingDeliverable(false);
        }
    }

    const deliverableColumns = React.useMemo(
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
            <Dropdown.Menu>
               <Dropdown.Item href={`/deliverables/${row.original.id}`} className="d-flex align-items-center gap-1">
                <i className="fas fa-edit me-2" style={{ color: 'var(--bs-primary)' }}></i>
                Edit
              </Dropdown.Item>
                <Dropdown.Item onClick={() => {  setDeliverableToDelete(row.original.id); setShowDeleteDeliverableModal(true)}} className="d-flex align-items-center gap-1">
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

    const fetchDeliverables = async () => {
        try {
            const data = await api.deliverables.list(id, 0, -1); // No pagination limit
            setReloadDeliverables(false);
            return data;
        } catch (err) {
            console.error(err);
            setError('Error fetching milestones');
            setSuccess(null);
        }
    }

    return (
    <div className='p-4'>
        <h3>Edit Milestone</h3>
        <hr/>
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
        <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                />
            </Form.Group>
            <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Control
                    as="select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    required
                    >
                        <option value="">Select Status</option>
                        {statuses.map((status) => (
                        <option key={status.name} value={status.name}>
                            {status.name}
                        </option>
                        ))}
                    </Form.Control>
            </Form.Group>
            <Button type="submit" variant="primary">
                <i className="fas fa-save"></i> Save
            </Button>
            <a href={`/sows/${sowId}`} className="btn btn-secondary ms-2" aria-label="Edit">
                <i className="fas fa-arrow-left"></i> Back to SOW
            </a>
        </Form>

        <hr />

        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h3>Deliverables</h3>
            <Button variant="primary" onClick={() => window.location.href = `/deliverables/create/${id}`}>
              <i className="fas fa-plus" />  New Deliverable 
            </Button>
        </div>

        <PagedTable columns={deliverableColumns}
            fetchData={fetchDeliverables}
            reload={reloadDeliverables}
            showPagination={false}
            noDataMesssage={'No deliverables have been added yet.'}
            noDataDescription={'Click on "New Deliverable" to begin adding deliverables.'}
        />

        <ConfirmModal
        show={showDeleteDeliverableModal}
        handleClose={() => setShowDeleteDeliverableModal(false)}
        handleConfirm={handleDeleteDeliverable}
        title="Delete Deliverable"
        message="Are you sure you want to delete this deliverable?"
        isLoading={isDeletingDeliverable}
        />
    </div>
    );
};

export default MilestoneEdit;