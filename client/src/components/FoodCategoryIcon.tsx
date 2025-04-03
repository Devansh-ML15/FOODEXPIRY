import {
  Apple, 
  EggFried, 
  Beef, 
  Cookie, 
  ShoppingBag, 
  Snowflake, 
  Package
} from "lucide-react";

type FoodCategoryIconProps = {
  category: string;
  className?: string;
  size?: number;
};

export default function FoodCategoryIcon({ 
  category, 
  className = "h-5 w-5", 
  size = 20 
}: FoodCategoryIconProps) {
  switch (category) {
    case "produce":
      return <Apple className={className} size={size} />;
    case "dairy":
      return <EggFried className={className} size={size} />;
    case "meat":
      return <Beef className={className} size={size} />;
    case "bakery":
      return <Cookie className={className} size={size} />;
    case "pantry":
      return <ShoppingBag className={className} size={size} />;
    case "frozen":
      return <Snowflake className={className} size={size} />;
    case "other":
    default:
      return <Package className={className} size={size} />;
  }
}
