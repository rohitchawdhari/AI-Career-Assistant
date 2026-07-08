import { useState } from "react";
import { toast } from "react-toastify";
import API from "../services/api";
import { FaLinkedin, FaEnvelope, FaFileSignature, FaCopy, FaDownload, FaMagic } from "react-icons/fa";

function CreativeStudio() {
  const [subTab, setSubTab] = useState("linkedin");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  // LinkedIn form state
  const [postType, setPostType] = useState("Project Completion");
  const [postDetails, setPostDetails] = useState("");

  // Email form state
  const [emailType, setEmailType] = useState("Referral Request");
  const [emailDetails, setEmailDetails] = useState("");

  // Cover Letter state
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [jdText, setJdText] = useState("");
  const [skills, setSkills] = useState("");

  const handleGenerateLinkedIn = async (e) => {
    e.preventDefault();
    if (!postDetails.trim()) {
      toast.warning("Please describe your project or achievement details.");
      return;
    }
    try {
      setLoading(true);
      const res = await API.post("/enterprise/linkedin-post", {
        type: postType,
        details: postDetails.trim()
      });
      setResult(res.data.post);
      toast.success("LinkedIn post generated! 🚀");
    } catch (err) {
      toast.error("Failed to generate post.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateEmail = async (e) => {
    e.preventDefault();
    if (!emailDetails.trim()) {
      toast.warning("Please provide context details for the email writer.");
      return;
    }
    try {
      setLoading(true);
      const res = await API.post("/enterprise/email-writer", {
        type: emailType,
        details: emailDetails.trim()
      });
      setResult(res.data.email);
      toast.success("Email template written! 📬");
    } catch (err) {
      toast.error("Failed to compile email.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCoverLetter = async (e) => {
    e.preventDefault();
    if (!role.trim() || !company.trim()) {
      toast.warning("Job Title and Company Name are required.");
      return;
    }
    try {
      setLoading(true);
      const skillList = skills.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await API.post("/enterprise/cover-letter", {
        role: role.trim(),
        company: company.trim(),
        jd_text: jdText.trim(),
        skills: skillList
      });
      setResult(res.data.cover_letter);
      toast.success("Cover letter crafted successfully! 📑");
    } catch (err) {
      toast.error("Failed to write cover letter.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast.success("Copied to clipboard! 📋");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      
      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-studio-result, #print-studio-result * {
            visibility: visible;
          }
          #print-studio-result {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

      {/* Sub tabs selector */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: "linkedin", label: "LinkedIn Post Generator", icon: <FaLinkedin /> },
          { id: "email", label: "AI Email Writer", icon: <FaEnvelope /> },
          { id: "cover", label: "AI Cover Letter Studio", icon: <FaFileSignature /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setSubTab(tab.id);
              setResult("");
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              subTab === tab.id
                ? "bg-purple-600 text-white shadow"
                : "bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Form column */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 h-fit">
          
          {subTab === "linkedin" && (
            <form onSubmit={handleGenerateLinkedIn} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Post Template Topic</label>
                <select
                  value={postType}
                  onChange={(e) => setPostType(e.target.value)}
                  className="w-full bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-350 rounded-xl p-3 outline-none text-xs font-bold"
                >
                  <option value="Project Completion">Project Completion 🎉</option>
                  <option value="Internship">New Internship Offer 💼</option>
                  <option value="Certificate">Certification Completed 🎓</option>
                  <option value="Achievement">Achievement / Award 🏆</option>
                  <option value="Placement">Job Placement Offer 🚀</option>
                  <option value="Hackathon">Hackathon Event Experience 💻</option>
                  <option value="Open Source">Open Source Contribution 🌐</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Context Details</label>
                <textarea
                  rows="5"
                  required
                  placeholder="Describe what you built, learned, or achieved..."
                  value={postDetails}
                  onChange={(e) => setPostDetails(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs resize-none font-semibold leading-relaxed"
                />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow">
                {loading ? "Writing post..." : <><FaMagic /> Build LinkedIn Post</>}
              </button>
            </form>
          )}

          {subTab === "email" && (
            <form onSubmit={handleGenerateEmail} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Email Category</label>
                <select
                  value={emailType}
                  onChange={(e) => setEmailType(e.target.value)}
                  className="w-full bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-350 rounded-xl p-3 outline-none text-xs font-bold"
                >
                  <option value="Referral Request">Referral Request 🤝</option>
                  <option value="HR Email">HR Application Cover 💼</option>
                  <option value="Internship Request">Internship Request 🎓</option>
                  <option value="Follow-up Email">Application Follow-up ⏰</option>
                  <option value="Thank You Email">Interview Thank You 🌟</option>
                  <option value="Offer Negotiation">Salary/Offer Negotiation 💰</option>
                  <option value="Resignation">Resignation Notice 📁</option>
                  <option value="Cold Email">Cold Outreach Letter ❄️</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Context Details</label>
                <textarea
                  rows="5"
                  required
                  placeholder="Provide recipient role, company name, your core values or experience points..."
                  value={emailDetails}
                  onChange={(e) => setEmailDetails(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs resize-none font-semibold leading-relaxed"
                />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow">
                {loading ? "Writing email..." : <><FaMagic /> Write Email Template</>}
              </button>
            </form>
          )}

          {subTab === "cover" && (
            <form onSubmit={handleGenerateCoverLetter} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Job Role Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Backend Dev"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Target Company *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Your Skills (Comma separated)</label>
                <input
                  type="text"
                  placeholder="FastAPI, React, SQL"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Job Description Keywords / Paste JD</label>
                <textarea
                  rows="3"
                  placeholder="Paste details of target job requirements here..."
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white rounded-xl p-3 outline-none text-xs resize-none font-semibold leading-relaxed"
                />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow">
                {loading ? "Crafting Cover Letter..." : <><FaMagic /> Build Custom Cover Letter</>}
              </button>
            </form>
          )}

        </div>

        {/* Right Output review column */}
        <div className="lg:col-span-2">
          {result ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AI Generated Document</span>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 hover:text-purple-600 rounded-xl border border-slate-200/50 dark:border-slate-750 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  >
                    <FaCopy /> Copy
                  </button>
                  {subTab === "cover" && (
                    <button
                      onClick={handlePrint}
                      className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                    >
                      <FaDownload /> Print / Export PDF
                    </button>
                  )}
                </div>
              </div>

              {/* Rendered result */}
              <div id="print-studio-result" className="p-5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl max-h-[460px] overflow-y-auto border border-slate-200/30">
                <pre className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                  {result}
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-32 border border-dashed border-slate-250 dark:border-slate-800 rounded-3xl">
              <FaFileSignature className="text-3xl text-purple-400 animate-pulse mb-3" />
              <p className="text-xs font-semibold">Fill out the variables and configure context to generate copy-paste ready LinkedIn posts, emails, and custom cover letters.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default CreativeStudio;
