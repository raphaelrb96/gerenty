
export default function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-full bg-muted/40">
        {children}
    </div>
  );
}
