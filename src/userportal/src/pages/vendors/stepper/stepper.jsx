import { useState, useEffect } from "react";
import { Breadcrumb, Button, Form , Alert, Spinner, Modal} from "react-bootstrap";
import ReactMarkdown from 'react-markdown';

import api from '../../../api/Api';
import "./stepper.css";

const NavigationStepper = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [sowFile, setSowFile] = useState(null);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [invoiceId, setInvoiceId] = useState(null);
  const [invoiceValidations, setInvoiceValidations] = useState([]);
  const [invoiceError, setInvoiceError] = useState(null);
  const [invoiceErrorDetail, setInvoiceErrorDetail] = useState(null);
  const [invoiceSuccess, setInvoiceSuccess] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(null);
  const [showInvoiceAnalysisModal, setShowInvoiceAnalysisModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [error, setError] = useState(null);
  const [errorDetail, setErrorDetail] = useState(null);
  const [loading, setLoading] = useState(null);
  const [success, setSuccess] = useState(null);
  const [sowId, setSowId] = useState(null);
  const [validations, setValidations] = useState([]);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    website: "",
    address: "",
  });

  const [vendorId, setVendorId] = useState(formData.name);

  const steps = [
    {
      title: "Vendor Details",
      subtitle: "Add vendor details",
      required: true,
    },
    {
      title: "Upload SOW",
      subtitle: "*Optional",
      required: false,
    },
    {
      title: "Upload Invoices",
      subtitle: "*Optional",
      required: false,
    },
  ];
    useEffect(() => {
    const fetchVendors = async () => {
      try {
        const data = await api.vendors.list(0, -1);
        setVendors(data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchVendors();
  }, []);

  // Auto-upload SOW when both file and vendorId are available
  useEffect(() => {
    if (sowFile && vendorId && !sowId && !loading && !showAnalysisModal) {
      uploadSOW();
    }
  }, [sowFile, vendorId, sowId, loading, showAnalysisModal]);

  // Auto-upload Invoice when both file and vendorId are available
  useEffect(() => {
    if (invoiceFile && vendorId && !invoiceId && !invoiceLoading && !showInvoiceAnalysisModal) {
      uploadInvoice();
    }
  }, [invoiceFile, vendorId, invoiceId, invoiceLoading, showInvoiceAnalysisModal]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearErrors = () => {
    setError(null);
    setErrorDetail(null);
    setLoading(null);
    setSuccess(null);
  };

  const handleClearFile = () => {
    setSowFile(null);
    setSowId(null); // Clear the SOW ID so auto-upload can work again
    setError(null);
    setErrorDetail(null);
    setLoading(null);
    setSuccess(null);
    setValidations([]);
    setShowAnalysisModal(false);
  };

  const handleClearInvoiceFile = () => {
    setInvoiceFile(null);
    setInvoiceId(null); // Clear the Invoice ID so auto-upload can work again
    setInvoiceError(null);
    setInvoiceErrorDetail(null);
    setInvoiceLoading(null);
    setInvoiceSuccess(null);
    setInvoiceValidations([]);
    setShowInvoiceAnalysisModal(false);
  };

  const handleSaveAndNext = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Make API calls based on current step
      switch (currentStep) {
        case 0:
          // Step 1: Save vendor details
          const vendorResponse = await saveVendorDetails();
          if (vendorResponse?.id) {
            setVendorId(vendorResponse.id);
          }
          break;
        case 1:
          // Step 2: Upload SOW (if file exists) - only if not already processed
          if (sowFile && !sowId) {
            await uploadSOW();
          }
          break;
        case 2:
          // Step 3: Upload invoice (if file exists) - only if not already processed
          if (invoiceFile && !invoiceId) {
            await uploadInvoice();
          }
          break;
        default:
          console.log("Unknown step");
          break;
      }

      // Move to next step if API call successful
      if (currentStep < steps.length - 1) {
        clearErrors(); // Clear any previous errors when moving to next step
        setCurrentStep(currentStep + 1);
      } else {
        // All steps completed
        clearErrors();
        window.location.href = "/vendors";
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      // Show error in alert for vendor details step
      if (currentStep === 0) {
        setError(`Error: ${errorMessage}`);
      }
      // Don't advance to next step if there was an error
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const saveVendorDetails = async () => {
    // Validate required fields for vendor details
    if (!formData.name || !formData.contact_name || !formData.contact_email || !formData.contact_phone || !formData.type || !formData.address) {
      throw new Error("Please fill in all required vendor details");
    }
    try {
      const response = await api.vendors.create(formData);
      return response;
    } catch (err) {
      throw err;
    }
  };

  // Helper function to check if required vendor details are filled
  const isVendorDetailsValid = () => {
    return formData.name && formData.contact_name && formData.contact_email && formData.contact_phone && formData.type && formData.address;
  };

  // Helper function to check if Save & Next button should be disabled
  const isSaveNextDisabled = () => {
    if (currentStep === 0) {
      // For vendor details step, check if all required fields are filled
      return !isVendorDetailsValid() || isLoading;
    }
    // For optional steps (SOW and Invoice upload), only disable during loading
    return isLoading;
  };

  const uploadSOW = async () => {
    // Check if SOW file was selected
    if (sowFile && vendorId) {
      let newSowId = 0;

      try {
        setError(null);
        setErrorDetail(null);
        setShowAnalysisModal(true);
        setLoading('Analyzing document. This might take a few seconds...');

        const result = await api.sows.analyze(sowFile, { vendor_id: vendorId });
        if (result.hasError) {
          setError(result.message);
          setErrorDetail(result.error);
          setShowAnalysisModal(false);
          setLoading(null);
          throw new Error(result.message);
        }

        setSowId(result.sow.id);
        newSowId = result.sow.id;
      } catch (err) {
        setError('Error analyzing document');
        setErrorDetail(null);
        setShowAnalysisModal(false);
        setLoading(null);
        throw err;
      }

      try {
        setLoading('Validating document with AI...');
        await api.sows.validate(newSowId);
        setShowAnalysisModal(false);
        setLoading(null);
        setSuccess('SOW created and validated successfully with AI!');
        
        // Fetch validation results to display
        try {
          const validationData = await api.validationResults.sow(newSowId);
          setValidations(validationData.data);
        } catch (validationErr) {
          console.error('Error fetching validation results:', validationErr);
        }
      } catch (err) {
        console.error('Validation error:', err);
        // Continue anyway, since the SOW is already created in the database
        setShowAnalysisModal(false);
        setLoading(null);
        setSuccess('SOW created successfully! (Validation completed with some warnings)');
        
        // Still try to fetch validation results even if validation had errors
        try {
          const validationData = await api.validationResults.sow(newSowId);
          setValidations(validationData.data);
        } catch (validationErr) {
          console.error('Error fetching validation results:', validationErr);
        }
      }

    } else if (!sowFile) {
      console.log('No SOW file selected, skipping upload');
    } else if (!vendorId) {
      throw new Error('Vendor ID is required for SOW upload');
    }
  };

  const uploadInvoice = async () => {
    // Check if invoice file was selected
    if (invoiceFile && vendorId) {
      let newInvoiceId = 0;

      try {
        setInvoiceError(null);
        setInvoiceErrorDetail(null);
        setShowInvoiceAnalysisModal(true);
        setInvoiceLoading('Analyzing document. This might take a few seconds...');

        const result = await api.invoices.analyze(invoiceFile, { vendor_id: vendorId });
        if (result.hasError) {
          setInvoiceError(result.message);
          setInvoiceErrorDetail(result.error);
          setShowInvoiceAnalysisModal(false);
          setInvoiceLoading(null);
          throw new Error(result.message);
        }

        setInvoiceId(result.invoice.id);
        newInvoiceId = result.invoice.id;
      } catch (err) {
        console.error('Invoice analysis error:', err);
        setInvoiceError('Error analyzing document');
        setInvoiceErrorDetail(null);
        setShowInvoiceAnalysisModal(false);
        setInvoiceLoading(null);
        throw err;
      }

      try {
        setInvoiceLoading('Validating document with AI...');
        await api.invoices.validate(newInvoiceId);
        setShowInvoiceAnalysisModal(false);
        setInvoiceLoading(null);
        setInvoiceSuccess('Invoice created and validated successfully with AI!');
        
        // Fetch validation results to display
        try {
          const validationData = await api.validationResults.invoice(newInvoiceId);
          setInvoiceValidations(validationData.data);
        } catch (validationErr) {
          console.error('Error fetching invoice validation results:', validationErr);
        }
      } catch (err) {
        console.error('Invoice validation error:', err);
        // Continue anyway, since the Invoice is already created in the database
        setShowInvoiceAnalysisModal(false);
        setInvoiceLoading(null);
        setInvoiceSuccess('Invoice created successfully! (Validation completed with some warnings)');
        
        // Still try to fetch validation results even if validation had errors
        try {
          const validationData = await api.validationResults.invoice(newInvoiceId);
          setInvoiceValidations(validationData.data);
        } catch (validationErr) {
          console.error('Error fetching invoice validation results:', validationErr);
        }
      }

    } else if (!invoiceFile) {
      console.log('No Invoice file selected, skipping upload');
    } else if (!vendorId) {
      throw new Error('Vendor ID is required for Invoice upload');
    }
  };


  const getStepStatus = (stepIndex) => {
    if (stepIndex < currentStep) return "completed";
    if (stepIndex === currentStep) return "active";
    return "inactive";
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            {error && (
              <Alert variant="danger" className="mb-3">
                <i className="fa-solid fa-circle-exclamation me-2" style={{ color: 'var(--bs-danger)' }}></i>
                {error}
              </Alert>
            )}
            <Form onSubmit={handleSaveAndNext} >
              <div className="mb-4">
                <h5 className="section-heading">Vendor Details</h5>
                <div className="row g-3">
                  <div className="col-12">
                      <Form.Group className="mb-4">
                <input
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  className="form-control p-3"
                  placeholder="Vendor Name *"
                  type="text"
                ></input>
              </Form.Group>
                  </div>
                  <div className="col-12">
                    <input
                    style={{"margin":0}}
                      type="text"
                      className="form-control p-3"
                      placeholder="Type *"
                      value={formData.type}
                      onChange={(e) => handleInputChange("type", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h5 className="section-heading">Contact Info</h5>
                <div className="row g-3">
                  <div className="col-12">
                    <input
                      type="text"
                      className="form-control p-3"
                      placeholder="Contact Person *"
                      value={formData.contact_name}
                      onChange={(e) =>
                        handleInputChange("contact_name", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="col-12">
                    <input
                      type="tel"
                      className="form-control p-3"
                      placeholder="Phone Number *"
                      value={formData.contact_phone}
                      onChange={(e) =>
                        handleInputChange("contact_phone", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="col-12">
                    <input
                      type="email"
                      className="form-control p-3"
                      placeholder="Email Address *"
                      value={formData.contact_email}
                      onChange={(e) =>
                        handleInputChange("contact_email", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="col-12">
                    <input
                      type="url"
                      className="form-control p-3"
                      placeholder="Website"
                      value={formData.website}
                      onChange={(e) =>
                        handleInputChange("website", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-12">
                    <input
                      type="text"
                      className="form-control p-3"
                      placeholder="Location *"
                      value={formData.address}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      required
                    />
                  </div>
                </div>
              </div>
            </Form>
          </>
        );
      case 1:
        return (
          <div>
            <div className="mb-4">
              <h5 className="section-heading">Add SOW</h5>
            </div>
   {error && (
          <Alert variant="danger" className="mb-3">
            <p className="mb-1">{error}</p>
            {errorDetail && (
              <div 
                style={{ 
                  maxHeight: '10em', 
                  overflowY: 'scroll', 
                  backgroundColor: '#fff', 
                  padding: '0.5rem', 
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  border: '1px solid #dee2e6'
                }} 
                dangerouslySetInnerHTML={{ 
                  __html: (errorDetail || '').replace(/\n/g, '<br/>') 
                }}
              />
            )}
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-3">
            <p className="mb-0">
              <i className="fa-solid fa-check-circle me-2"></i>
              {success}
            </p>
          </Alert>
        )}
            <div
              className="rounded p-5 text-center"
              style={{
                border: "1px dashed #6c757d",
                minHeight: "300px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#ffffff",
              }}
            >
              {!sowFile ? (
                // Show drag and drop when no file is selected
                <div className="mb-4">
                  <h4
                    className="mb-3"
                    style={{ color: "#292a31", fontWeight: "600" }}
                  >
                    Drag and drop
                  </h4>
                  <p
                    className="mb-4"
                    style={{ color: "#9696a0", fontSize: "16px" }}
                  >
                    Or choose file to upload
                  </p>
                  <Button
                    variant="outlined-primary"
                    className="btn btn-outline-primary fw-bold"
                    onClick={() => {
                      // Handle file browse for SOW
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = ".pdf,.doc,.docx";
                      input.onchange = (e) => {
                        const file = (e.target).files?.[0];
                        if (file) {
                          setSowFile(file);
                          setError(null);
                          setErrorDetail(null);
                          setLoading(null);
                          setSuccess(null);
                          setValidations([]);
                        }
                      };
                      input.click();
                    }}
                  >
                    Browse
                  </Button>
                </div>
              ) : (
                // Show selected file with remove option
                <div className="w-100">
                  <div
                    className="border rounded p-4"
                    style={{ 
                      borderColor: '#d2d2d6',
                      backgroundColor: '#f8f9fa'
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <div 
                          className="me-3 d-flex align-items-center justify-content-center"
                          style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: '#2979ff',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '18px'
                          }}
                        >
                          <i className="far fa-file-alt"></i>
                        </div>
                        <div>
                          <div className="fw-medium text-dark">{sowFile.name}</div>
                          <div className="text-muted small">{(sowFile.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                      </div>
                      <Button
                        variant="link"
                        className="p-0 text-danger"
                        onClick={handleClearFile}
                        title="Remove file"
                        style={{ fontSize: '18px' }}
                      >
                        <i className="far fa-trash-alt text-danger"></i>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Analysis Modal */}
            <Modal show={showAnalysisModal} backdrop="static" keyboard={false} centered>
              <Modal.Body className="text-center py-4">
                <Spinner animation="border" role="status" className="mb-3" variant='primary' size="lg">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
                <div className="fw-medium">{loading}</div>
              </Modal.Body>
            </Modal>

            {/* Validation Results Section */}
            {validations.length > 0 && (
              <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  {/* <h5 className="section-heading mb-0">Validation Results</h5> */}
                
                </div>
                <div className="border rounded p-3" style={{ backgroundColor: '#f8f9fa' }}>
                  {validations.map((validation, index) => (
                    <div key={validation.id || index} className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                        <h6 className="mb-0 fw-medium">Validation Results</h6>
                        <small className="text-muted">{validation.datestamp}</small>
                          </div>
                        <div className="d-flex gap-2">
                    {validations.map((validation, index) => (
                      <span key={validation.id || index} className={`${validation.validation_passed ? 'status-chip-success' : 'status-chip-error'}`}>
                        {validation.validation_passed ? 'Passed' : 'Failed'}
                      </span>
                    ))}
                  </div>
                      </div>
                      <div 
                        className="border rounded p-3" 
                        style={{ 
                          backgroundColor: '#fff',
                          maxHeight: '300px',
                          overflowY: 'auto'
                        }}
                      >
                        <ReactMarkdown>{validation.result}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div>
            <div className="mb-4">
              <h5 className="section-heading">Add Invoice</h5>
            </div>

            {invoiceError && (
              <Alert variant="danger" className="mb-3">
                <p className="mb-1">{invoiceError}</p>
                {invoiceErrorDetail && (
                  <div 
                    style={{ 
                      maxHeight: '10em', 
                      overflowY: 'scroll', 
                      backgroundColor: '#fff', 
                      padding: '0.5rem', 
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      border: '1px solid #dee2e6'
                    }} 
                    dangerouslySetInnerHTML={{ 
                      __html: (invoiceErrorDetail || '').replace(/\n/g, '<br/>') 
                    }}
                  />
                )}
              </Alert>
            )}

            {invoiceSuccess && (
              <Alert variant="success" className="mb-3">
                <p className="mb-0">
                  <i className="fa-solid fa-check-circle me-2"></i>
                  {invoiceSuccess}
                </p>
              </Alert>
            )}

            <div
              className="rounded p-5 text-center"
              style={{
                border: "1px dashed #6c757d",
                minHeight: "300px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#ffffff",
              }}
            >
              {!invoiceFile ? (
                // Show drag and drop when no file is selected
                <div className="mb-4">
                  <h4
                    className="mb-3"
                    style={{ color: "#292a31", fontWeight: "600" }}
                  >
                    Drag and drop
                  </h4>
                  <p
                    className="mb-4"
                    style={{ color: "#9696a0", fontSize: "16px" }}
                  >
                    Or choose file to upload
                  </p>
                  <Button
                    variant="outlined-primary"
                    className="btn btn-outline-primary fw-bold"
                    onClick={() => {
                      // Handle file browse for Invoice
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = ".pdf,.doc,.docx";
                      input.onchange = (e) => {
                        const file = (e.target).files?.[0];
                        if (file) {
                          setInvoiceFile(file);
                          setInvoiceError(null);
                          setInvoiceErrorDetail(null);
                          setInvoiceLoading(null);
                          setInvoiceSuccess(null);
                          setInvoiceValidations([]);
                        }
                      };
                      input.click();
                    }}
                  >
                    Browse
                  </Button>
                </div>
              ) : (
                // Show selected file with remove option
                <div className="w-100">
                  <div
                    className="border rounded p-4"
                    style={{ 
                      borderColor: '#d2d2d6',
                      backgroundColor: '#f8f9fa'
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <div 
                          className="me-3 d-flex align-items-center justify-content-center"
                          style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: '#2979ff',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '18px'
                          }}
                        >
                          <i className="far fa-file-alt"></i>
                        </div>
                        <div>
                          <div className="fw-medium text-dark">{invoiceFile.name}</div>
                          <div className="text-muted small">{(invoiceFile.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                      </div>
                      <Button
                        variant="link"
                        className="p-0 text-danger"
                        onClick={handleClearInvoiceFile}
                        title="Remove file"
                        style={{ fontSize: '18px' }}
                      >
                        <i className="far fa-trash-alt text-danger"></i>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Invoice Analysis Modal */}
            <Modal show={showInvoiceAnalysisModal} backdrop="static" keyboard={false} centered>
              <Modal.Body className="text-center py-4">
                <Spinner animation="border" role="status" className="mb-3" variant='primary' size="lg">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
                <div className="fw-medium">{invoiceLoading}</div>
              </Modal.Body>
            </Modal>

            {/* Invoice Validation Results Section */}
            {invoiceValidations.length > 0 && (
              <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  {/* <h5 className="section-heading mb-0">Invoice Validation Results</h5> */}
                </div>
                <div className="border rounded p-3" style={{ backgroundColor: '#f8f9fa' }}>
                  {invoiceValidations.map((validation, index) => (
                    <div key={validation.id || index} className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <h6 className="mb-0 fw-medium">Invoice Validation Results</h6>
                          <small className="text-muted">{validation.datestamp}</small>
                        </div>
                        <div className="d-flex gap-2">
                          {invoiceValidations.map((validation, index) => (
                            <span key={validation.id || index} className={`${validation.validation_passed ? 'status-chip-success' : 'status-chip-error'}`}>
                              {validation.validation_passed ? 'Passed' : 'Failed'}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div 
                        className="border rounded p-3" 
                        style={{ 
                          backgroundColor: '#fff',
                          maxHeight: '300px',
                          overflowY: 'auto'
                        }}
                      >
                        <ReactMarkdown>{validation.result}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container-fluid" style={{ backgroundColor: "#F9FBFF" }}>
      <div className="row m-4 p-4 mt-0">
        <main className="col-lg-12">
          <div className="row gap-5">
            {/* Stepper Navigation - col-lg-2 */}
            <div className="col-lg-2 background-styled p-4">
              <div className="position-sticky" style={{ top: "20px" }}>
                <div className="d-flex flex-column gap-5">
                  {steps.map((step, index) => (
                    <div key={index} className="position-relative mb-4">
                      {/* Connecting Line */}
                      {index < steps.length - 1 && (
                        <div 
                          className={`connecting-line ${
                            getStepStatus(index) === "completed" ? "connecting-line-completed" : ""
                          }`}
                        />
                      )}

                      {/* Step Circle and Content */}
                      <div className="d-flex align-items-start">
                        {/* Circle Indicator */}
                        <div
                          className={`step-circle ${
                            getStepStatus(index) === "completed"
                              ? "step-circle-completed"
                              : getStepStatus(index) === "active"
                              ? "step-circle-active"
                              : "step-circle-inactive"
                          }`}
                        >
                          {getStepStatus(index) === "completed" ? (
                            <span className="step-checkmark">
                              ✓
                            </span>
                          ) : (
                            <span
                              className={`step-number ${
                                getStepStatus(index) === "active"
                                  ? "step-number-active"
                                  : "step-number-inactive"
                              }`}
                            >
                              {index + 1}
                            </span>
                          )}
                        </div>

                        {/* Step Content */}
                        <div className="ms-3 flex-grow-1">
                          <div
                            className={`step-title ${
                              getStepStatus(index) === "completed"
                                ? "step-title-completed"
                                : getStepStatus(index) === "active"
                                ? "step-title-active"
                                : "step-title-inactive"
                            }`}
                          >
                            {step.title}
                          </div>
                          <small className="step-subtitle">
                            {step.subtitle}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content - col-lg-9 */}
            <div className="col-lg-9 p-0 main-content">
              <Breadcrumb className="mb-0">
                <Breadcrumb.Item href="/vendors">Vendors</Breadcrumb.Item>
                <Breadcrumb.Item active>Add New Vendor</Breadcrumb.Item>
              </Breadcrumb>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center">
                  <Button
                    area-label="Back to Vendors"
                    href="/vendors"
                    variant="link"
                    className="styled-button text-decoration-none"
                  >
                    <i className="fa-solid fa-arrow-left"></i> Back to Vendors
                  </Button>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="d-flex gap-2">
                    <Button
                      className="btn btn-save-next"
                      onClick={handleSaveAndNext}
                      disabled={isSaveNextDisabled()}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : (
                        currentStep === steps.length - 1 ? "Complete" : "Save & Next"
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div
                className="p-4 background-styled
              "
              >
                <div className="mb-4">
                  <h2 className="page-title mb-0">New Vendor</h2>
                </div>

                <div className="content-card p-4">{renderStepContent()}</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NavigationStepper;
