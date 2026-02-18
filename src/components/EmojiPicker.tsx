'use client'

const EMOJIS = ['😊', '😂', '😍', '🤔', '😭', '✨', '👍', '🙏', '📸', '🍱', '🌸', '🏠'];

export default function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  return (
    <div className="absolute bottom-12 right-0 bg-white border rounded-xl shadow-xl p-3 grid grid-cols-4 gap-2 z-50">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className="text-2xl hover:bg-slate-100 p-1 rounded-lg transition-colors"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}