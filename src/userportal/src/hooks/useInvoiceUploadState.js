import { useReducer } from 'react';

const initialState = {
  file: null,
  id: null,
  loading: null,
  error: null,
  errorDetail: null,
  success: null,
  validations: [],
  showModal: false,
  uploadAttempted: false,
};

const invoiceUploadReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FILE':
      return { ...state, file: action.payload };
    
    case 'SET_ID':
      return { ...state, id: action.payload };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { 
        ...state, 
        error: action.payload.error, 
        errorDetail: action.payload.errorDetail || null 
      };
    
    case 'SET_SUCCESS':
      return { ...state, success: action.payload };
    
    case 'SET_VALIDATIONS':
      return { ...state, validations: action.payload };
    
    case 'SET_MODAL_VISIBILITY':
      return { ...state, showModal: action.payload };
    
    case 'SET_UPLOAD_ATTEMPTED':
      return { ...state, uploadAttempted: action.payload };
    
    case 'CLEAR_ERRORS':
      return { 
        ...state, 
        error: null, 
        errorDetail: null, 
        loading: null, 
        success: null 
      };
    
    case 'CLEAR_ALL':
      return initialState;
    
    case 'START_UPLOAD':
      return {
        ...state,
        error: null,
        errorDetail: null,
        success: null,
        loading: action.payload.loadingMessage,
        showModal: true,
        uploadAttempted: true,
      };
    
    case 'UPLOAD_SUCCESS':
      return {
        ...state,
        loading: null,
        success: action.payload.successMessage,
        showModal: false,
        id: action.payload.id,
        validations: action.payload.validations || state.validations,
      };
    
    case 'UPLOAD_ERROR':
      return {
        ...state,
        loading: null,
        error: action.payload.error,
        errorDetail: action.payload.errorDetail,
        showModal: false,
      };
    
    default:
      return state;
  }
};

export const useInvoiceUploadState = () => {
  const [state, dispatch] = useReducer(invoiceUploadReducer, initialState);

  const actions = {
    setFile: (file) => dispatch({ type: 'SET_FILE', payload: file }),
    setId: (id) => dispatch({ type: 'SET_ID', payload: id }),
    setLoading: (loading) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error, errorDetail) => dispatch({ 
      type: 'SET_ERROR', 
      payload: { error, errorDetail } 
    }),
    setSuccess: (success) => dispatch({ type: 'SET_SUCCESS', payload: success }),
    setValidations: (validations) => dispatch({ type: 'SET_VALIDATIONS', payload: validations }),
    setModalVisibility: (visible) => dispatch({ type: 'SET_MODAL_VISIBILITY', payload: visible }),
    setUploadAttempted: (attempted) => dispatch({ type: 'SET_UPLOAD_ATTEMPTED', payload: attempted }),
    clearErrors: () => dispatch({ type: 'CLEAR_ERRORS' }),
    clearAll: () => dispatch({ type: 'CLEAR_ALL' }),
    startUpload: (loadingMessage) => dispatch({ 
      type: 'START_UPLOAD', 
      payload: { loadingMessage } 
    }),
    uploadSuccess: (id, successMessage, validations) => dispatch({
      type: 'UPLOAD_SUCCESS',
      payload: { id, successMessage, validations }
    }),
    uploadError: (error, errorDetail) => dispatch({
      type: 'UPLOAD_ERROR',
      payload: { error, errorDetail }
    }),
  };

  return { state, actions };
};