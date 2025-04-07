import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Paintbrush, Wheat, UtensilsCrossed, Leaf } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

export type VisualTheme = 'default' | 'farm-to-table' | 'modern-kitchen' | 'eco-friendly';

interface ThemeSelectorProps {
  className?: string;
}

export function ThemeSelector({ className }: ThemeSelectorProps) {
  const { visualTheme, setVisualTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className={className}>
          <Paintbrush className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setVisualTheme('default')}>
          <div className="flex items-center gap-2">
            <div className={`h-4 w-4 rounded-full bg-primary ${visualTheme === 'default' ? 'ring-2 ring-primary ring-offset-2' : ''}`} />
            <span>Default</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setVisualTheme('farm-to-table')}>
          <div className="flex items-center gap-2">
            <Wheat className={`h-4 w-4 text-amber-600 ${visualTheme === 'farm-to-table' ? 'opacity-100' : 'opacity-60'}`} />
            <span>Farm-to-Table</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setVisualTheme('modern-kitchen')}>
          <div className="flex items-center gap-2">
            <UtensilsCrossed className={`h-4 w-4 text-slate-600 ${visualTheme === 'modern-kitchen' ? 'opacity-100' : 'opacity-60'}`} />
            <span>Modern Kitchen</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setVisualTheme('eco-friendly')}>
          <div className="flex items-center gap-2">
            <Leaf className={`h-4 w-4 text-green-600 ${visualTheme === 'eco-friendly' ? 'opacity-100' : 'opacity-60'}`} />
            <span>Eco-Friendly</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}