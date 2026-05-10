import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Package, CheckCircle, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ItemCard from "@/components/ItemCard";

const Home = () => {
  // Mock recent items data
  const recentItems = [
    {
      id: "1",
      title: "Blue Backpack",
      category: "bags",
      location: "Library 2nd Floor",
      date: "2 hours ago",
      status: "found" as const,
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
    },
    {
      id: "2",
      title: "iPhone 13 Pro",
      category: "electronics",
      location: "Student Center",
      date: "5 hours ago",
      status: "lost" as const,
      image: "https://images.unsplash.com/photo-1592286927505-fce6be1dd812?w=400",
    },
    {
      id: "3",
      title: "Keys with Red Keychain",
      category: "keys",
      location: "Engineering Building",
      date: "1 day ago",
      status: "found" as const,
    },
    {
      id: "4",
      title: "Black Water Bottle",
      category: "personal items",
      location: "Sports Complex",
      date: "1 day ago",
      status: "lost" as const,
      image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-secondary/5" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center space-y-8 animate-fade-up">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Lost Something?
              <br />
              <span className="text-primary">We'll Help You Find It</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              CampusFinds is your go-to platform for reporting and recovering lost items on campus.
              Join our community and reunite with your belongings.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/report-lost">
                <Button size="lg" className="w-full sm:w-auto transition-all hover:scale-105">
                  <Package className="mr-2 h-5 w-5" />
                  Report Lost Item
                </Button>
              </Link>
              <Link to="/report-found">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto transition-all hover:scale-105">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Report Found Item
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">Simple steps to reunite with your items</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center space-y-4 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Search & Browse</h3>
              <p className="text-muted-foreground">
                Browse through reported items or use our search to find specific belongings
              </p>
            </div>
            <div className="text-center space-y-4 animate-fade-up" style={{ animationDelay: "0.2s" }}>
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto">
                <Package className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold">Report Items</h3>
              <p className="text-muted-foreground">
                Found or lost something? Report it in seconds with our easy form
              </p>
            </div>
            <div className="text-center space-y-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Get Reunited</h3>
              <p className="text-muted-foreground">
                Connect with finders or owners and recover your lost items quickly
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Items Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Recent Items</h2>
              <p className="text-muted-foreground">Latest lost and found reports from your campus</p>
            </div>
            <Link to="/browse">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentItems.map((item, index) => (
              <div
                key={item.id}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ItemCard {...item} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of students using CampusFinds to recover their lost items
          </p>
          <Link to="/signup">
            <Button size="lg" className="transition-all hover:scale-105">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
