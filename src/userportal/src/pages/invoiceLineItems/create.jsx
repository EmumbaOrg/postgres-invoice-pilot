import React, { useState, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { NumericFormat } from 'react-number-format';
import api from '../../api/Api';
import SelectFormField from '../../components/SelectFormField';

const InvoiceLineItemCreate = () => {
  const { invoiceId } = useParams(); // Extract from URL
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [statuses, setStatuses] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [milestone, setMilestone] = useState('');
    
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

    const fetchMilestones = async () => {
      if (!invoiceId) {
        setMilestones([]);
        return;
      }
      try {
        const data = await api.invoiceLineItems.getMilestones(invoiceId);
        setMilestones(data || []);
      } catch (err) {
        if (err?.status === 404) {
          setMilestones([]);
          return;
        }
        setError('Failed to load milestones');
      }
    };
    fetchMilestones();
  }, [invoiceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!milestone) {
      setError('Please select a milestone');
      setSuccess(null);
      return;
    }
    try {
      var data = {
        invoice_id: invoiceId,
        milestone_of_line_item: milestone,
        description: description,
        amount: amount,
        status: status,
        due_date: dueDate
      };
      var newItem = await api.invoiceLineItems.create(data);

      setSuccess('Invoice Line Item created successfully!');
      window.location.href = `/invoice-line-items/${newItem.id}`;
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to create Invoice Line Item');
      setSuccess(null);
    }
  };

  return (
    <div className='p-3'>
      <h3>Create Invoice Line Item</h3>
      <hr/>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Milestone</Form.Label>
            <SelectFormField
              options={milestones.map(name => ({ value: name, label: name }))}
              value={milestone ? { value: milestone, label: milestone } : null}
              onChange={(opt) => {
                const value = opt?.value || '';
                setMilestone(value);
                setError((prev) => (prev === 'Please select a milestone' ? null : prev));
              }}
              placeholder="Select Milestone"
              isSearchable
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            />
        </Form.Group>
        <Form.Group className="mb-3">
            <Form.Label>Amount</Form.Label>
            <NumericFormat
              className="form-control"
              value={amount}
              onValueChange={(values) => {
                const { formattedValue, value } = values;
                setAmount(value);
              }}
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
        <Form.Group className="mb-3">
            <Form.Label>Due Date</Form.Label>
            <Form.Control
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
            />
        </Form.Group>
      
        <Button type="submit" variant="primary">
          <i className="fas fa-plus"></i> Create
        </Button>
        <a href={`/invoices/${invoiceId}`} className="btn btn-secondary ms-2" aria-label="Cancel">
          <i className="fas fa-arrow-left"></i> Back to Invoice
        </a>
      </Form>
    </div>
  );
};

export default InvoiceLineItemCreate;