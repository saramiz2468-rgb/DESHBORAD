/** Persistent, honest label for the stage-1 skeleton. */
export function PreviewBanner({ text }: { text: string }) {
  return (
    <div
      role="status"
      className="border-b border-gold-soft bg-gold-soft/35 px-4 py-2 text-center text-[0.8rem] leading-snug text-ink-soft"
    >
      {text}
    </div>
  );
}
