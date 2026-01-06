import { Button, Breadcrumb } from "react-bootstrap";

const StepperWizard = ({ 
  activeStep, 
  setActiveStep, 
  steps, 
  renderContent, 
  onSaveAndNext, 
  isLoading, 
  isSaveNextDisabled,
  buttonText = "Save & Next" 
}) => {
  
  const getStepStatus = (stepIndex) => {
    if (stepIndex < activeStep) return "completed";
    if (stepIndex === activeStep) return "active";
    return "inactive";
  };

  return (
    <div className="container-fluid" style={{ backgroundColor: "#F9FBFF" }}>
      <div className="row m-4 p-4 mt-0 mb-0 wrapper-inner">
        <main className="col-lg-12">
          <div className="row gap-5">
            {/* Desktop Stepper Navigation - Hidden on mobile */}
            <div className="col-lg-2 background-styled p-4 d-none d-lg-block">
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

            {/* Main Content - Full width on mobile, col-lg-9 on desktop */}
            <div className="col-12 col-lg-9 p-0 main-content">
              {/* Mobile Stepper Header - Hidden on desktop */}
              <div className="d-block d-lg-none mb-3">
                <div className="mobile-stepper-header p-3 background-styled rounded">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-medium text-muted">Step {activeStep + 1} of {steps.length}</span>
                    <span className="text-muted small">{Math.round(((activeStep + 1) / steps.length) * 100)}% Complete</span>
                  </div>
                  <div className="mobile-progress-bar mb-2">
                    <div 
                      className="mobile-progress-fill"
                      style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
                    ></div>
                  </div>
                  <div className="current-step-info">
                    <h6 className="mb-1 fw-bold">{steps[activeStep].title}</h6>
                    <small className="text-muted">{steps[activeStep].subtitle}</small>
                  </div>
                </div>
              </div>
              
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
                      onClick={onSaveAndNext}
                      disabled={isSaveNextDisabled()}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : (
                        buttonText
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="p-4 background-styled vendor-stepper-inner">
                <div className="mb-4">
                  <h2 className="page-title mb-0">New Vendor</h2>
                </div>

                <div className="content-card p-4 pb-0">{renderContent[activeStep]}</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StepperWizard;