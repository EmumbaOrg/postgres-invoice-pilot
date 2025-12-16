import { useEffect, useState } from 'react';
import { Row, Button, OverlayTrigger, Tooltip, Spinner } from 'react-bootstrap';
import ConfirmModal from '../ConfirmModal'; 
import { deleteChatSession, getChatSessions, getChatHistory } from '../../services/completions.service';
import "./chat-session.css";
import { DeleteChatHistoryIcon } from '../../icon-svgs/icon-svgs';

const ChatSessions = ({  sessionId, setSessionId, setSessionToDelete, setMessages, sessionToDelete, setError, isDrawerView = false}) => {
  const [sessions, setSessions] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionHistoryLoading, setSessionHistoryLoading] = useState(false);
  const [isDeletingSession, setIsDeletingSession] = useState(false);


    const refreshSessionList = async () => {
        setSessionHistoryLoading(true);
        try {
          const data = await getChatSessions();
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
          const data = await getChatHistory(sessionId);
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
        setIsDeletingSession(true);
        try {
          await deleteChatSession(sessionToDelete);
    
          if (sessionId === sessionToDelete) {
            setSessionId(-1);
          }
        } catch (err) {
          console.error('Error deleting session:', err);
          setError('Error deleting session. Please try again.');
        } finally {
          setIsDeletingSession(false);
          setShowDeleteModal(false);
          refreshSessionList();
        }
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
        <Row className="chat-sessions-container">
        <h3 className='chat-history-title'>Chat History</h3>
        {sessionHistoryLoading  &&
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" role="status" variant="primary">
        </Spinner>
      </div>
        }
        {!sessionHistoryLoading && (!sessions || sessions.length === 0) && <p>No sessions</p>}
        {!sessionHistoryLoading && sessions && sessions.length > 0 && <ul className="session-list">
          {sessions.map((session, index) => (
              <li key={index}
                className={`session ${sessionId === session.id ? 'selected' : ''}`}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', border: '1px solid #C4DAFF', cursor: 'pointer', borderRadius: '4px' }}
                onClick={() => setSessionId(session.id)}
              >
                <OverlayTrigger
                  placement="top"
                  delay={{ show: 250, hide: 400 }}
                  overlay={<Tooltip id={`tooltip-${index}`}>{session.name.substring(0, 300)}</Tooltip>}
                >
                  <a style={{fontSize: '14px', color: '#292A31', fontWeight:400}} alt={session.name}>{session.name}</a>
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
                      <DeleteChatHistoryIcon/>
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
        isLoading={isDeletingSession}
      />  
        </>
    );
};

export default ChatSessions;