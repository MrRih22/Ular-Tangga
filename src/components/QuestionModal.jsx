const STYLE = {
  truth: {
    badge: '🤔 TRUTH',
    sub: 'Jawab jujur, jangan ngeles!',
    card: 'from-cyan-500/30 to-blue-600/30 border-cyan-300/40',
    pill: 'bg-cyan-500/40 border-cyan-200/50',
    btn: 'from-cyan-500 to-blue-500',
  },
  dare: {
    badge: '🔥 DARE',
    sub: 'Lakukan, jangan kabur!',
    card: 'from-pink-500/30 to-orange-500/30 border-pink-300/40',
    pill: 'bg-pink-500/40 border-pink-200/50',
    btn: 'from-pink-500 to-orange-500',
  },
};

export default function QuestionModal({ open, question, who, onDone }) {
  if (!open || !question) return null;
  const s = STYLE[question.kind] || STYLE.truth;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-5 bg-black/50 backdrop-blur-sm">
      <div
        className={`w-full max-w-md max-h-[88dvh] overflow-y-auto rounded-3xl p-5 sm:p-6 text-white
                    bg-gradient-to-br ${s.card} backdrop-blur-xl border
                    shadow-[0_8px_40px_rgba(0,0,0,0.5)] animate-card-pop`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-sm font-bold tracking-widest px-3 py-1 rounded-full border ${s.pill}`}>
            {s.badge}
          </span>
          {who && <span className="text-xs text-white/70">Giliran: <b>{who}</b></span>}
        </div>

        <h2 className="mt-5 text-xl sm:text-2xl font-semibold leading-snug">{question.question}</h2>

        <p className="mt-3 text-sm text-white/70">{s.sub}</p>

        <button
          onClick={onDone}
          className={`mt-6 w-full py-3 rounded-2xl font-semibold bg-gradient-to-r ${s.btn}
                      active:scale-95 transition shadow-lg`}
        >
          Selesai, lanjut! 🎉
        </button>
      </div>
    </div>
  );
}