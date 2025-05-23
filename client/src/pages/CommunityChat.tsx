import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { uploadImage } from '@/lib/image-upload-service';
import { ImageUpload } from '@/components/ImageUpload';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar,
  ChefHat, 
  Clock, 
  Heart, 
  MessageCircle, 
  RefreshCw, 
  Send, 
  Share, 
  ThumbsUp, 
  User, 
  Utensils
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '@/lib/theme-context';

// Define types for our chat messages
type User = {
  id: number;
  username: string;
};

type SharedRecipe = {
  id: number;
  title: string;
  ingredients: string[];
  instructions: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  imageUrl?: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
};

type ChatMessage = {
  id: number;
  content: string;
  userId: number;
  messageType: 'text' | 'recipe_share';
  attachmentId: number | null;
  createdAt: string;
  user: User;
  sharedRecipe?: SharedRecipe;
};

type RecipeComment = {
  id: number;
  recipeId: number;
  userId: number;
  content: string;
  createdAt: string;
  username: string;
};

export default function CommunityChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [recipeData, setRecipeData] = useState({
    title: '',
    ingredients: '',
    instructions: '',
    prepTime: 10,
    cookTime: 10,
    servings: 2,
    imageUrl: ''
  });
  const [imageUrlError, setImageUrlError] = useState<string | null>(null);
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<SharedRecipe | null>(null);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<RecipeComment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  
  // Set up WebSocket connection
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Query for chat messages
  const { 
    data: messages = [] as ChatMessage[], 
    isLoading: messagesLoading, 
    refetch: refetchMessages 
  } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat-messages'],
    refetchInterval: 0, // Disable automatic polling since we'll use WebSocket
    refetchOnWindowFocus: false,
  });
  
  // Query for shared recipes
  const { 
    data: recipes = [] as SharedRecipe[], 
    isLoading: recipesLoading, 
    refetch: refetchRecipes 
  } = useQuery<SharedRecipe[]>({
    queryKey: ['/api/shared-recipes'],
    refetchInterval: 0,
    refetchOnWindowFocus: false,
  });
  
  // Load comments for selected recipe
  const loadComments = async (recipeId: number) => {
    try {
      const response = await fetch(`/api/recipe-comments/${recipeId}`);
      const data = await response.json() as RecipeComment[];
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast({
        title: 'Failed to load comments',
        description: 'Please try again later',
        variant: 'destructive',
      });
    }
  };
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/chat-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          userId: user?.id,
          messageType: 'text',
          attachmentId: null,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      setMessage('');
      // No need to refetch as the WebSocket will update the UI
    },
    onError: (error) => {
      toast({
        title: 'Failed to send message',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      console.log(`Deleting message with ID: ${messageId}`);
      const response = await fetch(`/api/chat-messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete message');
      }
      
      // Try to parse JSON, but don't fail if it's not valid JSON
      try {
        return await response.json();
      } catch (error) {
        console.warn("Could not parse JSON response", error);
        return { success: true }; // Return a default successful response
      }
    },
    onSuccess: (_, variables) => {
      console.log(`Message deletion success, ID: ${variables}`);
      toast({
        title: "Message deleted",
        description: "Your message has been permanently removed",
      });
      
      // Force immediate refetch of data to ensure UI is up to date
      Promise.all([
        refetchMessages(),
        refetchRecipes() // Also refresh recipes in case the message was a recipe share
      ]).then(() => {
        console.log('Successfully refreshed data after message deletion');
      }).catch(err => {
        console.error('Error refreshing data after message deletion:', err);
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete message',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Delete recipe mutation
  const deleteRecipeMutation = useMutation({
    mutationFn: async (recipeId: number) => {
      console.log(`Deleting recipe with ID: ${recipeId}`);
      const response = await fetch(`/api/shared-recipes/${recipeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete recipe');
      }
      
      // Try to parse JSON, but don't fail if it's not valid JSON
      try {
        return await response.json();
      } catch (error) {
        console.warn("Could not parse JSON response", error);
        return { success: true }; // Return a default successful response
      }
    },
    onSuccess: (result, variables) => {
      console.log(`Recipe deletion success, ID: ${variables}`);
      toast({
        title: "Recipe deleted",
        description: "Your shared recipe has been permanently removed",
      });
      
      // Force immediate refetch of data to ensure UI is up to date
      Promise.all([
        refetchRecipes(),
        refetchMessages()
      ]).then(() => {
        console.log('Successfully refreshed data after recipe deletion');
      }).catch(err => {
        console.error('Error refreshing data after recipe deletion:', err);
      });
      
      // If we were viewing this recipe, close the detail view
      if (selectedRecipe && selectedRecipe.id === variables) {
        setSelectedRecipe(null);
      }
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete recipe',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Create recipe mutation
  const createRecipeMutation = useMutation({
    mutationFn: async (recipe: typeof recipeData) => {
      const ingredientsArray = recipe.ingredients
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);
        
      const recipeResponse = await fetch('/api/shared-recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: recipe.title, 
          ingredients: ingredientsArray,
          preparationTime: recipe.prepTime + recipe.cookTime,
          instructions: recipe.instructions,
          imageUrl: recipe.imageUrl && recipe.imageUrl.trim() !== '' ? recipe.imageUrl.trim() : null,
          userId: user?.id, // Add userId as required by schema
        }),
      });
      
      if (!recipeResponse.ok) {
        throw new Error('Failed to create recipe');
      }
      
      const newRecipe = await recipeResponse.json();
      
      // The server will automatically create a chat message about the recipe
      // No need to create a second message from the client
      
      return newRecipe;
    },
    onSuccess: () => {
      setRecipeDialogOpen(false);
      setRecipeData({
        title: '',
        ingredients: '',
        instructions: '',
        prepTime: 10,
        cookTime: 10,
        servings: 2,
        imageUrl: ''
      });
      // WebSocket will handle the UI update
      toast({
        title: 'Recipe shared!',
        description: 'Your recipe has been shared with the community',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to share recipe',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ recipeId, content }: { recipeId: number; content: string }) => {
      const response = await fetch('/api/recipe-comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipeId,
          userId: user?.id,
          content,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add comment');
      }
      
      return await response.json();
    },
    onSuccess: (_, variables) => {
      setComment('');
      loadComments(variables.recipeId);
      toast({
        title: 'Comment added',
        description: 'Your comment has been added to the recipe',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to add comment',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Get initials for avatar
  const getInitials = (username?: string) => {
    if (!username) return 'U'; // Default to 'U' for "User" if username is undefined
    
    return username
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Helper for message time formatting
  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return 'just now';
    }
  };
  
  // Validate image URL
  const validateImageUrl = (url: string): boolean => {
    if (!url || url.trim() === '') return true; // Empty URLs are valid (optional)
    
    try {
      // Basic URL validation using built-in URL constructor
      const parsedUrl = new URL(url);
      
      // Explicitly reject Google Image search URLs
      if (parsedUrl.hostname.includes('google.com') && 
          (parsedUrl.pathname.includes('/imgres') || parsedUrl.pathname.includes('/images') || 
           parsedUrl.search.includes('imgurl=') || parsedUrl.search.includes('&q='))) {
        return false;
      }
      
      // Extract the path part without query parameters
      const pathWithoutQuery = parsedUrl.pathname;
      
      // Check if the URL has an image file extension
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'];
      
      // Check the path part (without query parameters) for an image extension
      const hasImageExtension = imageExtensions.some(ext => 
        pathWithoutQuery.toLowerCase().endsWith(ext)
      );
      
      // Some image URLs don't have extensions but have image-specific hostnames
      const imageHostnames = ['i.imgur.com', 'images.unsplash.com', 'img.freepik.com'];
      const isImageHostname = imageHostnames.some(host => 
        parsedUrl.hostname.toLowerCase() === host
      );
      
      // Service-specific checks for common image hosts
      const isCloudinaryImage = parsedUrl.hostname.includes('cloudinary.com') && 
                               (parsedUrl.pathname.includes('/image/') || url.includes('/upload/'));
      
      // Check for image serving websites
      const isImageService = parsedUrl.hostname.includes('pexels.com') || 
                            parsedUrl.hostname.includes('pixabay.com') || 
                            parsedUrl.hostname.includes('unsplash.com');
      
      return hasImageExtension || isImageHostname || isCloudinaryImage || isImageService;
    } catch (e) {
      return false; // Invalid URL format
    }
  };
  
  // Setup and cleanup WebSocket connection
  useEffect(() => {
    const setupWebSocket = () => {
      // Close any existing connection
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      // Clear any reconnect timer
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      
      // Setup WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;
      console.log('Connecting to WebSocket:', wsUrl);
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      socket.onopen = () => {
        console.log('WebSocket connected');
      };
      
      socket.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
        
        try {
          const message = JSON.parse(event.data);
          
          // Handle different message types
          console.log(`Received WebSocket message type: ${message.type}`);
          
          if (message.type === 'recipe_deleted') {
            console.log('Recipe deleted:', message.data);
            // Explicitly fetch fresh data after a recipe is deleted
            queryClient.invalidateQueries({ queryKey: ['/api/shared-recipes'] });
            queryClient.invalidateQueries({ queryKey: ['/api/chat-messages'] });
          } else if (message.type === 'message_deleted') {
            console.log('Message deleted:', message.data);
            // Explicitly fetch fresh data after a message is deleted
            queryClient.invalidateQueries({ queryKey: ['/api/chat-messages'] });
          } else {
            // For other message types, refresh everything
            refetchMessages();
            refetchRecipes();
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
          // If there's an error parsing the message, just refresh the data
          refetchMessages();
          refetchRecipes();
        }
      };
      
      socket.onclose = (event) => {
        console.log('WebSocket closed, will reconnect in 5 seconds', event.code);
        
        // Attempt reconnection after delay
        reconnectTimer.current = setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
          setupWebSocket();
        }, 5000);
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        socket.close();
      };
    };
    
    // Only set up WebSocket if the user is authenticated
    if (user) {
      setupWebSocket();
    }
    
    return () => {
      // Clean up on component unmount
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
    };
  }, [user, refetchMessages, refetchRecipes]);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Handle sending a message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    if (!user) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to send messages',
        variant: 'destructive',
      });
      return;
    }
    
    sendMessageMutation.mutate(message);
  };
  
  // Open recipe details
  const handleRecipeClick = async (recipe: SharedRecipe) => {
    setSelectedRecipe(recipe);
    await loadComments(recipe.id);
  };
  
  // Add a comment to a recipe
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !selectedRecipe || !user) return;
    
    addCommentMutation.mutate({
      recipeId: selectedRecipe.id,
      content: comment,
    });
  };
  
  // Handle image upload
  const handleImageUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setImageUrlError(null);
      
      // Upload the image to the server
      const imagePath = await uploadImage(file);
      
      // Update recipe data with the image path
      setRecipeData({
        ...recipeData,
        imageUrl: imagePath
      });
      
      toast({
        title: 'Image uploaded successfully',
        description: 'Your image has been uploaded and will be included with your recipe'
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Image upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle image removal
  const handleImageRemove = () => {
    setRecipeData({
      ...recipeData,
      imageUrl: ''
    });
  };

  // Delete a message
  const handleDeleteMessage = (messageId: number) => {
    if (!user) return;
    
    // Confirm delete
    if (window.confirm("Are you sure you want to delete this message? This action cannot be undone.")) {
      deleteMessageMutation.mutate(messageId);
    }
  };
  
  // Delete a recipe
  const handleDeleteRecipe = (recipeId: number) => {
    if (!user) return;
    
    // Confirm delete
    if (window.confirm("Are you sure you want to delete this recipe? This action cannot be undone.")) {
      deleteRecipeMutation.mutate(recipeId);
    }
  };
  
  // Create and share a new recipe
  const handleCreateRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to share recipes',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate recipe form
    if (!recipeData.title.trim()) {
      toast({
        title: 'Missing title',
        description: 'Please enter a title for your recipe',
        variant: 'destructive',
      });
      return;
    }
    
    if (!recipeData.ingredients.trim()) {
      toast({
        title: 'Missing ingredients',
        description: 'Please enter the ingredients for your recipe',
        variant: 'destructive',
      });
      return;
    }
    
    if (!recipeData.instructions.trim()) {
      toast({
        title: 'Missing instructions',
        description: 'Please enter cooking instructions for your recipe',
        variant: 'destructive',
      });
      return;
    }
    
    // For URL inputs, validate image URL if provided
    if (recipeData.imageUrl && recipeData.imageUrl.trim() !== '' && !recipeData.imageUrl.startsWith('/uploads/')) {
      if (!validateImageUrl(recipeData.imageUrl)) {
        toast({
          title: 'Invalid image URL',
          description: 'Please provide a valid image URL or leave the field empty',
          variant: 'destructive',
        });
        return;
      }
    }
    
    createRecipeMutation.mutate(recipeData);
  };
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Community Recipe Share</h1>
          <p className="text-muted-foreground">
            Connect with other food-conscious users to share recipes and reduce waste
          </p>
        </div>
        
        <Button onClick={() => setRecipeDialogOpen(true)}>
          <ChefHat className="mr-2 h-4 w-4" />
          Share a Recipe
        </Button>
      </div>
      
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="chat">Live Chat</TabsTrigger>
          <TabsTrigger value="recipes">Shared Recipes</TabsTrigger>
        </TabsList>
        
        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4">
          <Card className="border shadow-md">
            <CardContent className="p-4">
              <ScrollArea className="h-[400px] pr-4">
                {messagesLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col justify-center items-center h-full text-center">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No messages yet</p>
                    <p className="text-sm text-muted-foreground">Be the first to start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg: ChatMessage) => (
                      <div 
                        key={msg.id} 
                        className={`flex ${msg.userId === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex gap-2 max-w-[80%] ${msg.userId === user?.id ? 'flex-row-reverse' : 'flex-row'}`}>
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarFallback className={theme === 'dark' ? 'bg-primary' : 'bg-primary-foreground'}>
                              <span className={theme === 'dark' ? 'text-white' : 'text-primary'}>
                                {getInitials(msg.user.username)}
                              </span>
                            </AvatarFallback>
                          </Avatar>
                          
                          <div>
                            <div 
                              className={`rounded-lg p-3 shadow-md ${
                                msg.userId === user?.id 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-card'
                              }`}
                            >
                              {msg.messageType === 'recipe_share' && msg.sharedRecipe ? (
                                <div className="space-y-2">
                                  <p className="font-medium">{msg.content}</p>
                                  <div className="rounded bg-accent/50 p-2 cursor-pointer" 
                                    onClick={() => handleRecipeClick(msg.sharedRecipe!)}>
                                    <div className="flex items-center gap-2">
                                      <Utensils className="h-4 w-4" />
                                      <span>{msg.sharedRecipe.title}</span>
                                    </div>
                                    <p className="text-xs mt-1">Click to view details</p>
                                  </div>
                                </div>
                              ) : (
                                <p>{msg.content}</p>
                              )}
                            </div>
                            
                            <div className={`text-xs text-muted-foreground mt-1 flex items-center ${
                              msg.userId === user?.id ? 'justify-end' : 'justify-start'
                            }`}>
                              <span className="font-medium">{msg.userId === user?.id ? 'You' : msg.user.username}</span>
                              {' · '}
                              <span>{formatMessageTime(msg.createdAt)}</span>
                              
                              {msg.userId === user?.id && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-5 w-5 p-0 ml-1 text-muted-foreground hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMessage(msg.id);
                                  }}
                                  title="Delete this message"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M3 6h18"></path>
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                  </svg>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>
              
              <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                <Textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="min-h-[60px]"
                />
                <Button 
                  type="submit" 
                  size="icon"
                  disabled={!message.trim() || sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Recipes Tab */}
        <TabsContent value="recipes">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipesLoading ? (
              <div className="col-span-full flex justify-center items-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : recipes.length === 0 ? (
              <div className="col-span-full flex flex-col justify-center items-center h-64 text-center">
                <Utensils className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No recipes shared yet</p>
                <p className="text-sm text-muted-foreground mb-4">Be the first to share a tasty recipe!</p>
                <Button onClick={() => setRecipeDialogOpen(true)}>
                  <ChefHat className="mr-2 h-4 w-4" />
                  Share a Recipe
                </Button>
              </div>
            ) : (
              recipes.map((recipe: SharedRecipe) => (
                <Card key={recipe.id} className="overflow-hidden shadow-md">
                  {recipe.imageUrl && recipe.imageUrl.trim() !== '' && (
                    <div className="h-48 w-full overflow-hidden">
                      <img 
                        src={recipe.imageUrl} 
                        alt={recipe.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Handle image loading errors
                          console.log('Image failed to load:', recipe.imageUrl);
                          // Hide the entire image container
                          (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                          
                          // Show feedback
                          toast({
                            title: "Image couldn't be loaded",
                            description: "The recipe image URL is invalid or inaccessible",
                            variant: "destructive",
                          });
                        }}
                      />
                    </div>
                  )}
                  
                  <CardHeader>
                    <CardTitle>{recipe.title}</CardTitle>
                    <CardDescription>
                      Shared by {recipe.userId === user?.id ? 'you' : 
                        messages.find((m: ChatMessage) => 
                          m.userId === recipe.userId)?.user.username || 'Community Member'}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center text-sm text-muted-foreground space-x-4">
                      <div className="flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        <span>{recipe.prepTime + recipe.cookTime} min</span>
                      </div>
                      <div className="flex items-center">
                        <User className="mr-1 h-4 w-4" />
                        <span>{recipe.servings} servings</span>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex flex-col gap-2">
                    <Button 
                      variant="secondary" 
                      className="w-full"
                      onClick={() => handleRecipeClick(recipe)}
                    >
                      View Recipe
                    </Button>
                    
                    {recipe.userId === user?.id && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRecipe(recipe.id);
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-1"
                        >
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                        Delete Recipe
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Create Recipe Dialog */}
      <Dialog open={recipeDialogOpen} onOpenChange={setRecipeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Share a Recipe</DialogTitle>
            <DialogDescription>
              Share your favorite recipes with the community to inspire others and reduce food waste
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateRecipe} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Recipe Title</Label>
                <Input
                  id="title"
                  value={recipeData.title}
                  onChange={(e) => setRecipeData({...recipeData, title: e.target.value})}
                  placeholder="E.g., Vegetable Stir Fry"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ingredients">
                  Ingredients (one per line)
                </Label>
                <Textarea
                  id="ingredients"
                  value={recipeData.ingredients}
                  onChange={(e) => setRecipeData({...recipeData, ingredients: e.target.value})}
                  placeholder="2 bell peppers, sliced&#10;1 cup broccoli florets&#10;2 tbsp olive oil"
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="instructions">Cooking Instructions</Label>
                <Textarea
                  id="instructions"
                  value={recipeData.instructions}
                  onChange={(e) => setRecipeData({...recipeData, instructions: e.target.value})}
                  placeholder="Heat olive oil in a pan. Add vegetables and stir-fry until crisp-tender..."
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prepTime">Prep Time (min)</Label>
                  <Input
                    id="prepTime"
                    type="number"
                    min="1"
                    value={recipeData.prepTime}
                    onChange={(e) => setRecipeData({...recipeData, prepTime: parseInt(e.target.value) || 10})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cookTime">Cook Time (min)</Label>
                  <Input
                    id="cookTime"
                    type="number"
                    min="1"
                    value={recipeData.cookTime}
                    onChange={(e) => setRecipeData({...recipeData, cookTime: parseInt(e.target.value) || 10})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="servings">Servings</Label>
                  <Input
                    id="servings"
                    type="number"
                    min="1"
                    value={recipeData.servings}
                    onChange={(e) => setRecipeData({...recipeData, servings: parseInt(e.target.value) || 2})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Recipe Image (optional)</Label>
                
                {/* Image upload section with preview */}
                {recipeData.imageUrl && !recipeData.imageUrl.startsWith('/uploads/') ? (
                  // Show existing URL input if there's already a URL that's not an uploaded file
                  <div className="space-y-3">
                    <Input
                      id="imageUrl"
                      value={recipeData.imageUrl}
                      onChange={(e) => {
                        const url = e.target.value;
                        setRecipeData({...recipeData, imageUrl: url});
                        
                        if (url.trim() !== '') {
                          if (!validateImageUrl(url)) {
                            setImageUrlError('Please enter a valid image URL (must end with .jpg, .png, .gif, etc.)');
                          } else {
                            setImageUrlError(null);
                          }
                        } else {
                          setImageUrlError(null);
                        }
                      }}
                      placeholder="https://example.com/image.jpg"
                      className={imageUrlError ? 'border-red-500' : ''}
                    />
                    {imageUrlError ? (
                      <p className="text-sm text-red-500">{imageUrlError}</p>
                    ) : (
                      <div className="text-xs text-muted-foreground mt-1">
                        <p>Add a direct link to an image file (must end with .jpg, .png, .gif, etc.).</p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <div className="text-sm">or</div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setRecipeData({...recipeData, imageUrl: ''})}
                      >
                        Upload an image instead
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Show image upload component
                  <div>
                    <ImageUpload 
                      onImageSelected={handleImageUpload}
                      onImageRemoved={handleImageRemove}
                      className="mt-2"
                    />
                    {isUploading && (
                      <div className="flex items-center mt-2 gap-2 text-sm text-muted-foreground">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Uploading image...</span>
                      </div>
                    )}
                    {recipeData.imageUrl && recipeData.imageUrl.startsWith('/uploads/') && (
                      <div className="text-sm text-green-600 mt-2">
                        Image uploaded successfully
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="text-sm">or</div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setRecipeData({...recipeData, imageUrl: 'https://'})}
                      >
                        Provide an image URL instead
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRecipeDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createRecipeMutation.isPending || !!imageUrlError}
              >
                {createRecipeMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share className="mr-2 h-4 w-4" />
                    Share Recipe
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Recipe Details Dialog */}
      {selectedRecipe && (
        <Dialog open={!!selectedRecipe} onOpenChange={(open) => !open && setSelectedRecipe(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedRecipe.title}</DialogTitle>
              <DialogDescription>
                Shared by {selectedRecipe.userId === user?.id ? 'you' : 
                  messages.find((m: ChatMessage) => 
                    m.userId === selectedRecipe.userId)?.user.username || 'Community Member'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {selectedRecipe.imageUrl && selectedRecipe.imageUrl.trim() !== '' && (
                  <div className="rounded-md overflow-hidden">
                    <img 
                      src={selectedRecipe.imageUrl} 
                      alt={selectedRecipe.title} 
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        // Handle image loading errors
                        console.log('Image failed to load in detail view:', selectedRecipe.imageUrl);
                        // Hide the entire image container
                        (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                        
                        // Show feedback
                        toast({
                          title: "Recipe image couldn't be loaded",
                          description: "The image URL is invalid or inaccessible",
                          variant: "destructive",
                        });
                      }}
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                    <span>Prep: {selectedRecipe.prepTime} min</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                    <span>Cook: {selectedRecipe.cookTime} min</span>
                  </div>
                  <div className="flex items-center">
                    <User className="mr-1 h-4 w-4 text-muted-foreground" />
                    <span>{selectedRecipe.servings} servings</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Ingredients</h3>
                  <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
                    {selectedRecipe.ingredients.map((ingredient, index) => (
                      <li key={index}>{ingredient}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Instructions</h3>
                  <p className="mt-2 whitespace-pre-line">{selectedRecipe.instructions}</p>
                </div>
                
                <Separator />
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium">Comments</h3>
                    <Button variant="ghost" size="sm" onClick={() => loadComments(selectedRecipe.id)}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-[200px] pr-4">
                    {comments.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <MessageCircle className="mx-auto h-8 w-8 mb-2" />
                        <p>No comments yet</p>
                        <p className="text-sm">Be the first to share your thoughts!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {comments.map((comment) => (
                          <div key={comment.id} className="border rounded-lg p-3">
                            <div className="flex justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className={theme === 'dark' ? 'bg-primary' : 'bg-primary-foreground'}>
                                    <span className={theme === 'dark' ? 'text-white' : 'text-primary'}>
                                      {getInitials(comment.username)}
                                    </span>
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-sm">
                                  {comment.userId === user?.id ? 'You' : comment.username}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatMessageTime(comment.createdAt)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  
                  <form onSubmit={handleAddComment} className="mt-4 flex gap-2">
                    <Input
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment..."
                    />
                    <Button 
                      type="submit" 
                      size="sm"
                      disabled={!comment.trim() || addCommentMutation.isPending}
                    >
                      {addCommentMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}