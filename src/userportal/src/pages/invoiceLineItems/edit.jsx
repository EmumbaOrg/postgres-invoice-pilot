import React, { useState, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { NumericFormat } from 'react-number-format';
import api from '../../api/Api';
import SelectFormField from '../../components/SelectFormField';

const InvoiceLineItemEdit = () => {
    const { id } = useParams(); // Extract from URL
    const [invoiceId, setInvoiceId] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    const [statuses, setStatuses] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [milestones, setMilestones] = useState([]);
    const [milestone, setMilestone] = useState('');
    
    useEffect(() => {
        // Fetch data when component mounts
        const fetchData = async () => {
        try {
            const data = await api.invoiceLineItems.get(id);
            updateDisplay(data);
        } catch (err) {
            setError('Failed to load Invoice Line Item data');
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

        const fetchInvoices = async () => {
            try {
                const data = await api.invoices.list(-1, 0, -1); // Fetch all invoices
                setInvoices(data.data);
            } catch (err) {
                setError('Failed to load invoices');
            }
        };
        fetchInvoices();
    }, [id]);

    useEffect(() => {
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
    
    const updateDisplay = (data) => {
        setInvoiceId(data.invoice_id);
        setDescription(data.description);
        setAmount(data.amount);
        setStatus(data.status);
        setDueDate(data.due_date || '');
        setMilestone(data.milestone_of_line_item || '');
    };

    const handleInvoiceChange = (opt) => {
        const selectedInvoiceId = opt?.value || '';
        setInvoiceId(selectedInvoiceId);
        setMilestones([]);
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
        var data = {
            invoice_id: invoiceId,
            milestone_of_line_item: milestone,
            description: description,
            amount: amount,
            status: status,
            due_date: dueDate
        };
        await api.invoiceLineItems.update(id, data);
    
        setSuccess('Invoice Line Item updated successfully!');
        setError(null);
        } catch (err) {
        console.error(err);
        setError('Failed to update Invoice Line Item');
        setSuccess(null);
        }
    };
    
    return (
        <div className='p-4'>
        <h3>Edit Invoice Line Item</h3>
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
                <Form.Label>Invoice</Form.Label>
                <SelectFormField
                  options={invoices.map(i => ({ value: i.id, label: i.number }))}
                  value={invoices.find(i => i.id == invoiceId) ? { value: invoiceId, label: (invoices.find(i => i.id == invoiceId) || {}).number } : null}
                  onChange={handleInvoiceChange}
                  placeholder="Select Invoice"
                  isSearchable
                />
            </Form.Group>
            <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                type="text"
                placeholder="Enter description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                />
            </Form.Group>
            <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <SelectFormField
                  options={statuses.map(s => ({ value: s.id, label: s.name }))}
                  value={statuses.find(s => s.id == status) ? { value: status, label: (statuses.find(s => s.id == status) || {}).name } : null}
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
                />
            </Form.Group>

            <Button type="submit" variant="primary">
                <i className="fas fa-save"></i> Save
            </Button>
            <a href={`/invoices/${invoiceId}`} className="btn btn-secondary ms-2" aria-label="Cancel">
                <i className="fas fa-arrow-left"></i> Back to Invoice
            </a>
        </Form>
        </div>
    );
};

export default InvoiceLineItemEdit;
