import ReactMarkdown from 'react-markdown';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { NumericFormat } from 'react-number-format';
import { Dropdown, Form, Button, Row, Col, Spinner, Alert, Modal, Breadcrumb } from 'react-bootstrap';

import api from '../../api/Api';
import InvoiceCreate from './create';
import PagedTable from '../../components/PagedTable';
import ConfirmModal from '../../components/ConfirmModal';
import StatusChip from '../../components/status-chip/status-chip';
import ActivityTile from '../../components/activity-tile/activity-tile';
import SelectFormField from '../../components/SelectFormField';

const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const InvoiceEdit = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const { id } = useParams(); // Extract Vendor ID from URL
  const [vendorId, setVendorId] = useState(0);
  const [sowId, setSowId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [document, setDocument] = useState('');
  const [metadata, setMetadata] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [validating, setValidating] = useState(false);
  const [showDeleteInvoiceLineItemModal, setShowDeleteInvoiceLineItemModal] = useState(false);
  const [reloadInvoiceLineItems, setReloadInvoiceLineItems] = useState(false);
  const [invoiceLineItemToDelete, setInvoiceLineItemToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sowToDelete, setSowToDelete] = useState(null);

  const [statuses, setStatuses] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [sows, setSows] = useState([]);
  const [validations, setValidations] = useState([]);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initialInvoiceLineItems, setInitialInvoiceLineItems] = useState(null);
  const [initialInvoiceLineItemsMeta, setInitialInvoiceLineItemsMeta] = useState({ total: 0, skip: 0, limit: 10 });

  useEffect(() => {
    const message = query.get('success');
    if (message) {
      setSuccess(message);
    }
    const validation = query.get('showValidation');
    if (validation) {
      setShowValidation(true);
    }
  }, [useLocation().search]);

  useEffect(() => {
    // Load core invoice + reference data together and show a loading state
    const loadAll = async () => {
      setIsLoading(true);
      try {
        const invoicePromise = await api.invoices.get(id);
        const statusesPromise = await  api.statuses.list();
        const vendorsPromise = await api.vendors.list(0, -1);

        const [invoiceData, statusesData, vendorsData] = await Promise.all([
          invoicePromise,
          statusesPromise,
          vendorsPromise,
        ]);

        updateDisplay(invoiceData);
        setStatuses(statusesData || []);
        setVendors(vendorsData?.data || []);

        // Fetch validations and invoice line items after invoice is available
        try {
          const [validationsData, lineItemsData] = await Promise.all([
            api.validationResults.invoice(id),
            api.invoiceLineItems.list(id, 0, -1),
          ]);
          setValidations(validationsData?.data || []);
          if (lineItemsData) {
            setInitialInvoiceLineItems(lineItemsData.data || []);
            setInitialInvoiceLineItemsMeta({ total: lineItemsData.total || 0, skip: lineItemsData.skip || 0, limit: lineItemsData.limit || 10 });
          }
        } catch (err) {
          console.error(err);
          setError('Error fetching Validations or Line Items');
          setSuccess(null);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load Invoice data');
      } finally {
        setIsLoading(false);
      }
    };

    loadAll();
  }, [id]);

  useEffect(() => {
    // Fetch SOWs when vendor changes
    const fetchSows = async () => {
      try {
        const data = await api.sows.list(vendorId, 0, -1); // No pagination limit
        setSows(data.data);
      } catch (err) {
        setError('Failed to load SOWs');
      }
    };
    fetchSows();
  }, [vendorId]);

  const updateDisplay = (data) => {
    setVendorId(data.vendor_id);
    setSowId(data.sow_id);
    setInvoiceNumber(data.number);
    setAmount(data.amount);
    setInvoiceDate(data.invoice_date);
    setPaymentStatus(data.payment_status);
    setDocument(data.document);
    setMetadata(data.metadata ? JSON.stringify(data.metadata, null, 2) : '');
  };

  const fetchInvoiceLineItems = async () => {
    try {
      const result = await api.invoiceLineItems.list(id, 0, -1); // No pagination limit
      return result;
    } catch (err) {
      console.error(err);
      setError('Failed to load Invoice Line Items');
      setSuccess(null);
    }
  };

  const invoiceLineItemsColumns = React.useMemo(
    () => [
      {
        Header: "Description",
        accessor: "description",
      },
      {
        Header: "Amount",
        accessor: "amount",
      },
      { 
        Header: "Due Date",
        accessor: "due_date",
      },
      {
        Header: "Payment Status",
        accessor: "status",
          Cell: ({ value }) => {
          return <StatusChip status={value} />;
        },
      },
      {
        Header: "",
        accessor: "actions",
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
              <Dropdown.Item href={`/invoice-line-items/${row.original.id}`} className="d-flex align-items-center gap-1">
              <i className="fas fa-edit" style={{ color: 'var(--bs-primary)' }} />
                Edit
              </Dropdown.Item>
               <Dropdown.Item  
               className="d-flex align-items-center gap-1"
                onClick={() => {
                    setInvoiceLineItemToDelete(row.original.id);
                    setShowDeleteInvoiceLineItemModal(true);
             }}>
              <i className="fas fa-trash" style={{ color: 'var(--bs-danger)' }} />
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

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setIsSaving(true);
    try {
      var data = {
        vendor_id: vendorId,
        sow_id: sowId,
        number: invoiceNumber,
        amount: amount,
        invoice_date: invoiceDate,
        payment_status: paymentStatus
      };
      var updatedItem = await api.invoices.update(id, data);
      
      updateDisplay(updatedItem);
      setSuccess('Invoice updated successfully!');
      setError(null);
      setTimeout(() => {
        navigate('/invoices');
      }, 500);
    } catch (err) {
      console.error(err);
      setError('Failed to update Invoice');
      setSuccess(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteInvoiceLineItem = async () => {
    if (!invoiceLineItemToDelete) {
      return;
    }

    try {
      await api.invoiceLineItems.delete(invoiceLineItemToDelete);
      setShowDeleteInvoiceLineItemModal(false);
      setInvoiceLineItemToDelete(null);

      const refreshed = await fetchInvoiceLineItems();
      if (refreshed) {
        setInitialInvoiceLineItems(refreshed.data || []);
        setInitialInvoiceLineItemsMeta({
          total: refreshed.total || 0,
          skip: refreshed.skip || 0,
          limit: refreshed.limit || 10,
        });
      }

      setReloadInvoiceLineItems((prev) => !prev);
      setSuccess('Invoice Line Item deleted successfully!');
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to delete Invoice Line Item');
    }
  };

  const runManualValidation = async () => {
    try {
      setValidating(true);
      await api.invoices.validate(id);
      window.location.href = `/invoices/${id}?showValidation=true`;
    }
    catch (err) {
      setValidating(false);
      console.error(err);
      setError('Manual validation failed!');
    }
  };

  const onAddAnotherInvoice = () => {
    setShowCreateInvoiceModal(true);
    setShowValidation(false);
    setSuccess(null);
    setError(null);
  };

  const handleDelete = async () => {
    if (!sowToDelete) return;

    try {
      await api.invoices.delete(sowToDelete);
      setSuccess('Invoice deleted successfully!');
      setError(null);
      setShowDeleteModal(false);
      // Redirect to invoices list after successful deletion
      window.location.href = '/invoices';
    } catch (err) {
      setSuccess(null);
      setError(err.message);
      setShowDeleteModal(false);
    }
  }

  if (isLoading) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ height: '60vh' }}>
        <Spinner animation="border" role="status" variant="primary" />
      </div>
    );
  }

  return (
    <div className='px-5 py-3' style={{ backgroundColor: "rgb(249, 251, 255)", position: "relative" }}>
    <div className='position-absolute top-0' style={{left:"38%"}}>
  
       {error && (
            <Alert variant="danger"  dismissible onClose={() => setError(null)}>
             <i className="fa-solid fa-circle-exclamation" variant="danger"></i> {error}
            </Alert>
          )}
           {success && (
            <Alert variant="success"  dismissible onClose={() => setSuccess(null)}>
             <i className="fa-solid fa-circle-check" variant="success"></i> {success}
            </Alert>
          )}
        </div>

          <Breadcrumb className="mb-3">
              <Breadcrumb.Item href="/sows">Inoivces</Breadcrumb.Item>
              <Breadcrumb.Item active>View Invoice</Breadcrumb.Item>
            </Breadcrumb>
 <div className='d-flex align-items-center justify-content-between mb-4'>
            <h3>{invoiceNumber}</h3>
            <div className='d-flex align-items-center gap-3'>
        <Button type="button" variant="danger" className="ms-2" onClick={() => { setSowToDelete(id); setShowDeleteModal(true); }}>
          Delete
        </Button>
             <Button type="button" variant="primary" onClick={handleSubmit} disabled={isSaving}>
           {isSaving ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>

            </div>

            </div>
     <div class="p-4 background-styled">
      <h3>Invoice Details</h3>
      <hr/>
      {!validating && (
        <>
      <Form onSubmit={handleSubmit}>
        <Row className='gap-3'>
          <Col>
            <Form.Group className="mb-3">
          <Form.Label>Invoice Number</Form.Label>
          <Form.Control
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            required
          />
        </Form.Group>
          </Col>
            <Col>
              <Form.Group>
                <Form.Label>SOW</Form.Label>
                <SelectFormField
                  options={sows.map(s => ({ value: s.id, label: s.number }))}
                  value={sows.find(s => s.id == sowId) ? { value: sowId, label: (sows.find(s => s.id == sowId) || {}).number } : null}
                  onChange={(opt) => setSowId(opt?.value || '')}
                  placeholder={sows.length === 0 ? 'Loading SOWs...' : 'Select SOW'}
                  isSearchable
                  isDisabled={sows.length === 0}
                />
              </Form.Group>
            </Col>
            <Col>
            <Form.Group className="mb-3">
              <Form.Label>Amount</Form.Label>
              <NumericFormat
                className="form-control"
                value={amount}
                onValueChange={(values) => setAmount(values.floatValue)}
                thousandSeparator={true}
                prefix={'$'}
                required
              />
            </Form.Group>
          </Col>
        </Row>
      
        <Row className='gap-3'>
          <Col>
            <Form.Group>
              <Form.Label>Vendor</Form.Label>
              <SelectFormField
                options={vendors.map(v => ({ value: v.id, label: v.name }))}
                value={vendors.find(v => v.id == vendorId) ? { value: vendorId, label: (vendors.find(v => v.id == vendorId) || {}).name } : null}
                onChange={(opt) => setVendorId(opt?.value || '')}
                placeholder={vendors.length === 0 ? 'Loading Vendors...' : 'Select Vendor'}
                isSearchable
                isDisabled={vendors.length === 0}
              />
            </Form.Group>
        </Col>
          <Col>
            <Form.Group className="mb-3">
              <Form.Label>Invoice Date</Form.Label>
              <Form.Control
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
              />
            </Form.Group>
          </Col>
          <Col>
            <Form.Group className="mb-3">
              <Form.Label>Payment Status</Form.Label>
              <Form.Control
                as="select"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
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
          </Col>
        </Row>
        <Form.Group className="mb-3">
          <Form.Label>Document</Form.Label>
          <div className="d-flex align-items-center gap-3">         
            <ActivityTile
              icon={<i className="fa-solid fa-file-invoice"></i>}
              title={document}
              showMenu={false}
            />
                <a href={api.documents.getUrl(document)} target="_blank" rel="noreferrer">
              <i className="fas fa-download ms-3"></i>
            </a>
          </div>
        </Form.Group>
        {/* <Form.Group className="mb-3">
          <Form.Label>Metadata</Form.Label>
          <Form.Control
            as="textarea"
            value={metadata}
            onChange={(e) => setMetadata(e.target.value)}
            style={{ height: '8em' }}
            readOnly
          />
        </Form.Group> */}
      </Form>

      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h3 className="h3">Line Items</h3>
      <hr />
        <Button variant="outline-primary" onClick={() => window.location.href = `/invoice-line-items/create/${id}`}>
         <i className="fas fa-plus" /> New Line Item
        </Button>
      </div>

      <PagedTable columns={invoiceLineItemsColumns}
        fetchData={fetchInvoiceLineItems}
        reload={reloadInvoiceLineItems}
        showPagination={false}
        noDataMessage={'No Line Items have been added yet.'}
        noDataDescription={'Click on "Add New Line Item" to begin adding line items.'}
        initialData={initialInvoiceLineItems}
        initialTotal={initialInvoiceLineItemsMeta.total}
        initialSkip={initialInvoiceLineItemsMeta.skip}
        initialLimit={initialInvoiceLineItemsMeta.limit}
        initialLoadCompleted={initialInvoiceLineItems !== null}
        />

      <ConfirmModal
        show={showDeleteInvoiceLineItemModal}
        handleClose={() => setShowDeleteInvoiceLineItemModal(false)}
        handleConfirm={handleDeleteInvoiceLineItem}
        title="Delete Invoice Line Item"
        message="Are you sure you want to delete this Invoice Line Item?"
        />

        <hr />

        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h3 className="h3">Validations</h3>
          <Button variant="outline-primary" onClick={() => runManualValidation()}>
           <i class="fa-solid fa-caret-right"></i>  Run Manual Validation
          </Button>
        </div>
    
        <table className="table">
          <thead>
            <tr role="row">
              <th colspan="1" role="columnheader">Status</th>
              <th colspan="1" role="columnheader">Timestamp</th>
              <th colspan="1" role="columnheader">Description</th>
            </tr>
          </thead>
          <tbody>
            {validations.length === 0 && (
              <tr>
                <td colspan="3">No validations found</td>
                </tr>
                )}
            {validations.map((validation) => (
              <tr key={validation.id}>
                <td>{validation.validation_passed ? <span className='status-chip-success'> Passed</span> : <span className='status-chip-error'> Failed</span>}</td>
                <td>{validation.datestamp}</td>
                <td>
                  <div style={{ height: '12em', overflowY: 'scroll', padding: '12px' }}>
                    <ReactMarkdown>{validation.result}</ReactMarkdown>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </>
      )}
    
    </div>
      {showValidation && validations && validations.length > 0 && (
        <Modal
  show={true}
  onHide={() => setShowValidation(false)}
  centered
  size='lg'
>
  <Modal.Header closeButton>
    <Modal.Title className="flex-wrap">
      Validation Results
      {validations[0].validation_passed ? (
        <span className="status-chip-success">Passed</span>
      ) : (
        <span className="status-chip-error">Failed</span>
      )}
    </Modal.Title>
  </Modal.Header>

  <Modal.Body>
    <div style={{ height: '30em', overflowY: 'scroll', border: '0.1em #ccc solid', padding:'20px', borderRadius: '8px' }}>
      <ReactMarkdown>{validations[0].result}</ReactMarkdown>
    </div>
  </Modal.Body>

  <Modal.Footer>
     <Button variant="outline-primary" onClick={() => onAddAnotherInvoice()}>
     Add Another Invoice
    </Button>
    <Button variant="primary" onClick={() => setShowValidation(false)}>
      View Invoice
    </Button>
  </Modal.Footer>
</Modal>
      )}
        {validating && (
          <Alert variant="info" className="mt-3 p-5 text-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Validating document with AI...</span>
            </Spinner>
            <div>Validating document with AI...</div>
          </Alert>
          )}
          <InvoiceCreate
          show={showCreateInvoiceModal}
          onHide={() => setShowCreateInvoiceModal(false)}
          />

      <ConfirmModal
        show={showDeleteModal}
        handleClose={() => setShowDeleteModal(false)}
        handleConfirm={handleDelete}
        message="Are you sure you want to delete this Invoice?"
      />
    </div>
  );
};

export default InvoiceEdit;