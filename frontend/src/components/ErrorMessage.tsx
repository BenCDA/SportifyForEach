interface ErrorMessageProps { message?: string }

export function ErrorMessage({ message }: Readonly<ErrorMessageProps>) {
  if (!message) return null;
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-accent border-l-2 border-accent pl-3 py-0.5">
      {message}
    </p>
  );
}
