import React, { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { AnimatedLink } from "@/components/AnimatedLink";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Leaf, 
  Calendar, 
  Clock, 
  BarChart2, 
  Users, 
  CheckCircle2, 
  Smartphone, 
  Bell, 
  Star, 
  ChevronRight,
  Heart,
  ShoppingBag,
  Trash2,
  PieChart,
  MessageCircle
} from "lucide-react";
import logoImage from "@/assets/logo.png";
import backgroundImage from "@/assets/Gemini_Generated_Image_h097xeh097xeh097.jpeg";

export default function LandingPage() {
  const { user } = useAuth();
  const [scrollY, setScrollY] = useState(0);
  const [animatedElements, setAnimatedElements] = useState<Set<string>>(new Set());
  const heroRef = useRef<HTMLDivElement>(null);
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);
  const statRefs = useRef<(HTMLDivElement | null)[]>([]);
  const testimonialRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      
      // Check each element to see if it's in the viewport
      const elements = [
        heroRef.current,
        ...featureRefs.current,
        ...statRefs.current,
        ...testimonialRefs.current
      ].filter(Boolean);
      
      elements.forEach((element) => {
        if (element) {
          const rect = element.getBoundingClientRect();
          const isVisible = rect.top < window.innerHeight * 0.8 && rect.bottom > 0;
          
          if (isVisible && !animatedElements.has(element.id)) {
            setAnimatedElements(prev => {
              const newSet = new Set(prev);
              newSet.add(element.id);
              return newSet;
            });
          }
        }
      });
    };
    
    window.addEventListener("scroll", handleScroll);
    // Initial check
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [animatedElements]);
  
  const isAnimated = (id: string) => animatedElements.has(id);
  
  // Calculate parallax and opacity effects
  const heroOpacity = Math.max(0, Math.min(1, 1 - scrollY / 500));
  const parallaxOffset = Math.min(scrollY * 0.5, 200);
  
  // Features data
  const features = [
    {
      id: "feature-1",
      icon: <Clock className="h-12 w-12 text-green-500" />,
      title: "Expiration Tracking",
      description: "Never let food go to waste again. Our smart tracking system reminds you when items are about to expire."
    },
    {
      id: "feature-2",
      icon: <Calendar className="h-12 w-12 text-teal-500" />,
      title: "Meal Planning",
      description: "Plan your meals for the week using items in your inventory to minimize waste and save money."
    },
    {
      id: "feature-3",
      icon: <Bell className="h-12 w-12 text-cyan-500" />,
      title: "Smart Notifications",
      description: "Get timely alerts about expiring food items through email or in-app notifications."
    },
    {
      id: "feature-4",
      icon: <BarChart2 className="h-12 w-12 text-indigo-500" />,
      title: "Waste Insights",
      description: "Visualize and track your food waste patterns to make better purchasing decisions."
    },
    {
      id: "feature-5",
      icon: <Users className="h-12 w-12 text-purple-500" />,
      title: "Community Sharing",
      description: "Share recipes and food waste reduction tips with a community of like-minded individuals."
    },
    {
      id: "feature-6",
      icon: <Smartphone className="h-12 w-12 text-pink-500" />,
      title: "Mobile Friendly",
      description: "Access your food inventory anytime, anywhere with our responsive mobile design."
    }
  ];
  
  // Benefits data
  const benefits = [
    {
      id: "benefit-1",
      value: "Track",
      description: "Get notified before food expires",
      icon: <Bell className="h-8 w-8 text-green-500" />
    },
    {
      id: "benefit-2",
      value: "Save",
      description: "Reduce food waste and save money",
      icon: <ShoppingBag className="h-8 w-8 text-emerald-500" />
    },
    {
      id: "benefit-3",
      value: "Share",
      description: "Exchange recipes with other users",
      icon: <Users className="h-8 w-8 text-blue-500" />
    },
    {
      id: "benefit-4",
      value: "Learn",
      description: "Discover your consumption patterns",
      icon: <PieChart className="h-8 w-8 text-purple-500" />
    }
  ];
  
  return (
    <div className="landing-page min-h-screen bg-gradient-to-b from-white via-green-50 to-white overflow-hidden">
      {/* Hero Section */}
      <div 
        ref={heroRef}
        id="hero-section"
        className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 transition-all duration-1000"
        style={{ 
          opacity: heroOpacity,
          transform: `translateY(${-parallaxOffset * 0.2}px)`,
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/10"
              style={{
                width: `${Math.random() * 100 + 50}px`,
                height: `${Math.random() * 100 + 50}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 20 + 10}s`,
                animationDelay: `${Math.random() * 5}s`,
                animation: `float ${Math.random() * 10 + 20}s ease-in-out infinite`,
                opacity: Math.random() * 0.3 + 0.1,
                transform: `scale(${Math.random() * 0.5 + 0.5})`,
              }}
            />
          ))}
        </div>
        
        <div className="z-10 max-w-4xl mx-auto text-center relative">
          <div 
            className={`transition-all duration-1000 ${
              isAnimated("hero-section") 
                ? "opacity-100 translate-y-0" 
                : "opacity-0 translate-y-10"
            }`}
          >
            <div className="mb-6 rounded-full bg-white/90 p-4 inline-block shadow-lg backdrop-blur-sm">
              <img src={logoImage} alt="FoodExpiry Logo" className="h-24 w-24" />
            </div>
            
            <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 text-white drop-shadow-lg">
              Reduce Food Waste, Save Money
            </h1>
            
            <p className="text-xl text-white mb-8 max-w-3xl mx-auto drop-shadow-md">
              FoodExpiry helps you track your food inventory, plan meals, and receive timely 
              notifications about expiring items - all to help you reduce waste and save money.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <AnimatedLink href="/auth?mode=register">
                <Button size="lg" className="group rounded-full bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-700 hover:to-teal-600 transition-all duration-300 shadow-md hover:shadow-lg">
                  Get Started Free
                  <ArrowRight className="h-4 w-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </AnimatedLink>
              
              <AnimatedLink href="/auth?mode=login">
                <Button size="lg" variant="outline" className="rounded-full border-2 border-white bg-white text-green-700 hover:bg-white/90 transition-all duration-300 shadow-md">
                  Login
                </Button>
              </AnimatedLink>
            </div>
            
            <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-white drop-shadow-md">
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-white mr-2" />
                No credit card required
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-white mr-2" />
                Free personal account
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-white mr-2" />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronRight className="h-10 w-10 text-white rotate-90 drop-shadow-md" />
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-green-600 to-teal-500 bg-clip-text text-transparent">
          Smart Features for Smart Living
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              id={feature.id}
              ref={el => featureRefs.current[index] = el}
              className={`bg-white rounded-xl p-6 shadow-md transition-all duration-1000 relative overflow-hidden group ${
                isAnimated(feature.id)
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-20"
              }`}
              style={{ 
                transitionDelay: `${index * 100}ms`,
                borderTop: "4px solid transparent",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-teal-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="mb-5 transform group-hover:scale-110 transition-transform duration-500">
                  {feature.icon}
                </div>
                
                <h3 className="text-xl font-semibold mb-3 text-gray-800 group-hover:text-teal-700 transition-colors duration-300">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
              
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Benefits Section */}
      <div className="py-20 px-4 sm:px-6 bg-gradient-to-br from-green-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-20">
            Key Benefits at a Glance
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {benefits.map((benefit, index) => (
              <div
                key={benefit.id}
                id={benefit.id}
                ref={el => statRefs.current[index] = el}
                className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 transition-all duration-1000 border border-white/20 ${
                  isAnimated(benefit.id)
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="flex justify-center mb-4 relative">
                  <div 
                    className="p-5 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-md rounded-full shadow-lg border border-white/30"
                    style={{
                      animation: `float ${6 + index}s ease-in-out infinite`,
                      animationDelay: `${index * 0.5}s`,
                    }}
                  >
                    <div className={`h-10 w-10 text-white drop-shadow-md`}>
                      {benefit.icon}
                    </div>
                  </div>
                  {/* Glowing effect behind icon */}
                  <div className="absolute inset-0 rounded-full bg-white/10 filter blur-xl -z-10" 
                    style={{ 
                      transform: 'scale(1.2)',
                      opacity: 0.7,
                    }}
                  />
                </div>
                
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">
                    {benefit.value}
                  </div>
                  <div className="text-white/80">
                    {benefit.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* How It Works Section */}
      <div className="py-24 px-4 sm:px-6 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-green-600 to-teal-500 bg-clip-text text-transparent">
            How FoodExpiry Works
          </h2>
          
          {/* Desktop version - hidden on mobile */}
          <div className="relative hidden md:block">
            {/* Connected Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-teal-500" />
            
            {/* Steps */}
            <div className="space-y-24 relative">
              {/* Step 1 */}
              <div className="flex flex-row items-center">
                <div className="w-1/2 pr-12 text-right">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Track Your Food Inventory</h3>
                  <p className="text-gray-600">
                    Add items to your digital pantry with expiration dates. Our system organizes everything for you.
                  </p>
                </div>
                
                <div className="w-12 flex justify-center relative z-10">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    1
                  </div>
                </div>
                
                <div className="w-1/2 pl-12 text-left">
                  <div className="bg-green-50 rounded-xl p-4 shadow-md inline-flex">
                    <ShoppingBag className="h-12 w-12 text-green-500" />
                  </div>
                </div>
              </div>
              
              {/* Step 2 */}
              <div className="flex flex-row items-center">
                <div className="w-1/2 pr-12 text-right">
                  <div className="bg-teal-50 rounded-xl p-4 shadow-md inline-flex float-right">
                    <Bell className="h-12 w-12 text-teal-500" />
                  </div>
                </div>
                
                <div className="w-12 flex justify-center relative z-10">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    2
                  </div>
                </div>
                
                <div className="w-1/2 pl-12 text-left">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Receive Smart Notifications</h3>
                  <p className="text-gray-600">
                    Get timely alerts before your food expires, so you can use it before it goes to waste.
                  </p>
                </div>
              </div>
              
              {/* Step 3 */}
              <div className="flex flex-row items-center">
                <div className="w-1/2 pr-12 text-right">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Plan Your Meals</h3>
                  <p className="text-gray-600">
                    Create meal plans that prioritize soon-to-expire ingredients to minimize waste.
                  </p>
                </div>
                
                <div className="w-12 flex justify-center relative z-10">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    3
                  </div>
                </div>
                
                <div className="w-1/2 pl-12 text-left">
                  <div className="bg-blue-50 rounded-xl p-4 shadow-md inline-flex">
                    <Calendar className="h-12 w-12 text-blue-500" />
                  </div>
                </div>
              </div>
              
              {/* Step 4 */}
              <div className="flex flex-row items-center">
                <div className="w-1/2 pr-12 text-right">
                  <div className="bg-purple-50 rounded-xl p-4 shadow-md inline-flex float-right">
                    <PieChart className="h-12 w-12 text-purple-500" />
                  </div>
                </div>
                
                <div className="w-12 flex justify-center relative z-10">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    4
                  </div>
                </div>
                
                <div className="w-1/2 pl-12 text-left">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Track Your Progress</h3>
                  <p className="text-gray-600">
                    Visualize your waste reduction and savings over time with intuitive charts and insights.
                  </p>
                </div>
              </div>
              
              {/* Step 5 */}
              <div className="flex flex-row items-center">
                <div className="w-1/2 pr-12 text-right">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Join the Community</h3>
                  <p className="text-gray-600">
                    Share recipes, tips, and sustainability ideas with others on the same journey.
                  </p>
                </div>
                
                <div className="w-12 flex justify-center relative z-10">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    5
                  </div>
                </div>
                
                <div className="w-1/2 pl-12 text-left">
                  <div className="bg-pink-50 rounded-xl p-4 shadow-md inline-flex">
                    <MessageCircle className="h-12 w-12 text-pink-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile version - only shown on mobile */}
          <div className="md:hidden">
            <div className="space-y-16">
              {/* Step 1 */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-md mr-4">
                    1
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Track Your Food Inventory</h3>
                </div>
                <div className="flex items-start">
                  <div className="bg-green-50 rounded-lg p-3 shadow mr-4">
                    <ShoppingBag className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-gray-600 flex-1">
                    Add items to your digital pantry with expiration dates. Our system organizes everything for you.
                  </p>
                </div>
              </div>
              
              {/* Step 2 */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-md mr-4">
                    2
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Receive Smart Notifications</h3>
                </div>
                <div className="flex items-start">
                  <div className="bg-teal-50 rounded-lg p-3 shadow mr-4">
                    <Bell className="h-8 w-8 text-teal-500" />
                  </div>
                  <p className="text-gray-600 flex-1">
                    Get timely alerts before your food expires, so you can use it before it goes to waste.
                  </p>
                </div>
              </div>
              
              {/* Step 3 */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-md mr-4">
                    3
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Plan Your Meals</h3>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-50 rounded-lg p-3 shadow mr-4">
                    <Calendar className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-gray-600 flex-1">
                    Create meal plans that prioritize soon-to-expire ingredients to minimize waste.
                  </p>
                </div>
              </div>
              
              {/* Step 4 */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md mr-4">
                    4
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Track Your Progress</h3>
                </div>
                <div className="flex items-start">
                  <div className="bg-purple-50 rounded-lg p-3 shadow mr-4">
                    <PieChart className="h-8 w-8 text-purple-500" />
                  </div>
                  <p className="text-gray-600 flex-1">
                    Visualize your waste reduction and savings over time with intuitive charts and insights.
                  </p>
                </div>
              </div>
              
              {/* Step 5 */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-md mr-4">
                    5
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Join the Community</h3>
                </div>
                <div className="flex items-start">
                  <div className="bg-pink-50 rounded-lg p-3 shadow mr-4">
                    <MessageCircle className="h-8 w-8 text-pink-500" />
                  </div>
                  <p className="text-gray-600 flex-1">
                    Share recipes, tips, and sustainability ideas with others on the same journey.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Call to Action */}
      <div className="py-20 px-4 sm:px-6 bg-gradient-to-r from-green-600 to-teal-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8">
            Be Among the First to Make a Difference
          </h2>
          
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Join our growing community of early adopters who are passionate about 
            reducing food waste and creating a more sustainable future.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <AnimatedLink href="/auth?mode=register">
              <Button size="lg" className="group rounded-full bg-white text-teal-700 hover:bg-green-50 transition-all duration-300 shadow-md hover:shadow-lg">
                Get Started Free
                <ArrowRight className="h-4 w-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </AnimatedLink>
            
            <AnimatedLink href="/auth?mode=login">
              <Button size="lg" variant="outline" className="rounded-full border-2 border-white bg-white text-green-700 hover:bg-white/90 transition-all duration-300 shadow-md">
                Login
              </Button>
            </AnimatedLink>
          </div>
        </div>
      </div>
      
      {/* Simple Footer */}
      <footer className="py-8 px-4 sm:px-6 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <img src={logoImage} alt="FoodExpiry Logo" className="h-8 w-8 mr-3" />
            <span className="text-xl font-bold">FoodExpiry</span>
          </div>
          
          <p className="text-gray-400 mb-6">
            Making food management smarter and more sustainable.
          </p>
          
          <div className="pt-4 border-t border-gray-800 text-center text-gray-500">
            <p>© {new Date().getFullYear()} FoodExpiry. All rights reserved.</p>
          </div>
        </div>
      </footer>
      
      {/* Custom CSS */}
      <style>{`
        @keyframes float {
          0% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
          100% {
            transform: translateY(0px) translateX(0px);
          }
        }
        
        .landing-page {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}