import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, MapPin, GraduationCap } from "lucide-react"

export default function TutorCard({ tutor, onBookClick }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{tutor.name}</h3>
            <p className="text-sm text-muted-foreground">{tutor.subject}</p>
          </div>
          {tutor.verified && (
            <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              Verified
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{tutor.rating}</span>
            <span className="text-xs">({tutor.reviews} reviews)</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {tutor.bio}
        </p>
        <div className="flex flex-wrap gap-2">
          {tutor.levels.map((level) => (
            <span
              key={level}
              className="rounded-md bg-secondary px-2 py-1 text-xs"
            >
              {level}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{tutor.location}</span>
          </div>
          {tutor.online && (
            <span className="text-primary">Online Available</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-sm">
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{tutor.qualifications}</span>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t pt-4">
        <div>
          <span className="text-2xl font-bold">£{tutor.price}</span>
          <span className="text-sm text-muted-foreground">/hour</span>
        </div>
        <Button onClick={onBookClick}>Book Tutor</Button>
      </CardFooter>
    </Card>
  )
}
