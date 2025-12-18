import React, { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import SelectFormField from '../../components/SelectFormField';
import { useCreateMilestone } from '../../hooks/useMilestones';
import { useStatusList } from '../../hooks/useStatuses';

const MilestoneCreate = () => {
  const { sowId } = useParams(); // Extract from URL
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch statuses using React Query
  const { data: statuses = [], isLoading: loadingStatuses } = useStatusList();
  
  // Create mutation
  const createMutation = useCreateMilestone();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        sow_id: sowId,
        name: name,
        status: status
      };
      
      const newItem = await createMutation.mutateAsync(data);

      setSuccess('Milestone created successfully!');
      setError(null);
      
      // Navigate to the new milestone detail page
      setTimeout(() => {
        navigate(`/milestones/${newItem.id}`);
      }, 1000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create Milestone');
      setSuccess(null);
    }
  };

  return (
    <div className='p-3'>
      <h3>Create Milestone</h3>
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
            <Form.Label>Name <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={createMutation.isPending}
              placeholder="Enter milestone name"
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
            href={`/sows/${sowId}`} 
            className="btn btn-secondary ms-2" 
            aria-label="Cancel"
          >
            <i className="fas fa-arrow-left"></i> Back to SOW
          </a>
        </Form>
      )}
    </div>
  );
};

export default MilestoneCreate;
