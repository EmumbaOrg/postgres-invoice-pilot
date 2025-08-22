import { useState } from "react";
import { Breadcrumb, Button } from "react-bootstrap";

import api from "../../../api/Api"
import "./stepper.css";


const NavigationStepper = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [vendorId, setVendorId] = useState(null);
  const [sowFile, setSowFile] = useState(null);
  const [invoiceFiles, setInvoiceFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    website: "",
    address: "",
  });

  console.log("formData", formData)
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

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveAndNext = async () => {
    setIsLoading(true);
    try {
      // Make different API calls based on current step
      switch (currentStep) {
        case 0:
          // Step 1: Save vendor details
          console.log("Saving vendor details for step 1", currentStep);
          const vendorResponse = await saveVendorDetails();
          if (vendorResponse?.id) {
            setVendorId(vendorResponse.id);
          }
          break;
        case 1:
          // Step 2: Upload SOW (if file exists)
          await uploadSOW();
          break;
        case 2:
          // Step 3: Upload invoices (if files exist)
          await uploadInvoices();
          break;
        default:
          console.log("Unknown step");
          break;
      }

      // Move to next step if API call successful
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // All steps completed
        console.log("Vendor creation process completed!");
        // Redirect to vendors list or show success message
      }
    } catch (error) {
      console.error("Error saving step data:", error);
      // Handle error (show toast, alert, etc.)
      const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const saveVendorDetails = async () => {
    // Make API call to save vendor details
    console.log("Saving vendor details to make API call:", formData);
    var newItem = await api.vendors.create(formData);
    window.location.href = `/vendors/${newItem.id}`;
  };

  const uploadSOW = async () => {
    // Check if SOW file was selected
    // This would require adding state to track selected files
    console.log("Uploading SOW for step 2");
    if (sowFile) {
      console.log("SOW file selected:", sowFile.name);
      // Example API call:
      // const formData = new FormData();
      // formData.append('file', sowFile);
      // formData.append('vendorId', vendorId || '');
      // await api.sow.upload(formData);
    }
  };

  const uploadInvoices = async () => {
    // Check if invoice files were selected
    console.log("Uploading invoices for step 3");
    if (invoiceFiles.length > 0) {
      console.log("Invoice files selected:", invoiceFiles.map(f => f.name));
      // Example API call:
      // const formData = new FormData();
      // invoiceFiles.forEach(file => formData.append('files[]', file));
      // formData.append('vendorId', vendorId || '');
      // await api.invoices.upload(formData);
    }
  };

  const handleSave = () => {
    console.log("Saving vendor data:", formData);
    // Handle save logic here
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
          <div>
            <div className="mb-4">
              <h5 className="section-heading">Vendor Details</h5>
              <div className="row g-3">
                <div className="col-12">
                  <input
                    type="text"
                    className="form-control p-3"
                    placeholder="Vendor Name"
                    value={formData.name}
                    onChange={(e) =>
                      handleInputChange("name", e.target.value)
                    }
                  />
                </div>
                <div className="col-12">
                  <input
                    type="text"
                    className="form-control p-3"
                    placeholder="Type"
                    value={formData.type}
                    onChange={(e) => handleInputChange("type", e.target.value)}
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
                    placeholder="Contact Person"
                    value={formData.contact_name}
                    onChange={(e) =>
                      handleInputChange("contact_name", e.target.value)
                    }
                  />
                </div>
                <div className="col-12">
                  <input
                    type="tel"
                    className="form-control p-3"
                    placeholder="Phone Number"
                    value={formData.contact_phone}
                    onChange={(e) =>
                      handleInputChange("contact_phone", e.target.value)
                    }
                  />
                </div>
                <div className="col-12">
                  <input
                    type="email"
                    className="form-control p-3"
                    placeholder="Email Address"
                    value={formData.contact_email}
                    onChange={(e) =>
                      handleInputChange("contact_email", e.target.value)
                    }
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
                    placeholder="Address"
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div>
            <div className="mb-4">
              <h5 className="section-heading">Add SOW</h5>
            </div>

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
                    // Handle file browse
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".pdf,.doc,.docx";
                    input.onchange = (e) => {
                      const file = (e.target).files?.[0];
                      if (file) {
                        console.log("Selected file:", file.name);
                        // Handle file upload logic here
                      }
                    };
                    input.click();
                  }}
                >
                  Browse
                </Button>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <div className="mb-4">
              <h5 className="section-heading">Add Invoice</h5>
            </div>

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
                    // Handle file browse
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".pdf,.doc,.docx";
                    input.onchange = (e) => {
                      const file = (e.target).files?.[0];
                      if (file) {
                        console.log("Selected file:", file.name);
                        // Handle file upload logic here
                      }
                    };
                    input.click();
                  }}
                >
                  Browse
                </Button>
              </div>
            </div>
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
                        <div className="connecting-line" />
                      )}

                      {/* Step Circle and Content */}
                      <div className="d-flex align-items-start">
                        {/* Circle Indicator */}
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: "24px",
                            height: "24px",
                            minWidth: "24px",
                            zIndex: 2,
                            position: "relative",
                            backgroundColor:
                              getStepStatus(index) === "active"
                                ? "#2979ff"
                                : "#ffffff",
                            border:
                              getStepStatus(index) === "active"
                                ? "none"
                                : "2px solid #e1e1e3",
                          }}
                        >
                          <span
                            className={`fw-bold`}
                            style={{
                              fontSize: "12px",
                              color:
                                getStepStatus(index) === "active"
                                  ? "#ffffff"
                                  : "#9696a0",
                            }}
                          >
                            {index + 1}
                          </span>
                        </div>

                        {/* Step Content */}
                        <div className="ms-3 flex-grow-1">
                          <h6
                            className="mb-1"
                            style={{
                              fontSize: "14px",
                              fontWeight:
                                getStepStatus(index) === "active"
                                  ? "600"
                                  : "500",
                              color:
                                getStepStatus(index) === "active"
                                  ? "#292a31"
                                  : "#787885",
                            }}
                          >
                            {step.title}
                          </h6>
                          <small style={{ fontSize: "12px", color: "#9696a0" }}>
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
                      variant="outline-secondary"
                      className="btn btn-save"
                      onClick={handleSave}
                    >
                      Save Vendor
                    </Button>
                    <Button
                      className="btn btn-save-next"
                      onClick={handleSaveAndNext}
                    >
                      Save & Next
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
