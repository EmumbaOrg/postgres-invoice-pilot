import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { NumericFormat } from 'react-number-format';
import { useParams, useNavigate } from 'react-router-dom';
import SelectFormField from '../../components/SelectFormField';
import { useDeliverable, useUpdateDeliverable } from '../../hooks/useDeliverables';
import { useStatusList } from '../../hooks/useStatuses';

const DeliverableEdit = () => {
  const { id } = useParams(); // Extract ID from URL
  const navigate = useNavigate();
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch deliverable data using React Query
  const { 
    data: deliverable, 
    isLoading: loadingDeliverable, 
    error: fetchError 
  } = useDeliverable(id);
  
  // Fetch statuses using React Query
  const { data: statuses = [], isLoading: loadingStatuses } = useStatusList();
  
  // Update mutation
  const updateMutation = useUpdateDeliverable();

  // Populate form when deliverable data is loaded
  useEffect(() => {
    if (deliverable) {
      setDescription(deliverable.description || '');
      setAmount(deliverable.amount || '');
      setStatus(deliverable.status || '');
      setDueDate(deliverable.due_date || '');
    }
  }, [deliverable]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        description: description,
        amount: amount,
        status: status,
        due_date: dueDate
      };
      
      await updateMutation.mutateAsync({ id, data });
      
      setSuccess('Deliverable updated successfully!');
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update Deliverable');
      setSuccess(null);
    }
  };

  // Loading state
  if (loadingDeliverable || loadingStatuses) {
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
      <div className='p-3'>
        <Alert variant="danger">
          <i className="fa-solid fa-circle-exclamation"></i> Failed to load deliverable data: {fetchError.message}
        </Alert>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className='p-3 position-relative'>
      <h3>Edit Deliverable</h3>
      
      <div className='position-absolute top-0' style={{left:"38%"}}>
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
      </div>
      
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
        
        <Form.Group className="mb-3">
          <Form.Label>Amount</Form.Label>
          <NumericFormat
            className="form-control"
            value={amount}
            thousandSeparator={true}
            prefix={'$'}
            onValueChange={(values) => {
              const { value } = values;
              setAmount(value);
            }}
            required
            disabled={updateMutation.isPending}
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Due Date</Form.Label>
          <Form.Control
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            disabled={updateMutation.isPending}
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
          href={`/milestones/${deliverable?.milestone_id}`} 
          className="btn btn-secondary ms-2" 
          aria-label="Cancel"
        >
          <i className="fas fa-arrow-left"></i> Back to Milestone
        </a>
      </Form>
    </div>
  );
};

export default DeliverableEdit;
