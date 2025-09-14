'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import {
  Menu,
  User,
  Settings,
  LogOut,
  Globe,
  Sun,
  Moon,
  Palette,
  ChevronDown,
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, language, setTheme, setLanguage } = useUIStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const handleLanguageChange = (newLanguage: 'en' | 'no') => {
    setLanguage(newLanguage);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'purple') => {
    setTheme(newTheme);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'purple':
        return <Palette className="h-4 w-4" />;
      default:
        return <Sun className="h-4 w-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'dark':
        return language === 'no' ? 'Mørk' : 'Dark';
      case 'purple':
        return language === 'no' ? 'Lilla' : 'Purple';
      default:
        return language === 'no' ? 'Lys' : 'Light';
    }
  };

  const getLanguageLabel = () => {
    return language === 'no' ? 'Norsk' : 'English';
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
        {/* Left side - Menu/Logo */}
        <div className="flex items-center">
          {isAuthenticated ? (
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-2 h-auto">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-sm">NX</span>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <span className="mr-2">🤖</span>
                    {language === 'no' ? 'AI' : 'AI'}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>
                      <Link href="/ai/link1" className="w-full">
                        {language === 'no' ? 'Link 1' : 'Link 1'}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/ai/link2" className="w-full">
                        {language === 'no' ? 'Link 2' : 'Link 2'}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/ai/link3" className="w-full">
                        {language === 'no' ? 'Link 3' : 'Link 3'}
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <span className="mr-2">📁</span>
                    {language === 'no' ? 'Mer' : 'More'}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>
                      <Link href="/more/site1" className="w-full">
                        {language === 'no' ? 'Side 1' : 'Site 1'}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/more/site2" className="w-full">
                        {language === 'no' ? 'Side 2' : 'Site 2'}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/more/site3" className="w-full">
                        {language === 'no' ? 'Side 3' : 'Site 3'}
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/dashboard" className="w-full">
                    {language === 'no' ? 'Kontrollpanel' : 'Dashboard'}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/tasks" className="w-full">
                    {language === 'no' ? 'Oppgaver' : 'Tasks'}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/llm-providers" className="w-full">
                    {language === 'no' ? 'LLM-leverandører' : 'LLM Providers'}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/profile" className="w-full">
                    {language === 'no' ? 'Profil' : 'Profile'}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/settings" className="w-full">
                    {language === 'no' ? 'Innstillinger' : 'Settings'}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">NX</span>
            </div>
          )}
        </div>

        {/* Center - Site Title */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <Link href="/" className="font-semibold text-lg hover:opacity-80 transition-opacity">
            nxfs.no
          </Link>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center space-x-2">
          {/* Language and Theme selectors */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Globe className="h-4 w-4 mr-2" />
                {getLanguageLabel()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleLanguageChange('en')}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLanguageChange('no')}>
                Norsk
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                {getThemeIcon()}
                <span className="ml-2">{getThemeLabel()}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleThemeChange('light')}>
                <Sun className="h-4 w-4 mr-2" />
                {language === 'no' ? 'Lys' : 'Light'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleThemeChange('dark')}>
                <Moon className="h-4 w-4 mr-2" />
                {language === 'no' ? 'Mørk' : 'Dark'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleThemeChange('purple')}>
                <Palette className="h-4 w-4 mr-2" />
                {language === 'no' ? 'Lilla' : 'Purple'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Authentication buttons */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profile_picture} alt={user?.display_name || user?.username} />
                    <AvatarFallback>
                      {(user?.display_name || user?.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user?.display_name && (
                      <p className="font-medium">{user.display_name}</p>
                    )}
                    {user?.email && (
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    {language === 'no' ? 'Profil' : 'Profile'}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    {language === 'no' ? 'Innstillinger' : 'Settings'}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {language === 'no' ? 'Logg ut' : 'Logout'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link href="/auth/signin">
                {language === 'no' ? 'Logg inn' : 'Sign In'}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}