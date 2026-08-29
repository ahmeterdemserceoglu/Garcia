export default function PlaceholderPage() {
  return (
    <div className="p-8 h-full flex flex-col items-center justify-center text-center">
      <div className="bg-muted w-24 h-24 rounded-full flex items-center justify-center mb-6">
        <span className="text-4xl">🚧</span>
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Under Construction</h1>
      <p className="text-muted-foreground max-w-md">
        This page is currently being built. Check back later for updates.
      </p>
    </div>
  )
}
