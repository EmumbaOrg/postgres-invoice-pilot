import React, { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { NumericFormat } from 'react-number-format';
import SelectFormField from '../../components/SelectFormField';
import { useCreateInvoiceLineItem, useInvoiceMilestones } from '../../hooks/useInvoiceLineItems';
import { useStatusList } from '../../hooks/useStatuses';

const InvoiceLineItemCreate = () => {
  const { invoiceId } = useParams(); // Extract from URL
  const navigate = useNavigate();
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [milestone, setMilestone] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch statuses using React Query
  const { data: statuses = [], isLoading: loadingStatuses } = useStatusList();
  
  // Fetch milestones for the invoice using React Query
  const { 
    data: milestones = [], 
    isLoading: loadingMilestones,
    error: milestonesError 
  } = useInvoiceMilestones(invoiceId);
  
  // Create mutation
  const createMutation = useCreateInvoiceLineItem();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!milestone) {
      setError('Please select a milestone');
      setSuccess(null);
      return;
    }
    
    try {
      const data = {
        invoice_id: invoiceId,
        milestone_of_line_item: milestone,
        description: description,
        amount: amount,
        status: status,
        due_date: dueDate
      };
      
      await createMutation.mutateAsync(data);
      
      setSuccess('Invoice Line Item created successfully!');
      setError(null);
      
      // Navigate back to invoice after short delay
      setTimeout(() => {
        navigate(`/invoices/${invoiceId}`);
      }, 1000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create Invoice Line Item');
      setSuccess(null);
    }
  };

  // Loading state
  const isLoading = loadingStatuses || loadingMilestones;

  return (
    <div className='p-3'>
      <h3>Create Invoice Line Item</h3>
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
      
      {milestonesError && (
        <Alert variant="warning">
          <i className="fa-solid fa-triangle-exclamation"></i> Unable to load milestones. Please ensure the invoice has associated SOW milestones.
        </Alert>
      )}
      
      {isLoading ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Milestone <span className="text-danger">*</span></Form.Label>
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
              isDisabled={createMutation.isPending || milestones.length === 0}
            />
            {milestones.length === 0 && (
              <Form.Text className="text-muted">
                No milestones available. Please ensure the invoice has an associated SOW with milestones.
              </Form.Text>
            )}
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Description <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={createMutation.isPending}
              placeholder="Enter description"
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Amount <span className="text-danger">*</span></Form.Label>
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
              placeholder="$0.00"
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
            <Form.Label>Due Date <span className="text-danger">*</span></Form.Label>
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
            disabled={createMutation.isPending || milestones.length === 0}
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
            href={`/invoices/${invoiceId}`} 
            className="btn btn-secondary ms-2" 
            aria-label="Cancel"
          >
            <i className="fas fa-arrow-left"></i> Back to Invoice
          </a>
        </Form>
      )}
    </div>
  );
};

export default InvoiceLineItemCreate;
