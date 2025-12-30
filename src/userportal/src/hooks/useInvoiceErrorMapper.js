export const useInvoiceErrorMapper = () => {
  const mapUploadError = (error) => {
    console.error('Invoice analysis error:', error);
    
    // Handle specific error cases more gracefully
    let errorMessage = 'Error analyzing document';
    let errorDetail = null;
    
    if (error.response?.status === 400) {
      const errorText = error.response.data?.detail || '';
      
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
      errorMessage = error.message || 'Error analyzing document';
      errorDetail = null;
    }
    
    return { errorMessage, errorDetail };
  };

  const mapSOWRequiredError = () => {
    return {
      errorMessage: 'SOW Required',
      errorDetail: 'Invoices require an associated Statement of Work (SOW). Please upload a SOW first before adding invoices.'
    };
  };

  const mapValidationError = (error) => {
    console.error('Invoice validation error:', error);
    return {
      errorMessage: 'Validation Error',
      errorDetail: 'An error occurred during validation. The invoice was created but validation completed with warnings.'
    };
  };

  return {
    mapUploadError,
    mapSOWRequiredError,
    mapValidationError,
  };
};