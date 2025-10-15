import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Row, Col, Spinner, Alert, Modal, Breadcrumb, Dropdown } from 'react-bootstrap';
import { NumericFormat } from 'react-number-format';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

import api from '../../api/Api';
import ConfirmModal from '../../components/ConfirmModal';
import PagedTable from '../../components/PagedTable';
import SOWCreateModal from './create';
import ActivityTile from '../../components/activity-tile/activity-tile';
import StatusChip from '../../components/status-chip/status-chip';

const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const SOWEdit = () => {
  const query = useQuery();
  const { id } = useParams(); // Extract SOW ID from URL
  const navigate = useNavigate();
  const [sowNumber, setSowNumber] = useState('');
  const [sowVendorId, setSowVendorId] = useState('');
  const [sowDocument, setSowDocument] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [metadata, setMetadata] = useState('');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showValidation, setShowValidation] = useState(false);
  const [validating, setValidating] = useState(false); 
  const [vendors, setVendors] = useState([]);
  const [validations, setValidations] = useState([]);

  const [showDeleteMilestoneModal, setShowDeleteMilestoneModal] = useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = useState(null);
  const [reloadMilestones, setReloadMilestones] = useState(false);
const [showCreateSOWModal, setShowCreateSOWModal] = useState(false);
  const [isDeletingMilestone, setIsDeletingMilestone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const message = query.get('success');
    if (message) {
      setSuccess(message);
    }
    const validation = query.get('showValidation');
    if (validation) {
      setShowValidation(true);
    }
  }, [useLocation().search]);

  const sowLoaded = useRef(false);

  useEffect(() => {
    // Fetch data when component mounts
    if (!sowLoaded.current) {
       // Load Vendors dropdown options
       const fetchVendors = async () => {
        try {
          const data = await api.vendors.list(0, -1); // No pagination limit
          setVendors(data.data);
        } catch (err) {
          console.error(err);
          setError('Error fetching Vendors');
          setSuccess(null);
        }
      };
      fetchVendors();

      // Load SOW Details
      const fetchSow = async () => {
        try {
          const data = await api.sows.get(id);
          updateDisplay(data);
        } catch (err) {
          console.error(err);
          setError('Failed to load SOW data');
        }

        // Load SOW Validations after SOW is loaded
        const fetchValidations = async () => {
          try {
            const data = await api.validationResults.sow(id);
            setValidations(data.data);
          } catch (err) {
            console.error(err);
            setError('Error fetching Validations');
            setSuccess(null);
          }
        };
        fetchValidations();

        sowLoaded.current = true;
      };
      fetchSow();
    }
  }, [id]);

  const updateDisplay = (data) => {
    setSowNumber(data.number);
    setSowVendorId(data.vendor_id);
    setSowDocument(data.document);
    setStartDate(data.start_date);
    setEndDate(data.end_date);
    setBudget(data.budget);
    setMetadata(data.metadata ? JSON.stringify(data.metadata, null, 2) : '');
    setSummary(data.summary);
  }

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setIsSaving(true);
    try {
      var data = {
        number: sowNumber,
        vendor_id: sowVendorId,
        start_date: startDate,
        end_date: endDate,
        budget: parseFloat(budget)
      };
      var updatedItem = await api.sows.update(id, data);

      updateDisplay(updatedItem);
      setSuccess('SOW updated successfully!');
      setError(null);
      setTimeout(() => {
        navigate('/sows');
      }, 500); 
    } catch (err) {
      console.error(err);
      setError('Failed to update SOW');
      setSuccess(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMilestone = async () => {
    setIsDeletingMilestone(true);
    try {
      await api.milestones.delete(milestoneToDelete);
      setSuccess('Milestone deleted successfully!');
      setError(null);
      setShowDeleteMilestoneModal(false);
      setMilestoneToDelete(null);
      setReloadMilestones(true);
    } catch (err) {
      setSuccess(null);
      setError(`Error deleting milestone: ${err.message}`);
      setShowDeleteMilestoneModal(false);
      setMilestoneToDelete(null);
    } finally {
      setIsDeletingMilestone(false);
    }
  };

  const milestoneColumns = React.useMemo(
    () => [
      {
        Header: 'Name',
        accessor: 'name',
      },
      {
        Header: 'Payment Status',
        accessor: 'status',
        Cell: ({ value }) => {
              return <StatusChip status={value} />;
            },
        
      },
      {
        Header: '',
        accessor: 'actions',
        Cell: ({ row }) => {
          return (
            <Dropdown>
             <Dropdown.Toggle
              variant="outline-primary"
              size="sm"
              id={`dropdown-${row.original.id}`}
              className="border-0"
            >
              <i className="fas fa-ellipsis-v"></i>
            </Dropdown.Toggle>
            <Dropdown.Menu align="end">
              <Dropdown.Item className="d-flex align-items-center gap-1" href={`/milestones/${row.original.id}`}>
                Edit
              </Dropdown.Item>
               <Dropdown.Item  
               className="d-flex align-items-center gap-1"
                onClick={() => {
                  setMilestoneToDelete(row.original.id);
                  setShowDeleteMilestoneModal(true);
             }}>
                Delete
              </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
          );
        },
      },
    ],
    []
  );

  const fetchMilestones = async () => {
    try {
      const data = await api.milestones.list(id, 0, -1); // No pagination limit
      setReloadMilestones(false);
      return data;
    } catch (err) {
      console.error(err);
      setError('Error fetching milestones');
      setSuccess(null);
    }
  };

  const sowChunkColumns = React.useMemo(
    () => [
      {
        Header: 'Page',
        accessor: 'page_number',
         Cell: ({ row }) => {
          return (
            <p className='text-center'>
              {row.original.page_number}
            </p>
          );
        }
      },
      {
        Header: 'Result',
        accessor: 'content',
        Cell: ({ row }) => {
          return (
            <p className='p-3'>
              <strong>{row.original.heading}</strong>
              <p style={{ maxHeight: '8em', overflowY: 'scroll', padding: '0.3em 1em', borderRadius: '0.3em' }} dangerouslySetInnerHTML={{ __html: (row.original.content || '').replace(/\n/g, '<br/>') }}></p>
            </p>
          );
        }
      }
    ],
    []
  );

  const fetchSowChunks = async () => {
    try {
      const data = await api.sows.getChunks(id);
      return data;
    } catch (err) {
      console.error(err);
      setError('Error fetching SOW chunks');
      setSuccess(null);
    }
  };

  const runManualValidation = async () => {
      try {
        setValidating(true);
        await api.sows.validate(id);
        window.location.href = `/sows/${id}?showValidation=true`;
      }
      catch (err) {
        setValidating(false);
        console.error(err);
        setError('Manual validation failed!');
      }
    };

  const onAddAnotherSOW = () => {
    setShowCreateSOWModal(true);
    setShowValidation(false);
    setSuccess(null);
    setError(null);
  };

  return (
    <div className='px-5 py-3' style={{ backgroundColor: "rgb(249, 251, 255)", position: "relative" }}>
      <div className='position-absolute top-0' style={{left:"38%"}}>

     {error && (
          <Alert variant="danger"  dismissible onClose={() => setError(null)}>
           <i className="fa-solid fa-circle-exclamation" variant="danger"></i> {error}
          </Alert>
        )}
         {success && (
          <Alert variant="success"  dismissible onClose={() => setSuccess(null)}>
           <i className="fa-solid fa-circle-check" variant="success"></i> {success}
          </Alert>
        )}
      </div>
       <Breadcrumb className="mb-3">
              <Breadcrumb.Item href="/sows">SOWs</Breadcrumb.Item>
              <Breadcrumb.Item active>View SOW</Breadcrumb.Item>
            </Breadcrumb>
            <div className='d-flex align-items-center justify-content-between mb-4'>
            <h3>{sowNumber}</h3>
            <div className='d-flex align-items-center gap-3'>
        <Button type="button" variant="outline-primary" className="ms-2" onClick={() => window.location.href = '/sows' }>
           Cancel
        </Button>
             <Button type="button" variant="primary" onClick={handleSubmit} disabled={isSaving}>
           {isSaving ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>

            </div>

            </div>
            <div class="p-4 background-styled">
      <h3>SOW Details</h3>
      <hr/>
     

      {!validating && (
        <>
      <Form onSubmit={handleSubmit}>
        <Row className='gap-3'>
          <Col>
            <Form.Group>
              <Form.Label>Vendor</Form.Label>
              <Form.Control
                as="select"
                value={sowVendorId}
                onChange={(e) => setSowVendorId(e.target.value)}
                required
              >
                <option value="">Select Vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
          </Col>
          <Col>
            <Form.Group className="mb-3">
              <Form.Label>SOW</Form.Label>
              <Form.Control
                type="text"
                value={sowNumber}
                onChange={(e) => setSowNumber(e.target.value)}
                required
              />
            </Form.Group>
          </Col>  
          <Col>
            <Form.Group className="mb-3">
              <Form.Label>Budget</Form.Label>
              <NumericFormat
                className="form-control"
                value={budget}
                thousandSeparator={true}
                prefix={'$'}
                onValueChange={(values) => {
                  const { value } = values;
                  setBudget(value);
                }}
                required
              />
            </Form.Group>
          </Col>
        </Row>
        <Row className='gap-3'>
          <Col>
            <Form.Group className="mb-3">
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </Form.Group>
          </Col>
          <Col>
            <Form.Group className="mb-3">
              <Form.Label>End Date</Form.Label>
              <Form.Control
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </Form.Group>
          </Col>
        </Row>
           <Form.Group className="mb-3">
          <Form.Label>Summary</Form.Label>
          <Form.Control
            as="textarea"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            style={{ height: '8em' }}
            required
            disabled
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Document</Form.Label>
          <div className="d-flex align-items-center gap-3">         
            <ActivityTile
                            icon={<i className="fa-solid fa-file-invoice"></i>}
                            title={sowDocument}
                            showMenu={false}
                          />
                             <a href={api.documents.getUrl(sowDocument)} target="_blank" rel="noreferrer">
              <i className="fas fa-download ms-3"></i>
            </a>
          </div>
        </Form.Group>
     
        {/* <Form.Group className="mb-3">
          <Form.Label>Metadata</Form.Label>
          <Form.Control
            as="textarea"
            value={metadata}
            onChange={(e) => setMetadata(e.target.value)}
            style={{ height: '8em' }}
            readOnly
          />
        </Form.Group> */}
       
      </Form>
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h3>Milestones</h3>
      <hr />
        <Button variant="outline-primary" onClick={() => window.location.href = `/milestones/create/${id}`}>
           <i className="fas fa-plus" />Add New Milestone
        </Button>
      </div>
      <PagedTable columns={milestoneColumns}
        fetchData={fetchMilestones}
        reload={reloadMilestones}
        showPagination={false}
        noDataMesssage={'No milestones have been added yet.'}
        noDataDescription={'Click on "Add New Milestone" to begin adding milestones.'}
        />
      <ConfirmModal
        show={showDeleteMilestoneModal}
        handleClose={() => setShowDeleteMilestoneModal(false)}
        handleConfirm={handleDeleteMilestone}
        title="Delete Milestone"
        message="Are you sure you want to delete this milestone?"
        isLoading={isDeletingMilestone}
      />
    <hr />
    <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
      <h3 >Validations</h3>
      <Button variant="outline-primary" onClick={() => runManualValidation()}>
       <i class="fa-solid fa-caret-right"></i>  Run Manual Validation
      </Button>
    </div>
    <table className="table">
      <thead>
        <tr role="row">
          <th colspan="1" role="columnheader">Status</th>
          <th colspan="1" role="columnheader">Timestamp</th>
          <th colspan="1" role="columnheader">Description</th>
        </tr>
      </thead>
      <tbody>
        {validations.length === 0 && (
          <tr>
            <td colspan="3" className='text-center'>No validations found</td>
            </tr>
              )}
        {validations.map((validation) => (
          <tr key={validation.id}>
            <td>{validation.validation_passed ? <span className='status-chip-success'> Passed</span> : <span className='status-chip-error'> Failed</span>}</td>
            <td>{validation.datestamp}</td>
            <td>
              <div style={{ height: '12em', overflowY: 'scroll', padding:'12px' }}>
                <ReactMarkdown>{validation.result}</ReactMarkdown>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
        </>
      )}
            </div>


      {showValidation && validations && validations.length > 0 && (
        <Modal
  show={true}
  onHide={() => setShowValidation(false)}
  centered
  size='lg'
>
  <Modal.Header closeButton>
    <Modal.Title className="flex-wrap">
      Validation Results
      {validations[0].validation_passed ? (
        <span className="status-chip-success">Passed</span>
      ) : (
        <span className="status-chip-error">Failed</span>
      )}
    </Modal.Title>
  </Modal.Header>

  <Modal.Body>
    <div style={{ height: '30em', overflowY: 'scroll', border: '0.1em #ccc solid', padding:'20px', borderRadius: '8px' }}>
      <ReactMarkdown>{validations[0].result}</ReactMarkdown>
    </div>
  </Modal.Body>

  <Modal.Footer>
     <Button variant="outline-primary" onClick={() => onAddAnotherSOW()}>
     Add Another SOW
    </Button>
    <Button variant="primary" onClick={() => setShowValidation(false)}>
      View SOW
    </Button>
  </Modal.Footer>
</Modal>
      )}

      {validating && (
        <Alert variant="info" className="mt-3 p-5 text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Validating document with AI...</span>
          </Spinner>
          <div>Validating document with AI...</div>
        </Alert>
        )}

      <hr />

      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h3 >SOW Chunks</h3>
      </div>

      <PagedTable columns={sowChunkColumns}
        fetchData={fetchSowChunks}
        showPagination={false}
        />

        <SOWCreateModal 
        show={showCreateSOWModal} 
        onHide={() => setShowCreateSOWModal(false)} 
        
      />
    </div>
  );
};

export default SOWEdit;