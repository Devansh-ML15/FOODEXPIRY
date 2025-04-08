import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Server, Calendar, BarChart3, Search, MessageSquare, Users, Settings, CheckCircle, List } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { GlassLogoBackground } from "@/components/ui/glass-logo-background";
import logoImage from "@/assets/logo.png";

type TutorialStep = {
  title: string;
  description: string;
  icon: React.ReactNode;
  image?: string;
};

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to FoodExpiry",
    description: "Your smart food inventory management system designed to help you reduce food waste through intelligent tracking, recipe recommendations, and interactive community features.",
    icon: <Server className="h-8 w-8 text-primary" />,
  },
  {
    title: "Dashboard",
    description: "Your central hub for monitoring your food inventory status. View at-a-glance statistics, items expiring soon, and insightful data visualizations about your inventory.",
    icon: <List className="h-8 w-8 text-primary" />,
  },
  {
    title: "Inventory Management",
    description: "Add, edit, and remove food items from your inventory. Set expiration dates, quantities, and categories to keep track of what you have on hand.",
    icon: <CheckCircle className="h-8 w-8 text-primary" />,
  },
  {
    title: "Meal Planning",
    description: "Plan your meals for the week based on what's in your inventory. Get AI-powered recipe suggestions that prioritize ingredients that are about to expire.",
    icon: <Calendar className="h-8 w-8 text-primary" />,
  },
  {
    title: "Food Insights",
    description: "Gain valuable insights into your food consumption and waste patterns. Visualize trends and identify opportunities to reduce waste.",
    icon: <BarChart3 className="h-8 w-8 text-primary" />,
  },
  {
    title: "Recipe Suggestions",
    description: "Get personalized recipe suggestions based on what's in your inventory. Prioritize recipes that use ingredients that are about to expire.",
    icon: <Search className="h-8 w-8 text-primary" />,
  },
  {
    title: "Community Features",
    description: "Connect with other users, share recipes, and exchange food waste reduction tips. Learn from others and contribute your own knowledge.",
    icon: <Users className="h-8 w-8 text-primary" />,
  },
  {
    title: "Live Chat",
    description: "Engage in real-time discussions with the community. Ask questions, share ideas, and connect with like-minded individuals.",
    icon: <MessageSquare className="h-8 w-8 text-primary" />,
  },
  {
    title: "Settings & Notifications",
    description: "Customize your experience. Set notification preferences for expiring food, personalize your theme, and manage your account settings.",
    icon: <Settings className="h-8 w-8 text-primary" />,
  },
];

interface AppTutorialProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  firstTime?: boolean;
}

export function AppTutorial({ open, onOpenChange, firstTime = false }: AppTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const { user } = useAuth();
  
  const totalSteps = tutorialSteps.length;
  
  // Reset to first step when opened
  useEffect(() => {
    if (open) {
      setCurrentStep(0);
    }
  }, [open]);
  
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleComplete = () => {
    if (dontShowAgain && firstTime) {
      // Here you would typically save the user preference
      localStorage.setItem('foodExpiry_skipTutorial', 'true');
    }
    onOpenChange(false);
  };
  
  const handleSkip = () => {
    if (dontShowAgain && firstTime) {
      localStorage.setItem('foodExpiry_skipTutorial', 'true');
    }
    onOpenChange(false);
  };
  
  const step = tutorialSteps[currentStep];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-gradient-to-br from-white to-gray-50 shadow-xl">
        <DialogHeader className="bg-gradient-to-r from-green-600 to-teal-500 p-6 text-white">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold flex items-center">
              {step.icon}
              <span className="ml-3">{step.title}</span>
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleSkip} className="text-white hover:bg-white/20">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>
        
        <div className="p-6">
          <div className="mb-8">
            <div className="flex items-center justify-center mb-6">
              <GlassLogoBackground className="rounded-full p-6">
                <div className="h-16 w-16 flex items-center justify-center">
                  {currentStep === 0 ? (
                    <img src={logoImage} alt="FoodExpiry Logo" className="h-16 w-16 drop-shadow-md" />
                  ) : (
                    step.icon
                  )}
                </div>
              </GlassLogoBackground>
            </div>
            <p className="text-gray-700 text-center">
              {step.description}
            </p>
          </div>
          
          {/* Progress indicators */}
          <div className="flex justify-center space-x-1 mb-6">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? "w-4 bg-primary" 
                    : index < currentStep 
                    ? "w-3 bg-primary/60" 
                    : "w-3 bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
        
        <DialogFooter className="bg-gray-50 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              {firstTime && (
                <div className="flex items-center">
                  <Checkbox
                    id="dont-show-again"
                    checked={dontShowAgain}
                    onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
                    className="mr-2"
                  />
                  <label
                    htmlFor="dont-show-again"
                    className="text-sm text-gray-600 cursor-pointer"
                  >
                    Don't show this again
                  </label>
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              {currentStep < totalSteps - 1 ? (
                <Button 
                  onClick={handleNext} 
                  className="flex items-center"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleComplete}>
                  Finish
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}