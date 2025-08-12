
import { useState, useEffect, useRef } from "react";
import api from "../api/Api" 

export const useChatSession = () => {
  const [sessionId, setSessionId] = useState(-1);
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

  const handleSendMessage = async (e) => {
      // Prevent form submission if called from form
      if (e) {
        e.preventDefault()
      }

    if (input.trim() === "") return

    const prompt = input
    setInput("")
    setIsThinking(true)

    // Add the user's message to the local message history
    const userMessage = { role: "user", content: prompt }
    setMessages([...messages, userMessage])
    setError("")
    try {
      // Get the completion from the API
      const output = await api.completions.chat(sessionId, prompt)
      // make sure request for a different session doesn't update the messages
      if (sessionId === output.session_id) {
        // Add the assistant's response to the messages
        const assistantMessage = { role: "assistant", content: output.content }
        setMessages([...messages, userMessage, assistantMessage])
      }

      // only update the messages if the session ID is the same
      // This keeps a processing completion from updating messages after a new session is created
      if (sessionId === -1 || sessionId !== output.session_id) {
        // Update the session ID
        setSessionId(output.session_id)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      setError("Error sending message. Please try again.")
    } finally {
      setIsThinking(false)
    }
  }

  const createNewSession = async () => {
    setSessionId(-1)
    setMessages([])
    setIsThinking(false)
    setError("")
    setCopiedMessageIndex(null)
  }

  const loadSessionHistory = async () => {
    if (!sessionId || sessionId <= 0) {
      setMessages([])
      return
    }

    try {
      const data = await api.completions.getHistory(sessionId)
      setMessages(data)
    } catch (error) {
      console.error("Error loading session history:", error)
      setError("Error loading session history. Please try again.")
    }
  }

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
