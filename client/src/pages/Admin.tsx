import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, CheckCircle, XCircle, Users, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Admin = () => {
  // Mock stats data
  const stats = [
    { title: "Total Items", value: "245", icon: Package, change: "+12%", color: "text-primary" },
    { title: "Found Items", value: "156", icon: CheckCircle, change: "+8%", color: "text-secondary" },
    { title: "Lost Items", value: "89", icon: XCircle, change: "+5%", color: "text-destructive" },
    { title: "Active Users", value: "1,234", icon: Users, change: "+23%", color: "text-accent-foreground" },
  ];

  // Mock items data
  const items = [
    { id: "1", title: "Blue Backpack", status: "found", location: "Library", date: "2024-03-15", reporter: "John Doe" },
    { id: "2", title: "iPhone 13 Pro", status: "lost", location: "Student Center", date: "2024-03-14", reporter: "Jane Smith" },
    { id: "3", title: "Keys with Red Keychain", status: "found", location: "Engineering", date: "2024-03-13", reporter: "Bob Johnson" },
    { id: "4", title: "MacBook Pro", status: "lost", location: "Library", date: "2024-03-12", reporter: "Alice Brown" },
  ];

  // Mock claims data
  const claims = [
    { id: "1", item: "Blue Backpack", claimant: "Sarah Wilson", status: "pending", date: "2024-03-15" },
    { id: "2", item: "Keys with Red Keychain", claimant: "Mike Davis", status: "approved", date: "2024-03-14" },
    { id: "3", item: "Calculus Textbook", claimant: "Emma Taylor", status: "rejected", date: "2024-03-13" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mb-8 animate-fade-up">
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage lost and found items and claims</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <Card key={index} className="animate-bounce-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold mt-2">{stat.value}</p>
                      <p className="text-sm text-secondary mt-1 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {stat.change} from last month
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="items" className="animate-fade-up">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="items">Items</TabsTrigger>
              <TabsTrigger value="claims">Claims</TabsTrigger>
            </TabsList>

            <TabsContent value="items" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>All Items</CardTitle>
                  <CardDescription>Manage reported lost and found items</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Reporter</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell>
                            <Badge variant={item.status === "found" ? "default" : "destructive"}>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.location}</TableCell>
                          <TableCell>{item.date}</TableCell>
                          <TableCell>{item.reporter}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">View</Button>
                              <Button size="sm" variant="outline">Edit</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="claims" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Item Claims</CardTitle>
                  <CardDescription>Review and manage claim requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Claimant</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {claims.map((claim) => (
                        <TableRow key={claim.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">{claim.item}</TableCell>
                          <TableCell>{claim.claimant}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                claim.status === "approved"
                                  ? "default"
                                  : claim.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {claim.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{claim.date}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {claim.status === "pending" && (
                                <>
                                  <Button size="sm" variant="default">Approve</Button>
                                  <Button size="sm" variant="outline">Reject</Button>
                                </>
                              )}
                              <Button size="sm" variant="outline">View</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Admin;
