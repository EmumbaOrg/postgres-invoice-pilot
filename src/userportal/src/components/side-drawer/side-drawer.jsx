import { useState } from "react";
import {  Offcanvas, Form, Button, InputGroup, Spinner } from "react-bootstrap";
import ReactMarkdown from "react-markdown";

import ChatSessions from "../../components/chat-sessions/chat-sessions";
import { useChatSession } from "../../hooks/useChatSession";
import "./side-drawer.css";


export default function SideDrawer({handleCloseAIdrawer, showDrawer}) {
  const { messages, input, setInput, messagesEndRef, error, isThinking, copiedMessageIndex, handleCopy, handleSendMessage , sessionId, setSessionId, setMessages, setError} =
  useChatSession();

  const[showChatHistory, setShowChatHistory] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  const onSubmit = (e) => {
    e.preventDefault()
    handleSendMessage(e)
  }

  const handleOpenChatHistory = () =>{
    setShowChatHistory(true);
  }

  const handleNewChat = ()=>{
    setShowChatHistory(false);
    setInput("");
    setMessages([]);
    setSessionId(-1);
    setError("");
  }

const handleSessionSelect = (selectedSessionId) => {
  setSessionId(selectedSessionId);
  setShowChatHistory(false);
}

  return (
    <>
      <Offcanvas show={showDrawer} onHide={handleCloseAIdrawer} placement="end" className="w-100" style={{ maxWidth: "400px" }}>
        <Offcanvas.Header className="border-bottom px-3 py-3">
          <div className="d-flex align-items-center w-100">
            {!showChatHistory ? (
            <>
            <Button variant="link" className="p-0 me-3 text-dark" onClick={handleOpenChatHistory}>
            <i className="fa-solid fa-arrow-left"></i>
            </Button>
            <Offcanvas.Title className="flex-grow-1 mb-0 fw-bold">New Chat</Offcanvas.Title>
            <Button variant="link" className="p-0 text-muted" onClick={handleCloseAIdrawer}>
            <i className="fa-solid fa-xmark"></i>
            </Button>
            </>
            ) : 
            <>
             <i className="fa-solid fa-wand-sparkles text-primary me-2"></i>
            <Offcanvas.Title className="flex-grow-1 mb-0 fw-bold">Ask AI</Offcanvas.Title>
            <Button variant="link" className="text-primary me-4 fw-bold bordered-button text-decoration-none"  onClick={handleNewChat}>
            New Chat
            </Button>
            <Button variant="link" className="p-0 text-muted" onClick={handleCloseAIdrawer}>
            <i className="fa-solid fa-xmark"></i>
            </Button>
          </>
            }
          </div>
        </Offcanvas.Header>

        <Offcanvas.Body className="d-flex flex-column">
          {/* Main Content Area */}
          {showChatHistory &&  <ChatSessions isDrawerView={true} sessionId={sessionId} setSessionId={handleSessionSelect} setSessionToDelete={setSessionToDelete} messages={messages} setMessages={setMessages} sessionToDelete={sessionToDelete} setError={setError} />}
            {!showChatHistory &&  
          <>
            {messages.length === 0 && !isThinking && !showChatHistory && (
          <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center text-center px-3">
            <div className="mb-4">
            <i className="fa-solid fa-wand-sparkles"></i>
            </div>

            {/* Help Text */}
            <h4 className="mb-3 fw-bold text-dark">How can I help you with?</h4>
            <p className="text-muted mb-0">Write "What's on your mind?" so I can help.</p>
          </div>
          )}
            {messages.map((msg, index) => (
                       <div key={index} className={`message position-relative ${msg.role} mb-2 d-flex ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                {msg.role === "assistant" && (
                  <Button
                    variant="outlined-primary"
                    size="sm"
                    onClick={() => handleCopy(msg.content, index)}
                    className="position-absolute  m-2"
                    style={{
                      color: "#2979FF",
                      top: '-16px',
                      right: '0',
                    }}
                  >
                    {copiedMessageIndex === index ? "Copied!" : <i className="fa-regular fa-clone"></i>}
                  </Button>
                )}
                         {!error && index === messages.length - 1 && <div ref={messagesEndRef} />}
                         <div className={`alert ${msg.role === 'user' ? 'user-message' : 'chat-response'}`} style={{ maxWidth: '90%', wordBreak:'break-word' }} role="alert">
                           <ReactMarkdown>{msg.content}</ReactMarkdown>
                         </div>
                       </div>
                     ))}
                     {error && <div className="alert alert-danger" role="alert">{error}<div ref={messagesEndRef} /></div>}
                     {isThinking && <div className="d-flex justify-content-center">
                      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" role="status" variant="primary">
        </Spinner>
      </div>
                         <div ref={messagesEndRef} />
                       </div>}
          {/* Input Area */}
          {  !showChatHistory && 
          <div className="mt-auto">
            <Form onSubmit={onSubmit} >
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="What do you have in mind?"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { handleSendMessage(e); e.preventDefault(); return false; } }}
                  className="border-end-0"
                  style={{
                    borderRadius: "8px 0 0 8px",
                    fontSize: "14px",
                  }}
                  disabled={isThinking}
                />
                <Button
                onClick={handleSendMessage}
                  type="submit"
                  variant="primary"
                  className="px-3"
                  style={{
                    borderRadius: "0 8px 8px 0",
                    backgroundColor: "#2979ff",
                    borderColor: "#2979ff",
                  }}
                >
                 <i className="fa-solid fa-paper-plane"></i>
                </Button>
              </InputGroup>
            </Form>
          </div>
}
          </>
}    
        </Offcanvas.Body>
      </Offcanvas>
    </>

  )
}
