function JDScoreCard({
  matchScore,
}) {

  const getColor = () => {

    if (matchScore >= 80)
      return "text-green-400";

    if (matchScore >= 60)
      return "text-yellow-400";

    return "text-red-400";
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
        🎯 JD Match Score
      </h2>

      <div
        className={`text-6xl font-bold ${getColor()}`}
      >
        {matchScore}%
      </div>

      <p className="text-slate-400 mt-4">
        Resume vs Job Description
      </p>

    </div>
  );
}

export default JDScoreCard;