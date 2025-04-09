import { useLocation } from "wouter";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MobileNavBar() {
  const [, setLocation] = useLocation();

  return (
    <div className="fixed bottom-4 left-0 right-0 flex justify-center z-50 pointer-events-none">
      <Button
        onClick={() => setLocation('/add-food-item')}
        size="lg"
        className="rounded-full w-16 h-16 flex items-center justify-center shadow-xl bg-primary hover:bg-primary/90 text-white pointer-events-auto transition-transform duration-300 hover:scale-105 active:scale-95"
      >
        <Plus size={30} />
      </Button>
    </div>
  );
}