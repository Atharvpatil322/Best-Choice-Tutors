import { Button } from "@/components/ui/button"
import { User } from "lucide-react"

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Brand */}
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-primary">Best Choice Tutors</h1>
          <p className="text-xs text-muted-foreground">
            Expert Tutors. Real Results. Real Futures.
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <a
            href="#how-it-works"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            How it works
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm">
            Sign Up
          </Button>
          <Button variant="default" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            Become a Tutor
          </Button>
        </div>
      </div>
    </header>
  )
}
