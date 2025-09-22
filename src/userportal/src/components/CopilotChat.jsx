import ReactMarkdown from "react-markdown";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Row, Col, Button, Breadcrumb } from "react-bootstrap";

import { useChatSession } from "../hooks/useChatSession";
import ChatSessions from "./chat-sessions/chat-sessions";
import "./CopilotChat.css";

const CopilotChat = () => {
  const location = useLocation();

  const {
    sessionId,
    setSessionId,
    messages,
    setMessages,
    input,
    setInput,
    messagesEndRef,
    error,
    setError,
    isThinking,
    copiedMessageIndex,
    handleCopy,
    handleSendMessage,
    createNewSession,
  } = useChatSession();

  const [sessionToDelete, setSessionToDelete] = useState(null);
  // Local gate to prevent sudden UI render; show loader for first 500ms
  const [isUiReady, setIsUiReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsUiReady(true), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  //  // Handle initial message from navigation state
  // Ensure automatic first message waits until UI is ready & hook initialized
  const hasAutoSentRef = useRef(false);
  useEffect(() => {
    if (hasAutoSentRef.current) return; // already sent
    const initialMessage = location.state?.initialMessage;
    if (!initialMessage || !initialMessage.trim()) return;
    if (!isUiReady) return; // wait until loader done

    // slight delay to allow session hook state stabilization (e.g., any async side-effects)
    const t = setTimeout(() => {
      if (hasAutoSentRef.current) return;
      hasAutoSentRef.current = true;
      const fakeEvent = { preventDefault: () => {} };
      setInput(initialMessage.trim());
      handleSendMessage(fakeEvent, initialMessage.trim());
    }, 1000);

    return () => clearTimeout(t);
  }, [location.state, isUiReady]);

  if (!isUiReady) {
    return (
      <div
        className="ai-chat d-flex align-items-center justify-content-center p-5 pt-0 m-4 mb-0"
        style={{ minHeight: "70vh" }}
        aria-busy={!isUiReady}
        aria-live="polite"
      >
        <div
          className="text-center"
          role="status"
          aria-label="Loading chat interface"
        >
          <div className="spinner-border text-info mb-3" />
          <div
            className="fw-semibold text-secondary"
            style={{ letterSpacing: ".5px" }}
          >
            Initializing Chat...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-chat p-5 pt-0 m-4 mb-0" aria-busy={isThinking}>
      <Row style={{ gap: "5rem" }}>
        <Col
          lg={2}
          className="px-1"
          style={{
            boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.15)",
            borderRadius: "8px",
            height: "82vh",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          <ChatSessions
            sessionId={sessionId}
            setSessionId={setSessionId}
            setSessionToDelete={setSessionToDelete}
            messages={messages}
            setMessages={setMessages}
            sessionToDelete={sessionToDelete}
            setError={setError}
          />
        </Col>
        <Col lg={9}>
          <div className="d-flex justify-content-between mb-2">
            <div>
              <Breadcrumb className="mb-0">
                <Breadcrumb.Item href="/">Dashboard</Breadcrumb.Item>
                <Breadcrumb.Item active>Chats</Breadcrumb.Item>
              </Breadcrumb>
              <Button
                area-label="Back to Dashboard"
                alt="Back to Dashboard"
                href="/"
                variant="link"
                className="styled-button text-decoration-none"
              >
                <i className="fa-solid fa-arrow-left"></i> Back to Dashboard
              </Button>
            </div>
            <Button
              area-label="New Session"
              alt="New Session"
              onClick={createNewSession}
              className="align-self-center"
            >
              <i className="fas fa-plus"></i> New Chat
            </Button>
          </div>
          <div
            className="messages mb-3 p-3"
            style={{
              height: "65vh",
              overflowY: "scroll",
              boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.15)",
              borderRadius: "8px",
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message position-relative ${msg.role} mb-2 d-flex ${msg.role === "user" ? "justify-content-end" : "justify-content-start"}`}
              >
                {/* Only show copy button for assistant messages */}
                {msg.role === "assistant" && (
                  <Button
                    variant="text-primary"
                    size="sm"
                    onClick={() => handleCopy(msg.content, index)}
                    className="position-absolute top-0 end-0 m-2"
                    style={{ color: "#2979FF" }}
                  >
                    {copiedMessageIndex === index ? (
                      "Copied!"
                    ) : (
                      <i className="fa-regular fa-clone"></i>
                    )}
                  </Button>
                )}
                {!error && index === messages.length - 1 && (
                  <div ref={messagesEndRef} />
                )}
                <div
                  className={`alert ${msg.role === "user" ? "user-message" : "chat-response"}`}
                  style={{ maxWidth: "90%" }}
                  role="alert"
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
                <div ref={messagesEndRef} />
              </div>
            )}
            {isThinking && (
              <div className="d-flex justify-content-center">
                <div className="spinner-border text-info" role="status">
                  <span className="visually-hidden">Thinking...</span>
                </div>
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          <div className="input-container d-flex">
            <textarea
              className="form-control me-2"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage(e);
                  e.preventDefault();
                  return false;
                }
              }}
              placeholder="Type a message..."
              aria-label="Chat input"
            ></textarea>
            <Button onClick={handleSendMessage} aria-label="Send message">
              {" "}
              <i className="fa-solid fa-paper-plane"></i>
            </Button>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default CopilotChat;
