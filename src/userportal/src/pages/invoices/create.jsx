import React, { useState, useEffect } from "react";
import { Form, Button, Spinner, Alert, Modal } from "react-bootstrap";
import api from "../../api/Api";
import { formatFileSize } from "../../utils/common-functions";
import SelectFormField from "../../components/SelectFormField";

const InvoiceCreate = ({ show, onHide, vendorId }) => {
  const [invoiceId, setInvoiceId] = useState(0);
  const [invoiceVendorId, setInvoiceVendorId] = useState(vendorId);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [errorDetail, setErrorDetail] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const data = await api.vendors.list(0, -1); // No pagination limit
        setVendors(data.data);
      } catch (err) {
        console.error(err);
        setError("Error fetching Vendors");
        setErrorDetail(null);
        setSuccess(null);
      }
    };

    fetchVendors();
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    // Reset the file input value to allow selecting the same file again
    const fileInput = document.getElementById("fileInput");
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleAnalyzeDocument = async (e) => {
    e.preventDefault();

    setShowUpload(false);

    var newInvoiceId = 0;
    try {
      setError(null);
      setErrorDetail(null);

      setLoading("Analyzing document with AI...");

      const result = await api.invoices.analyze(file, {
        vendor_id: invoiceVendorId,
      });

      if (result.hasError) {
        setError(result.message);
        setErrorDetail(result.error);
        setShowUpload(true);
        setSuccess(null);
        setLoading(null);
        return false;
      }

      setInvoiceId(result.invoice.id);
      newInvoiceId = result.invoice.id;
    } catch (err) {
      setShowUpload(true);
      setError(err.message || "Error analyzing the document");
      setErrorDetail(null);
      setSuccess(null);
      setLoading(null);
      return false;
    }

    try {
      setLoading("Validating document with AI...");
      await api.invoices.validate(newInvoiceId);
    } catch (err) {
      console.error(err);
      // still continue on, since the Invoice is already created in the database
    }

    setError(null);
    const successMessage =
      "Invoice created successfully with fields populated by AI!";
    window.location.href = `/invoices/${newInvoiceId}?success=${successMessage}&showValidation=true`;
  };

  const resetForm = () => {
    setInvoiceId(0);
    setInvoiceVendorId(vendorId || "");
    setFile(null);
    setError(null);
    setErrorDetail(null);
    setSuccess(null);
    setLoading(null);
    setShowUpload(true);
    setDragActive(false);
    // Reset file input
    const fileInput = document.getElementById("fileInput");
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleClose = () => {
    resetForm();
    onHide();
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="lg"
      centered
      backdrop="static"
    >
      <Modal.Header closeButton>
        <Modal.Title className="fs-4 fw-bold text-dark">
          Add New Invoice
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="px-4 py-3">
        {error && (
          <Alert variant="danger" className="mb-3">
            <p className="mb-1">{error}</p>
            {errorDetail && (
              <div
                style={{
                  maxHeight: "10em",
                  overflowY: "scroll",
                  backgroundColor: "#fff",
                  padding: "0.5rem",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  border: "1px solid #dee2e6",
                }}
                dangerouslySetInnerHTML={{
                  __html: (errorDetail || "").replace(/\n/g, "<br/>"),
                }}
              />
            )}
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-3">
            {success}
          </Alert>
        )}

        {showUpload && (
          <Form onSubmit={handleAnalyzeDocument}>
            <Form.Group className="mb-4">
              <Form.Label
                style={{
                  fontSize: "14px",
                  fontWeight: 400,
                  color: "#787885",
                  marginBottom: "2px",
                  display: "block",
                }}
              >
                Vendor Name
              </Form.Label>

              <SelectFormField
                options={vendors.map((v) => ({ value: v.id, label: v.name }))}
                value={
                  vendors.length > 0
                    ? vendors
                        .map((v) => ({ value: v.id, label: v.name }))
                        .find((opt) => opt.value === invoiceVendorId) || null
                    : null
                }
                onChange={(option) => setInvoiceVendorId(option?.value || "")}
                placeholder="Select vendor name"
                isSearchable
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#292A31",
                  marginBottom: "16px",
                  display: "block",
                }}
              >
                File Upload
              </Form.Label>

              {!file ? (
                <div
                  className={`p-5 text-center position-relative ${
                    dragActive ? "border-primary bg-light" : ""
                  }`}
                  style={{
                    border: "1px dashed rgb(108, 117, 125)",
                    minHeight: "300px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "rgb(255, 255, 255)",
                  }}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="mb-3">
                    <h5 className="fw-bold text-dark mb-2">Drag and drop</h5>
                    <p className="text-muted mb-3">Or Browse for documents</p>
                  </div>

                  <input
                    type="file"
                    onChange={handleFileChange}
                    required
                    className="d-none"
                    id="fileInput"
                    accept=".pdf,.doc,.docx"
                  />

                  <Button
                    variant="outline-primary"
                    onClick={() =>
                      document.getElementById("fileInput")?.click()
                    }
                    className="px-4 py-2"
                    style={{
                      borderColor: "#2979ff",
                      color: "#2979ff",
                      backgroundColor: "transparent",
                    }}
                  >
                    Browse
                  </Button>
                </div>
              ) : (
                <div
                  className="border rounded p-4"
                  style={{
                    borderColor: "#d2d2d6",
                    backgroundColor: "#f8f9fa",
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <div
                        className="me-3 d-flex align-items-center justify-content-center"
                        style={{
                          width: "40px",
                          height: "40px",
                          backgroundColor: "#2979ff",
                          borderRadius: "8px",
                          color: "white",
                        }}
                      >
                        📄
                      </div>
                      <div>
                        <div className="fw-medium text-dark">{file.name}</div>
                        <div className="text-muted small">
                          {formatFileSize(file.size)}
                        </div>
                        <div className="text-success small">
                          <i className="fas fa-check-circle me-1"></i>
                          File selected successfully
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="link"
                      className="p-0 text-danger"
                      onClick={handleClearFile}
                      title="Remove file"
                      style={{ fontSize: "20px" }}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              )}
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button
                type="button"
                variant="outline-secondary"
                onClick={handleClose}
                className="px-4"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="px-4"
                style={{ backgroundColor: "#2979ff", borderColor: "#2979ff" }}
                disabled={!file || !invoiceVendorId}
              >
                <i className="fas fa-search me-2"></i>
                Analyze Document
              </Button>
            </div>
          </Form>
        )}

        {loading && (
          <Alert variant="light" className="text-center py-4">
            <Spinner
              animation="border"
              role="status"
              className="me-3"
              variant="primary"
            >
              <span className="visually-hidden">{loading}</span>
            </Spinner>
            <div className="fw-medium">{loading}</div>
          </Alert>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default InvoiceCreate;
