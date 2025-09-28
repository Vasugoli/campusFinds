import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AuthContext } from '../context/AuthContext';

// Replace with your actual Item and User types
interface Item {
  _id: string;
  name: string;
  description: string;
  isLost: boolean;
  imageUrl: string;
  category: string;
  reportedBy: { _id: string; displayName: string };
}

const ItemDetailsPage: React.FC = () => {
  const [item, setItem] = useState<Item | null>(null);
  const { id } = useParams<{ id: string }>();
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await fetch(`/api/v1/items/${id}`);
        if (response.ok) {
          const data = await response.json();
          setItem(data.item);
        } else {
          toast({ title: 'Failed to fetch item details', variant: 'destructive' });
        }
      } catch (error) {
        toast({ title: 'An error occurred', description: 'Please try again later.', variant: 'destructive' });
      }
    };

    fetchItem();
  }, [id, toast]);

  const handleClaim = async () => {
    if (!user) {
      toast({ title: 'Please log in to claim an item', variant: 'destructive' });
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`/api/v1/items/${id}/claim`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({ title: 'Item claimed successfully!', description: 'The owner has been notified.' });
        // Optionally, update the UI to reflect the claimed status
      } else {
        const errorData = await response.json();
        toast({ title: 'Failed to claim item', description: errorData.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'An error occurred', description: 'Please try again later.', variant: 'destructive' });
    }
  };

  if (!item) {
    return <p>Loading item details...</p>;
  }

  const isOwner = user && user._id === item.reportedBy._id;

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <img src={item.imageUrl} alt={item.name} className="w-full h-96 object-cover rounded-t-lg" />
      </CardHeader>
      <CardContent className="p-6">
        <CardTitle className="text-4xl mb-4">{item.name}</CardTitle>
        <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
          <span>{item.isLost ? 'Lost' : 'Found'}</span>
          <span>Category: {item.category}</span>
          <span>Reported by: {item.reportedBy.displayName}</span>
        </div>
        <p className="text-lg">{item.description}</p>
      </CardContent>
      <CardFooter className="p-6">
        {isOwner ? (
          <p className="text-sm text-gray-500">You reported this item.</p>
        ) : (
          <Button onClick={handleClaim} className="w-full">Claim Item</Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ItemDetailsPage;
