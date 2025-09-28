import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Link } from 'react-router-dom';

// Replace with your actual Item type
interface Item {
  _id: string;
  name: string;
  description: string;
  isLost: boolean;
  imageUrl: string;
}

const ProfilePage: React.FC = () => {
  const [reportedItems, setReportedItems] = useState<Item[]>([]);
  const { user, token } = useContext(AuthContext);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReportedItems = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/v1/users/${user._id}/items`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setReportedItems(data.items);
        } else {
          toast({ title: 'Failed to fetch reported items', variant: 'destructive' });
        }
      } catch (error) {
        toast({ title: 'An error occurred', description: 'Please try again later.', variant: 'destructive' });
      }
    };

    fetchReportedItems();
  }, [user, token, toast]);

  if (!user) {
    return <p>Please log in to view your profile.</p>;
  }

  return (
    <div>
      <div className="flex items-center space-x-4 mb-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={user.avatarUrl} alt={user.displayName} />
          <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{user.displayName}</h1>
          <p className="text-gray-500">{user.email}</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Your Reported Items</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportedItems.map(item => (
          <Card key={item._id}>
            <CardHeader>
              <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover rounded-t-lg" />
            </CardHeader>
            <CardContent>
              <CardTitle>{item.name}</CardTitle>
              <p className="text-sm text-gray-500">{item.isLost ? 'Lost' : 'Found'}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button asChild variant="secondary">
                <Link to={`/item/${item._id}`}>View</Link>
              </Button>
              {/* Add edit/delete functionality here */}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProfilePage;
