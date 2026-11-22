export default function MessageBubble({ m }: any) {
  const mine = m.mine; // backend should mark message as mine = true

  return (
    <div className={`flex mb-2 ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`p-3 rounded-xl max-w-xs ${
          mine ? "bg-emerald-600 text-white" : "bg-gray-200"
        }`}
      >
        {m.content}
      </div>
    </div>
  );
}
