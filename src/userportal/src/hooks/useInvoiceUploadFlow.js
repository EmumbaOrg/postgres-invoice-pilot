import { useAnalyzeInvoice, useValidateInvoice } from './useInvoices';
import { getValidationResults } from '../services/invoices.service';
import { useInvoiceUploadState } from './useInvoiceUploadState';
import { useInvoiceErrorMapper } from './useInvoiceErrorMapper';

export const useInvoiceUploadFlow = () => {
  const { state, actions } = useInvoiceUploadState();
  const { mapUploadError, mapSOWRequiredError } = useInvoiceErrorMapper();
  
  const analyzeInvoiceMutation = useAnalyzeInvoice();
  const validateInvoiceMutation = useValidateInvoice();

  const validatePreconditions = (file, vendorId, hasSOW) => {
    if (!file) {
      console.log('No Invoice file selected, skipping upload');
      return { isValid: false, skipUpload: true };
    }
    
    if (!vendorId) {
      throw new Error('Vendor ID is required for Invoice upload');
    }

    if (!hasSOW) {
      const { errorMessage, errorDetail } = mapSOWRequiredError();
      actions.setError(errorMessage, errorDetail);
      actions.setUploadAttempted(true);
      return { isValid: false, skipUpload: false };
    }

    return { isValid: true, skipUpload: false };
  };

  const analyzeInvoice = async (file, vendorId) => {
    actions.startUpload('Analyzing document. This might take a few seconds...');

    try {
      const result = await analyzeInvoiceMutation.mutateAsync({ 
        file, 
        metadata: { vendor_id: vendorId } 
      });
      
      if (result.hasError) {
        actions.uploadError(result.message, result.error);
        throw new Error(result.message);
      }

      return result.invoice.id;
    } catch (error) {
      const { errorMessage, errorDetail } = mapUploadError(error);
      actions.uploadError(errorMessage, errorDetail);
      throw error;
    }
  };

  const validateInvoice = async (invoiceId) => {
    actions.setLoading('Validating document with AI...');

    try {
      await validateInvoiceMutation.mutateAsync(invoiceId);
      
      // Fetch validation results
      const validationData = await getValidationResults(invoiceId);
      actions.uploadSuccess(
        invoiceId,
        'Invoice created and validated successfully with AI!',
        validationData.data
      );
    } catch (error) {
      console.error('Invoice validation error:', error);
      
      // Continue anyway, since the Invoice is already created in the database
      try {
        const validationData = await getValidationResults(invoiceId);
        actions.uploadSuccess(
          invoiceId,
          'Invoice created successfully! (Validation completed with some warnings)',
          validationData.data
        );
      } catch (validationError) {
        console.error('Error fetching invoice validation results:', validationError);
        actions.uploadSuccess(
          invoiceId,
          'Invoice created successfully! (Validation completed with some warnings)',
          []
        );
      }
    }
  };

  const uploadInvoice = async (file, vendorId, hasSOW = true) => {
    const validation = validatePreconditions(file, vendorId, hasSOW);
    
    if (!validation.isValid) {
      if (validation.skipUpload) return;
      throw new Error('Preconditions not met');
    }

    // Mark that we've attempted upload for this file
    actions.setUploadAttempted(true);

    try {
      const invoiceId = await analyzeInvoice(file, vendorId);
      await validateInvoice(invoiceId);
    } catch (error) {
      // Error handling is done in the individual functions
      throw error;
    }
  };

  return {
    // State - mapped to original property names for compatibility
    invoiceFile: state.file,
    invoiceId: state.id,
    invoiceLoading: state.loading,
    invoiceError: state.error,
    invoiceErrorDetail: state.errorDetail,
    invoiceSuccess: state.success,
    invoiceValidations: state.validations,
    showInvoiceAnalysisModal: state.showModal,
    uploadAttempted: state.uploadAttempted,
    
    // Actions - mapped to original method names
    setInvoiceFile: actions.setFile,
    uploadInvoice,
    clearInvoiceFile: actions.clearAll,
    clearInvoiceErrors: actions.clearErrors,
  };
};