function ResumeInsights({
  projectsCount,
  skillsCount,
  education,
  certificationsCount,
  experience,
}) {
  const cards = [
    {
      title: "Projects",
      value: projectsCount,
      icon: "🚀",
    },
    {
      title: "Skills",
      value: skillsCount,
      icon: "🛠️",
    },
    {
      title: "Education",
      value: education,
      icon: "🎓",
    },
    {
      title: "Experience",
      value: experience,
      icon: "💼",
    },
    {
      title: "Certificates",
      value: certificationsCount,
      icon: "📜",
    },
  ];

  return (
    <div className="grid md:grid-cols-5 gap-4 mt-8">
      {cards.map((card) => (
        <div
          key={card.title}
          className="
          bg-slate-900/70
          backdrop-blur-xl
          border
          border-slate-800
          rounded-2xl
          p-5
          shadow-xl
          "
        >
          <div className="text-3xl mb-3">
            {card.icon}
          </div>

          <p className="text-slate-400 text-sm">
            {card.title}
          </p>

          <h3 className="text-xl font-bold mt-2">
            {card.value}
          </h3>
        </div>
      ))}
    </div>
  );
}

export default ResumeInsights;