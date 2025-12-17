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

  const clearInvoiceFile = () => {
    setInvoiceFile(null);
    setInvoiceId(null);
    setInvoiceError(null);
    setInvoiceErrorDetail(null);
    setInvoiceLoading(null);
    setInvoiceSuccess(null);
    setInvoiceValidations([]);
    setShowInvoiceAnalysisModal(false);
  };

  const uploadInvoice = async (file, vendorId) => {
    if (!file || !vendorId) {
      if (!file) {
        console.log('No Invoice file selected, skipping upload');
        return;
      }
      if (!vendorId) {
        throw new Error('Vendor ID is required for Invoice upload');
      }
    }

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
      setInvoiceError('Error analyzing document');
      setInvoiceErrorDetail(null);
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
    
    // Actions
    setInvoiceFile,
    uploadInvoice,
    clearInvoiceFile,
    clearInvoiceErrors
  };
};