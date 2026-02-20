export default function HeroImageSection() {
  return (
    <section className="container px-4 py-16">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-lg bg-muted">
        {/* Placeholder for hero image */}
        <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
          <div className="text-center">
            <p className="text-lg font-medium text-muted-foreground">
              Parent and child studying together using a laptop
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              [Placeholder Image - Reinforces trust, learning, and parental involvement]
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
