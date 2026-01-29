import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"
import { isAuthenticated } from "@/lib/auth"
import { getCurrentRole } from "@/services/authService"

export default function Header() {
  const authenticated = isAuthenticated();
  const role = getCurrentRole();
  const normalizedRole = typeof role === 'string' ? role.toLowerCase() : null;
  const isTutor = normalizedRole === 'tutor';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Brand */}
        <Link to="/" className="flex flex-col">
          <h1 className="text-xl font-bold text-primary">Best Choice Tutors</h1>
          <p className="text-xs text-muted-foreground">
            Expert Tutors. Real Results. Real Futures.
          </p>
        </Link>

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
          <Link
            to="/tutors"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Find Tutors
          </Link>
          {authenticated && (
            <Link
              to="/profile"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              My Profile
            </Link>
          )}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {!authenticated ? (
            <>
              <Link to="/register">
                <Button variant="ghost" size="sm">
                  Sign Up
                </Button>
              </Link>
              <Link to="/tutor/create">
                <Button variant="default" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  Become a Tutor
                </Button>
              </Link>
            </>
          ) : (
            !isTutor ? (
              <Link to="/tutor/create">
                <Button variant="default" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  Become a Tutor
                </Button>
              </Link>
            ) : null
          )}
        </div>
      </div>
    </header>
  )
}
