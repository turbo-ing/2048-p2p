export default function ExitButton({
  onClose,
  className,
}: {
  onClose: () => void;
  className?: string;
}) {
  return (
    <button className={className} onClick={onClose}>
      <div className="hover:bg-text hover:text-background aspect-square size-full h-6 rounded-full transition-all m-auto">
        <span>✖</span>
      </div>
    </button>
  );
}
