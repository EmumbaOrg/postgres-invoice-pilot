import type React from "react";
import { useState } from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import "./chat-interface.css";
import { useNavigate } from "react-router-dom";
import { MessageIcon } from "../../icon-svgs/icon-svgs";

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
    navigate("/chats", { state: { initialMessage: suggestion } });
  };

  const suggestions = [
    "List all vendors",
    "List all the pending invoices",
    "Show SOWs pertaining to optimization",
  ];

  return (
    <section className="search-title-container">
      <article className="search-title-container-inner">
        <div>
          <h1 className="heading-primary">Search using AI</h1>
          <p className="text-secondary fs-6 mb-1">
            Get instant insights and answers from your contract management data
            using AI
          </p>
        </div>

        {/* Input Field */}
        <div className="input-wrapper">
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

          <div className="flex-container">
            <Button
              variant="link"
              className="chat-history-btn p-0 text-decoration-none"
              onClick={handleChatHistoryClick}
            >
              <div className="d-flex gap-2 align-items-center">
                <MessageIcon />
                <span className="fs-6 fw-bold">Chat History</span>
              </div>
            </Button>
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
          </div>
        </div>

        {/* Suggestion Pills */}
        <div className="pills-wrapper">
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
      </article>
    </section>
  );
}
