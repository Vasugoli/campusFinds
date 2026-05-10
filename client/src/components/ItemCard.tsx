import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar } from "lucide-react";

interface ItemCardProps {
  id: string;
  title: string;
  category: string;
  location: string;
  date: string;
  status: "lost" | "found";
  image?: string;
}

const ItemCard = ({ id, title, category, location, date, status, image }: ItemCardProps) => {
  return (
    <Link to={`/item/${id}`}>
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-primary/50">
        <div className="aspect-video overflow-hidden bg-muted">
          {image ? (
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg line-clamp-1">{title}</h3>
            <Badge variant={status === "lost" ? "destructive" : "default"}>
              {status === "lost" ? "Lost" : "Found"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3 capitalize">{category}</p>
          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="line-clamp-1">{location}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{date}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ItemCard;
