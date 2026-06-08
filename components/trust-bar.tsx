const stats = [
  { value: "Global", label: "Marketplace Reach" },
  { value: "50+", label: "Countries Supported" },
  { value: "24/7", label: "On-Chain Settlement" },
  { value: "100%", label: "Escrow Protection" },
]

export function TrustBar() {
  return (
    <section className="border-y border-border/40 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-4xl font-bold tracking-tight bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
