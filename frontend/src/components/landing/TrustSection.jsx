import { Shield, Award, CreditCard, HeadphonesIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const trustItems = [
  {
    icon: Shield,
    title: "DBS Verified Tutors",
    description: "All tutors undergo background checks for your peace of mind",
  },
  {
    icon: Award,
    title: "Certified Professionals",
    description: "Verified qualifications and teaching credentials",
  },
  {
    icon: CreditCard,
    title: "Secure Payment",
    description: "Safe and secure payment processing with escrow protection",
  },
  {
    icon: HeadphonesIcon,
    title: "Dedicated Parent Support",
    description: "24/7 support team ready to help with any questions",
  },
]

export default function TrustSection() {
  return (
    <section className="container px-4 py-16 bg-muted/50">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why Parents and Students Trust Us
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustItems.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.title} className="text-center">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
