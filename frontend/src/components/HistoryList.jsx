import { useState, useEffect } from "react";
import { FaHistory, FaTrash, FaEye, FaCalendarAlt, FaFileAlt } from "react-icons/fa";

function HistoryList({ onLoadItem }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const saved = localStorage.getItem("career_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved).reverse()); // newest first
      } catch (e) {
        console.error("Error reading history", e);
      }
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear your search history?")) {
      localStorage.removeItem("career_history");
      setHistory([]);
    }
  };

  const handleDeleteItem = (id, e) => {
    e.stopPropagation();
    const updated = history.filter((item) => item.id !== id);
    localStorage.setItem("career_history", JSON.stringify(updated.reverse()));
    setHistory(updated);
  };

  const formatDate = (ts) => {
    return new Date(ts).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-2xl">
            <FaHistory className="text-3xl" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Analysis History</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Reload or inspect previously run evaluations.
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 border border-red-200 dark:border-red-900/50 hover:bg-red-500 hover:text-white text-red-500 dark:text-red-400 px-4 py-2 rounded-xl text-sm font-semibold transition"
          >
            <FaTrash size={12} />
            Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <FaFileAlt className="text-6xl mx-auto mb-4 text-slate-300 dark:text-slate-700" />
          <h3 className="text-xl font-bold mb-1">No History Yet</h3>
          <p className="text-slate-500 text-sm">
            Upload your resume or perform a job description comparison to log records.
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {history.map((item) => (
            <div
              key={item.id}
              onClick={() => onLoadItem(item)}
              className="group flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-900/60 rounded-2xl p-5 cursor-pointer transition duration-300"
            >
              <div className="flex items-center gap-4 mb-3 sm:mb-0">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    item.type === "ats"
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                      : "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
                  }`}
                >
                  {item.type === "ats" ? "ATS Run" : "JD Match"}
                </span>

                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white truncate max-w-[200px] sm:max-w-[300px]">
                    {item.filename || "Uploaded File"}
                  </h4>
                  <p className="text-slate-400 text-xs flex items-center gap-1.5 mt-1">
                    <FaCalendarAlt size={10} />
                    {formatDate(item.timestamp)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-right">
                  <span className="text-slate-400 text-xs block">Score</span>
                  <span
                    className={`font-black text-2xl ${
                      item.score >= 80
                        ? "text-green-500"
                        : item.score >= 60
                        ? "text-yellow-500"
                        : "text-red-500"
                    }`}
                  >
                    {item.score}%
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onLoadItem(item)}
                    className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-purple-500 hover:text-white dark:hover:bg-purple-600 rounded-xl text-slate-600 dark:text-slate-300 transition"
                    title="Load Analysis"
                  >
                    <FaEye size={14} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteItem(item.id, e)}
                    className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-red-500 hover:text-white dark:hover:bg-red-950/40 dark:hover:text-red-400 rounded-xl text-slate-600 dark:text-slate-300 transition"
                    title="Delete Record"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HistoryList;
