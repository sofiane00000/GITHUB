import { useState } from 'react';
import { Search, User } from 'lucide-react';
import { useAuthStore, useUIStore } from '../../store/useStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export function Header({ title }) {
  const { user } = useAuthStore();
  const { sidebarOpen } = useUIStore();

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <header 
      className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-6 py-4"
      style={{ marginLeft: sidebarOpen ? '280px' : '80px' }}
    >
      <div className="flex items-center justify-between">
        {/* Title & Search */}
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              className="w-64 pl-10 rounded-full bg-muted border-none"
              data-testid="search-input"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-3 px-3"
                data-testid="user-menu-btn"
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(user?.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">
                    {user?.display_name || 'Utilisateur'}
                  </p>
                  <Badge variant="outline" className="gap-1">
                    <div className={`w-2 h-2 rounded-full ${user?.provider === 'pronote' ? 'bg-blue-500' : 'bg-green-500'}`} />
                    {user?.provider === 'pronote' ? 'Pronote' : 'EcoleDirecte'}
                  </Badge>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                {user?.school_name || 'Mon établissement'}
              </DropdownMenuItem>
              {user?.class_name && (
                <DropdownMenuItem>
                  Classe: {user.class_name}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
