import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

// Replace with your actual Item type
interface Item {
  _id: string;
  name: string;
  description: string;
  isLost: boolean;
  imageUrl: string;
  category: string;
}

const LostAndFoundPage: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        // Replace with your actual API call
        const response = await fetch('/api/v1/items');
        if (response.ok) {
          const data = await response.json();
          setItems(data.items);
        } else {
          toast({ title: 'Failed to fetch items', variant: 'destructive' });
        }
      } catch (error) {
        toast({ title: 'An error occurred', description: 'Please try again later.', variant: 'destructive' });
      }
    };

    fetchItems();
  }, [toast]);

  const filteredItems = items
    .filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(item => {
      if (filter === 'all') return true;
      if (filter === 'lost') return item.isLost;
      if (filter === 'found') return !item.isLost;
      return true;
    });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Lost & Found</h1>
        <Button asChild>
          <Link to="/report-item">Report an Item</Link>
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <Input
          type="text"
          placeholder="Search for items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select onValueChange={setFilter} defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
            <SelectItem value="found">Found</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <Card key={item._id}>
            <CardHeader>
              <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover rounded-t-lg" />
            </CardHeader>
            <CardContent>
              <CardTitle>{item.name}</CardTitle>
              <p className="text-sm text-gray-500">{item.isLost ? 'Lost' : 'Found'} - {item.category}</p>
              <p className="mt-2">{item.description}</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link to={`/item/${item._id}`}>View Details</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LostAndFoundPage;
