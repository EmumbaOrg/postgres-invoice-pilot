import { useState, useCallback } from "react";
import { Container, Row, Col, Spinner, Alert } from "react-bootstrap";

import "./recent-activity.css";
import ActivityTile from "../activity-tile/activity-tile";
import PdfPreviewModal from "../pdf-preview-modal/pdf-preview-modal";
import ConfirmModal from "../ConfirmModal";
import { useRecentDocuments, useDeleteDocument, getDocumentUrl } from "../../hooks/useDocuments";
import { useRecentActivities } from "../../hooks/useActivities";
import { useDeleteInvoice } from "../../hooks/useInvoices";
import { useDeleteSOW } from "../../hooks/useSOWs";
import { formatDocumentDisplayName, extractFileName, getDocumentIconClass } from "../../utils/common-functions";

export default function RecentActivity() {
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedDocumentUrl, setSelectedDocumentUrl] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Fetch recent documents and activities using React Query
  const { 
    data: recentDocuments = [], 
    isLoading: loadingDocuments,
    error: documentsError 
  } = useRecentDocuments("created");
  
  const { 
    data: activitiesData, 
    isLoading: loadingActivities,
    error: activitiesError 
  } = useRecentActivities(3);

  // Mutations
  const deleteDocumentMutation = useDeleteDocument();
  const deleteInvoiceMutation = useDeleteInvoice();
  const deleteSOWMutation = useDeleteSOW();

  const recentActivities = activitiesData?.logs || [];

  const handleMenuAction = useCallback((action, documentItem) => {
    try {
      switch (action) {
        case 'view':
          // Open PDF preview modal
          const documentUrl = getDocumentUrl(documentItem.blob_name);
          setSelectedDocumentUrl(documentUrl);
          setShowPdfModal(true);
          break;

        case 'download':
          // Download the document
          const downloadUrl = getDocumentUrl(documentItem.blob_name);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = extractFileName(documentItem.blob_name);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          break;

        case 'delete':
          // Store document to delete and show confirmation modal
          setDocumentToDelete(documentItem);
          setShowDeleteModal(true);
          break;

        default:
          console.log("Unknown action:", action);
          break;
      }
    } catch (error) {
      console.error("Error handling menu action:", error);
      setErrorMessage(`Error ${action}ing document: ${error.message}`);
    }
  }, []);

  const handleClosePdfModal = useCallback(() => {
    setShowPdfModal(false);
    setSelectedDocumentUrl(null);
  }, []);

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;

    try {
      const documentItem = documentToDelete;
      
      // Determine document type based on blob_name or other properties
      const isInvoice = documentItem.blob_name?.toLowerCase().includes('inv-') || 
                       documentItem.blob_name?.toLowerCase().includes('invoice');
      const isSOW = documentItem.blob_name?.toLowerCase().includes('sow') || 
                   documentItem.blob_name?.toLowerCase().includes('statement_of_work');

      // Delete the document from blob storage
      await deleteDocumentMutation.mutateAsync(documentItem.blob_name);
      
      // If it's an invoice or SOW, also delete from the respective API
      if (isInvoice && documentItem.invoice_id) {
        await deleteInvoiceMutation.mutateAsync(documentItem.invoice_id);
      } else if (isSOW && documentItem.sow_id) {
        await deleteSOWMutation.mutateAsync(documentItem.sow_id);
      }
      
      // Close modal and reset state
      setShowDeleteModal(false);
      setDocumentToDelete(null);
      setErrorMessage(null);
    } catch (error) {
      console.error("Error deleting document:", error);
      setErrorMessage(`Error deleting document: ${error.message}`);
      setShowDeleteModal(false);
      setDocumentToDelete(null);
    }
  };

  const isDeleting = deleteDocumentMutation.isPending || 
                     deleteInvoiceMutation.isPending || 
                     deleteSOWMutation.isPending;

  const error = documentsError || activitiesError || errorMessage;

  return (
    <Container fluid className="py-5 section-wrapper" style={{minHeight: "467px"}}>
      <Row className="gap-5 justify-content-center">
        {/* Left Section - Recent Activity */}
        <Col lg={6}>
          <div className="mb-4">
            <h3 className="fw-bold text-dark mb-2">Recent Activity</h3>
            <p className="text-muted">Latest updates and changes in your system</p>
          </div>
          
          {error && (
            <Alert variant="danger" role="alert" dismissible onClose={() => setErrorMessage(null)}>
              {typeof error === 'string' ? error : error?.message}
            </Alert>
          )}
          
          <div style={{display:"flex", flexDirection: "column", gap:"16px"}}>
            {loadingActivities && (
              <div className="d-flex justify-content-center align-items-center" style={{ height: '20vh' }}>
                <Spinner animation="border" role="status" variant="primary" />
              </div>
            )}
            {!loadingActivities && recentActivities.map((activity, index) => (
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
          
          <div style={{display:"flex", flexDirection:"column", gap:"16px"}}>
            {loadingDocuments && (
              <div className="d-flex justify-content-center align-items-center" style={{ height: '20vh' }}>
                <Spinner animation="border" role="status" variant="primary" />
              </div>
            )}
            {!loadingDocuments && recentDocuments.slice(0, 3).map((document, index) => (
              <ActivityTile
                key={index}
                icon={<i className={getDocumentIconClass(document.blob_name)}></i>}
                title={formatDocumentDisplayName(document.blob_name)}
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={showDeleteModal}
        handleClose={() => setShowDeleteModal(false)}
        handleConfirm={handleConfirmDelete}
        title="Delete Document"
        message={`Are you sure you want to delete this document?\n\n"${documentToDelete ? formatDocumentDisplayName(documentToDelete.blob_name) : ''}"`}
        isLoading={isDeleting}
      />
    </Container>
  );
}
