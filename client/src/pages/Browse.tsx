import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ItemCard from "@/components/ItemCard";

const Browse = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  // Mock items data
  const items = [
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
    {
      id: "5",
      title: "MacBook Pro 14-inch",
      category: "electronics",
      location: "Library Study Room 3",
      date: "2 days ago",
      status: "lost" as const,
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400",
    },
    {
      id: "6",
      title: "Calculus Textbook",
      category: "books",
      location: "Math Building Room 201",
      date: "3 days ago",
      status: "found" as const,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        {/* Search Header */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-2">Browse Items</h1>
            <p className="text-muted-foreground mb-8">Search through all reported lost and found items</p>
            
            {/* Search Bar */}
            <div className="max-w-4xl space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-lg transition-all focus:scale-[1.01]"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 animate-slide-in-left">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="sm:w-[200px]">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="bags">Bags & Backpacks</SelectItem>
                    <SelectItem value="keys">Keys</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="books">Books & Documents</SelectItem>
                    <SelectItem value="personal">Personal Items</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="sm:w-[200px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="lost">Lost Only</SelectItem>
                    <SelectItem value="found">Found Only</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline">Clear Filters</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Items Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">{items.length} items found</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <ItemCard {...item} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Browse;
