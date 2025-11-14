
import  { useEffect, useState } from "react"
import { Form, Button, Container, Row, Col, Card, Breadcrumb, Alert, Spinner } from "react-bootstrap"
import { useParams } from "react-router-dom"

import PdfPreviewModal from "../../components/pdf-preview-modal/pdf-preview-modal"
import api from "../../api/Api"
import ConfirmModal from "../../components/ConfirmModal"
import SOWCreateModal from "../sows/create"
import "./vendors.css"

const VendorView = () => {
  const { id } = useParams() 
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [contactType, setContactType] = useState("")
  const [website, setWebsite] = useState("")
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [sows, setSows] = useState([])
  const [invoices, setInvoices] = useState([])
  const [fetchingSows, setFetchingSows] = useState(false)
  const [fetchingInvoices, setFetchingInvoices] = useState(false)
  const [openPDFView, setOpenPDFView] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showDeleteSOWModal, setShowDeleteSOWModal] = useState(false);
  const [showCreateSOWModal, setShowCreateSOWModal] = useState(false);
  const [showDeleteVendorModal, setShowDeleteVendorModal] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const [sowToDelete, setSowToDelete] = useState(null);
  const [reload, setReload] = useState(false);
  const [deleteItemType, setDeleteItemType] = useState("");
  const [isDeletingSOW, setIsDeletingSOW] = useState(false);
  const [isDeletingVendor, setIsDeletingVendor] = useState(false);

  useEffect(() => {
    // Fetch vendor data when component mounts
    const fetchSOW = async () => {
      try {
        const data = await api.vendors.get(id)
        updateDisplay(data)
      } catch (err) {
        setError("Failed to load Vendor data")
      }
    }
    fetchSOW()
  }, [id])


  const updateDisplay = (data) => {
    setName(data.name)
    setAddress(data.address)
    setContactName(data.contact_name)
    setContactEmail(data.contact_email)
    setContactPhone(data.contact_phone)
    setWebsite(data.website)
    setContactType(data.type)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
  }

  const fetchSows = async () => {
    setFetchingSows(true);
    try {
      const data = await api.sows.list(id, 0, -1) // No pagination limit
      setSows(data?.data)
      setFetchingSows(false);
    } catch (err) {
      console.error(err)
      setError("Error fetching SOWs")
      setSuccess(null)
    }
  }

    const fetchInvoices = async () => {
        setFetchingInvoices(true);
      const response = await api.invoices.list(id, 0, 10);
      setInvoices(response.data);
      setFetchingInvoices(false);
      return response;
    };
  
    useEffect(()=>{
        fetchInvoices();
        fetchSows();
    },[])

    useEffect(() => {
        if (reload) {
            fetchSows();
            setReload(false); // Reset the reload state
        }
    }, [reload])

    const onPreviewPDFClick=(file)=>{
        const url = api.documents.getUrl(file?.document);
        setPdfUrl(url);
        setOpenPDFView(true);
    }

    const handleDeleteSOW = async () => {
    if (!sowToDelete) return;

    setIsDeletingSOW(true);
    try {
      if (deleteItemType === 'sow') {
        await api.sows.delete(sowToDelete);
        setReload(true); // Refresh the SOWs data
        setSuccess('SOW successfully deleted!');
      } else if (deleteItemType === 'invoice') {
        await api.invoices.delete(sowToDelete);
        // Refresh invoices data
        fetchInvoices();
        setSuccess('Invoice successfully deleted!');
      }
      setError(null);
      setShowDeleteSOWModal(false);
      setSowToDelete(null);
    } catch (err) {
      setSuccess(null);
      setError(`Error deleting ${deleteItemType}: ${err.message}`);
      setShowDeleteSOWModal(false);
      setSowToDelete(null);
    } finally {
      setIsDeletingSOW(false);
    }
  }

  const handleDeleteVendor = async () => {
    if (!vendorToDelete) return;

    setIsDeletingVendor(true);
    try {
      await api.vendors.delete(vendorToDelete);
      setSuccess('Vendor deleted successfully!');
      setError(null);
      setShowDeleteVendorModal(false);
      setVendorToDelete(null);
      // Redirect to vendors list after successful deletion
      window.location.href = '/vendors';
    } catch (err) {
      setSuccess(null);
      setError(`Error deleting vendor: ${err.message}`);
      setShowDeleteVendorModal(false);
      setVendorToDelete(null);
    } finally {
      setIsDeletingVendor(false);
    }
  }

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
        <Button variant="text-primary" className="btn-link p-1" size="sm" onClick={()=>onPreviewPDFClick(file)}>
          <i className="fas fa-eye"></i>
          </Button>
        <Button
          variant="text-primary"
          className="btn-link p-1"
          size="sm"
          onClick={() => window.open(api.documents.getUrl(file?.document), "_blank", "noopener,noreferrer")}
          aria-label="Download"
        >
          <i className="fas fa-download"></i>
        </Button>
        <Button variant="text-danger" style={{color:"#0d6efd"}} className="p-1" size="sm" onClick={()=> {setSowToDelete(file.id); setDeleteItemType(type); setShowDeleteSOWModal(true)}}>
          <i className="fas fa-trash-alt"></i>
        </Button>
      </div>
    </div>
  )

  return (
    <Container fluid className="px-4 py-3" style={{ backgroundColor: "rgb(249, 251, 255)" }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-3">
        <Breadcrumb.Item href="/vendors">Vendors</Breadcrumb.Item>
        <Breadcrumb.Item active>View Vendor</Breadcrumb.Item>
      </Breadcrumb>

      {/* Header with Title and Action Buttons */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 mb-0 fw-bold text-dark">{name || "Adatum Corporation"}</h1>
        <div className="d-flex gap-2">
          <Button variant="danger" onClick={() => { setVendorToDelete(id); setShowDeleteVendorModal(true); }}>Delete</Button>
          <Button variant="primary" onClick={() => setShowCreateSOWModal(true)}>Add new SOW</Button>
        </div>
      </div>

      {/* Alert Messages */}
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Row className="gap-5 m-2">
        {/* Left Column - Vendor Details and Contact Info */}
        <Col lg={6} className="shadow-sm">
          {/* Vendor Details Card */}
          <Card className="border-0 ">
            <Card.Body className="p-4">
              <h5 className="fw-bold text-dark mb-4">Vendor Details</h5>
              <hr/>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-muted small">Vendor Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={name || "Adatum Corporation"}
                    onChange={(e) => setName(e.target.value)}
                    disabled
                    className="border-0 bg-light"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="text-muted small">Type</Form.Label>
                  <Form.Control
                    type="text"
                    value={contactType || "Data Engineering"}
                    onChange={(e) => setContactType(e.target.value)}
                    disabled
                    className="border-0 bg-light"
                  />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>

          {/* Contact Info Card */}
          <Card className="border-0 ">
            <Card.Body className="p-4">
              <h5 className="fw-bold text-dark mb-4">Contact Info</h5>
              <hr/>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label className="text-muted small">Contact Person</Form.Label>
                  <Form.Control
                    type="text"
                    value={contactName || "Elizabeth Moore"}
                    onChange={(e) => setContactName(e.target.value)}
                    disabled
                    className="border-0 bg-light"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="text-muted small">Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    value={contactPhone || "555-789-7890"}
                    onChange={(e) => setContactPhone(e.target.value)}
                    disabled
                    className="border-0 bg-light"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="text-muted small">Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    value={contactEmail || "elizabeth.moore@adatum.com"}
                    onChange={(e) => setContactEmail(e.target.value)}
                    disabled
                    className="border-0 bg-light"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="text-muted small">Website</Form.Label>
                  <Form.Control
                    type="text"
                    value={website || "http://www.adatum.com"}
                    onChange={(e) => setWebsite(e.target.value)}
                    disabled
                    className="border-0 bg-light"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="text-muted small">Location</Form.Label>
                  <Form.Control
                    type="text"
                    value={address || "789 Goldsmith Road, MainTown City"}
                    onChange={(e) => setAddress(e.target.value)}
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
                {fetchingSows &&            
                <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
            <Spinner animation="border" role="status" variant="primary">
            </Spinner>
        </div>}
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
                {fetchingInvoices && <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
            <Spinner animation="border" role="status" variant="primary">
            </Spinner>
        </div>}
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
        isLoading={isDeletingSOW}
      />

      <ConfirmModal
        show={showDeleteVendorModal}
        handleClose={() => setShowDeleteVendorModal(false)}
        handleConfirm={handleDeleteVendor}
        message="Are you sure you want to delete this Vendor? This action cannot be undone."
        isLoading={isDeletingVendor}
      />

          <SOWCreateModal 
        show={showCreateSOWModal} 
        onHide={() => setShowCreateSOWModal(false)} 
        
      />

    </Container>
  )
}

export default VendorView
