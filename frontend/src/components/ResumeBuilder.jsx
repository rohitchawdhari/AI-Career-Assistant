import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import API from "../services/api";
import { FaFilePdf, FaFileWord, FaMarkdown, FaMagic, FaPlus, FaTrash, FaEye, FaEdit, FaTrophy } from "react-icons/fa";

function ResumeBuilder({ user }) {
  const [activeSection, setActiveSection] = useState("personal");
  const [template, setTemplate] = useState("modern");
  const [loading, setLoading] = useState(false);
  const [atsScore, setAtsScore] = useState(70);

  // Form State
  const [resumeData, setResumeData] = useState({
    personal: {
      name: user?.name || "",
      email: user?.email || "",
      phone: "",
      location: "",
      website: "",
      github: "",
      linkedin: "",
      portfolio: "",
      summary: "",
    },
    skills: [],
    experience: [],
    projects: [],
    education: [],
    certifications: [],
    achievements: [],
    languages: [],
    interests: [],
  });

  const [newSkill, setNewSkill] = useState("");
  const [newCert, setNewCert] = useState("");
  const [newAch, setNewAch] = useState("");
  const [newLang, setNewLang] = useState("");
  const [newInt, setNewInt] = useState("");

  const templates = ["modern", "professional", "minimal", "corporate", "creative"];

  // Fetch Live ATS score on input change (throttled/simulated)
  useEffect(() => {
    let score = 50;
    if (resumeData.personal.summary) score += 10;
    if (resumeData.skills.length > 3) score += 10;
    if (resumeData.experience.length > 0) score += 15;
    if (resumeData.projects.length > 0) score += 10;
    if (resumeData.education.length > 0) score += 5;
    setAtsScore(Math.min(100, score));
  }, [resumeData]);

  // AI Optimizer Call
  const handleAIOptimize = async (actionType) => {
    try {
      setLoading(true);
      const res = await API.post("/tools/resume-builder/optimize", {
        sections: resumeData,
        target_role: resumeData.personal.summary ? undefined : "Software Engineer",
      });

      if (actionType === "summary" && res.data.improved_summary) {
        setResumeData((prev) => ({
          ...prev,
          personal: { ...prev.personal, summary: res.data.improved_summary },
        }));
        toast.success("AI Summary Optimized! 🤖");
      } else if (actionType === "skills" && res.data.suggested_skills) {
        setResumeData((prev) => ({
          ...prev,
          skills: Array.from(new Set([...prev.skills, ...res.data.suggested_skills])),
        }));
        toast.success("AI Skills Added! 🧠");
      } else if (actionType === "ats" && res.data.ats_score) {
        setAtsScore(res.data.ats_score);
        if (res.data.ats_compatibility_tips) {
          toast.info(res.data.ats_compatibility_tips[0] || "ATS check completed.");
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("AI optimization failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Add Item Helpers
  const addExperience = () => {
    setResumeData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        { company: "", position: "", location: "", start: "", end: "", desc: "" },
      ],
    }));
  };

  const addProject = () => {
    setResumeData((prev) => ({
      ...prev,
      projects: [...prev.projects, { title: "", link: "", tech: "", desc: "" }],
    }));
  };

  const addEducation = () => {
    setResumeData((prev) => ({
      ...prev,
      education: [...prev.education, { school: "", degree: "", field: "", start: "", end: "" }],
    }));
  };

  // Export File Handlers
  const handleExportMarkdown = () => {
    const md = `
# ${resumeData.personal.name}
Email: ${resumeData.personal.email} | Phone: ${resumeData.personal.phone}
Location: ${resumeData.personal.location}
GitHub: ${resumeData.personal.github} | LinkedIn: ${resumeData.personal.linkedin}

## Professional Summary
${resumeData.personal.summary}

## Skills
${resumeData.skills.join(", ")}

## Professional Experience
${resumeData.experience
  .map(
    (exp) => `
### ${exp.position} - ${exp.company}
*${exp.start} - ${exp.end}*
${exp.desc}
`
  )
  .join("\n")}

## Projects
${resumeData.projects
  .map(
    (proj) => `
### ${proj.title}
*Tech Stack: ${proj.tech}*
${proj.desc}
`
  )
  .join("\n")}

## Education
${resumeData.education
  .map(
    (edu) => `
### ${edu.degree} in ${edu.field}
*${edu.school} | ${edu.start} - ${edu.end}*
`
  )
  .join("\n")}
`;

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${resumeData.personal.name.replace(/\s+/g, "_")}_Resume.md`;
    a.click();
    toast.success("Markdown exported successfully!");
  };

  const handleExportDocx = () => {
    // Generate simple rich-text compatible word output as string
    let text = `${resumeData.personal.name.toUpperCase()}\n`;
    text += `Email: ${resumeData.personal.email} | Phone: ${resumeData.personal.phone}\n`;
    text += `Location: ${resumeData.personal.location}\n\n`;
    text += `SUMMARY\n-------\n${resumeData.personal.summary}\n\n`;
    text += `SKILLS\n------\n${resumeData.skills.join(", ")}\n\n`;
    text += `EXPERIENCE\n----------\n`;
    resumeData.experience.forEach((exp) => {
      text += `${exp.position} at ${exp.company} (${exp.start} - ${exp.end})\n${exp.desc}\n\n`;
    });
    
    const blob = new Blob([text], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${resumeData.personal.name.replace(/\s+/g, "_")}_Resume.doc`;
    a.click();
    toast.success("DOCX file exported!");
  };

  const handlePrintPDF = () => {
    // Set document title temporarily to custom name for printing
    const originalTitle = document.title;
    document.title = `${resumeData.personal.name}_Resume`;
    window.print();
    document.title = originalTitle;
  };

  return (
    <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
      
      {/* Print styles injection to hide everything except the print resume container */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-resume-preview, #print-resume-preview * {
            visibility: visible;
          }
          #print-resume-preview {
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

      {/* Top Options Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-6 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">AI Resume Builder</h2>
          <p className="text-slate-400 text-xs mt-1">Design and build your resume from scratch with real-time AI optimization.</p>
        </div>
        
        {/* ATS Score Indicator */}
        <div className="flex items-center gap-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 rounded-2xl p-4">
          <div className="p-3 bg-purple-600 text-white rounded-xl">
            <FaTrophy className="text-lg" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Live ATS score</p>
            <p className="text-xl font-black text-purple-600 dark:text-purple-400">{atsScore}/100</p>
          </div>
        </div>
      </div>

      {/* Selector Area: Template & Export Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-850 rounded-2xl p-4 mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase">Template:</span>
          {templates.map((t) => (
            <button
              key={t}
              onClick={() => setTemplate(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                template === t
                  ? "bg-purple-600 text-white"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-250 dark:border-slate-700 hover:bg-slate-100"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
          >
            <FaFilePdf /> PDF
          </button>
          <button
            onClick={handleExportDocx}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
          >
            <FaFileWord /> DOCX
          </button>
          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
          >
            <FaMarkdown /> Markdown
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Left Side: Interactive Edit Form */}
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            {[
              { id: "personal", label: "Details" },
              { id: "skills", label: "Skills" },
              { id: "experience", label: "Experience" },
              { id: "projects", label: "Projects" },
              { id: "education", label: "Education" },
            ].map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeSection === sec.id
                    ? "bg-slate-100 dark:bg-slate-800 text-purple-600 dark:text-purple-400"
                    : "text-slate-650 dark:text-slate-400 hover:text-purple-500"
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>

          {/* 1. Personal Details Form */}
          {activeSection === "personal" && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    value={resumeData.personal.name}
                    onChange={(e) => setResumeData({ ...resumeData, personal: { ...resumeData.personal, name: e.target.value } })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={resumeData.personal.email}
                    onChange={(e) => setResumeData({ ...resumeData, personal: { ...resumeData.personal, email: e.target.value } })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={resumeData.personal.phone}
                    onChange={(e) => setResumeData({ ...resumeData, personal: { ...resumeData.personal, phone: e.target.value } })}
                    placeholder="e.g. +91 9999999999"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">Location</label>
                  <input
                    type="text"
                    value={resumeData.personal.location}
                    onChange={(e) => setResumeData({ ...resumeData, personal: { ...resumeData.personal, location: e.target.value } })}
                    placeholder="e.g. Mumbai, India"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold">Professional Summary</label>
                  <button
                    onClick={() => handleAIOptimize("summary")}
                    disabled={loading}
                    className="text-purple-600 hover:text-purple-500 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <FaMagic /> AI Generate Summary
                  </button>
                </div>
                <textarea
                  rows="5"
                  value={resumeData.personal.summary}
                  onChange={(e) => setResumeData({ ...resumeData, personal: { ...resumeData.personal, summary: e.target.value } })}
                  placeholder="Describe your career goals and core engineering accomplishments..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 outline-none text-sm resize-none"
                />
              </div>
            </div>
          )}

          {/* 2. Skills list Form */}
          {activeSection === "skills" && (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold">Add Skills</label>
                  <button
                    onClick={() => handleAIOptimize("skills")}
                    disabled={loading}
                    className="text-purple-600 hover:text-purple-500 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <FaMagic /> AI Suggest Skills
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), setNewSkill(""), setResumeData({ ...resumeData, skills: [...resumeData.skills, newSkill] }))}
                    placeholder="Type skill and press Enter"
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 outline-none text-sm"
                  />
                  <button
                    onClick={() => {
                      if (newSkill.trim()) {
                        setResumeData({ ...resumeData, skills: [...resumeData.skills, newSkill.trim()] });
                        setNewSkill("");
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 rounded-xl text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {resumeData.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2"
                  >
                    {skill}
                    <button
                      onClick={() => setResumeData({ ...resumeData, skills: resumeData.skills.filter((_, i) => i !== idx) })}
                      className="text-slate-400 hover:text-red-500 text-[10px]"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 3. Experience Form */}
          {activeSection === "experience" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-800 dark:text-white">Experience Blocks</h4>
                <button
                  onClick={addExperience}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition"
                >
                  <FaPlus /> Add Experience
                </button>
              </div>

              {resumeData.experience.map((exp, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 relative space-y-3">
                  <button
                    onClick={() => setResumeData({ ...resumeData, experience: resumeData.experience.filter((_, i) => i !== idx) })}
                    className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition cursor-pointer"
                  >
                    <FaTrash size={12} />
                  </button>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Company</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => {
                          const updated = [...resumeData.experience];
                          updated[idx].company = e.target.value;
                          setResumeData({ ...resumeData, experience: updated });
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Position</label>
                      <input
                        type="text"
                        value={exp.position}
                        onChange={(e) => {
                          const updated = [...resumeData.experience];
                          updated[idx].position = e.target.value;
                          setResumeData({ ...resumeData, experience: updated });
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Start Date</label>
                      <input
                        type="text"
                        value={exp.start}
                        onChange={(e) => {
                          const updated = [...resumeData.experience];
                          updated[idx].start = e.target.value;
                          setResumeData({ ...resumeData, experience: updated });
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">End Date</label>
                      <input
                        type="text"
                        value={exp.end}
                        onChange={(e) => {
                          const updated = [...resumeData.experience];
                          updated[idx].end = e.target.value;
                          setResumeData({ ...resumeData, experience: updated });
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Description (Bullets)</label>
                    <textarea
                      rows="3"
                      value={exp.desc}
                      onChange={(e) => {
                        const updated = [...resumeData.experience];
                        updated[idx].desc = e.target.value;
                        setResumeData({ ...resumeData, experience: updated });
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2.5 outline-none text-xs resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 4. Projects Form */}
          {activeSection === "projects" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-800 dark:text-white">Project Blocks</h4>
                <button
                  onClick={addProject}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition"
                >
                  <FaPlus /> Add Project
                </button>
              </div>

              {resumeData.projects.map((proj, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 relative space-y-3">
                  <button
                    onClick={() => setResumeData({ ...resumeData, projects: resumeData.projects.filter((_, i) => i !== idx) })}
                    className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition cursor-pointer"
                  >
                    <FaTrash size={12} />
                  </button>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Project Title</label>
                      <input
                        type="text"
                        value={proj.title}
                        onChange={(e) => {
                          const updated = [...resumeData.projects];
                          updated[idx].title = e.target.value;
                          setResumeData({ ...resumeData, projects: updated });
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tech Stack</label>
                      <input
                        type="text"
                        value={proj.tech}
                        onChange={(e) => {
                          const updated = [...resumeData.projects];
                          updated[idx].tech = e.target.value;
                          setResumeData({ ...resumeData, projects: updated });
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Description</label>
                    <textarea
                      rows="3"
                      value={proj.desc}
                      onChange={(e) => {
                        const updated = [...resumeData.projects];
                        updated[idx].desc = e.target.value;
                        setResumeData({ ...resumeData, projects: updated });
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2.5 outline-none text-xs resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 5. Education Form */}
          {activeSection === "education" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-800 dark:text-white">Education Blocks</h4>
                <button
                  onClick={addEducation}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition"
                >
                  <FaPlus /> Add Education
                </button>
              </div>

              {resumeData.education.map((edu, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 relative space-y-3">
                  <button
                    onClick={() => setResumeData({ ...resumeData, education: resumeData.education.filter((_, i) => i !== idx) })}
                    className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition cursor-pointer"
                  >
                    <FaTrash size={12} />
                  </button>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">School / University</label>
                      <input
                        type="text"
                        value={edu.school}
                        onChange={(e) => {
                          const updated = [...resumeData.education];
                          updated[idx].school = e.target.value;
                          setResumeData({ ...resumeData, education: updated });
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Degree</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => {
                          const updated = [...resumeData.education];
                          updated[idx].degree = e.target.value;
                          setResumeData({ ...resumeData, education: updated });
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Field of Study</label>
                      <input
                        type="text"
                        value={edu.field}
                        onChange={(e) => {
                          const updated = [...resumeData.education];
                          updated[idx].field = e.target.value;
                          setResumeData({ ...resumeData, education: updated });
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Start Date</label>
                      <input
                        type="text"
                        value={edu.start}
                        onChange={(e) => {
                          const updated = [...resumeData.education];
                          updated[idx].start = e.target.value;
                          setResumeData({ ...resumeData, education: updated });
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">End Date</label>
                      <input
                        type="text"
                        value={edu.end}
                        onChange={(e) => {
                          const updated = [...resumeData.education];
                          updated[idx].end = e.target.value;
                          setResumeData({ ...resumeData, education: updated });
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 outline-none text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Right Side: Live Resume Preview container */}
        <div className="bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 overflow-y-auto max-h-[800px] shadow-inner">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3 mb-6">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FaEye /> Live Rendering Preview
            </span>
          </div>

          <div
            id="print-resume-preview"
            className={`bg-white text-slate-850 p-8 rounded-2xl shadow-lg border border-slate-100 ${
              template === "minimal"
                ? "font-serif text-black leading-relaxed"
                : template === "corporate"
                ? "font-sans border-t-8 border-t-slate-800"
                : template === "creative"
                ? "font-sans border-l-8 border-l-purple-600"
                : "font-sans"
            }`}
          >
            {/* Header Layout */}
            <div className="border-b border-slate-200 pb-5 mb-5 text-center sm:text-left">
              <h1 className={`text-3xl font-black uppercase tracking-tight ${
                template === "creative" ? "text-purple-600" : "text-slate-900"
              }`}>
                {resumeData.personal.name || "YOUR NAME"}
              </h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center sm:justify-start text-xs text-slate-500 mt-2 font-medium">
                {resumeData.personal.email && <span>📧 {resumeData.personal.email}</span>}
                {resumeData.personal.phone && <span>📞 {resumeData.personal.phone}</span>}
                {resumeData.personal.location && <span>📍 {resumeData.personal.location}</span>}
              </div>
            </div>

            {/* Professional Summary */}
            {resumeData.personal.summary && (
              <div className="mb-6">
                <h3 className={`text-sm font-bold uppercase tracking-wider border-b border-slate-100 pb-1 mb-2 ${
                  template === "creative" ? "text-purple-600" : "text-slate-800"
                }`}>
                  Summary
                </h3>
                <p className="text-xs text-slate-650 leading-relaxed whitespace-pre-wrap">
                  {resumeData.personal.summary}
                </p>
              </div>
            )}

            {/* Technical Skills */}
            {resumeData.skills.length > 0 && (
              <div className="mb-6">
                <h3 className={`text-sm font-bold uppercase tracking-wider border-b border-slate-100 pb-1 mb-2 ${
                  template === "creative" ? "text-purple-600" : "text-slate-800"
                }`}>
                  Technical Skills
                </h3>
                <p className="text-xs text-slate-650 leading-relaxed">
                  {resumeData.skills.join(" • ")}
                </p>
              </div>
            )}

            {/* Professional Experience */}
            {resumeData.experience.length > 0 && (
              <div className="mb-6">
                <h3 className={`text-sm font-bold uppercase tracking-wider border-b border-slate-100 pb-1 mb-3 ${
                  template === "creative" ? "text-purple-600" : "text-slate-800"
                }`}>
                  Experience
                </h3>
                <div className="space-y-4">
                  {resumeData.experience.map((exp, idx) => (
                    <div key={idx} className="text-xs">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>{exp.position || "Position"} - {exp.company || "Company"}</span>
                        <span className="font-normal text-slate-400">{exp.start} - {exp.end}</span>
                      </div>
                      <p className="text-slate-600 mt-1 whitespace-pre-wrap text-[11px] leading-relaxed">
                        {exp.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {resumeData.projects.length > 0 && (
              <div className="mb-6">
                <h3 className={`text-sm font-bold uppercase tracking-wider border-b border-slate-100 pb-1 mb-3 ${
                  template === "creative" ? "text-purple-600" : "text-slate-800"
                }`}>
                  Projects
                </h3>
                <div className="space-y-4">
                  {resumeData.projects.map((proj, idx) => (
                    <div key={idx} className="text-xs">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>{proj.title || "Project Title"}</span>
                        {proj.tech && <span className="text-[10px] font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded">{proj.tech}</span>}
                      </div>
                      <p className="text-slate-600 mt-1 text-[11px] leading-relaxed whitespace-pre-wrap">
                        {proj.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {resumeData.education.length > 0 && (
              <div className="mb-6">
                <h3 className={`text-sm font-bold uppercase tracking-wider border-b border-slate-100 pb-1 mb-3 ${
                  template === "creative" ? "text-purple-600" : "text-slate-800"
                }`}>
                  Education
                </h3>
                <div className="space-y-3">
                  {resumeData.education.map((edu, idx) => (
                    <div key={idx} className="text-xs flex justify-between">
                      <div>
                        <span className="font-bold text-slate-800">{edu.degree || "Degree"}</span> in {edu.field || "Field of Study"}
                        <p className="text-slate-500 text-[10px] mt-0.5">{edu.school}</p>
                      </div>
                      <span className="text-slate-400 font-medium">{edu.start} - {edu.end}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}

export default ResumeBuilder;
