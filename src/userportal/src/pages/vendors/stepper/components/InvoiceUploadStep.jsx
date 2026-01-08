import { Button, Alert, Spinner, Modal } from "react-bootstrap";
import ReactMarkdown from 'react-markdown';
import { useDragAndDrop } from '../../../../hooks/useDragAndDrop';

const InvoiceUploadStep = ({ 
  invoiceFile, 
  setInvoiceFile, 
  invoiceValidations, 
  invoiceError, 
  invoiceErrorDetail, 
  invoiceSuccess, 
  invoiceLoading, 
  showInvoiceAnalysisModal, 
  onUpload,
  onClearFile,
  hasSOW = false 
}) => {
  
  const handleFileDrop = (file) => {
    setInvoiceFile(file);
    // Auto-upload will be handled by useEffect in parent
  };

  const isDisabled = !hasSOW || !!invoiceError;
  const { dragActive, dragHandlers, getDragStyles } = useDragAndDrop(handleFileDrop, {
    disabled: isDisabled
  });
  
  const handleFileSelect = () => {
    // Don't allow file selection if no SOW or if there's an error
    if (!hasSOW || invoiceError) {
      return;
    }
    
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        setInvoiceFile(file);
        // Auto-upload will be handled by useEffect in parent
      }
    };
    input.click();
  };

  return (
    <div>
      <div className="mb-4">
        <h5 className="section-heading">Add Invoice</h5>
      </div>

      {!hasSOW && (
        <Alert variant="warning" className="mb-3">
          <Alert.Heading className="h6">
            No SOW Available
          </Alert.Heading>
          <p className="mb-0 small">
            Invoices require an associated Statement of Work (SOW). Since no SOW was uploaded in the previous step, you can skip this step and add invoices later after creating SOWs.
          </p>
        </Alert>
      )}

      {invoiceError && (
        <Alert variant="danger" className="mb-3">
          <Alert.Heading className="h6">
            {invoiceError}
          </Alert.Heading>
          {invoiceErrorDetail && (
            <div 
              className="small"
              style={{ 
                maxHeight: '10em', 
                overflowY: 'scroll', 
                backgroundColor: '#fff', 
                padding: '0.5rem', 
                borderRadius: '0.375rem',
                border: '1px solid #dee2e6',
                whiteSpace: 'pre-line'
              }} 
              dangerouslySetInnerHTML={{ 
                __html: (invoiceErrorDetail || '').replace(/\n/g, '<br/>') 
              }}
            />
          )}
          {invoiceError.includes('Referenced SOW Not Found') && (
            <div className="mt-3 d-flex gap-2">
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={() => window.open('/sows', '_blank')}
              >
                <i className="fas fa-file-alt me-1"></i>
                Upload SOW
              </Button>
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={onClearFile}
              >
                <i className="fas fa-redo me-1"></i>
                Try Different Invoice
              </Button>
            </div>
          )}
          {invoiceError && invoiceError !== 'SOW Required' && (
            <div className="mt-3">
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={onClearFile}
              >
                <i className="fas fa-redo me-1"></i>
                Try Again
              </Button>
            </div>
          )}
        </Alert>
      )}

      {invoiceSuccess && (
        <Alert variant="success" className="mb-3">
          <p className="mb-0 small">
            {invoiceSuccess}
          </p>
        </Alert>
      )}

      <div
        className={`rounded p-5 text-center ${isDisabled ? 'opacity-50' : ''}`}
        style={getDragStyles({
          minHeight: "300px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: isDisabled ? "#f8f9fa" : "#ffffff",
          pointerEvents: isDisabled ? "none" : "auto"
        })}
        {...dragHandlers}
      >
        {!invoiceFile ? (
          <div className="mb-4">
            <h4
              className="mb-3 stepper-drag-title"
              style={{ color: "#292a31", fontWeight: "600" }}
            >
              Drag and drop
            </h4>
            <p
              className="mb-4 stepper-drag-subtitle"
              style={{ color: "#9696a0", fontSize: "16px" }}
            >
              {!hasSOW ? "Upload a SOW first to enable invoice upload" : 
               invoiceError ? "Please resolve the error above to continue" : 
               "Or choose file to upload"}
            </p>
            <Button
              variant="outlined-primary"
              className="btn btn-outline-primary fw-bold"
              onClick={handleFileSelect}
              disabled={!hasSOW || invoiceError}
            >
              Browse
            </Button>
          </div>
        ) : (
          <div className="w-100">
            <div
              className="border rounded stepper-file-card"
              style={{ 
                borderColor: '#d2d2d6',
                backgroundColor: '#f8f9fa'
              }}
            >
              <div className="d-flex align-items-center justify-content-between stepper-file-content">
                <div className="d-flex align-items-center stepper-file-info">
                  <div 
                    className="me-3 d-flex align-items-center justify-content-center stepper-file-icon"
                    style={{
                      width: '30px',
                      height: '30px',
                      backgroundColor: '#2979ff',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '18px'
                    }}
                  >
                    <i className="far fa-file-alt"></i>
                  </div>
                  <div className="stepper-file-name-container">
                    <div className="fw-medium text-dark stepper-file-name" title={invoiceFile.name}>
                      {invoiceFile.name}
                    </div>
                  </div>
                </div>
                <Button
                  variant="link"
                  className="p-0 text-danger stepper-file-remove"
                  onClick={onClearFile}
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
            {/* <h5 className="section-heading mb-0">Validation Results</h5> */}
          </div>
          <div className="border rounded p-3" style={{ backgroundColor: '#f8f9fa' }}>
            {invoiceValidations.map((validation, index) => (
              <div key={validation.id || index} className="mb-3">
                <div className="validation-header d-flex justify-content-between align-items-start mb-2">
                  <div className="validation-info">
                    <h6 className="mb-0 fw-medium validation-title">Validation Results</h6>
                    <small className="text-muted validation-date">{validation.datestamp}</small>
                  </div>
                  <div className="validation-badges d-flex flex-wrap gap-2">
                    {invoiceValidations.map((validation, index) => (
                      <span key={validation.id || index} className={`status-chip ${validation.validation_passed ? 'status-chip-success' : 'status-chip-error'}`}>
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
};

export default InvoiceUploadStep;