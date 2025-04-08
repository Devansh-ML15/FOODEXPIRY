import { HelpCircle } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import { useTutorial } from "@/lib/tutorial-context";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HelpButtonProps extends ButtonProps {
  className?: string;
}

export function HelpButton({ className, ...props }: HelpButtonProps) {
  const { setShowTutorial } = useTutorial();
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full transition-all duration-300 text-gray-500 hover:text-primary hover:bg-primary/10 ${className}`}
            onClick={() => setShowTutorial(true)}
            {...props}
          >
            <HelpCircle className="h-5 w-5 icon-animated" />
            <span className="sr-only">Help</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>App Tutorial</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}