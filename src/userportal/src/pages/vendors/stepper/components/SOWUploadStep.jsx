import { Button, Alert, Spinner, Modal } from "react-bootstrap";
import ReactMarkdown from 'react-markdown';

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
              onClick={handleFileSelect}
            >
              Browse
            </Button>
          </div>
        ) : (
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
                  <div style={{ textAlign: "left" }}>
                    <div style={{wordBreak: "break-word" }} className="fw-medium text-dark ">{sowFile.name}</div>
                  </div>
                </div>
                <Button
                  variant="link"
                  className="p-0 text-danger"
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
};

export default SOWUploadStep;