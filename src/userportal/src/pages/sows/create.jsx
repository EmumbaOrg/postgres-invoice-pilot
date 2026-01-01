import React, { useState } from "react";
import { Modal, Form, Button, Spinner, Alert } from "react-bootstrap";
import SelectFormField from "../../components/SelectFormField";
import { formatFileSize } from "../../utils/common-functions";
import { useAllVendors } from "../../hooks/useVendors";
import { useAnalyzeSOW, useValidateSOW } from "../../hooks/useSOWs";

const SOWCreateModal = ({ show, onHide, vendorId }) => {
  const [sowId, setSowId] = useState(0);
  const [sowVendorId, setSowVendorId] = useState(vendorId || "");
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [errorDetail, setErrorDetail] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(null);
  const [showUpload, setShowUpload] = useState(true);
  const [dragActive, setDragActive] = useState(false);

  // Fetch vendors using React Query
  const { data: vendorsData, isLoading: loadingVendors, error: vendorsError } = useAllVendors();
  const vendors = vendorsData?.data || [];

  // React Query mutations
  const analyzeMutation = useAnalyzeSOW();
  const validateMutation = useValidateSOW();

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
    if (!file || !sowVendorId) return;

    setShowUpload(false);
    let newSowId = 0;

    try {
      setError(null);
      setErrorDetail(null);
      setLoading("Analyzing document with AI...");

      const result = await analyzeMutation.mutateAsync({ 
        file, 
        metadata: { vendor_id: sowVendorId } 
      });
      
      if (result.hasError) {
        setError(result.message);
        setErrorDetail(result.error);
        setShowUpload(true);
        setSuccess(null);
        setLoading(null);
        return false;
      }

      setSowId(result.sow.id);
      newSowId = result.sow.id;
    } catch (err) {
      console.error(err);
      setShowUpload(true);
      setError(err.message || "Error analyzing document");
      setErrorDetail(null);
      setSuccess(null);
      setLoading(null);
      return false;
    }

    try {
      setLoading("Validating document with AI...");
      await validateMutation.mutateAsync(newSowId);
    } catch (err) {
      console.error(err);
      // still continue on, since the SOW is already created in the database
    }

    setError(null);
    setLoading(null);
    const successMessage =
      "SOW created successfully with fields populated by AI!";
    setSuccess(successMessage);

    // Simulate redirect after success
    setTimeout(() => {
      window.location.href = `/sows/${newSowId}?success=${successMessage}&showValidation=true`;
      handleClose();
    }, 2000);
  };

  const resetForm = () => {
    setSowId(0);
    setSowVendorId(vendorId || "");
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
          Add New SOW
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="px-4 py-3">
        {error && (
          <Alert variant="danger" className="mb-3">
            <p className="mb-1 small">{error}</p>
            {errorDetail && (
              <div
                className="small"
                style={{
                  maxHeight: "10em",
                  overflowY: "scroll",
                  backgroundColor: "#fff",
                  padding: "0.5rem",
                  borderRadius: "0.375rem",
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
            <span className="small">{success}</span>
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
                  display: "block",
                  marginBottom: "2px",
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
                        .find((opt) => opt.value == sowVendorId) || null
                    : null
                }
                onChange={(option) => setSowVendorId(option?.value || "")}
                placeholder={loadingVendors ? "Loading vendors..." : "Select vendor name"}
                isSearchable
                isLoading={loadingVendors}
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
                        <div style={{ wordBreak: "break-all" }} className="fw-medium text-dark">{file.name}</div>
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
                disabled={!file || !sowVendorId}
              >
                <i className="fas fa-search me-2"></i>
                Analyze Document
              </Button>
            </div>
          </Form>
        )}

        {vendorsError && (
          <Alert variant="danger" className="mb-3">
            Error loading vendors: {vendorsError.message}
          </Alert>
        )}

        {(loading || analyzeMutation.isPending || validateMutation.isPending) && (
          <Alert variant="light" className="text-center py-4">
            <Spinner
              animation="border"
              role="status"
              className="me-3"
              variant="primary"
            >
              <span className="visually-hidden">{loading}</span>
            </Spinner>
            <div className="fw-medium">{loading || "Processing..."}</div>
          </Alert>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default SOWCreateModal;
