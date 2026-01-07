import { useState, useEffect } from "react";

import "./stepper.css";
import { useAllVendors, useCreateVendor } from '../../../hooks/useVendors';
import { useSOWUpload } from '../../../hooks/useSOWUpload';
import { useInvoiceUploadFlow } from '../../../hooks/useInvoiceUploadFlow';

// Import step components
import StepperWizard from './components/StepperWizard';
import VendorDetailsStep from './components/VendorDetailsStep';
import SOWUploadStep from './components/SOWUploadStep';
import InvoiceUploadStep from './components/InvoiceUploadStep';

const NavigationStepper = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    website: "",
    address: "",
  });
  const [serverFieldErrors, setServerFieldErrors] = useState({});
  const [vendorId, setVendorId] = useState(null);

  // React Query hooks
  const { data: vendorsData, isLoading: loadingVendors } = useAllVendors();
  const createVendorMutation = useCreateVendor();

  // Custom upload hooks
  const sowUpload = useSOWUpload();
  const invoiceUpload = useInvoiceUploadFlow();

  const steps = [
    {
      title: "Vendor Details",
      subtitle: "Add vendor details",
      required: true,
    },
    {
      title: "Upload SOW",
      subtitle: "*Optional",
      required: false,
    },
    {
      title: "Upload Invoices",
      subtitle: "*Optional",
      required: false,
    },
  ];

  // Set vendors from React Query
  useEffect(() => {
    if (vendorsData?.data) {
      setVendors(vendorsData.data);
    }
  }, [vendorsData]);

  // Auto-upload Invoice when both file and vendorId are available
  useEffect(() => {
    if (invoiceUpload.invoiceFile && 
        vendorId && 
        !invoiceUpload.invoiceId && 
        !invoiceUpload.invoiceLoading && 
        !invoiceUpload.showInvoiceAnalysisModal &&
        !invoiceUpload.uploadAttempted && // Don't retry if already attempted
        !invoiceUpload.invoiceError) { // Don't retry if there's an error
      const hasSOW = sowUpload.sowId || sowUpload.sowFile;
      invoiceUpload.uploadInvoice(invoiceUpload.invoiceFile, vendorId, hasSOW);
    }
  }, [invoiceUpload.invoiceFile, vendorId, invoiceUpload.invoiceId, invoiceUpload.invoiceLoading, invoiceUpload.showInvoiceAnalysisModal, invoiceUpload.uploadAttempted, invoiceUpload.invoiceError, sowUpload.sowId, sowUpload.sowFile]);

  // Validation helper functions
  const isNonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;
  const validateEmail = (email) => {
    if (!email) return false;
    const trimmed = email.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  };
  const validatePhone = (phone) => {
    if (!phone) return false;
    const digits = (phone || '').replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
  };

  // Handle SOW upload
  const handleSOWUpload = (file) => {
    sowUpload.uploadSOW(file, vendorId);
  };

  const handleSaveAndNext = async () => {
    setIsLoading(true);
    setError(null);
    setServerFieldErrors({});
    try {
      // Make API calls based on current step
      switch (currentStep) {
        case 0:
          // Step 1: Save vendor details
          const vendorResponse = await saveVendorDetails();
          if (vendorResponse?.id) {
            setVendorId(vendorResponse.id);
          }
          break;
        case 1:
          // Step 2: SOW upload happens immediately when file is selected in SOWUploadStep
          // No additional processing needed here
          break;
        case 2:
          // Step 3: Upload invoice (if file exists) - only if not already processed and no previous errors
          if (invoiceUpload.invoiceFile && 
              !invoiceUpload.invoiceId && 
              !invoiceUpload.uploadAttempted && 
              !invoiceUpload.invoiceError) {
            const hasSOW = sowUpload.sowId || sowUpload.sowFile;
            await invoiceUpload.uploadInvoice(invoiceUpload.invoiceFile, vendorId, hasSOW);
          }
          break;
        default:
          console.log("Unknown step");
          break;
      }

      // Special handling for invoice step when no SOW exists
      if (currentStep === 2 && !sowUpload.sowId && !sowUpload.sowFile) {
        // Skip invoice upload if no SOW was uploaded (invoices require SOW)
        window.location.href = "/vendors";
        return;
      }

      // Move to next step if API call successful
      if (currentStep < steps.length - 1) {
        // Skip invoice step if no SOW was uploaded (invoices require SOW)
        if (currentStep === 1 && !sowUpload.sowId && !sowUpload.sowFile) {
          window.location.href = "/vendors";
          return;
        }
        setCurrentStep(currentStep + 1);
      } else {
        // All steps completed
        window.location.href = "/vendors";
      }
    } catch (error) {
      // Default fallback message
      const rawMessage = error instanceof Error ? error.message : "Something went wrong";
      // Show error in alert for vendor details step
      if (currentStep === 0) {
        // If the error contains details (field errors), build a friendly message
        if (error && error.details && Array.isArray(error.details) && error.details.length > 0) {
          const fieldErrs = {};
          const friendlyParts = [];
          const labelMap = {
            contact_email: 'Email',
            contact_phone: 'Phone',
            contact_name: 'Contact person',
            name: 'Vendor name',
            type: 'Type',
            address: 'Location',
            website: 'Website'
          };

          error.details.forEach((d) => {
            let field = null;
            if (Array.isArray(d.loc) && d.loc.length >= 2) {
              field = d.loc[1];
            } else if (typeof d.loc === 'string') {
              const parts = d.loc.split('.');
              field = parts[parts.length - 1];
            }

            const msg = d.msg || (typeof d === 'string' ? d : JSON.stringify(d));

            if (field) {
              fieldErrs[field] = msg;
              const label = labelMap[field] || field.replace(/_/g, ' ');
              friendlyParts.push(`${label}: ${msg}`);
            } else {
              friendlyParts.push(msg);
            }
          });

          setServerFieldErrors(fieldErrs);
          setError(friendlyParts.join('; '));
        } else {
          // No structured details; show plain message
          setError(rawMessage);
        }
      }
      // Don't advance to next step if there was an error
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const saveVendorDetails = async () => {
    // Validate required fields for vendor details
    const { name, contact_name, contact_email, contact_phone, type, address, website } = formData;

    if (!isNonEmpty(name) || !isNonEmpty(contact_name) || !isNonEmpty(contact_email) || !isNonEmpty(contact_phone) || !isNonEmpty(type) || !isNonEmpty(address)) {
      throw new Error('Please fill in all required vendor details');
    }

    if (!validateEmail(contact_email)) {
      throw new Error('Please enter a valid email address');
    }

    if (!validatePhone(contact_phone)) {
      throw new Error('Please enter a valid phone number');
    }

    const payload = {
      name: name.trim(),
      contact_name: contact_name.trim(),
      contact_email: contact_email.trim(),
      contact_phone: contact_phone.trim(),
      type: type.trim(),
      address: address.trim(),
      website: website ? website.trim() : '',
    };

    try {
      const response = await createVendorMutation.mutateAsync(payload);
      return response;
    } catch (err) {
      throw err;
    }
  };

  // Helper function to check if required vendor details are filled
  const isVendorDetailsValid = () => {
    return (
      isNonEmpty(formData.name) &&
      isNonEmpty(formData.contact_name) &&
      isNonEmpty(formData.type) &&
      isNonEmpty(formData.address) &&
      validateEmail(formData.contact_email) &&
      validatePhone(formData.contact_phone)
    );
  };

  // Helper function to check if Save & Next button should be disabled
  const isSaveNextDisabled = () => {
    if (currentStep === 0) {
      // For vendor details step, check if all required fields are filled
      return !isVendorDetailsValid() || isLoading;
    }
    // For optional steps (SOW and Invoice upload), only disable during loading
    return isLoading;
  };

  // Check if we should skip invoice step
  const shouldSkipInvoiceStep = () => {
    return !sowUpload.sowId && !sowUpload.sowFile;
  };

  // Get button text based on current step and conditions
  const getButtonText = () => {
    if (currentStep === 0) {
      return "Save & Next";
    } else if (currentStep === 1) {
      return shouldSkipInvoiceStep() ? "Complete" : "Save & Next";
    } else {
      return "Complete";
    }
  };

  // Define render content for each step
  const renderContent = [
    <VendorDetailsStep
      key="vendor-details"
      formData={formData}
      setFormData={setFormData}
      error={error}
      serverFieldErrors={serverFieldErrors}
      onSave={handleSaveAndNext}
    />,
    <SOWUploadStep
      key="sow-upload"
      sowFile={sowUpload.sowFile}
      setSowFile={sowUpload.setSowFile}
      validations={sowUpload.validations}
      error={sowUpload.error}
      errorDetail={sowUpload.errorDetail}
      success={sowUpload.success}
      loading={sowUpload.loading}
      showAnalysisModal={sowUpload.showAnalysisModal}
      onUpload={handleSOWUpload}
      onClearFile={sowUpload.clearFile}
    />,
    <InvoiceUploadStep
      key="invoice-upload"
      invoiceFile={invoiceUpload.invoiceFile}
      setInvoiceFile={invoiceUpload.setInvoiceFile}
      invoiceValidations={invoiceUpload.invoiceValidations}
      invoiceError={invoiceUpload.invoiceError}
      invoiceErrorDetail={invoiceUpload.invoiceErrorDetail}
      invoiceSuccess={invoiceUpload.invoiceSuccess}
      invoiceLoading={invoiceUpload.invoiceLoading}
      showInvoiceAnalysisModal={invoiceUpload.showInvoiceAnalysisModal}
      onUpload={(file) => {
        const hasSOW = sowUpload.sowId || sowUpload.sowFile;
        invoiceUpload.uploadInvoice(file, vendorId, hasSOW);
      }}
      onClearFile={invoiceUpload.clearInvoiceFile}
      hasSOW={sowUpload.sowId || sowUpload.sowFile}
    />
  ];

  return (
    <StepperWizard
      activeStep={currentStep}
      setActiveStep={setCurrentStep}
      steps={steps}
      renderContent={renderContent}
      onSaveAndNext={handleSaveAndNext}
      isLoading={isLoading}
      isSaveNextDisabled={isSaveNextDisabled}
      buttonText={getButtonText()}
    />
  );
};

export default NavigationStepper;