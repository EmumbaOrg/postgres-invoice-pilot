import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { NumericFormat } from 'react-number-format';
import SelectFormField from '../../components/SelectFormField';
import { 
  useInvoiceLineItem, 
  useUpdateInvoiceLineItem, 
  useInvoiceMilestones 
} from '../../hooks/useInvoiceLineItems';
import { useInvoices } from '../../hooks/useInvoices';
import { useStatusList } from '../../hooks/useStatuses';

const InvoiceLineItemEdit = () => {
  const { id } = useParams(); // Extract from URL
  const navigate = useNavigate();
  
  const [invoiceId, setInvoiceId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [milestone, setMilestone] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch line item data using React Query
  const { 
    data: lineItem, 
    isLoading: loadingLineItem, 
    error: fetchError 
  } = useInvoiceLineItem(id);
  
  // Fetch statuses using React Query
  const { data: statuses = [], isLoading: loadingStatuses } = useStatusList();
  
  // Fetch all invoices using React Query
  const { data: invoicesData, isLoading: loadingInvoices } = useInvoices({ 
    vendorId: -1, 
    skip: 0, 
    limit: -1 
  });
  const invoices = invoicesData?.data || [];
  
  // Fetch milestones for the selected invoice
  const { 
    data: milestones = [], 
    isLoading: loadingMilestones 
  } = useInvoiceMilestones(invoiceId);
  
  // Update mutation
  const updateMutation = useUpdateInvoiceLineItem();

  // Populate form when line item data is loaded
  useEffect(() => {
    if (lineItem) {
      setInvoiceId(lineItem.invoice_id || '');
      setDescription(lineItem.description || '');
      setAmount(lineItem.amount || '');
      setStatus(lineItem.status || '');
      setDueDate(lineItem.due_date || '');
      setMilestone(lineItem.milestone_of_line_item || '');
    }
  }, [lineItem]);

  const handleInvoiceChange = (opt) => {
    const selectedInvoiceId = opt?.value || '';
    setInvoiceId(selectedInvoiceId);
    setMilestone('');
    setError((prev) => (prev === 'Please select a milestone' ? null : prev));
  };
  
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
      
      await updateMutation.mutateAsync({ id, data });
      
      setSuccess('Invoice Line Item updated successfully!');
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update Invoice Line Item');
      setSuccess(null);
    }
  };

  // Loading state
  if (loadingLineItem || loadingStatuses || loadingInvoices) {
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
          <i className="fa-solid fa-circle-exclamation"></i> Failed to load invoice line item data: {fetchError.message}
        </Alert>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i> Go Back
        </Button>
      </div>
    );
  }
  
  return (
    <div className='p-4'>
      <h3>Edit Invoice Line Item</h3>
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
            isDisabled={updateMutation.isPending || loadingMilestones}
            isLoading={loadingMilestones}
          />
          {milestones.length === 0 && !loadingMilestones && (
            <Form.Text className="text-muted">
              No milestones available for this invoice.
            </Form.Text>
          )}
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Invoice</Form.Label>
          <SelectFormField
            options={invoices.map(i => ({ value: i.id, label: i.number }))}
            value={invoices.find(i => i.id === invoiceId) ? { 
              value: invoiceId, 
              label: (invoices.find(i => i.id === invoiceId) || {}).number 
            } : null}
            onChange={handleInvoiceChange}
            placeholder="Select Invoice"
            isSearchable
            isDisabled={updateMutation.isPending}
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Description <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            disabled={updateMutation.isPending}
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
            disabled={updateMutation.isPending}
            placeholder="$0.00"
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Status</Form.Label>
          <SelectFormField
            options={statuses.map(s => ({ value: s.name, label: s.name }))}
            value={status ? { value: status, label: status } : null}
            onChange={(opt) => setStatus(opt?.value || '')}
            placeholder="Select Status"
            isSearchable
            isDisabled={updateMutation.isPending}
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Due Date <span className="text-danger">*</span></Form.Label>
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
          href={`/invoices/${invoiceId}`} 
          className="btn btn-secondary ms-2" 
          aria-label="Cancel"
        >
          <i className="fas fa-arrow-left"></i> Back to Invoice
        </a>
      </Form>
    </div>
  );
};

export default InvoiceLineItemEdit;
