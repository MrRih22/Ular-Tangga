export default function QuestionModal({ open, question, onDone }) {
  if (!open || !question) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-5 bg-black/40 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-3xl p-6 text-white
                   bg-white/10 backdrop-blur-xl border border-white/20
                   shadow-[0_8px_40px_rgba(0,0,0,0.45)]"
      >
        <span className="inline-block text-[11px] uppercase tracking-widest px-3 py-1 rounded-full bg-pink-500/30 border border-pink-300/30">
          {question.category}
        </span>

        <h2 className="mt-4 text-2xl font-semibold leading-snug">
          {question.question}
        </h2>

        <p className="mt-3 text-sm text-white/60">
          Diskusikan berdua dengan jujur, lalu lanjutkan permainan 💜
        </p>

        <button
          onClick={onDone}
          className="mt-6 w-full py-3 rounded-2xl font-semibold
                     bg-gradient-to-r from-pink-500 to-purple-500
                     active:scale-95 transition shadow-lg"
        >
          Selesai Berdiskusi
        </button>
      </div>
    </div>
  );
}