import { useEffect, useState } from 'react';
import { Row, Button, OverlayTrigger, Tooltip, Spinner } from 'react-bootstrap';
import ConfirmModal from '../ConfirmModal'; 
import api from '../../api/Api';

const ChatSessions = ({  sessionId, setSessionId, setSessionToDelete, setMessages, sessionToDelete, setError, isDrawerView = false}) => {
  const [sessions, setSessions] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionHistoryLoading, setSessionHistoryLoading] = useState(false);


    const refreshSessionList = async () => {
        setSessionHistoryLoading(true);
        try {
          const data = await api.completions.getSessions();
          setSessions(data);
          setSessionHistoryLoading(false);
        } catch (error) {
          console.error('Error loading session history:', error);
          setError('Error loading session history. Please try again.');
        }
      }
    
      const loadSessionHistory = async () => {
        setSessionHistoryLoading(true);
        if (!sessionId || sessionId <= 0) {
          setMessages([]);
          return;
        }
        try {
          const data = await api.completions.getHistory(sessionId);
          setMessages(data);
          setSessionHistoryLoading(false);
        } catch (error) {
          console.error('Error loading session history:', error);
          setError('Error loading session history. Please try again.');
        }
      }
    
      const handleDelete = async () => {
        if (!sessionToDelete) return;
    
        setError(null);
        try {
          await api.completions.deleteSession(sessionToDelete);
    
          console.log('Session deleted:', sessionToDelete);
          console.log('Current session:', sessionId);
          if (sessionId === sessionToDelete) {
            setSessionId(-1);
          }
        } catch (err) {
          console.error('Error deleting session:', err);
          setError('Error deleting session. Please try again.');
        }
        setShowDeleteModal(false);
        refreshSessionList();
      };

      useEffect(() => {
        refreshSessionList();
        loadSessionHistory();
      }, [sessionId]);
    

    
      useEffect(() => {
        refreshSessionList();
      }, []);

    return (
        <>
        <Row className='px-4 py-2' >
        <strong style={{color: "#1B4EA3"}}>Chat History</strong>
        {sessionHistoryLoading  &&
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" role="status" variant="primary">
        </Spinner>
      </div>
        }
        {!sessionHistoryLoading && (!sessions || sessions.length === 0) && <p>No sessions</p>}
        {sessions && sessions.length > 0 && <ul className="session-list">
          {sessions.map((session, index) => (
              <li key={index}
                className={`session ${sessionId === session.id ? 'selected' : ''}`}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px 8px 10px', borderBottom: '1px solid #ccc', cursor: 'pointer' }}
                onClick={() => setSessionId(session.id)}
              >
                <OverlayTrigger
                  placement="top"
                  delay={{ show: 250, hide: 400 }}
                  overlay={<Tooltip id={`tooltip-${index}`}>{session.name.substring(0, 300)}</Tooltip>}
                >
                  <a alt={session.name}>{session.name}</a>
                </OverlayTrigger>
                <div>
                  <OverlayTrigger
                    placement="top"
                    delay={{ show: 250, hide: 400 }}
                    overlay={<Tooltip id={`delete-tooltip-${index}`}>Delete Session</Tooltip>}
                  >
                    <Button className="btn-danger" style={{ marginRight: '10px', border:'none' }}
                      title="Delete Session"
                      onClick={(e) => { setSessionToDelete(session.id); setShowDeleteModal(true); e.stopPropagation(); }}>
                      <i className="fas fa-trash" style={{color:'red'}}></i>
                    </Button>
                  </OverlayTrigger>
                </div>
              </li>
            ))}
          </ul>}
      </Row>
      <ConfirmModal
        show={showDeleteModal}
        handleClose={() => setShowDeleteModal(false)}
        handleConfirm={handleDelete}
        message="This action cannot be reverted. Are you sure you want to delete this chat?"
        title={'Delete Chat?'}
      />  
        </>
    );
};

export default ChatSessions;