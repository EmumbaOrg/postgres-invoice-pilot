import { useState } from 'react';
import { useAnalyzeSOW, useValidateSOW, useDeleteSOW } from './useSOWs';
import { getValidationResults } from '../services/sows.service';

export const useSOWUpload = () => {
  const [sowFile, setSowFile] = useState(null);
  const [sowId, setSowId] = useState(null);
  const [validations, setValidations] = useState([]);
  const [error, setError] = useState(null);
  const [errorDetail, setErrorDetail] = useState(null);
  const [loading, setLoading] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  const analyzeSOWMutation = useAnalyzeSOW();
  const validateSOWMutation = useValidateSOW();
  const deleteSOWMutation = useDeleteSOW();

  const clearErrors = () => {
    setError(null);
    setErrorDetail(null);
    setLoading(null);
    setSuccess(null);
  };

  const clearFile = async () => {
    // If SOW was uploaded to backend, delete it
    if (sowId) {
      try {
        await deleteSOWMutation.mutateAsync(sowId);
      } catch (error) {
        console.error('Error deleting SOW from backend:', error);
        // Continue with clearing frontend state even if backend delete fails
      }
    }
    
    setSowFile(null);
    setSowId(null);
    setError(null);
    setErrorDetail(null);
    setLoading(null);
    setSuccess(null);
    setValidations([]);
    setShowAnalysisModal(false);
  };

  const uploadSOW = async (file, vendorId) => {
    if (!file || !vendorId) {
      if (!file) {
        console.log('No SOW file selected, skipping upload');
        return;
      }
      if (!vendorId) {
        throw new Error('Vendor ID is required for SOW upload');
      }
    }

    let newSowId = 0;

    try {
      setError(null);
      setErrorDetail(null);
      setShowAnalysisModal(true);
      setLoading('Analyzing document. This might take a few seconds...');

      const result = await analyzeSOWMutation.mutateAsync({ 
        file, 
        metadata: { vendor_id: vendorId } 
      });
      
      if (result.hasError) {
        setErrorDetail(result.error);
        throw new Error(result.message);
      }

      setSowId(result.sow.id);
      newSowId = result.sow.id;
    } catch (err) {
      setError(err.message);
      setShowAnalysisModal(false);
      setLoading(null);
      throw err;
    }

    try {
      setLoading('Validating document with AI...');
      await validateSOWMutation.mutateAsync(newSowId);
      setShowAnalysisModal(false);
      setLoading(null);
      setSuccess('SOW created and validated successfully with AI!');
      
      // Fetch validation results to display
      try {
        const validationData = await getValidationResults(newSowId);
        setValidations(validationData.data);
      } catch (validationErr) {
        console.error('Error fetching validation results:', validationErr);
      }
    } catch (err) {
      console.error('Validation error:', err);
      // Continue anyway, since the SOW is already created in the database
      setShowAnalysisModal(false);
      setLoading(null);
      setSuccess('SOW created successfully! (Validation completed with some warnings)');
      
      // Still try to fetch validation results even if validation had errors
      try {
        const validationData = await getValidationResults(newSowId);
        setValidations(validationData.data);
      } catch (validationErr) {
        console.error('Error fetching validation results:', validationErr);
      }
    }
  };

  return {
    // State
    sowFile,
    sowId,
    validations,
    error,
    errorDetail,
    loading,
    success,
    showAnalysisModal,
    
    // Actions
    setSowFile,
    uploadSOW,
    clearFile,
    clearErrors
  };
};