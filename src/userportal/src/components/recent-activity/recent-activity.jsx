import { useEffect, useState } from "react";
import { Container, Row, Col, Spinner } from "react-bootstrap";

import "./recent-activity.css";
import api from "../../api/Api";
import ActivityTile from "../activity-tile/activity-tile";
import PdfPreviewModal from "../pdf-preview-modal/pdf-preview-modal";

export default function RecentActivity() {
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [error, setError] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedDocumentUrl, setSelectedDocumentUrl] = useState(null);

  const fetchRecentDocuments = async () => {
    try {
      const data = await api.documents.get("created");
      setRecentDocuments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const data = await api.activities.getRecent(3);
      setRecentActivities(data.logs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    fetchRecentDocuments();
    fetchRecentActivities();
  }, []);


  const handleMenuAction = async (action, documentItem) => {
    
    try {
      // Determine document type based on blob_name or other properties
      const isInvoice = documentItem.blob_name?.toLowerCase().includes('inv-') || 
                       documentItem.blob_name?.toLowerCase().includes('invoice');
      const isSOW = documentItem.blob_name?.toLowerCase().includes('sow') || 
                   documentItem.blob_name?.toLowerCase().includes('statement_of_work');

      switch (action) {
        case 'view':
          // Open PDF preview modal
          const documentUrl = api.documents.getUrl(documentItem.blob_name);
          console.log('Open PDF preview modal document url', documentUrl)
          setSelectedDocumentUrl(documentUrl);
          setShowPdfModal(true);
          break;

        case 'download':
          // Download the document
          const downloadUrl = api.documents.getUrl(documentItem.blob_name);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = documentItem.blob_name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          break;

        case 'delete':
          // Confirm deletion
          if (window.confirm(`Are you sure you want to delete "${documentItem.blob_name}"?`)) {
            // Delete the document from blob storage
            await api.documents.delete(documentItem.blob_name);
            
            // If it's an invoice or SOW, also delete from the respective API
            if (isInvoice && documentItem.invoice_id) {
              await api.invoices.delete(documentItem.invoice_id);
            } else if (isSOW && documentItem.sow_id) {
              await api.sows.delete(documentItem.sow_id);
            }
            
            // Refresh the documents list
            await fetchRecentDocuments();
          }
          break;

        default:
          console.log("Unknown action:", action);
          break;
      }
    } catch (error) {
      console.error("Error handling menu action:", error);
      setError(`Error ${action}ing document: ${error.message}`);
    }
  };

  const handleClosePdfModal = () => {
    setShowPdfModal(false);
    setSelectedDocumentUrl(null);
  };

  return (
    <Container fluid className="py-5 section-wrapper">
      <Row className="gap-5 justify-content-center">
        {/* Left Section - Recent Activity */}
        <Col lg={6}>
          <div className="mb-4">
            <h3 className="fw-bold text-dark mb-2">Recent Activity</h3>
            <p className="text-muted">Latest updates and changes in your system</p>
          </div>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <div>
                {loadingActivities &&    
             <div className="d-flex justify-content-center align-items-center" style={{ height: '20vh' }}>
                <Spinner animation="border" role="status" variant="primary">
                </Spinner>
              </div>
              }
            {recentActivities.map((activity, index) => (
              <ActivityTile
                key={index}
                icon={<i className="fa-solid fa-file-invoice"></i>}
                title={activity.message}
                timestamp={activity.timestamp}
                showMenu={false}
              />
            ))}
          </div>
        </Col>

        {/* Right Section - Recent Documents */}
        <Col lg={5}>
          <div className="mb-4">
            <h3 className="fw-bold text-dark mb-2">Recent Documents</h3>
            <p className="text-muted">Recently uploaded invoices and SOW files</p>
          </div>
          <div>
            {loadingDocuments &&    
             <div className="d-flex justify-content-center align-items-center" style={{ height: '20vh' }}>
                <Spinner animation="border" role="status" variant="primary">
                </Spinner>
              </div>
              }
            {recentDocuments.slice(0, 3).map((document, index) => (
              <ActivityTile
                key={index}
                icon={<i className="fa-solid fa-file-invoice"></i>}
                title={document.blob_name}
                timestamp={document.created}
                fileSize={document.size}
                showMenu={true}
                onMenuAction={(action) =>
                  handleMenuAction(action, document)
                }
              />
            ))}
          </div>
        </Col>
      </Row>

      {/* PDF Preview Modal */}
      <PdfPreviewModal
        show={showPdfModal}
        handleClose={handleClosePdfModal}
        fileUrl={selectedDocumentUrl}
      />
    </Container>
  );
}
