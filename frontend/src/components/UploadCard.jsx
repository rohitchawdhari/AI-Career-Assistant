import { useState } from "react";
import { toast } from "react-toastify";

import API from "../services/api";

function UploadCard({
  setAtsScore,
  setSkills,
  setMissingSkills,
  setPdfUrl,

  setProjectsCount,
  setSkillsCount,
  setEducation,
  setCertificationsCount,
  setExperience,
}) {
  const [loading, setLoading] =
    useState(false);

  const [dragActive, setDragActive] = useState(false);

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
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const uploadResume = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file) => {
    setFileName(file.name);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);

      const res = await API.post(
        "/upload-resume",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      setAtsScore(
        res.data.ats_score
      );

      setSkills(
        res.data.skills_found || []
      );

      setMissingSkills(
        res.data.missing_skills || []
      );

      setProjectsCount(
        res.data.projects_count || 0
      );

      setSkillsCount(
        res.data.skills_count || 0
      );

      setEducation(
        res.data.education ||
          "Not Found"
      );

      setCertificationsCount(
        res.data
          .certifications_count || 0
      );

      setExperience(
        res.data.experience ||
          "Fresher"
      );

      if (res.data.file_url) {
        const baseURL = API.defaults.baseURL || "http://127.0.0.1:8000";
        setPdfUrl(`${baseURL}${res.data.file_url}`);
      }

      toast.success(
        "Resume analyzed successfully 🚀"
      );

    } catch (err) {
      console.log(err);
      toast.error(
        "Failed to upload resume"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl p-8 border border-slate-800 shadow-2xl">

      <h2 className="text-3xl font-bold mb-2">
        📄 Upload Resume
      </h2>

      <p className="text-slate-400 mb-6">
        Upload your resume and get ATS
        insights instantly.
      </p>

      <label
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`
        group
        flex
        flex-col
        items-center
        justify-center
        w-full
        h-56
        border-2
        border-dashed
        rounded-2xl
        cursor-pointer
        bg-slate-800/30
        hover:bg-slate-800/60
        transition-all
        duration-300
        ${dragActive ? 'border-cyan-400 bg-slate-800/80 scale-102' : 'border-purple-500 hover:border-cyan-400'}
        `}
      >
        <div className="text-center">

          <div className="text-6xl mb-3 group-hover:scale-110 transition">
            📂
          </div>

          <p className="font-semibold text-lg">
            {dragActive ? "Drop your resume here!" : "Click or Drag & Drop Resume"}
          </p>

          <p className="text-sm text-slate-400 mt-2">
            PDF Files Only
          </p>

        </div>

        <input
          type="file"
          accept=".pdf"
          onChange={uploadResume}
          className="hidden"
        />

      </label>

      {fileName && (
        <div className="mt-5 bg-slate-800 rounded-xl p-4 border border-slate-700">

          <p className="text-green-400 font-medium">
            ✓ {fileName}
          </p>

        </div>
      )}

      {loading && (
        <div className="mt-6">

          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">

            <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 animate-pulse"></div>

          </div>

          <p className="mt-3 text-yellow-400">
            Analyzing Resume...
          </p>

        </div>
      )}

    </div>
  );
}

export default UploadCard;