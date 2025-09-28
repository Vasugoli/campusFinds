import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/use-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { AuthContext } from '../context/AuthContext';

const ReportItemPage: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isLost, setIsLost] = useState(true);
  const [image, setImage] = useState<File | null>(null);
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ title: 'Please log in to report an item', variant: 'destructive' });
      navigate('/login');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('isLost', String(isLost));
    if (image) {
      formData.append('image', image);
    }

    try {
      const response = await fetch('/api/v1/items', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (response.ok) {
        toast({ title: 'Item reported successfully!' });
        navigate('/lost-found');
      } else {
        const errorData = await response.json();
        toast({ title: 'Failed to report item', description: errorData.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'An error occurred', description: 'Please try again later.', variant: 'destructive' });
    }
  };

  return (
    <div className="flex justify-center items-center h-full">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Report an Item</CardTitle>
          <CardDescription>Fill in the details of the item you lost or found.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name</Label>
              <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" type="text" value={category} onChange={(e) => setCategory(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select onValueChange={(value) => setIsLost(value === 'lost')} defaultValue={isLost ? 'lost' : 'found'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="found">Found</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Image</Label>
              <Input id="image" type="file" onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)} />
            </div>
            <Button type="submit" className="w-full">Submit Report</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportItemPage;
