function SkillsCard({
  skills,
  missingSkills,
}) {

  const coverage =
    skills.length + missingSkills.length > 0
      ? Math.round(
          (skills.length /
            (skills.length +
              missingSkills.length)) *
            100
        )
      : 0;

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

        <h2 className="text-4xl font-bold">
          Skills Analysis
        </h2>

        <div className="flex gap-3">

          <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">

            <span className="text-green-400 font-bold">
              {skills.length}
            </span>

            <span className="text-slate-400">
              {" "}Found
            </span>

          </div>

          <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">

            <span className="text-red-400 font-bold">
              {missingSkills.length}
            </span>

            <span className="text-slate-400">
              {" "}Missing
            </span>

          </div>

        </div>

      </div>

      {/* Skills Found */}

      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">

        <h3 className="text-2xl font-bold flex items-center gap-3">

          <span>✅</span>

          <span>Skills Found</span>

        </h3>

        <div className="flex flex-wrap gap-3 mt-6">

          {skills.length > 0 ? (
            skills.map((skill, index) => (
              <span
                key={index}
                className="
                bg-gradient-to-r
                from-blue-600
                to-cyan-500
                px-4
                py-2
                rounded-full
                text-white
                font-semibold
                shadow-lg
                hover:scale-105
                transition
                cursor-default
                "
              >
                {skill}
              </span>
            ))
          ) : (
            <div className="text-slate-400">
              No skills detected yet.
            </div>
          )}

        </div>

      </div>

      {/* Missing Skills */}

      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 mt-6">

        <h3 className="text-2xl font-bold flex items-center gap-3">

          <span>⚠️</span>

          <span>Missing Skills</span>

        </h3>

        <div className="flex flex-wrap gap-3 mt-6">

          {missingSkills.length > 0 ? (
            missingSkills.map(
              (skill, index) => (
                <span
                  key={index}
                  className="
                  bg-gradient-to-r
                  from-red-600
                  to-pink-500
                  px-4
                  py-2
                  rounded-full
                  text-white
                  font-semibold
                  shadow-lg
                  hover:scale-105
                  transition
                  cursor-default
                  "
                >
                  {skill}
                </span>
              )
            )
          ) : (
            <div className="text-green-400 font-semibold">
              🎉 Great! No missing skills found.
            </div>
          )}

        </div>

      </div>

      {/* Stats */}

      <div className="grid md:grid-cols-3 gap-4 mt-8">

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">

          <p className="text-slate-400">
            Total Skills
          </p>

          <h3 className="text-3xl font-bold mt-2">
            {skills.length +
              missingSkills.length}
          </h3>

        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">

          <p className="text-slate-400">
            Detected
          </p>

          <h3 className="text-3xl font-bold text-green-400 mt-2">
            {skills.length}
          </h3>

        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">

          <p className="text-slate-400">
            Coverage
          </p>

          <h3 className="text-3xl font-bold text-cyan-400 mt-2">
            {coverage}%
          </h3>

        </div>

      </div>

      {/* Progress */}

      <div className="mt-8">

        <div className="flex justify-between mb-3">

          <span className="text-slate-400">
            Skill Coverage
          </span>

          <span className="font-semibold text-cyan-400">
            {coverage}%
          </span>

        </div>

        <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden">

          <div
            className="
            h-4
            rounded-full
            bg-gradient-to-r
            from-cyan-500
            via-blue-500
            to-green-500
            transition-all
            duration-700
            "
            style={{
              width: `${coverage}%`,
            }}
          />

        </div>

      </div>

      {/* Summary */}

      <div className="mt-8 bg-slate-800 border border-slate-700 rounded-2xl p-5">

        <p className="text-slate-300 text-lg">

          <span className="font-bold text-green-400">
            {skills.length}
          </span>{" "}
          skills found and{" "}

          <span className="font-bold text-red-400">
            {missingSkills.length}
          </span>{" "}
          skills recommended for improvement.

        </p>

      </div>

    </div>
  );
}

export default SkillsCard;