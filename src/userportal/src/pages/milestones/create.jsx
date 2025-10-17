import React, { useState, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import api from '../../api/Api';
import SelectFormField from '../../components/SelectFormField';

const MilestoneCreate = () => {
  const { sowId } = useParams(); // Extract from URL
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [statuses, setStatuses] = useState([]);
    
  useEffect(() => {
    // Fetch data when component mounts
    const fetchStatuses = async () => {
      try {
        const data = await api.statuses.list();
        setStatuses(data);
      } catch (err) {
        setError('Failed to load statuses');
      }
    }
    fetchStatuses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      var data = {
        sow_id: sowId,
        name: name,
        status: status
      };
      var newItem = await api.milestones.create(data);

      setSuccess('Milestone created successfully!');
      window.location.href = `/milestones/${newItem.id}`;
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to create Milestone');
      setSuccess(null);
    }
  };

  return (
    <div className='p-3'>
      <h3>Create Milestone</h3>
      <hr/>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
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
            <SelectFormField
              options={statuses.map(s => ({ value: s.name, label: s.name }))}
              value={statuses.find(s => s.name == status) ? { value: status, label: status } : null}
              onChange={(opt) => setStatus(opt?.value || '')}
              placeholder="Select Status"
              isSearchable
            />
        </Form.Group>
        <Button type="submit" variant="primary">
          <i className="fas fa-plus"></i> Create
        </Button>
        <a href={`/sows/${sowId}`} className="btn btn-secondary ms-2" aria-label="Cancel">
          <i className="fas fa-arrow-left"></i> Back to Sow
        </a>
      </Form>
    </div>
  );
};

export default MilestoneCreate;