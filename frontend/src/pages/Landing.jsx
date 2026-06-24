import { motion } from "framer-motion";
import { FaRobot, FaBriefcase, FaChartLine, FaMagic, FaArrowRight, FaSearch } from "react-icons/fa";

function Landing({ token, setPage, onGetStarted }) {
  const features = [
    {
      icon: <FaChartLine className="text-4xl text-purple-400" />,
      title: "ATS Optimization Analyzer",
      description: "Extract text from PDF, DOC, and DOCX resumes. Instantly score your resume format, section clarity, and vocabulary keywords.",
    },
    {
      icon: <FaBriefcase className="text-4xl text-cyan-400" />,
      title: "Resume vs JD Alignment",
      description: "Compare your resume against any job description. Uncover matched skills, identify gaps, and get recommendations to increase alignment.",
    },
    {
      icon: <FaRobot className="text-4xl text-pink-400" />,
      title: "AI Career Coach & Mentor",
      description: "A continuous ChatGPT-like interactive portal. Ask about job searches, prepare for technical rounds, or seek career mentorship.",
    },
    {
      icon: <FaMagic className="text-4xl text-indigo-400" />,
      title: "Resume AI Assistant",
      description: "Improve summaries, translate project descriptions to STAR formats, and structure technical skills using state-of-the-art Gemini AI.",
    },
  ];

  const steps = [
    {
      num: "01",
      title: "Upload Resume",
      desc: "Drag & drop your resume in PDF, DOC, or DOCX formats.",
    },
    {
      num: "02",
      title: "Run Analysis",
      desc: "Compare it with job descriptions or test it against ATS parsers.",
    },
    {
      num: "03",
      title: "Optimize with AI",
      desc: "Chat with the coach or let the editor rewrite bullet points instantly.",
    },
    {
      num: "04",
      title: "Land the Role",
      desc: "Download your polished resume & customized roadmap to apply.",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      {/* Background Blobs */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/10 w-72 md:w-96 h-72 md:h-96 rounded-full bg-purple-600 opacity-15 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/10 w-72 md:w-96 h-72 md:h-96 rounded-full bg-cyan-500 opacity-15 blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 flex flex-col items-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-sm font-medium text-purple-300 mb-8"
        >
          <span className="flex h-2 w-2 rounded-full bg-purple-400 animate-ping" />
          Powered by Gemini 2.5 Flash & RAG
        </motion.div>

        {/* Hero Content */}
        <div className="text-center max-w-4xl">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none"
          >
            Your Ultimate AI
            <span className="block mt-2 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Career Copilot
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-8 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed"
          >
            Analyze resumes, simulate interviews, optimize keywords for ATS systems, and generate professional career roadmaps instantly.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={onGetStarted}
              className="group flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-purple-900/20 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {token ? "Go to Dashboard" : "Get Started"}
              <FaArrowRight className="group-hover:translate-x-1.5 transition-transform" />
            </button>
            <a
              href="#features"
              className="flex items-center justify-center border border-slate-800 bg-slate-900/40 hover:bg-slate-900 text-slate-300 hover:text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300"
            >
              Learn More
            </a>
          </motion.div>
        </div>

        {/* Feature Grid */}
        <div id="features" className="mt-36 w-full pt-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold">Advanced Platform Features</h2>
            <p className="text-slate-400 mt-4 max-w-xl mx-auto text-base">
              Everything you need to bypass recruiter gatekeepers and level up your career trajectory.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 w-full">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -6, borderColor: 'rgba(168, 85, 247, 0.4)' }}
                className="bg-slate-900/40 backdrop-blur-md rounded-3xl p-8 border border-slate-800/80 transition-all duration-300 flex gap-6"
              >
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/60 h-fit">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed text-sm">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-36 w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold">How It Works</h2>
            <p className="text-slate-400 mt-4 max-w-xl mx-auto">
              Follow these simple steps to optimize your profile and job hunt flow.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, idx) => (
              <div key={idx} className="relative bg-slate-900/20 rounded-3xl p-6 border border-slate-900 hover:border-slate-800 transition duration-300">
                <div className="text-4xl font-black text-slate-800 mb-4">{step.num}</div>
                <h4 className="text-xl font-bold mb-2">{step.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-36 w-full text-center bg-gradient-to-br from-purple-950/30 to-cyan-950/20 rounded-3xl p-12 border border-slate-800/80 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500 opacity-5 blur-[100px] rounded-full" />
          <h2 className="text-3xl md:text-5xl font-black">Ready to unlock your career potential?</h2>
          <p className="text-slate-400 mt-4 max-w-xl mx-auto">
            Take 2 minutes to upload your resume and get immediate insights to stay ahead in the job market.
          </p>
          <button
            onClick={onGetStarted}
            className="mt-8 bg-white hover:bg-slate-100 text-slate-950 px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-white/5 transition duration-300 inline-flex items-center gap-3 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {token ? "Go to Dashboard" : "Optimize Your Resume Now"}
            <FaArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Landing;
