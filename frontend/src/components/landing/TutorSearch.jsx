import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
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
    bio: "Chemistry specialist with hands-on laboratory experience. Makes complex concepts easy to understand.",
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
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }))
  }

  const handleBookClick = () => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      // Redirect to login if not authenticated
      navigate('/login')
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
            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Select
                value={filters.subject}
                onChange={(e) => handleFilterChange("subject", e.target.value)}
              >
                <option value="">All Subjects</option>
                <option value="mathematics">Mathematics</option>
                <option value="physics">Physics</option>
                <option value="chemistry">Chemistry</option>
                <option value="biology">Biology</option>
                <option value="english">English</option>
                <option value="computerscience">Computer Science</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Price</label>
              <Select
                value={filters.price}
                onChange={(e) => handleFilterChange("price", e.target.value)}
              >
                <option value="">Any Price</option>
                <option value="0-30">£0 - £30</option>
                <option value="30-40">£30 - £40</option>
                <option value="40-50">£40 - £50</option>
                <option value="50+">£50+</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Level</label>
              <Select
                value={filters.level}
                onChange={(e) => handleFilterChange("level", e.target.value)}
              >
                <option value="">All Levels</option>
                <option value="11+">11+</option>
                <option value="gcse">GCSE</option>
                <option value="alevel">A-Level</option>
                <option value="university">University</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Location / Online
              </label>
              <Select
                value={filters.location}
                onChange={(e) => handleFilterChange("location", e.target.value)}
              >
                <option value="">All Locations</option>
                <option value="online">Online Only</option>
                <option value="london">London</option>
                <option value="manchester">Manchester</option>
                <option value="birmingham">Birmingham</option>
                <option value="leeds">Leeds</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Gender</label>
              <Select
                value={filters.gender}
                onChange={(e) => handleFilterChange("gender", e.target.value)}
              >
                <option value="">Any</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </div>
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
