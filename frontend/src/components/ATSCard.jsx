function ATSCard({ score }) {

  const progress = score || 0;

  const getColor = () => {
    if (progress >= 80) return "#22c55e";
    if (progress >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const getStatus = () => {
    if (progress >= 80) return "Excellent";
    if (progress >= 60) return "Good";
    return "Needs Improvement";
  };

  const getRecommendation = () => {
    if (progress >= 80) {
      return "Your resume is highly optimized for ATS systems.";
    }

    if (progress >= 60) {
      return "Your resume is performing well but can be improved further.";
    }

    return "Add more relevant skills and keywords to improve ATS performance.";
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
      {/* Header */}

      <div className="flex items-center justify-between mb-8">

        <h2 className="text-3xl font-bold">
          ATS Score
        </h2>

        <div
          className="px-4 py-2 rounded-xl font-semibold"
          style={{
            backgroundColor: `${getColor()}20`,
            color: getColor(),
          }}
        >
          {getStatus()}
        </div>

      </div>

      {/* Score Circle */}

      <div className="flex justify-center">

        <div className="relative w-56 h-56">

          <svg
            className="w-56 h-56 -rotate-90"
            viewBox="0 0 120 120"
          >
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke="#1e293b"
              strokeWidth="10"
              fill="none"
            />

            <circle
              cx="60"
              cy="60"
              r="50"
              stroke={getColor()}
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="314"
              strokeDashoffset={
                314 -
                (314 * progress) / 100
              }
              style={{
                transition:
                  "stroke-dashoffset 1.5s ease",
              }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">

            <span
              className="text-6xl font-bold"
              style={{
                color: getColor(),
              }}
            >
              {score !== null
                ? `${score}%`
                : "--"}
            </span>

            <span className="text-slate-400 mt-2">
              ATS Match
            </span>

          </div>

        </div>

      </div>

      {/* Stats */}

      <div className="grid grid-cols-2 gap-4 mt-8">

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">

          <p className="text-slate-400 text-sm">
            Score Status
          </p>

          <h3
            className="text-xl font-bold mt-2"
            style={{
              color: getColor(),
            }}
          >
            {getStatus()}
          </h3>

        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">

          <p className="text-slate-400 text-sm">
            ATS Rating
          </p>

          <h3 className="text-xl font-bold text-cyan-400 mt-2">
            {progress}/100
          </h3>

        </div>

      </div>

      {/* Recommendation */}

      <div className="mt-6 bg-slate-800 border border-slate-700 rounded-2xl p-5">

        <h3 className="font-semibold text-lg mb-3">
          Recommendation
        </h3>

        <p className="text-slate-300 leading-7">
          {getRecommendation()}
        </p>

      </div>

      {/* Progress Bar */}

      <div className="mt-6">

        <div className="flex justify-between mb-2">

          <span className="text-slate-400">
            Optimization Level
          </span>

          <span
            className="font-semibold"
            style={{
              color: getColor(),
            }}
          >
            {progress}%
          </span>

        </div>

        <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">

          <div
            className="h-3 rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              backgroundColor: getColor(),
            }}
          />

        </div>

      </div>

    </div>
  );
}

export default ATSCard;