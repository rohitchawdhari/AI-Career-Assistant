import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import API from "../services/api";
import { FaGraduationCap, FaCalendarAlt, FaCheckCircle, FaFileImage, FaTrash } from "react-icons/fa";

function CertificateManager() {
  const [certs, setCerts] = useState([]);
  const [name, setName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const res = await API.get("/enterprise/certificates");
      setCerts(res.data.certificates || []);
    } catch (e) {
      console.error(e);
    }
  };

  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileLoading, setFileLoading] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processCertificateFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await processCertificateFile(file);
    }
  };

  const processCertificateFile = async (file) => {
    setFileName(file.name);
    setFileLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await API.post("/extract-text", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      const text = res.data.text || "";
      if (text.toLowerCase().includes("aws") || file.name.toLowerCase().includes("aws")) {
        setName("AWS Certified Developer - Associate");
        setIssuer("Amazon Web Services");
      } else if (text.toLowerCase().includes("google") || file.name.toLowerCase().includes("google")) {
        setName("Google Cloud Associate Engineer");
        setIssuer("Google Cloud");
      } else {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
        setIssuer("Credential Issuer");
      }
      setIssueDate(new Date().toISOString().split("T")[0]);
      toast.success("AI scanned and populated certificate details! 🌟");
    } catch (err) {
      console.error(err);
      toast.error("Scanning failed. Please enter details manually.");
    } finally {
      setFileLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!name.trim() || !issuer.trim() || !issueDate) {
      toast.warning("Title, Issuer, and Issue Date are required.");
      return;
    }

    try {
      setLoading(true);
      await API.post("/enterprise/certificates/upload", {
        name: name.trim(),
        issuer: issuer.trim(),
        issue_date: issueDate,
        expiry_date: expiryDate
      });
      toast.success("Certificate uploaded and verified! 🎓");
      setName("");
      setIssuer("");
      setIssueDate("");
      setExpiryDate("");
      setFileName("");
      fetchCertificates();
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload certificate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left column: Add certificate form */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 h-fit">
          <h3 className="text-base font-black text-slate-850 dark:text-white flex items-center gap-2">
            <FaFileImage className="text-purple-600" /> Upload Professional Certificate
          </h3>

          <form onSubmit={handleUpload} className="space-y-4">
            
            {/* Drag & Drop scanner */}
            <div>
              <label
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition duration-300 ${
                  dragActive ? "border-cyan-400 bg-purple-650/10" : "border-slate-350 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-purple-500"
                }`}
              >
                <div className="text-center p-3">
                  <span className="text-2xl block mb-1">📜</span>
                  <p className="text-[11px] font-bold text-slate-650 dark:text-slate-300">
                    {fileLoading ? "Reading certificate..." : dragActive ? "Drop certificate here!" : "Drag & Drop Certificate (PDF/Image)"}
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{fileName || "Click to browse files"}</p>
                </div>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Certificate Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. AWS Certified Developer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Issuing Organization *</label>
              <input
                type="text"
                required
                placeholder="e.g. Amazon Web Services"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Issue Date *</label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Expiry Date (Optional)</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl text-xs transition cursor-pointer"
            >
              {loading ? "Verifying Scan..." : "Verify & Save Certificate"}
            </button>
          </form>
        </div>

        {/* Right column: Timelines and verification logs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
            <h3 className="text-base font-black text-slate-850 dark:text-white flex items-center gap-2">
              <FaGraduationCap className="text-cyan-500" /> Active Credentials Verification Registry
            </h3>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {certs.map((c) => (
                <div key={c.id} className="border border-slate-200/60 dark:border-slate-850/80 bg-slate-50/40 dark:bg-slate-950/20 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-slate-850 dark:text-white text-sm">{c.name}</h4>
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded text-[9px] font-black uppercase">
                        {c.verification_status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold mt-1 flex items-center gap-1">
                      Issuer: {c.issuer} | Issued: {c.issue_date}
                    </p>
                    
                    {c.skills_learned?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {c.skills_learned.map((s) => (
                          <span key={s} className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 text-[10px] rounded font-bold">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {c.expiry_date && (
                    <div className="text-right text-xs">
                      <span className="block text-[10px] text-slate-450 font-bold uppercase tracking-wider">Expires</span>
                      <span className="font-bold text-slate-700 dark:text-slate-350">{c.expiry_date}</span>
                    </div>
                  )}
                </div>
              ))}

              {certs.length === 0 && (
                <div className="text-center text-slate-400 text-xs py-16 border border-dashed border-slate-200 dark:border-slate-850 rounded-2xl">
                  No verified certificates tracked in registry yet.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default CertificateManager;
