import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, AlertCircle, Zap } from "lucide-react";
import { API_BASE_URL } from "../config";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text: "🔐 Welcome! I'm your Network Security Assistant. Ask me about threats, recommendations, or how to use the dashboard. Try: 'What are the top threats?' or 'Give me security recommendations.'",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const apiBase = API_BASE_URL;

  const appendMessage = (message) => {
    setMessages((prev) => [...prev, { ...message, id: Date.now() }]);
  };

  const sendChatRequest = async (messageText) => {
    const response = await fetch(`${apiBase}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: messageText }),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API error ${response.status}: ${errorBody}`);
    }
    return response.json();
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      type: "user",
      text: input,
    };

    appendMessage(userMessage);
    const messageText = input;
    setInput("");
    setIsLoading(true);

    try {
      const data = await sendChatRequest(messageText);
      appendMessage({
        type: "bot",
        text:
          data.response || "I couldn't process that request. Please try again.",
      });
    } catch (error) {
      console.error("Chat request failed:", error);
      appendMessage({
        type: "bot",
        text: "❌ Error connecting to the assistant. Please ensure the backend is running.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "What are the top threats?",
    "Security recommendations",
    "Explain protocol analysis",
    "How to block an IP?",
  ];

  const handleSuggestedQuestion = (question) => {
    setInput(question);
    const tempInput = question;
    appendMessage({ type: "user", text: tempInput });
    setInput("");
    setIsLoading(true);

    sendChatRequest(tempInput)
      .then((data) => {
        appendMessage({
          type: "bot",
          text: data.response || "I couldn't process that request.",
        });
      })
      .catch((error) => {
        console.error("Suggested chat request failed:", error);
        appendMessage({
          type: "bot",
          text: "❌ Error processing your question.",
        });
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 ${
          isOpen
            ? "bg-red-600 hover:bg-red-500"
            : "bg-lime-600 hover:bg-lime-500 animate-pulse"
        }`}
        title={isOpen ? "Close Assistant" : "Open Assistant (AI Help)"}
      >
        {isOpen ? (
          <X className="text-white" size={24} />
        ) : (
          <MessageCircle className="text-white" size={24} />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-black border-2 border-green-500/40 rounded-2xl shadow-2xl z-40 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-lime-600/20 to-cyan-600/20 border-b border-green-500/40 p-4 flex items-center gap-3">
            <div className="p-2 bg-lime-600/20 rounded-lg">
              <Zap className="text-lime-400" size={20} />
            </div>
            <div>
              <h3 className="text-white font-black text-sm uppercase tracking-widest">
                Security Assistant
              </h3>
              <p className="text-[10px] text-green-400">
                AI-Powered Recommendations
              </p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-3 rounded-lg text-sm font-medium leading-relaxed ${
                    msg.type === "user"
                      ? "bg-lime-600/30 border border-lime-500/40 text-white rounded-br-none"
                      : "bg-cyan-600/20 border border-cyan-500/30 text-green-300 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-cyan-600/20 border border-cyan-500/30 px-4 py-3 rounded-lg text-green-300">
                  <span className="flex gap-2 items-center">
                    <span className="w-2 h-2 bg-lime-400 rounded-full animate-pulse"></span>
                    Assistant is thinking...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length <= 2 && (
            <div className="border-t border-green-500/20 p-3 bg-black/50">
              <p className="text-[10px] text-green-500 uppercase font-bold mb-2">
                Quick Questions:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestedQuestion(q)}
                    className="text-[10px] px-2 py-2 bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 rounded-lg hover:bg-cyan-600/40 transition-all font-bold"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-green-500/40 p-3 bg-black/80">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about threats, IPs, recommendations..."
                className="flex-1 bg-black border border-green-500/30 rounded-lg px-3 py-2 text-white text-sm placeholder-green-600 focus:border-lime-400 outline-none"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="p-2 bg-lime-600 hover:bg-lime-500 disabled:bg-slate-700 text-white rounded-lg transition-all"
                title="Send message"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-[9px] text-green-600 mt-2">
              💡 Type questions about network analysis, threats, or
              recommendations
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
