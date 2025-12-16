import { useState, useCallback } from "react";
import { Form, Button, Container, Row, Col, Card, Breadcrumb, Alert, Spinner } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";

import PdfPreviewModal from "../../components/pdf-preview-modal/pdf-preview-modal";
import ConfirmModal from "../../components/ConfirmModal";
import SOWCreateModal from "../sows/create";
import "./vendors.css";
import { useVendor, useDeleteVendor } from "../../hooks/useVendors";
import { useSOWs, useDeleteSOW } from "../../hooks/useSOWs";
import { useInvoices, useDeleteInvoice } from "../../hooks/useInvoices";
import { getDocumentUrl } from "../../hooks/useDocuments";

const VendorView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Fetch vendor data using React Query
  const { data: vendor, isLoading: loadingVendor, error: vendorError } = useVendor(id);
  
  // Fetch SOWs for this vendor
  const { data: sowsData, isLoading: fetchingSows, error: sowsError } = useSOWs({ 
    vendorId: id, 
    skip: 0, 
    limit: -1 
  });
  
  // Fetch invoices for this vendor
  const { data: invoicesData, isLoading: fetchingInvoices, error: invoicesError } = useInvoices({ 
    vendorId: id, 
    skip: 0, 
    limit: 10 
  });
  
  // Mutations
  const deleteVendorMutation = useDeleteVendor();
  const deleteSOWMutation = useDeleteSOW();
  const deleteInvoiceMutation = useDeleteInvoice();
  
  // Local state
  const [openPDFView, setOpenPDFView] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showDeleteSOWModal, setShowDeleteSOWModal] = useState(false);
  const [showCreateSOWModal, setShowCreateSOWModal] = useState(false);
  const [showDeleteVendorModal, setShowDeleteVendorModal] = useState(false);
  const [sowToDelete, setSowToDelete] = useState(null);
  const [deleteItemType, setDeleteItemType] = useState("");
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const sows = sowsData?.data || [];
  const invoices = invoicesData?.data || [];

  const onPreviewPDFClick = useCallback((file) => {
    const url = getDocumentUrl(file?.document);
    setPdfUrl(url);
    setOpenPDFView(true);
  }, []);

  const handleDeleteSOW = async () => {
    if (!sowToDelete) return;

    try {
      if (deleteItemType === 'sow') {
        await deleteSOWMutation.mutateAsync(sowToDelete);
        setSuccessMessage('SOW successfully deleted!');
      } else if (deleteItemType === 'invoice') {
        await deleteInvoiceMutation.mutateAsync(sowToDelete);
        setSuccessMessage('Invoice successfully deleted!');
      }
      setErrorMessage(null);
      setShowDeleteSOWModal(false);
      setSowToDelete(null);
    } catch (err) {
      setErrorMessage(`Error deleting ${deleteItemType}: ${err.message}`);
      setSuccessMessage(null);
      setShowDeleteSOWModal(false);
      setSowToDelete(null);
    }
  };

  const handleDeleteVendor = async () => {
    if (!id) return;

    try {
      await deleteVendorMutation.mutateAsync(id);
      setSuccessMessage('Vendor deleted successfully!');
      setErrorMessage(null);
      setShowDeleteVendorModal(false);
      // Redirect to vendors list after successful deletion
      navigate('/vendors');
    } catch (err) {
      setErrorMessage(`Error deleting vendor: ${err.message}`);
      setSuccessMessage(null);
      setShowDeleteVendorModal(false);
    }
  };

  const FileListItem = ({ file, type }) => (
    <div className="file-list-item d-flex align-items-center justify-content-between p-3" style={{border: "1px solid #EBF2FF", borderRadius: "8px", marginBottom: "10px"}}>
      <div className="d-flex align-items-center flex-grow-1 min-w-0 me-2">
        <div className="me-3 flex-shrink-0">
          <i className="fas fa-file-pdf text-primary" style={{ fontSize: "24px" }}></i>
        </div>
        <div className="min-w-0 flex-grow-1">
          <div className="fw-medium text-dark file-name-text">{file?.number} {file?.document} </div>
          <small className="text-muted d-block text-truncate">
            {file?.start_date || file?.invoice_date}
          </small>
        </div>
      </div>
      <div className="d-flex gap-2 flex-shrink-0">
        <Button variant="text-primary" className="btn-link p-1" size="sm" onClick={() => onPreviewPDFClick(file)}>
          <i className="fas fa-eye"></i>
        </Button>
        <Button
          variant="text-primary"
          className="btn-link p-1"
          size="sm"
          onClick={() => window.open(getDocumentUrl(file?.document), "_blank", "noopener,noreferrer")}
          aria-label="Download"
        >
          <i className="fas fa-download"></i>
        </Button>
        <Button 
          variant="text-danger" 
          style={{color:"#0d6efd"}} 
          className="p-1" 
          size="sm" 
          onClick={() => { 
            setSowToDelete(file.id); 
            setDeleteItemType(type); 
            setShowDeleteSOWModal(true);
          }}
        >
          <i className="fas fa-trash-alt"></i>
        </Button>
      </div>
    </div>
  );

  // Loading state
  if (loadingVendor) {
    return (
      <Container fluid className="px-4 py-3">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <Spinner animation="border" role="status" variant="primary" />
        </div>
      </Container>
    );
  }

  // Error state
  const error = vendorError || sowsError || invoicesError || errorMessage;

  return (
    <Container fluid className="px-4 py-3" style={{ backgroundColor: "rgb(249, 251, 255)" }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-3">
        <Breadcrumb.Item href="/vendors">Vendors</Breadcrumb.Item>
        <Breadcrumb.Item active>View Vendor</Breadcrumb.Item>
      </Breadcrumb>

      {/* Header with Title and Action Buttons */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 mb-0 fw-bold text-dark">{vendor?.name || "Vendor"}</h1>
        <div className="d-flex gap-2">
          <Button variant="danger" onClick={() => { setVendorToDelete(id); setShowDeleteVendorModal(true); }}>Delete</Button>
          <Button variant="primary" onClick={() => setShowCreateSOWModal(true)}>Add new SOW</Button>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setErrorMessage(null)}>
          {typeof error === 'string' ? error : error?.message}
        </Alert>
      )}
      {successMessage && (
        <Alert variant="success" dismissible onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      <Row className="gap-5 m-2">
        {/* Left Column - Vendor Details and Contact Info */}
        <Col lg={6} className="shadow-sm">
          {/* Vendor Details Card */}
          <Card className="border-0">
            <Card.Body className="p-4">
              <h5 className="fw-bold text-dark mb-4">Vendor Details</h5>
              <hr/>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label className="text-muted small">Vendor Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={vendor?.name || ""}
                    disabled
                    className="border-0 bg-light"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="text-muted small">Type</Form.Label>
                  <Form.Control
                    type="text"
                    value={vendor?.type || ""}
                    disabled
                    className="border-0 bg-light"
                  />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>

          {/* Contact Info Card */}
          <Card className="border-0">
            <Card.Body className="p-4">
              <h5 className="fw-bold text-dark mb-4">Contact Info</h5>
              <hr/>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label className="text-muted small">Contact Person</Form.Label>
                  <Form.Control
                    type="text"
                    value={vendor?.contact_name || ""}
                    disabled
                    className="border-0 bg-light"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="text-muted small">Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    value={vendor?.contact_phone || ""}
                    disabled
                    className="border-0 bg-light"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="text-muted small">Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    value={vendor?.contact_email || ""}
                    disabled
                    className="border-0 bg-light"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="text-muted small">Website</Form.Label>
                  <Form.Control
                    type="text"
                    value={vendor?.website || ""}
                    disabled
                    className="border-0 bg-light"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="text-muted small">Location</Form.Label>
                  <Form.Control
                    type="text"
                    value={vendor?.address || ""}
                    disabled
                    className="border-0 bg-light"
                  />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column - SOWs and Invoices */}
        <Col lg={5}>
          {/* SOWs Card */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Body className="p-4">
              <div className="">
                <h5 className="fw-bold text-dark mb-0">SOWs</h5>
              </div>
              <hr/>
              <div>
                {fetchingSows && (
                  <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                    <Spinner animation="border" role="status" variant="primary" />
                  </div>
                )}
                {!fetchingSows && sows.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted">No SOWs have been added yet.</p>
                  </div>
                )}
                {sows.map((sow) => (
                  <FileListItem key={sow.id} file={sow} type="sow" />
                ))}
              </div>
            </Card.Body>
          </Card>

          {/* Invoices Card */}
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <div className="">
                <h5 className="fw-bold text-dark mb-0">Invoices</h5>
              </div>
              <hr/>
              <div>
                {fetchingInvoices && (
                  <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                    <Spinner animation="border" role="status" variant="primary" />
                  </div>
                )}
                {!fetchingInvoices && invoices.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted">No Invoices have been added yet.</p>
                  </div>
                )}
                {invoices.map((invoice) => (
                  <FileListItem key={invoice.id} file={invoice} type="invoice" />
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modals */}
      <PdfPreviewModal
        show={openPDFView}
        handleClose={() => setOpenPDFView(false)}
        fileUrl={pdfUrl}
      />

      <ConfirmModal
        show={showDeleteSOWModal}
        handleClose={() => setShowDeleteSOWModal(false)}
        handleConfirm={handleDeleteSOW}
        message={`Are you sure you want to delete this ${deleteItemType === 'sow' ? 'SOW' : 'Invoice'}?`}
        isLoading={deleteSOWMutation.isPending || deleteInvoiceMutation.isPending}
      />

      <ConfirmModal
        show={showDeleteVendorModal}
        handleClose={() => setShowDeleteVendorModal(false)}
        handleConfirm={handleDeleteVendor}
        message="Are you sure you want to delete this Vendor? This action cannot be undone."
        isLoading={deleteVendorMutation.isPending}
      />

      <SOWCreateModal 
        show={showCreateSOWModal} 
        onHide={() => setShowCreateSOWModal(false)} 
        vendorId={id}
      />
    </Container>
  );
};

export default VendorView;
