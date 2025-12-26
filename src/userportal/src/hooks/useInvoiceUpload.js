import { useState } from 'react';
import { useAnalyzeInvoice, useValidateInvoice } from './useInvoices';
import { getValidationResults } from '../services/invoices.service';

export const useInvoiceUpload = () => {
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [invoiceId, setInvoiceId] = useState(null);
  const [invoiceValidations, setInvoiceValidations] = useState([]);
  const [invoiceError, setInvoiceError] = useState(null);
  const [invoiceErrorDetail, setInvoiceErrorDetail] = useState(null);
  const [invoiceSuccess, setInvoiceSuccess] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(null);
  const [showInvoiceAnalysisModal, setShowInvoiceAnalysisModal] = useState(false);

  const analyzeInvoiceMutation = useAnalyzeInvoice();
  const validateInvoiceMutation = useValidateInvoice();

  const clearInvoiceErrors = () => {
    setInvoiceError(null);
    setInvoiceErrorDetail(null);
    setInvoiceLoading(null);
    setInvoiceSuccess(null);
  };

  // Add upload attempt tracking to prevent infinite loops
  const [uploadAttempted, setUploadAttempted] = useState(false);

  const clearInvoiceFile = () => {
    setInvoiceFile(null);
    setInvoiceId(null);
    setInvoiceError(null);
    setInvoiceErrorDetail(null);
    setInvoiceLoading(null);
    setInvoiceSuccess(null);
    setInvoiceValidations([]);
    setShowInvoiceAnalysisModal(false);
    setUploadAttempted(false); // Reset upload attempt flag
  };

  const uploadInvoice = async (file, vendorId, hasSOW = true) => {
    if (!file || !vendorId) {
      if (!file) {
        console.log('No Invoice file selected, skipping upload');
        return;
      }
      if (!vendorId) {
        throw new Error('Vendor ID is required for Invoice upload');
      }
    }

    // Prevent upload if no SOW exists (optional safety check)
    if (!hasSOW) {
      setInvoiceError('SOW Required');
      setInvoiceErrorDetail('Invoices require an associated Statement of Work (SOW). Please upload a SOW first before adding invoices.');
      setUploadAttempted(true); // Mark as attempted to prevent retries
      return;
    }

    // Mark that we've attempted upload for this file
    setUploadAttempted(true);
    
    let newInvoiceId = 0;

    try {
      setInvoiceError(null);
      setInvoiceErrorDetail(null);
      setShowInvoiceAnalysisModal(true);
      setInvoiceLoading('Analyzing document. This might take a few seconds...');

      const result = await analyzeInvoiceMutation.mutateAsync({ 
        file, 
        metadata: { vendor_id: vendorId } 
      });
      
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
      
      // Handle specific error cases more gracefully
      let errorMessage = 'Error analyzing document';
      let errorDetail = null;
      
      if (err.response?.status === 400) {
        const errorText = err.response.data?.detail || '';
        
        // Handle specific SOW-related errors
        if (errorText.includes('SOW number') && errorText.includes('could not be found')) {
          // Extract SOW number from error message
          const sowMatch = errorText.match(/SOW number "([^"]+)"/);
          const sowNumber = sowMatch ? sowMatch[1] : 'referenced SOW';
          
          errorMessage = 'Referenced SOW Not Found';
          errorDetail = `This invoice references SOW "${sowNumber}" which could not be found in the system. Please:\n\n• Upload the corresponding SOW document first, or\n• Use an invoice that references an existing SOW, or\n• Upload an invoice that doesn't reference any SOW number\n\nYou can upload SOWs from the vendor details page or the SOWs section.`;
        } else if (errorText.includes('SOW number not found in invoice')) {
          errorMessage = 'No SOW Reference Found';
          errorDetail = 'This invoice does not contain a reference to a Statement of Work (SOW) number. Invoices must be associated with a SOW. Please ensure your invoice document includes a valid SOW number that matches an existing SOW in the system.';
        } else {
          errorMessage = 'Unable to Process Invoice';
          errorDetail = errorText || 'The invoice could not be processed due to validation errors.';
        }
      } else {
        errorMessage = err.message || 'Error analyzing document';
        errorDetail = null;
      }
      
      setInvoiceError(errorMessage);
      setInvoiceErrorDetail(errorDetail);
      setShowInvoiceAnalysisModal(false);
      setInvoiceLoading(null);
      throw err;
    }

    try {
      setInvoiceLoading('Validating document with AI...');
      await validateInvoiceMutation.mutateAsync(newInvoiceId);
      setShowInvoiceAnalysisModal(false);
      setInvoiceLoading(null);
      setInvoiceSuccess('Invoice created and validated successfully with AI!');
      
      // Fetch validation results to display
      try {
        const validationData = await getValidationResults(newInvoiceId);
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
        const validationData = await getValidationResults(newInvoiceId);
        setInvoiceValidations(validationData.data);
      } catch (validationErr) {
        console.error('Error fetching invoice validation results:', validationErr);
      }
    }
  };

  return {
    // State
    invoiceFile,
    invoiceId,
    invoiceValidations,
    invoiceError,
    invoiceErrorDetail,
    invoiceSuccess,
    invoiceLoading,
    showInvoiceAnalysisModal,
    uploadAttempted,
    
    // Actions
    setInvoiceFile,
    uploadInvoice,
    clearInvoiceFile,
    clearInvoiceErrors
  };
};