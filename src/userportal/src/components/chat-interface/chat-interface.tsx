import type React from "react";
import { useState } from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import "./chat-interface.css";
import { useNavigate } from "react-router-dom";

export default function ChatInterface() {
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleChatHistoryClick = () => {
    navigate("/chats");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      navigate("/chats", { state: { initialMessage: message.trim() } });
      setMessage("");
    } else {
      handleChatHistoryClick();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
  };

  const suggestions = [
    "Top vendors in 2025",
    "List of unpaid invoices",
    "List of pending invoices",
  ];

  return (
    <Container fluid className=" py-3 pb-5">
      <Container>
        <Row className="mb-3">
          <Col>
            <h1 className="display-5 fw-bold text-dark text-shadow">
              Search using AI
            </h1>
            <p className="text-secondary fs-6 mb-1">
              Get instant insights and answers from your contract management
              data using AI
            </p>
          </Col>
        </Row>

        {/* Input Field */}
        <div className="bg-white container py-3 px-4 rounded shadow-sm row justify-content-center">
          <Row className="mb-3">
            <Col>
              <Form.Control
                type="text"
                placeholder="What do you have in your mind?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && message.trim()) {
                    handleSubmit(e);
                  }
                }}
                className="chat-input py-3 px-4 fs-6"
              />
            </Col>
          </Row>

          <Row className="align-items-center">
            <Col>
              <Button
                variant="link"
                className="chat-history-btn p-0 text-decoration-none"
                onClick={handleChatHistoryClick}
              >
                <div className="d-flex gap-2 align-items-center">
                  <i className="fa-brands fa-rocketchat"></i>
                  <span className="fs-6 fw-bold">Chat History</span>
                </div>
              </Button>
            </Col>
            <Col xs="auto">
              <Button
                variant="primary"
                className="send-button"
                onClick={handleSubmit}
                disabled={!message.trim()}
              >
                <i className="fa-solid fa-paper-plane"></i>
              </Button>
            </Col>
          </Row>
        </div>

        {/* Suggestion Pills */}
        <Row className="mt-3">
          <Col>
            <div className="d-flex gap-3">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline-primary"
                  className="suggestion-pill"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </Col>
        </Row>
      </Container>
    </Container>
  );
}
