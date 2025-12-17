import { useState } from "react";
import { Form, Alert } from "react-bootstrap";

const VendorDetailsStep = ({ 
  formData, 
  setFormData, 
  error, 
  onSave 
}) => {
  // Inline validation messages
  const [contactEmailError, setContactEmailError] = useState('');
  const [contactPhoneError, setContactPhoneError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    contact_name: '',
    type: '',
    address: '',
  });

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

  const handleInputChange = (field, value) => {
    // Update form data
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Inline validation for email
    if (field === 'contact_email') {
      const trimmed = (value || '').trim();
      if (value && trimmed.length === 0) {
        setContactEmailError('Email cannot be blank or only spaces');
      } else if (trimmed.length === 0) {
        setContactEmailError('');
      } else if (!validateEmail(trimmed)) {
        setContactEmailError('Please enter a valid email address');
      } else {
        setContactEmailError('');
      }
    }

    // Inline validation for phone
    if (field === 'contact_phone') {
      const trimmed = (value || '').trim();
      const digits = trimmed.replace(/\D/g, '');
      if (value && trimmed.length === 0) {
        setContactPhoneError('Phone cannot be blank or only spaces');
      } else if (digits.length === 0) {
        setContactPhoneError('');
      } else if (!(digits.length >= 7 && digits.length <= 15)) {
        setContactPhoneError('Please enter a valid phone number (7-15 digits)');
      } else {
        setContactPhoneError('');
      }
    }

    // Generic required-field spaces-only detection
    if (['name', 'contact_name', 'type', 'address'].includes(field)) {
      const trimmed = (value || '').trim();
      setFieldErrors((prev) => ({ 
        ...prev, 
        [field]: value && trimmed.length === 0 ? 'This field cannot be blank or only spaces' : '' 
      }));
    }
  };

  const handleBlur = (field) => {
    const value = formData[field] || '';
    
    // For required fields, show message if empty or spaces-only on blur
    if (['name', 'contact_name', 'type', 'address'].includes(field)) {
      if (!isNonEmpty(value)) {
        setFieldErrors((prev) => ({ ...prev, [field]: 'This field is required' }));
      } else {
        setFieldErrors((prev) => ({ ...prev, [field]: '' }));
      }
    }

    if (field === 'contact_email') {
      if (!isNonEmpty(value)) {
        setContactEmailError('Email is required');
      } else if (!validateEmail(value)) {
        setContactEmailError('Please enter a valid email address');
      } else {
        setContactEmailError('');
      }
    }

    if (field === 'contact_phone') {
      if (!isNonEmpty(value)) {
        setContactPhoneError('Phone number is required');
      } else if (!validatePhone(value)) {
        setContactPhoneError('Please enter a valid phone number (7-15 digits)');
      } else {
        setContactPhoneError('');
      }
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

  return (
    <>
      {error && (
        <Alert variant="danger" className="mb-3">
          <i className="fa-solid fa-circle-exclamation me-2" style={{ color: 'var(--bs-danger)' }}></i>
          {error}
        </Alert>
      )}
      <Form onSubmit={onSave}>
        <div className="mb-4">
          <h5 className="section-heading">Vendor Details</h5>
          <div className="row g-3">
            <div className="col-12">
              <Form.Group>
                <input
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  className="form-control p-3"
                  placeholder="Vendor Name *"
                  type="text"
                  onBlur={() => handleBlur('name')}
                />
                {fieldErrors.name ? (
                  <div className="form-text text-danger mt-1">{fieldErrors.name}</div>
                ) : null}
              </Form.Group>
            </div>
            <div className="col-12">
              <input
                style={{ margin: 0 }}
                type="text"
                className="form-control p-3"
                placeholder="Type *"
                value={formData.type}
                onChange={(e) => handleInputChange("type", e.target.value)}
                onBlur={() => handleBlur('type')}
                required
              />
              {fieldErrors.type ? (
                <div className="form-text text-danger mt-1">{fieldErrors.type}</div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h5 className="section-heading">Contact Info</h5>
          <div className="row g-3">
            <div className="col-12">
              <input
                type="text"
                className="form-control p-3"
                placeholder="Contact Person *"
                value={formData.contact_name}
                onChange={(e) => handleInputChange("contact_name", e.target.value)}
                onBlur={() => handleBlur('contact_name')}
                required
              />
              {fieldErrors.contact_name ? (
                <div className="form-text text-danger mt-1">{fieldErrors.contact_name}</div>
              ) : null}
            </div>
            <div className="col-12">
              <input
                type="tel"
                className="form-control p-3"
                placeholder="Phone Number *"
                value={formData.contact_phone}
                onChange={(e) => handleInputChange("contact_phone", e.target.value)}
                onBlur={() => handleBlur('contact_phone')}
                required
              />
              {contactPhoneError ? (
                <div className="form-text text-danger mt-1">{contactPhoneError}</div>
              ) : null}
            </div>
            <div className="col-12">
              <input
                type="email"
                className="form-control p-3"
                placeholder="Email Address *"
                value={formData.contact_email}
                onChange={(e) => handleInputChange("contact_email", e.target.value)}
                onBlur={() => handleBlur('contact_email')}
                required
              />
              {contactEmailError ? (
                <div className="form-text text-danger mt-1">{contactEmailError}</div>
              ) : null}
            </div>
            <div className="col-12">
              <input
                type="url"
                className="form-control p-3"
                placeholder="Website"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
              />
            </div>
            <div className="col-12">
              <input
                type="text"
                className="form-control p-3"
                placeholder="Location *"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                onBlur={() => handleBlur('address')}
                required
              />
              {fieldErrors.address ? (
                <div className="form-text text-danger mt-1">{fieldErrors.address}</div>
              ) : null}
            </div>
          </div>
        </div>
      </Form>
    </>
  );
};

export default VendorDetailsStep;