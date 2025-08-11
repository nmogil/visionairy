export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* TODO: Add navigation header for marketing pages */}
      <main>{children}</main>
      {/* TODO: Add footer for marketing pages */}
    </div>
  );
}