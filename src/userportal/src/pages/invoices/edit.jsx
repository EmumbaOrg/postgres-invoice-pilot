import ReactMarkdown from 'react-markdown';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NumericFormat } from 'react-number-format';
import { Dropdown, Form, Button, Row, Col, Spinner, Alert, Modal, Breadcrumb } from 'react-bootstrap';

import InvoiceCreate from './create';
import PagedTable from '../../components/PagedTable';
import ConfirmModal from '../../components/ConfirmModal';
import StatusChip from '../../components/status-chip/status-chip';
import ActivityTile from '../../components/activity-tile/activity-tile';
import SelectFormField from '../../components/SelectFormField';
import { 
  useInvoice, 
  useUpdateInvoice, 
  useValidateInvoice, 
  useDeleteInvoice,
  useInvoiceValidationResults 
} from '../../hooks/useInvoices';
import { useAllVendors } from '../../hooks/useVendors';
import { useSOWs } from '../../hooks/useSOWs';
import { useStatusList } from '../../hooks/useStatuses';
import { 
  useInvoiceLineItems, 
  useDeleteInvoiceLineItem 
} from '../../hooks/useInvoiceLineItems';
import { getDocumentUrl } from '../../hooks/useDocuments';

const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const InvoiceEdit = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [vendorId, setVendorId] = useState(0);
  const [sowId, setSowId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [document, setDocument] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showValidation, setShowValidation] = useState(false);
  const [showDeleteInvoiceLineItemModal, setShowDeleteInvoiceLineItemModal] = useState(false);
  const [reloadInvoiceLineItems, setReloadInvoiceLineItems] = useState(false);
  const [invoiceLineItemToDelete, setInvoiceLineItemToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);

  // Fetch invoice data using React Query
  const { 
    data: invoice, 
    isLoading: loadingInvoice, 
    error: invoiceError 
  } = useInvoice(id);
  
  // Fetch reference data
  const { data: statuses = [], isLoading: loadingStatuses } = useStatusList();
  const { data: vendorsData, isLoading: loadingVendors } = useAllVendors();
  const vendors = vendorsData?.data || [];
  
  // Fetch SOWs for selected vendor
  const { data: sowsData, isLoading: loadingSOWs } = useSOWs({ 
    vendorId, 
    skip: 0, 
    limit: -1 
  });
  const sows = sowsData?.data || [];
  
  // Fetch invoice line items
  const { 
    data: lineItemsData, 
    isLoading: loadingLineItems 
  } = useInvoiceLineItems({ 
    invoiceId: id, 
    skip: 0, 
    limit: -1 
  });
  
  // Fetch validation results
  const { 
    data: validationsData 
  } = useInvoiceValidationResults(id);
  const validations = validationsData?.data || [];
  
  // Mutations
  const updateMutation = useUpdateInvoice();
  const validateMutation = useValidateInvoice();
  const deleteMutation = useDeleteInvoice();
  const deleteLineItemMutation = useDeleteInvoiceLineItem();

  // Check for query params and clear them immediately to prevent loops
  useEffect(() => {
    const message = query.get('success');
    const validation = query.get('showValidation');
    
    // Only process if there are relevant params
    if (message || validation) {
      if (message) {
        setSuccess(message);
      }
      if (validation) {
        setShowValidation(true);
      }
      
      // Clear the URL parameters immediately to prevent re-triggering
      const url = new URL(window.location);
      url.searchParams.delete('success');
      url.searchParams.delete('showValidation');
      window.history.replaceState({}, document.title, url.pathname + url.search);
    }
  }, []); // Empty dependency array - only run once on mount

  // Populate form when invoice data is loaded
  useEffect(() => {
    if (invoice) {
      setVendorId(invoice.vendor_id || 0);
      setSowId(invoice.sow_id || '');
      setInvoiceNumber(invoice.number || '');
      setAmount(invoice.amount || '');
      setInvoiceDate(invoice.invoice_date || '');
      setPaymentStatus(invoice.payment_status || '');
      setDocument(invoice.document || '');
    }
  }, [invoice]);

  const fetchInvoiceLineItems = useCallback(async () => {
    if (!lineItemsData) {
      return {
        data: [],
        total: 0,
        skip: 0,
        limit: 10
      };
    }
    return lineItemsData;
  }, [lineItemsData]);

  const invoiceLineItemsColumns = useMemo(
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
                <Dropdown.Item 
                  href={`/invoice-line-items/${row.original.id}`} 
                  className="d-flex align-items-center gap-1"
                >
                  <i className="fas fa-edit" style={{ color: 'var(--bs-primary)' }} />
                  Edit
                </Dropdown.Item>
                <Dropdown.Item  
                  className="d-flex align-items-center gap-1"
                  onClick={() => {
                    setInvoiceLineItemToDelete(row.original.id);
                    setShowDeleteInvoiceLineItemModal(true);
                  }}
                >
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
    
    try {
      const data = {
        vendor_id: vendorId,
        sow_id: sowId,
        number: invoiceNumber,
        amount: amount,
        invoice_date: invoiceDate,
        payment_status: paymentStatus
      };
      
      await updateMutation.mutateAsync({ id, data });
      
      setSuccess('Invoice updated successfully!');
      setError(null);
      
      setTimeout(() => {
        navigate('/invoices');
      }, 500);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update Invoice');
      setSuccess(null);
    }
  };

  const handleDeleteInvoiceLineItem = async () => {
    if (!invoiceLineItemToDelete) {
      return;
    }

    try {
      await deleteLineItemMutation.mutateAsync(invoiceLineItemToDelete);
      
      setShowDeleteInvoiceLineItemModal(false);
      setInvoiceLineItemToDelete(null);
      setReloadInvoiceLineItems((prev) => !prev);
      setSuccess('Invoice Line Item deleted successfully!');
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete Invoice Line Item');
    }
  };

  const runManualValidation = async () => {
    try {
      await validateMutation.mutateAsync(id);
      window.location.href = `/invoices/${id}?showValidation=true`;
    } catch (err) {
      console.error(err);
      setError(err.message || 'Manual validation failed!');
    }
  };

  const onAddAnotherInvoice = () => {
    setShowCreateInvoiceModal(true);
    setShowValidation(false);
    setSuccess(null);
    setError(null);
  };

  const handleCloseValidationModal = () => {
    setShowValidation(false);
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      await deleteMutation.mutateAsync(id);
      setSuccess('Invoice deleted successfully!');
      setError(null);
      setShowDeleteModal(false);
      
      // Redirect to invoices list after successful deletion
      setTimeout(() => {
        navigate('/invoices');
      }, 500);
    } catch (err) {
      setError(err.message || 'Failed to delete invoice');
      setSuccess(null);
      setShowDeleteModal(false);
    }
  };

  // Loading state
  const isLoading = loadingInvoice || loadingStatuses || loadingVendors;

  if (isLoading) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ height: '60vh' }}>
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  // Error state
  if (invoiceError) {
    return (
      <div className='px-5 py-3'>
        <Alert variant="danger">
          <i className="fa-solid fa-circle-exclamation"></i> Failed to load invoice data: {invoiceError.message}
        </Alert>
        <Button variant="secondary" onClick={() => navigate('/invoices')}>
          <i className="fas fa-arrow-left"></i> Back to Invoices
        </Button>
      </div>
    );
  }

  return (
    <div className='px-5 py-3' style={{ backgroundColor: "rgb(249, 251, 255)", position: "relative" }}>
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

      <Breadcrumb className="mb-3">
        <Breadcrumb.Item href="/invoices">Invoices</Breadcrumb.Item>
        <Breadcrumb.Item active>View Invoice</Breadcrumb.Item>
      </Breadcrumb>

      <div className='d-flex align-items-center justify-content-between mb-4'>
        <h3>{invoiceNumber}</h3>
        <div className='d-flex align-items-center gap-3'>
          <Button 
            type="button" 
            variant="danger" 
            className="ms-2" 
            onClick={() => setShowDeleteModal(true)}
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
          <Button 
            type="button" 
            variant="primary" 
            onClick={handleSubmit} 
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
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

      <div className="p-4 background-styled">
        <h3>Invoice Details</h3>
        <hr/>
        
        {!validateMutation.isPending && (
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
                      disabled={updateMutation.isPending}
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Label>SOW</Form.Label>
                    <SelectFormField
                      options={sows.map(s => ({ value: s.id, label: s.number }))}
                      value={sows.find(s => s.id === sowId) ? { 
                        value: sowId, 
                        label: (sows.find(s => s.id === sowId) || {}).number 
                      } : null}
                      onChange={(opt) => setSowId(opt?.value || '')}
                      placeholder={loadingSOWs ? 'Loading SOWs...' : 'Select SOW'}
                      isSearchable
                      isDisabled={updateMutation.isPending || loadingSOWs}
                      isLoading={loadingSOWs}
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
                      disabled={updateMutation.isPending}
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
                      value={vendors.find(v => v.id === vendorId) ? { 
                        value: vendorId, 
                        label: (vendors.find(v => v.id === vendorId) || {}).name 
                      } : null}
                      onChange={(opt) => setVendorId(opt?.value || '')}
                      placeholder="Select Vendor"
                      isSearchable
                      isDisabled={updateMutation.isPending}
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
                      disabled={updateMutation.isPending}
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
                      disabled={updateMutation.isPending}
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
                  <a href={getDocumentUrl(document)} target="_blank" rel="noreferrer">
                    <i className="fas fa-download ms-3"></i>
                  </a>
                </div>
              </Form.Group>
            </Form>

            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
              <h3 className="h3">Line Items</h3>
              <Button 
                variant="outline-primary" 
                onClick={() => navigate(`/invoice-line-items/create/${id}`)}
              >
                <i className="fas fa-plus" /> New Line Item
              </Button>
            </div>

            <PagedTable 
              columns={invoiceLineItemsColumns}
              fetchData={fetchInvoiceLineItems}
              reload={reloadInvoiceLineItems}
              showPagination={false}
              noDataMesssage={'No Line Items have been added yet.'}
              noDataDescription={'Click on "Add New Line Item" to begin adding line items.'}
              initialData={lineItemsData?.data || []}
              initialTotal={lineItemsData?.total || 0}
              initialSkip={lineItemsData?.skip || 0}
              initialLimit={lineItemsData?.limit || 10}
              initialLoadCompleted={!loadingLineItems}
              isExternalLoading={loadingLineItems}
            />

            <ConfirmModal
              show={showDeleteInvoiceLineItemModal}
              handleClose={() => setShowDeleteInvoiceLineItemModal(false)}
              handleConfirm={handleDeleteInvoiceLineItem}
              title="Delete Invoice Line Item"
              message="Are you sure you want to delete this Invoice Line Item?"
              isLoading={deleteLineItemMutation.isPending}
            />

            <hr />

            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
              <h3 className="h3">Validations</h3>
              <Button 
                variant="outline-primary" 
                onClick={runManualValidation}
                disabled={validateMutation.isPending}
              >
                <i className="fa-solid fa-caret-right"></i> Run Manual Validation
              </Button>
            </div>
        
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="table">
                <thead>
                  <tr role="row">
                    <th colSpan="1" role="columnheader">Status</th>
                    <th colSpan="1" role="columnheader">Timestamp</th>
                    <th colSpan="1" role="columnheader">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {validations.length === 0 && (
                    <tr>
                      <td colSpan="3">No validations found</td>
                    </tr>
                  )}
                  {validations.map((validation) => (
                    <tr key={validation.id}>
                      <td>
                        {validation.validation_passed ? (
                          <span className='status-chip-success'> Passed</span>
                        ) : (
                          <span className='status-chip-error'> Failed</span>
                        )}
                      </td>
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
            </div>
          </>
        )}
      </div>

      {showValidation && validations && validations.length > 0 && (
        <Modal
          show={showValidation}
          onHide={handleCloseValidationModal}
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
            <Button variant="outline-primary" onClick={onAddAnotherInvoice}>
              Add Another Invoice
            </Button>
            <Button variant="primary" onClick={handleCloseValidationModal}>
              View Invoice
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {validateMutation.isPending && (
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
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default InvoiceEdit;
