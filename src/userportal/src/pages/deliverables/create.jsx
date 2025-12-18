import React, { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { NumericFormat } from 'react-number-format';
import { useParams, useNavigate } from 'react-router-dom';
import SelectFormField from '../../components/SelectFormField';
import { useCreateDeliverable } from '../../hooks/useDeliverables';
import { useStatusList } from '../../hooks/useStatuses';

const DeliverableCreate = () => {
  const { milestoneId } = useParams(); // Extract from URL
  const navigate = useNavigate();
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch statuses using React Query
  const { data: statuses = [], isLoading: loadingStatuses } = useStatusList();
  
  // Create mutation
  const createMutation = useCreateDeliverable();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        description: description,
        amount: amount,
        status: status,
        due_date: dueDate
      };
      
      const newItem = await createMutation.mutateAsync({ 
        milestoneId, 
        data 
      });

      setSuccess('Deliverable created successfully!');
      setError(null);
      
      // Navigate to the new deliverable detail page
      setTimeout(() => {
        navigate(`/deliverables/${newItem.id}`);
      }, 1000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create Deliverable');
      setSuccess(null);
    }
  };

  return (
    <div className='p-3'>
      <h3>Create Deliverable</h3>
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
      
      {loadingStatuses ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={createMutation.isPending}
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
              isDisabled={createMutation.isPending}
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
              disabled={createMutation.isPending}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Due Date</Form.Label>
            <Form.Control
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              disabled={createMutation.isPending}
            />
          </Form.Group>
          
          <Button 
            type="submit" 
            variant="primary"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Creating...
              </>
            ) : (
              <>
                <i className="fas fa-plus"></i> Create
              </>
            )}
          </Button>
          
          <a 
            href={`/milestones/${milestoneId}`} 
            className="btn btn-secondary ms-2" 
            aria-label="Cancel"
          >
            <i className="fas fa-arrow-left"></i> Back to Milestone
          </a>
        </Form>
      )}
    </div>
  );
};

export default DeliverableCreate;
