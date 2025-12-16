
import { useState, useEffect, useRef } from "react";
import { sendChatMessage, getChatHistory, getChatSessions, deleteChatSession } from "../services/completions.service";

export const useChatSession = () => {
  const [sessionId, setSessionId] = useState(-1); // -1 indicates not yet established with backend
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null)
  const [error, setError] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [copiedMessageIndex, setCopiedMessageIndex] = useState(null)

  const handleCopy = async (text, messageIndex) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageIndex(messageIndex)
      setTimeout(() => setCopiedMessageIndex(null), 1500)
    } catch (err) {
      console.error("Copy failed:", err)
    }
  }

  const inflightRef = useRef(false);
  const suppressNextHistoryLoadRef = useRef(false); // avoids overwriting optimistic first exchange

  const handleSendMessage = async (e, explicitMessage) => {
    if (e) e.preventDefault();
    const prompt = (explicitMessage ?? input).trim();
    if (!prompt) return;
    if (inflightRef.current) {
      // Optionally queue or ignore; for now ignore to prevent overlap
      return;
    }
    inflightRef.current = true;
    setInput("");
    setIsThinking(true);
    setError("");

    const userMessage = { role: "user", content: prompt };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Mark to skip immediate history load if we don't yet have a server session
      if (sessionId === -1) {
        suppressNextHistoryLoadRef.current = true;
      }
      const output = await sendChatMessage({ sessionId, message: prompt });
      const assistantMessage = { role: "assistant", content: output.content };

      // Ensure session id is updated first so future sends use correct id
      if (sessionId === -1 || sessionId !== output.session_id) {
        setSessionId(output.session_id);
      }

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Error sending message. Please try again.");
    } finally {
      inflightRef.current = false;
      setIsThinking(false);
    }
  };

  const createNewSession = async () => {
    setSessionId(-1)
    setMessages([])
    setIsThinking(false)
    setError("")
    setCopiedMessageIndex(null)
  }

  const loadSessionHistory = async () => {
    if (!sessionId || sessionId <= 0) {
      setMessages([]);
      return;
    }

    if (suppressNextHistoryLoadRef.current) {
      // Skip the first automatic history load; let optimistic messages stand
      suppressNextHistoryLoadRef.current = false;
      return;
    }

    try {
      const data = await getChatHistory(sessionId);
      setMessages(prev => {
        // If backend has fewer messages (race), keep optimistic ones
        if (data.length < prev.length) return prev;
        return data;
      });
    } catch (error) {
      console.error("Error loading session history:", error);
      setError("Error loading session history. Please try again.");
    }
  };

  useEffect(() => {
    loadSessionHistory()
  }, [sessionId])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  return {
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
    loadSessionHistory,
  }
}
