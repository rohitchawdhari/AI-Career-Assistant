function ResumePreview({ pdfUrl }) {

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
      <div className="flex items-center justify-between mb-5">

        <h2 className="text-3xl font-bold">
          📄 Resume Preview
        </h2>

        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="
            bg-gradient-to-r
            from-purple-600
            to-cyan-500
            px-4
            py-2
            rounded-xl
            text-sm
            font-semibold
            "
          >
            Open PDF
          </a>
        )}

      </div>

      {!pdfUrl ? (

        <div
          className="
          h-[500px]
          rounded-2xl
          border-2
          border-dashed
          border-slate-700
          flex
          flex-col
          items-center
          justify-center
          "
        >

          <div className="text-7xl mb-4">
            📑
          </div>

          <h3 className="text-xl font-semibold">
            No Resume Uploaded
          </h3>

          <p className="text-slate-400 mt-2 text-center">
            Upload a PDF resume to preview it here.
          </p>

        </div>

      ) : (

        <iframe
          src={pdfUrl}
          title="Resume Preview"
          className="
          w-full
          h-[700px]
          rounded-2xl
          border
          border-slate-700
          bg-white
          "
        />

      )}

    </div>
  );
}

export default ResumePreview;