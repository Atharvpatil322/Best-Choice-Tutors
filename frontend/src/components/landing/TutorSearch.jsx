import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel, FieldControl } from "@/components/ui/field"
import { isAuthenticated } from "@/lib/auth"
import TutorCard from "./TutorCard"

// TODO (Phase 3): Replace mock tutor data with API-backed data
const mockTutors = [
  {
    id: 1,
    name: "Sarah Johnson",
    subject: "Mathematics",
    rating: 4.9,
    reviews: 127,
    bio: "Experienced maths tutor with 10+ years teaching GCSE and A-Level. Specializes in algebra and calculus.",
    levels: ["GCSE", "A-Level"],
    location: "London",
    online: true,
    qualifications: "MSc Mathematics, PGCE",
    price: 35,
    verified: true,
  },
  {
    id: 2,
    name: "Michael Chen",
    subject: "Physics",
    rating: 4.8,
    reviews: 89,
    bio: "Physics tutor with expertise in mechanics and thermodynamics. Former university lecturer.",
    levels: ["A-Level", "University"],
    location: "Manchester",
    online: true,
    qualifications: "PhD Physics",
    price: 45,
    verified: true,
  },
  {
    id: 3,
    name: "Emma Williams",
    subject: "English Literature",
    rating: 4.7,
    reviews: 156,
    bio: "Passionate English tutor helping students excel in essay writing and literary analysis.",
    levels: ["GCSE", "A-Level", "11+"],
    location: "Birmingham",
    online: false,
    qualifications: "BA English, MA Literature",
    price: 30,
    verified: true,
  },
  {
    id: 4,
    name: "David Patel",
    subject: "Chemistry",
    rating: 4.9,
    reviews: 98,
    bio: "Chemistry specialist with hands-on laboratory work. Makes complex concepts easy to understand.",
    levels: ["GCSE", "A-Level"],
    location: "Leeds",
    online: true,
    qualifications: "BSc Chemistry, PGCE",
    price: 38,
    verified: true,
  },
  {
    id: 5,
    name: "Lisa Thompson",
    subject: "Biology",
    rating: 4.6,
    reviews: 112,
    bio: "Biology tutor with medical background. Expert in human biology and genetics.",
    levels: ["GCSE", "A-Level"],
    location: "Bristol",
    online: true,
    qualifications: "BSc Biology, Medical Sciences",
    price: 32,
    verified: true,
  },
  {
    id: 6,
    name: "James Wilson",
    subject: "Computer Science",
    rating: 4.8,
    reviews: 74,
    bio: "Software engineer turned tutor. Teaches programming, algorithms, and computer science fundamentals.",
    levels: ["A-Level", "University"],
    location: "Edinburgh",
    online: true,
    qualifications: "BSc Computer Science, Industry Experience",
    price: 40,
    verified: true,
  },
]

export default function TutorSearch() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({
    subject: "",
    price: "",
    level: "",
    location: "",
    gender: "",
  })
  const [showMessage, setShowMessage] = useState(false)

  const handleFilterChange = (filterName, value) => {
    // Convert "all" or "any" back to empty string for filtering logic
    const filterValue = (value === "all" || value === "any") ? "" : value;
    setFilters((prev) => ({
      ...prev,
      [filterName]: filterValue,
    }))
  }

  const handleBookClick = () => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      // Redirect to landing page if not authenticated (login is now protected)
      navigate('/', { replace: true })
      return
    }

    // TODO: CLARIFICATION REQUIRED - What should happen when authenticated user clicks book?
    // Phase 2: No booking logic yet, just show message for now
    setShowMessage(true)
    setTimeout(() => setShowMessage(false), 3000)
  }

  return (
    <section className="container px-4 py-16">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-4">Find Your Perfect Tutor</h2>
        <p className="text-muted-foreground">
          Browse our verified tutors and find the right match for your learning needs.
        </p>
      </div>

      {/* Search Filters */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Field>
              <FieldLabel>Subject</FieldLabel>
              <FieldControl>
                <Select
                  value={filters.subject ? filters.subject : "all"}
                  onValueChange={(value) => handleFilterChange("subject", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    <SelectItem value="mathematics">Mathematics</SelectItem>
                    <SelectItem value="physics">Physics</SelectItem>
                    <SelectItem value="chemistry">Chemistry</SelectItem>
                    <SelectItem value="biology">Biology</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="computerscience">Computer Science</SelectItem>
                  </SelectContent>
                </Select>
              </FieldControl>
            </Field>
            <Field>
              <FieldLabel>Price</FieldLabel>
              <FieldControl>
                <Select
                  value={filters.price ? filters.price : "any"}
                  onValueChange={(value) => handleFilterChange("price", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any Price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Price</SelectItem>
                    <SelectItem value="0-30">£0 - £30</SelectItem>
                    <SelectItem value="30-40">£30 - £40</SelectItem>
                    <SelectItem value="40-50">£40 - £50</SelectItem>
                    <SelectItem value="50+">£50+</SelectItem>
                  </SelectContent>
                </Select>
              </FieldControl>
            </Field>
            <Field>
              <FieldLabel>Level</FieldLabel>
              <FieldControl>
                <Select
                  value={filters.level ? filters.level : "all"}
                  onValueChange={(value) => handleFilterChange("level", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="11+">11+</SelectItem>
                    <SelectItem value="gcse">GCSE</SelectItem>
                    <SelectItem value="alevel">A-Level</SelectItem>
                    <SelectItem value="university">University</SelectItem>
                  </SelectContent>
                </Select>
              </FieldControl>
            </Field>
            <Field>
              <FieldLabel>Location / Online</FieldLabel>
              <FieldControl>
                <Select
                  value={filters.location ? filters.location : "all"}
                  onValueChange={(value) => handleFilterChange("location", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="online">Online Only</SelectItem>
                    <SelectItem value="london">London</SelectItem>
                    <SelectItem value="manchester">Manchester</SelectItem>
                    <SelectItem value="birmingham">Birmingham</SelectItem>
                    <SelectItem value="leeds">Leeds</SelectItem>
                  </SelectContent>
                </Select>
              </FieldControl>
            </Field>
            <Field>
              <FieldLabel>Gender</FieldLabel>
              <FieldControl>
                <Select
                  value={filters.gender ? filters.gender : "any"}
                  onValueChange={(value) => handleFilterChange("gender", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </FieldControl>
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Message Alert */}
      {showMessage && (
        <div className="mb-6 rounded-lg border bg-primary/10 p-4 text-center text-primary">
          Please sign up or log in to book a tutor.
        </div>
      )}

      {/* Tutor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockTutors.map((tutor) => (
          <TutorCard key={tutor.id} tutor={tutor} onBookClick={handleBookClick} />
        ))}
      </div>
    </section>
  )
}
