import React, { useState, useRef } from "react";
import {
  Send,
  Paperclip,
  FileText,
  X,
  Search,
  Brain,
  ShieldCheck,
  Sparkles,
  Copy,
  RotateCcw,
  ChevronDown,
  Activity,
  BookOpen,
  CheckCircle2,
  Loader2,
  Menu,
  Plus,
  BarChart3,
  LogOut,
} from "lucide-react";

import { clearSession } from "@/features/dashboard/session";
import { API_BASE_URL, MODEL_NAME } from "@/config";

import "./chat.css";

/* ============================================================
   COLORS
============================================================ */

const COLORS = {
  blue: "#046DD6",
  cyan: "#0493AE",
  navy: "#0D375D",
  red: "#5D0200",
  dark: "#131116",
};

/* ============================================================
   LOCAL STORAGE + INDEXEDDB
   Chats/evidence survive refresh; PDF files are stored locally.
============================================================ */

const CHAT_STORAGE_KEY = "neuromind_chats_v2";
const EVIDENCE_STORAGE_KEY = "neuromind_saved_evidence_v2";
const DOCUMENT_DB = "neuromind_documents_v2";
const DOCUMENT_STORE = "documents";

const loadJSON = (key, fallback = []) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const saveJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Storage error:", error);
  }
};

const openDocumentDB = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DOCUMENT_DB, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DOCUMENT_STORE)) {
        db.createObjectStore(DOCUMENT_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const saveDocument = async (file) => {
  const db = await openDocumentDB();
  const id = `${file.name}-${file.size}-${file.lastModified}`;

  await new Promise((resolve, reject) => {
    const tx = db.transaction(DOCUMENT_STORE, "readwrite");
    tx.objectStore(DOCUMENT_STORE).put({
      id,
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      file,
    });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });

  db.close();
  return id;
};

const getDocuments = async () => {
  const db = await openDocumentDB();

  const result = await new Promise((resolve, reject) => {
    const tx = db.transaction(DOCUMENT_STORE, "readonly");
    const request = tx.objectStore(DOCUMENT_STORE).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });

  db.close();
  return result;
};

const getDocument = async (id) => {
  const db = await openDocumentDB();

  const result = await new Promise((resolve, reject) => {
    const tx = db.transaction(DOCUMENT_STORE, "readonly");
    const request = tx.objectStore(DOCUMENT_STORE).get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });

  db.close();
  return result;
};

const removeDocument = async (id) => {
  const db = await openDocumentDB();

  await new Promise((resolve, reject) => {
    const tx = db.transaction(DOCUMENT_STORE, "readwrite");
    tx.objectStore(DOCUMENT_STORE).delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });

  db.close();
};

/* ============================================================
   FLOATING BRAIN
============================================================ */

function BrainAnimation() {
  return (
    <div className="brain-animation">
      <div className="brain-glow" />

      <div className="brain-orbit orbit-one" />
      <div className="brain-orbit orbit-two" />

      <div className="brain-core">
        <Brain size={70} strokeWidth={1.2} />
      </div>

      <span className="brain-node node-1" />
      <span className="brain-node node-2" />
      <span className="brain-node node-3" />
      <span className="brain-node node-4" />
    </div>
  );
}

/* ============================================================
   LOGO
============================================================ */

function Logo() {
  return (
    <div className="chat-logo">
      <div className="chat-logo-icon">
        <Activity size={20} />
      </div>

      <div>
        <div className="chat-logo-name">{MODEL_NAME}</div>
        <div className="chat-logo-sub">Medical Intelligence</div>
      </div>
    </div>
  );
}

/* ============================================================
   MESSAGE
============================================================ */

function Message({ message, onRegenerate, onSaveEvidence }) {
  const [copied, setCopied] = useState(false);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(message.text);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  /* USER MESSAGE */

  if (message.role === "user") {
    return (
      <div className="message-row user-row">
        <div className="user-message">
          {message.text}
        </div>
      </div>
    );
  }

  /* ASSISTANT MESSAGE */

  return (
    <div className="message-row assistant-row">
      <div className="assistant-avatar">
        <Brain size={18} />
      </div>

      <div className="assistant-content">

        <div className="assistant-name">
          {MODEL_NAME}

          <span className="verified-badge">
            <CheckCircle2 size={12} />
            Evidence grounded
          </span>
        </div>

        <div className="assistant-message">
          {message.text}
        </div>
{/* CLINICAL RAG STATUS */}
<div className="rag-status-row">
  <span className="rag-status-pill">
    Status: {message.error ? "Error" : "Answered"}
  </span>

  <span className="rag-quality-pill">
    Evidence quality: {message.sources && message.sources.length > 0 ? "High" : "General"}
  </span>
</div>

{/* EXPANDABLE EVIDENCE */}
<details className="rag-evidence-panel">
  <summary>
    <span>▾</span>
    EVIDENCE (expand)
  </summary>

  <div className="rag-evidence-table">
    <div className="rag-evidence-header">
      <span>Document</span>
      <span>Section</span>
      <span>Page</span>
      <span>Chunk ID</span>
      <span>Score</span>
    </div>

    {message.sources && message.sources.length > 0 ? (
      message.sources.map((source, index) => (
        <div className="rag-evidence-row" key={index}>
          <span>{source.title || "—"}</span>
          <span>{source.section || "—"}</span>
          <span>{source.page || "—"}</span>
          <span>{source.chunkId || "—"}</span>
          <span>
            {source.score !== undefined ? `${source.score}%` : "—"}
          </span>
        </div>
      ))
    ) : (
      <div className="rag-evidence-row">
        <span>—</span>
        <span>—</span>
        <span>—</span>
        <span>—</span>
        <span>—</span>
      </div>
    )}
  </div>
</details>

{/* NEXT ACTION + ERROR STATE */}
<div className="rag-bottom-states">
  <div className="rag-next-action">
    Suggested next action: consult a clinician
  </div>

  {message.error && (
    <div className="rag-error-state">
      Error state: retrieval unavailable — try again
    </div>
  )}
</div>
        {/* SOURCES */}

        {message.sources && message.sources.length > 0 && (
          <div className="sources-box">

            <div className="sources-title">
              <BookOpen size={15} />
              Evidence used
            </div>

            {message.sources.map((source, index) => (
              <div
                className="source-item"
                key={index}
              >
                <div className="source-number">
                  {index + 1}
                </div>

                <div className="source-info">
                  <div>{source.title}</div>

                  <span>
                    {source.detail}
                  </span>
                </div>

                <div className="similarity">
                  {source.score}%
                </div>

                <button
                  className="save-evidence-btn"
                  onClick={() => onSaveEvidence?.(source)}
                  title="Save evidence"
                >
                  <CheckCircle2 size={14} />
                  Save
                </button>
              </div>
            ))}

          </div>
        )}

        {/* ACTIONS */}

        <div className="message-actions">

          <button onClick={copyText}>
            {copied ? (
              <CheckCircle2 size={14} />
            ) : (
              <Copy size={14} />
            )}

            {copied ? "Copied" : "Copy"}
          </button>

          <button
            onClick={() => onRegenerate?.(message)}
          >
            <RotateCcw size={14} />
            Regenerate
          </button>

        </div>

      </div>
    </div>
  );
}

/* ============================================================
   UPLOADED FILE
============================================================ */

function UploadedFile({ file, onRemove }) {
  if (!file) return null;

  return (
    <div className="uploaded-file">

      <div className="uploaded-file-icon">
        <FileText size={20} />
      </div>

      <div className="uploaded-file-info">
        <strong>{file.name}</strong>

        <span>
          PDF document • Ready to search
        </span>
      </div>

      <CheckCircle2
        size={18}
        className="file-ready"
      />

      <button
        onClick={onRemove}
        aria-label="Remove file"
      >
        <X size={17} />
      </button>

    </div>
  );
}

/* ============================================================
   MAIN APP
============================================================ */

export default function App({ onNavigate }) {

  /* ----------------------------------------------------------
     STATE
  ---------------------------------------------------------- */

  const defaultMessages = [
    {
      role: "assistant",
      text:
        "Hi! I'm Depremune AI. I can help you explore the relationship between mental health, immunity, and the latest medical evidence. You can ask me a question or upload a research PDF and I'll search within it.",
      sources: [
  {
    title: "Neuroimmune interactions in depression",
    detail: "Published research • Medical literature",
    section: "Results",
    page: 12,
    chunkId: "CH-0042",
    score: 96,
  },
  {
    title: "Depression and immune system pathways",
    detail: "Evidence review • Immunology",
    section: "Discussion",
    page: 8,
    chunkId: "CH-0027",
    score: 91,
  },
],
    },
  ];

  const [chatHistory, setChatHistory] = useState(() => loadJSON(CHAT_STORAGE_KEY));
  const [currentChatId, setCurrentChatId] = useState(() => {
    const chats = loadJSON(CHAT_STORAGE_KEY);
    return chats[0]?.id || null;
  });

  const [messages, setMessages] = useState(() => {
    const chats = loadJSON(CHAT_STORAGE_KEY);
    return chats[0]?.messages?.length ? chats[0].messages : defaultMessages;
  });

  const [chatTitle, setChatTitle] = useState(() => {
    const chats = loadJSON(CHAT_STORAGE_KEY);
    return chats[0]?.title || "New conversation";
  });

  const [savedEvidence, setSavedEvidence] = useState(() =>
    loadJSON(EVIDENCE_STORAGE_KEY)
  );

  const [documents, setDocuments] = useState([]);
  const [activeView, setActiveView] = useState("chat");

  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState("Research");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    getDocuments()
      .then(setDocuments)
      .catch((error) => console.error("Could not load documents:", error));
  }, []);

  React.useEffect(() => {
    if (!messages.length) return;

    const title =
      chatTitle === "New conversation"
        ? messages.find((m) => m.role === "user")?.text?.slice(0, 45) ||
          "New conversation"
        : chatTitle;

    setChatTitle(title);

    const id = currentChatId || `chat-${Date.now()}`;
    if (!currentChatId) setCurrentChatId(id);

    const chat = {
      id,
      title,
      messages,
      updatedAt: Date.now(),
    };

    setChatHistory((prev) => {
      const withoutCurrent = prev.filter((item) => item.id !== id);
      const next = [chat, ...withoutCurrent].slice(0, 30);
      saveJSON(CHAT_STORAGE_KEY, next);
      return next;
    });
  }, [messages]);

  const saveEvidence = (source) => {
    const item = {
      ...source,
      id: `${source.title}-${source.score}-${source.detail}`,
      savedAt: Date.now(),
    };

    setSavedEvidence((prev) => {
      if (prev.some((saved) => saved.id === item.id)) return prev;
      const next = [item, ...prev];
      saveJSON(EVIDENCE_STORAGE_KEY, next);
      return next;
    });
  };

  const removeEvidence = (id) => {
    setSavedEvidence((prev) => {
      const next = prev.filter((item) => item.id !== id);
      saveJSON(EVIDENCE_STORAGE_KEY, next);
      return next;
    });
  };

  const openChat = (chat) => {
    setCurrentChatId(chat.id);
    setChatTitle(chat.title);
    setMessages(chat.messages || []);
    setFile(null);
    setActiveView("chat");
  };

  const newChat = () => {
    setCurrentChatId(`chat-${Date.now()}`);
    setChatTitle("New conversation");
    setMessages([]);
    setFile(null);
    setInput("");
    setActiveView("chat");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openDocument = async (doc) => {
    try {
      const stored = await getDocument(doc.id);
      if (!stored?.file) return;

      const url = URL.createObjectURL(stored.file);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error("Could not open document:", error);
    }
  };

  const deleteDocument = async (id) => {
    try {
      await removeDocument(id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      setFile((prev) => (prev?.id === id ? null : prev));
    } catch (error) {
      console.error("Could not delete document:", error);
    }
  };

  /* ==========================================================
     SEND MESSAGE (API HOOKED)
  ========================================================== */

  const sendMessage = async () => {
    const trimmed = input.trim();

    if (!trimmed || loading) {
      return;
    }

    const newMessages = [
      ...messages,
      {
        role: "user",
        text: trimmed,
      },
    ];

    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token") || "";
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          question: trimmed,
          fileName: file?.name || null,
          mode: searchMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error (${response.status})`);
      }

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          text: data.answer || "No response received.",
          sources: data.sources || [],
          error: false,
        },
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          text: `An error occurred while connecting to the intelligence server: ${err.message}`,
          sources: [],
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     ENTER KEY
  ========================================================== */

  const handleKeyDown = (e) => {

    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {

      e.preventDefault();

      sendMessage();
    }
  };

  /* ==========================================================
     UPLOAD PDF
  ========================================================== */

  const handleFile = (e) => {

    const selected =
      e.target.files?.[0];

    if (!selected) {
      return;
    }

    if (
      selected.type !==
      "application/pdf"
    ) {

      alert(
        "Please upload a PDF file."
      );

      e.target.value = "";

      return;
    }

    saveDocument(selected)
      .then(async (id) => {
        const stored = await getDocuments();
        setDocuments(stored);
        setFile({ ...selected, id });
      })
      .catch((error) => {
        console.error("Could not save document:", error);
        setFile(selected);
      });
  };

  /* ==========================================================
     REMOVE FILE
  ========================================================== */

  const removeFile = () => {
    setFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* ==========================================================
     SUGGESTION
  ========================================================== */

  const useSuggestion = (text) => {

    setInput(text);

    setTimeout(() => {
      document
        .querySelector(".chat-input")
        ?.focus();
    }, 50);
  };

  /* ==========================================================
     REGENERATE (API HOOKED)
  ========================================================== */

  const regenerateMessage = async () => {
    if (loading) {
      return;
    }

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMessage) return;

    setLoading(true);

    try {
      const token = localStorage.getItem("token") || "";
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          question: lastUserMessage.text,
          fileName: file?.name || null,
          mode: searchMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error (${response.status})`);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.answer || "No response received.",
          sources: data.sources || [],
          error: false,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `An error occurred during regeneration: ${err.message}`,
          sources: [],
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     RETURN
  ========================================================== */

  return (

    <div className="app-shell">

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      {sidebarOpen && (

        <aside className="sidebar">

          <div className="sidebar-top">

            <Logo />

            <button
              className="mobile-close"
              onClick={() =>
                setSidebarOpen(false)
              }
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>

          </div>

          {/* NEW CHAT */}

          <button
            className="new-chat-btn"
            onClick={newChat}
          >
            <Plus size={19} />

            New conversation
          </button>

          {/* WORKSPACE */}

          <div className="sidebar-section">
            <span className="sidebar-label">WORKSPACE</span>

            <button
              className={`sidebar-item ${activeView === "chat" ? "active" : ""}`}
              onClick={() => setActiveView("chat")}
            >
              <Brain size={18} />
              AI Research Chat
            </button>

            <button
              className={`sidebar-item ${activeView === "documents" ? "active" : ""}`}
              onClick={() => setActiveView("documents")}
            >
              <FileText size={18} />
              My documents
              {documents.length > 0 && (
                <span className="sidebar-count">{documents.length}</span>
              )}
            </button>

            <button
              className={`sidebar-item ${activeView === "evidence" ? "active" : ""}`}
              onClick={() => setActiveView("evidence")}
            >
              <BookOpen size={18} />
              Saved evidence
              {savedEvidence.length > 0 && (
                <span className="sidebar-count">{savedEvidence.length}</span>
              )}
            </button>
          </div>

          {/* CHAT HISTORY */}

          <div className="sidebar-section">
            <span className="sidebar-label">CHAT HISTORY</span>

            {chatHistory.length === 0 ? (
              <div className="history-empty">No saved chats yet</div>
            ) : (
              chatHistory.slice(0, 10).map((chat) => (
                <button
                  key={chat.id}
                  className={`history-item ${
                    chat.id === currentChatId ? "active" : ""
                  }`}
                  onClick={() => openChat(chat)}
                  title={chat.title}
                >
                  {chat.title}
                </button>
              ))
            )}
          </div>

          {/* BOTTOM */}

          <div className="sidebar-bottom">

            {/* App-level navigation */}

            <button
              className="sidebar-item"
              onClick={() => onNavigate && onNavigate("dashboard")}
            >
              <BarChart3 size={18} />
              Benchmark dashboard
            </button>

            <button
              className="sidebar-item"
              onClick={() => {
                clearSession();
                onNavigate && onNavigate("login");
              }}
            >
              <LogOut size={18} />
              Sign out
            </button>

            <div className="privacy-card">

              <ShieldCheck size={20} />

              <div>

                <strong>
                  Research focused
                </strong>

                <span>
                  Answers are grounded in
                  evidence.
                </span>

              </div>

            </div>

          </div>

        </aside>

      )}

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="chat-main">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="chat-header">

          <button
            className="menu-btn"
            onClick={() =>
              setSidebarOpen(
                (prev) => !prev
              )
            }
            aria-label="Toggle sidebar"
          >
            <Menu size={22} />
          </button>

          <div className="header-title">

            <div className="header-title-icon">
              <Sparkles size={18} />
            </div>

            <div>

              <strong>
                Research Assistant
              </strong>

              <span>
                Evidence-grounded medical
                intelligence
              </span>

            </div>

          </div>

          <div className="header-status">

            <span className="status-dot" />

            Online

          </div>

        </header>
        <input
  ref={fileInputRef}
  type="file"
  accept="application/pdf"
  hidden
  onChange={handleFile}
/>

        {/* ====================================================
            CHAT CONTENT
        ==================================================== */}

        {activeView === "documents" && (
          <div className="workspace-page">
            <div className="workspace-page-header">
              <div>
                <span className="workspace-eyebrow">LIBRARY</span>
                <h2>My documents</h2>
                <p>Your uploaded research PDFs are saved here.</p>
              </div>

              <button
                className="new-chat-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus size={18} />
                Upload PDF
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="workspace-empty">
                <FileText size={42} />
                <h3>No documents yet</h3>
                <p>Upload a PDF to see it here.</p>
              </div>
            ) : (
              <div className="workspace-list">
                {documents.map((doc) => (
                  <div className="workspace-item" key={doc.id}>
                    <div className="workspace-item-icon">
                      <FileText size={22} />
                    </div>

                    <div className="workspace-item-info">
                      <strong>{doc.name}</strong>
                      <span>
                        PDF • {(doc.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>

                    <button
                      className="workspace-open-btn"
                      onClick={() => openDocument(doc)}
                    >
                      Open
                    </button>

                    <button
                      className="workspace-delete-btn"
                      onClick={() => deleteDocument(doc.id)}
                      title="Delete document"
                    >
                      <X size={17} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === "evidence" && (
          <div className="workspace-page">
            <div className="workspace-page-header">
              <div>
                <span className="workspace-eyebrow">BOOKMARKS</span>
                <h2>Saved evidence</h2>
                <p>Evidence saved from your research responses.</p>
              </div>
            </div>

            {savedEvidence.length === 0 ? (
              <div className="workspace-empty">
                <BookOpen size={42} />
                <h3>No saved evidence yet</h3>
                <p>Press Save beside an evidence source to keep it here.</p>
              </div>
            ) : (
              <div className="workspace-list">
                {savedEvidence.map((source) => (
                  <div className="workspace-item evidence-item" key={source.id}>
                    <div className="workspace-item-icon">
                      <BookOpen size={22} />
                    </div>

                    <div className="workspace-item-info">
                      <strong>{source.title}</strong>
                      <span>{source.detail}</span>
                    </div>

                    <div className="similarity">{source.score}%</div>

                    <button
                      className="workspace-delete-btn"
                      onClick={() => removeEvidence(source.id)}
                      title="Remove saved evidence"
                    >
                      <X size={17} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === "chat" && (
        <>
        <div className="chat-scroll">

          {/* EMPTY STATE */}

          {messages.length === 0 && (

            <div className="empty-state">

              <BrainAnimation />

              <h1>
                Explore the science
                <br />
                behind the mind & immune
                system.
              </h1>

              <p>
                Ask a medical research
                question or upload a PDF to
                discover evidence-backed
                insights.
              </p>

              <div className="suggestion-grid">

                <button
                  onClick={() =>
                    useSuggestion(
                      "How does depression affect the immune system?"
                    )
                  }
                >
                  <Activity size={19} />

                  Depression & immunity
                </button>

                <button
                  onClick={() =>
                    useSuggestion(
                      "What inflammatory pathways are associated with depression?"
                    )
                  }
                >
                  <Search size={19} />

                  Inflammatory pathways
                </button>

                <button
                  onClick={() =>
                    useSuggestion(
                      "What does current research say about psychoneuroimmunology?"
                    )
                  }
                >
                  <BookOpen size={19} />

                  Research overview
                </button>

              </div>

            </div>
          )}

          {/* MESSAGES */}

          <div className="messages-container">

            {messages.map(
              (message, index) => (

                <Message
                  key={index}
                  message={message}
                  onRegenerate={
                    regenerateMessage
                  }
                  onSaveEvidence={saveEvidence}
                />

              )
            )}

            {/* LOADING */}

            {loading && (

              <div className="message-row assistant-row">

                <div className="assistant-avatar">
                  <Brain size={18} />
                </div>

                <div className="assistant-content">

                  <div className="assistant-name">
                    {MODEL_NAME} AI
                  </div>

                  <div className="thinking-box">

                    <div className="thinking-animation">

                      <span />
                      <span />
                      <span />

                    </div>

                    <div>

                      <strong>
                        Searching medical
                        evidence
                      </strong>

                      <span>
                        Retrieving relevant
                        research...
                      </span>

                    </div>

                  </div>

                </div>

              </div>
            )}

          </div>

        </div>

        {/* ====================================================
            COMPOSER
        ==================================================== */}

        <div className="composer-area">

          <div className="composer-wrapper">

            {/* UPLOADED FILE */}

            {file && (

              <UploadedFile
                file={file}
                onRemove={removeFile}
              />

            )}

            <div className="composer">

              {/* ATTACH */}

              <button
                className="attach-btn"
                title="Upload PDF"
                onClick={() =>
                  fileInputRef.current?.click()
                }
              >
                <Paperclip size={21} />
              </button>

              {/* INPUT */}

              <textarea
                className="chat-input"
                value={input}
                onChange={(e) =>
                  setInput(e.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder={
                  file
                    ? "Ask a question about your PDF..."
                    : "Ask a question about medical research..."
                }
                rows={1}
              />

              {/* MODE */}

              <button
                className="mode-btn"
                onClick={() =>
                  setSearchMode(
                    searchMode ===
                      "Research"
                      ? "Document"
                      : "Research"
                  )
                }
              >

                {searchMode ===
                "Research" ? (
                  <Search size={17} />
                ) : (
                  <FileText size={17} />
                )}

                {searchMode}

                <ChevronDown size={14} />

              </button>

              {/* SEND */}

              <button
                className="send-btn"
                onClick={sendMessage}
                disabled={
                  !input.trim() ||
                  loading
                }
                aria-label="Send message"
              >

                {loading ? (

                  <Loader2
                    size={20}
                    className="spin"
                  />

                ) : (

                  <Send size={20} />

                )}

              </button>

            </div>

            {/* FOOTER */}

            <div className="composer-footer">

              <span>
                <ShieldCheck size={14} />

                Evidence-grounded responses
              </span>

              <span>
                Enter to send
              </span>

            </div>

          </div>

        </div>

        </>
        )}
      </main>

      {/* ======================================================
          RIGHT INSIGHT PANEL
      ====================================================== */}

      <aside className="insight-panel">

        {/* HEADER */}

        <div className="insight-header">

          <div>

            <span>
              LIVE ANALYSIS
            </span>

            <h3>
              Research context
            </h3>

          </div>

          <div className="pulse-icon">
            <Activity size={19} />
          </div>

        </div>

        {/* SEMANTIC SEARCH */}

        <div className="analysis-card">

          <div className="analysis-icon">
            <Search size={19} />
          </div>

          <div>

            <strong>
              Semantic search
            </strong>

            <span>
              Finding relevant medical
              literature
            </span>

          </div>

          <div className="analysis-status">
            <CheckCircle2 size={16} />
          </div>

        </div>

        {/* NEUROIMMUNE */}

        <div className="analysis-card">

          <div className="analysis-icon cyan">
            <Brain size={19} />
          </div>

          <div>

            <strong>
              Neuroimmune link
            </strong>

            <span>
              Depression ↔ inflammation
            </span>

          </div>

          <div className="analysis-status">
            <CheckCircle2 size={16} />
          </div>

        </div>

       {/* RESEARCH ACTIVITY */}

<div className="mini-visual">

  <div className="mini-visual-label">
    Research activity
  </div>

  <div className="research-stats">

<div className="research-stat">
  <strong>{documents.length}</strong>
  <span>Documents</span>
</div>

<div className="research-stat">
  <strong>{savedEvidence.length}</strong>
  <span>Saved evidence</span>
</div>

<div className="research-stat">
  <strong>{messages.filter((m) => m.role === "user").length}</strong>
  <span>Questions</span>
</div>
  </div>

  <div className="confidence-footer">

    <span>
      <CheckCircle2 size={14} />
      Research workspace active
    </span>

  </div>

</div>

        {/* NOTE */}

        <div className="insight-note">

          <Sparkles size={17} />

          <p>
            {MODEL_NAME} prioritizes relevant
            evidence and clearly separates
            established findings from
            uncertain or limited evidence.
          </p>

        </div>

      </aside>

    </div>
  );
}