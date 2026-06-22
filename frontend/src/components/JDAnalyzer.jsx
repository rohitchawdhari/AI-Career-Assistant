import { useState } from "react";
import API from "../services/api";

function JDAnalyzer({
  setMatchScore,
  setMatchedSkills,
  setJDMissingSkills,
}) {
  const [jobDescription, setJobDescription] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [fileName, setFileName] =
    useState("");

  const analyzeJD = async () => {
    if (!jobDescription.trim()) return;

    try {
      setLoading(true);

      const res = await API.post(
        "/analyze-jd",
        {
          job_description:
            jobDescription,
        }
      );

      setMatchScore(
        res.data.match_score
      );

      setMatchedSkills(
        res.data.matched_skills
      );

      setJDMissingSkills(
        res.data.missing_skills
      );

    } catch (err) {
      console.log(err);

      alert(
        "JD Analysis Failed"
      );

    } finally {
      setLoading(false);
    }
  };

  const uploadJDFile = async (e) => {
    const file =
      e.target.files[0];

    if (!file) return;

    setFileName(file.name);

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    try {
      setLoading(true);

      const res =
        await API.post(
          "/upload-jd",
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

      setMatchScore(
        res.data.match_score
      );

      setMatchedSkills(
        res.data.matched_skills
      );

      setJDMissingSkills(
        res.data.missing_skills
      );

    } catch (err) {
      console.log(err);

      alert(
        "JD File Upload Failed"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
      bg-slate-900/70
      backdrop-blur-xl
      rounded-3xl
      p-8
      border
      border-slate-800
      shadow-2xl
      "
    >
      <h2 className="text-3xl font-bold mb-5">
        📋 Job Description Analyzer
      </h2>

      <textarea
        rows="8"
        value={jobDescription}
        onChange={(e) =>
          setJobDescription(
            e.target.value
          )
        }
        placeholder="Paste Job Description Here..."
        className="
        w-full
        bg-slate-800
        border
        border-slate-700
        rounded-xl
        p-4
        outline-none
        "
      />

      <div className="flex flex-wrap gap-4 mt-5">

        <button
          onClick={analyzeJD}
          disabled={loading}
          className="
          bg-gradient-to-r
          from-purple-600
          to-cyan-500
          px-6
          py-3
          rounded-xl
          font-semibold
          "
        >
          {loading
            ? "Analyzing..."
            : "Analyze JD"}
        </button>

        <label
          className="
          cursor-pointer
          bg-slate-800
          hover:bg-slate-700
          px-6
          py-3
          rounded-xl
          font-semibold
          "
        >
          📎 Upload JD

          <input
            type="file"
            accept=".pdf,.docx"
            onChange={
              uploadJDFile
            }
            className="hidden"
          />
        </label>

      </div>

      {fileName && (
        <div className="mt-4">

          <p className="text-green-400">
            ✓ {fileName}
          </p>

        </div>
      )}
    </div>
  );
}

export default JDAnalyzer;