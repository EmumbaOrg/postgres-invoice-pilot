import { Button, Alert, Spinner, Modal } from "react-bootstrap";
import ReactMarkdown from 'react-markdown';
import { useDragAndDrop } from '../../../../hooks/useDragAndDrop';

const SOWUploadStep = ({ 
  sowFile, 
  setSowFile, 
  validations, 
  error, 
  errorDetail, 
  success, 
  loading, 
  showAnalysisModal, 
  onUpload,
  onClearFile 
}) => {
  
  const handleFileDrop = (file) => {
    setSowFile(file);
    onUpload(file);
  };

  const { dragActive, dragHandlers, getDragStyles } = useDragAndDrop(handleFileDrop);
  
  const handleFileSelect = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        setSowFile(file);
        onUpload(file);
      }
    };
    input.click();
  };

  return (
    <div>
      <div className="mb-4">
        <h5 className="section-heading">Add SOW</h5>
        <p className="text-muted small mb-0">
          Uploading a SOW is optional, but required if you plan to add invoices that reference SOW numbers.
        </p>
      </div>

      {error && (
        <Alert variant="danger" className="mb-3">
          <p className="mb-1 small">{error}</p>
          {errorDetail && (
            <div 
              className="small"
              style={{ 
                maxHeight: '10em', 
                overflowY: 'scroll', 
                backgroundColor: '#fff', 
                padding: '0.5rem', 
                borderRadius: '0.375rem',
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
          <p className="mb-0 small">
            {success}
          </p>
        </Alert>
      )}

      <div
        className="rounded stepper-drag-area text-center"
        style={getDragStyles({
          minHeight: "300px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        })}
        {...dragHandlers}
      >
        {!sowFile ? (
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
              Or choose file to upload
            </p>
            <Button
              variant="outlined-primary"
              className="btn btn-outline-primary fw-bold"
              onClick={handleFileSelect}
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
                    <div className="fw-medium text-dark stepper-file-name" title={sowFile.name}>
                      {sowFile.name}
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
                <div className="validation-header d-flex justify-content-between align-items-start mb-2">
                  <div className="validation-info">
                    <h6 className="mb-0 fw-medium validation-title">Validation Results</h6>
                    <small className="text-muted validation-date">{validation.datestamp}</small>
                  </div>
                  <div className="validation-badges d-flex flex-wrap gap-2">
                    {validations.map((validation, index) => (
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

export default SOWUploadStep;