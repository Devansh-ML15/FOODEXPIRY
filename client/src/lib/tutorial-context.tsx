import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";

interface TutorialContextType {
  showTutorial: boolean;
  setShowTutorial: (show: boolean) => void;
  isTutorialSeen: boolean;
  setTutorialSeen: (seen: boolean) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

interface TutorialProviderProps {
  children: ReactNode;
}

export function TutorialProvider({ children }: TutorialProviderProps) {
  const [showTutorial, setShowTutorial] = useState(false);
  const [isTutorialSeen, setTutorialSeen] = useState(false);
  const { user } = useAuth();
  
  // Check if tutorial has been seen before (from localStorage)
  useEffect(() => {
    const tutorialSeen = localStorage.getItem('foodExpiry_skipTutorial') === 'true';
    setTutorialSeen(tutorialSeen);
    
    // If authenticated user and tutorial hasn't been seen, show it
    if (user && !tutorialSeen) {
      // Small delay to let the app render first
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user]);
  
  return (
    <TutorialContext.Provider
      value={{
        showTutorial,
        setShowTutorial,
        isTutorialSeen,
        setTutorialSeen,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return context;
}