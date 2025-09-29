import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

const HomePage: React.FC = () => {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">Welcome to CampusFinds</h1>
      <p className="mt-6 text-lg leading-8 text-gray-600">Your one-stop solution for lost and found items on campus.</p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Button asChild>
          <Link to="/lost-found">View Lost & Found</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/report-item">Report an Item</Link>
        </Button>
      </div>
    </div>
  );
};

export default HomePage;
