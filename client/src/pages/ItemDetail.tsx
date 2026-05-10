import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Calendar, Tag, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ItemDetail = () => {
  const { id } = useParams();
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);

  // Mock item data
  const item = {
    id: id,
    title: "Blue Backpack",
    category: "bags",
    location: "Library 2nd Floor near entrance",
    date: "March 15, 2024",
    status: "found" as const,
    description: "A navy blue backpack with leather straps and a small front pocket. Contains a laptop compartment. Brand: North Face. Has a small keychain attached.",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
    reporter: "John Doe",
    contactInfo: "Submitted by campus security",
  };

  const handleClaim = () => {
    toast.success("Claim request submitted! We'll contact you soon.");
    setClaimDialogOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link to="/browse">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Browse
            </Button>
          </Link>

          <div className="grid md:grid-cols-2 gap-8 animate-fade-up">
            {/* Image */}
            <div className="space-y-4">
              <div className="aspect-square rounded-xl overflow-hidden bg-muted">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No Image Available
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-6">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h1 className="text-4xl font-bold">{item.title}</h1>
              <Badge variant={item.status === "found" ? "default" : "destructive"} className="text-lg px-3 py-1">
                {item.status === "found" ? "Found" : "Lost"}
                  </Badge>
                </div>
                <p className="text-lg text-muted-foreground capitalize">{item.category}</p>
              </div>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-muted-foreground">{item.location}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Date</p>
                      <p className="text-muted-foreground">{item.date}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Tag className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Category</p>
                      <p className="text-muted-foreground capitalize">{item.category}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div>
                <h2 className="text-xl font-semibold mb-3">Description</h2>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">Contact Information</h2>
                <p className="text-muted-foreground">{item.contactInfo}</p>
              </div>

              <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full transition-all hover:scale-[1.02]">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Claim This Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="animate-scale-in">
                  <DialogHeader>
                    <DialogTitle>Claim Item</DialogTitle>
                    <DialogDescription>
                      To claim this item, you'll need to verify your identity and provide proof of ownership.
                      We'll contact you at your registered email address with further instructions.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setClaimDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleClaim}>
                      Submit Claim Request
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ItemDetail;
