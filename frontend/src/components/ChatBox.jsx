import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import API from "../services/api";
import { FaPaperPlane, FaRobot, FaTimes, FaUndo } from "react-icons/fa";

function ChatBox({ resetTrigger }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Format matching backend expectations: 'user' or 'model'
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);

  const suggestions = [
    "How can I tailor my resume for senior roles?",
    "Generate 3 custom interview questions for me",
    "What are some key technical skills missing in my profile?",
    "Give me resume advice to improve my project impact details",
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    setMessages([]);
    setQuestion("");
  }, [resetTrigger]);

  const askAI = async (customQuestion = null) => {
    const queryStr = customQuestion || question;
    if (!queryStr.trim()) return;

    // Append user message
    const userMessage = { role: "user", content: queryStr };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    if (!customQuestion) setQuestion("");

    try {
      setLoading(true);

      const res = await API.post("/chat", {
        messages: nextMessages,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: res.data.answer,
        },
      ]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to get AI response");
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: "Failed to connect to the Career Copilot service. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
    toast.info("Conversation history cleared.");
  };

  const formatInline = (text) => {
    if (!text) return "";
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    const parts = text.split(regex);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-extrabold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 px-1.5 py-0.5 rounded font-mono text-xs text-pink-650 dark:text-pink-400"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const renderMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="text-base font-bold mt-3 mb-1.5 text-indigo-650 dark:text-indigo-400">
            {line.slice(4)}
          </h4>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={idx} className="text-lg font-bold mt-4 mb-2 text-indigo-650 dark:text-indigo-400">
            {line.slice(3)}
          </h3>
        );
      }
      if (line.startsWith("# ")) {
        return (
          <h2 key={idx} className="text-xl font-black mt-5 mb-2.5 text-indigo-650 dark:text-indigo-400">
            {line.slice(2)}
          </h2>
        );
      }
      if (line === "---" || line === "***") {
        return <hr key={idx} className="my-3 border-slate-200 dark:border-slate-800" />;
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-sm text-slate-600 dark:text-slate-300 leading-relaxed my-1">
            {formatInline(line.slice(2))}
          </li>
        );
      }
      const numMatch = line.match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        return (
          <li key={idx} className="ml-4 list-decimal text-sm text-slate-600 dark:text-slate-300 leading-relaxed my-1">
            {formatInline(numMatch[2])}
          </li>
        );
      }
      return (
        <p key={idx} className="text-sm text-slate-650 dark:text-slate-300 leading-relaxed my-1.5 min-h-[1rem]">
          {formatInline(line)}
        </p>
      );
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl">
            <FaRobot className="text-2xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">AI Career Coach</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs">Continuous mentoring based on your resume context</p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 font-semibold border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 transition"
          >
            <FaUndo size={10} />
            Reset Chat
          </button>
        )}
      </div>

      {/* Suggestions */}
      {messages.length === 0 && (
        <div className="mb-6">
          <p className="text-xs text-slate-400 font-semibold mb-3">Suggested Topics:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((item) => (
              <button
                key={item}
                onClick={() => askAI(item)}
                className="bg-slate-50 hover:bg-purple-50 dark:bg-slate-800/50 dark:hover:bg-purple-950/20 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 hover:text-purple-650 dark:hover:text-purple-400 px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition duration-300"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 h-[450px] overflow-y-auto shadow-inner">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-sm">
              <FaRobot className="text-5xl mx-auto mb-4 text-purple-400 dark:text-purple-600 animate-bounce" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Coach is Ready</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Ask career advice, test interview question responses, seek job recommendations, or request skills paths.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-5 py-3.5 rounded-2xl shadow-md border ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 border-transparent text-white"
                      : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-850 text-slate-800 dark:text-slate-150"
                  }`}
                >
                  <p className="text-[10px] uppercase font-bold tracking-wider opacity-65 mb-1.5">
                    {msg.role === "user" ? "You" : "Career Copilot"}
                  </p>
                  <div className="prose dark:prose-invert max-w-none">
                    {msg.role === "user" ? <p className="text-sm whitespace-pre-wrap">{msg.content}</p> : renderMarkdown(msg.content)}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 px-5 py-4 rounded-2xl shadow-md">
                  <p className="text-[10px] uppercase font-bold tracking-wider opacity-65 mb-2">Career Copilot</p>
                  <div className="flex gap-1.5 text-purple-600 dark:text-purple-400">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-3 mt-5">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              askAI();
            }
          }}
          placeholder="Ask your coach anything about job searching, careers, skills..."
          className="flex-1 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-950 dark:text-white focus:border-purple-500 transition text-sm"
        />
        <button
          onClick={() => askAI()}
          disabled={loading}
          className="bg-gradient-to-r from-purple-650 to-indigo-650 hover:from-purple-600 hover:to-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-900/10 transition transform active:scale-95"
        >
          <FaPaperPlane size={13} />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
}

export default ChatBox;