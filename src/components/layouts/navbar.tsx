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
import { useAuthStore, useUIStore } from '@/stores';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Menu,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Palette,
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { language, theme, setLanguage, setTheme } = useUIStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUnauthMenuOpen, setIsUnauthMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
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
                    <div className="w-8 h-8 flex items-center justify-center">
                      <img
                        src={
                          theme === 'dark'
                            ? '/logo_dark.svg'
                            : '/logo_light.svg'
                        }
                        alt="NXFS Logo"
                        className="w-8 h-8"
                      />
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
                  <Link href="/memo" className="w-full">
                    📱{' '}
                    {language === 'no'
                      ? 'Memo (Arbeidsordre)'
                      : 'Memo (Work Orders)'}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/memo/admin" className="w-full">
                    📊 {language === 'no' ? 'Memo Admin' : 'Memo Admin'}
                  </Link>
                </DropdownMenuItem>
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
                  <Link href="/api-tester" className="w-full">
                    {language === 'no' ? 'API Tester' : 'API Tester'}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/llm-providers" className="w-full">
                    {language === 'no' ? 'LLM-leverandører' : 'LLM Providers'}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/docker" className="w-full">
                    {language === 'no' ? 'Docker' : 'Docker'}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/system-monitor" className="w-full">
                    💻 {language === 'no' ? 'Systemovervåkning' : 'System Monitor'}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/blog/admin" className="w-full">
                    {language === 'no' ? 'Blogg Admin' : 'Blog Admin'}
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
            <DropdownMenu
              open={isUnauthMenuOpen}
              onOpenChange={setIsUnauthMenuOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-2 h-auto">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <img
                        src={
                          theme === 'dark'
                            ? '/logo_dark.svg'
                            : '/logo_light.svg'
                        }
                        alt="NXFS Logo"
                        className="w-8 h-8"
                      />
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <div className="p-4">
                  <h3 className="font-medium mb-3">
                    {language === 'no' ? 'Innstillinger' : 'Settings'}
                  </h3>

                  {/* Theme Selection */}
                  <div className="mb-4">
                    <Label className="text-sm font-medium mb-2 block">
                      {language === 'no' ? 'Tema' : 'Theme'}
                    </Label>
                    <RadioGroup
                      value={theme}
                      onValueChange={(value: 'light' | 'dark' | 'purple') =>
                        setTheme(value)
                      }
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="light" id="light" />
                        <Label
                          htmlFor="light"
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <Sun className="h-4 w-4" />
                          {language === 'no' ? 'Lys' : 'Light'}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dark" id="dark" />
                        <Label
                          htmlFor="dark"
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <Moon className="h-4 w-4" />
                          {language === 'no' ? 'Mørk' : 'Dark'}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="purple" id="purple" />
                        <Label
                          htmlFor="purple"
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <Palette className="h-4 w-4" />
                          {language === 'no' ? 'Lilla' : 'Purple'}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Language Selection */}
                  <div className="mb-4">
                    <Label className="text-sm font-medium mb-2 block">
                      {language === 'no' ? 'Språk' : 'Language'}
                    </Label>
                    <RadioGroup
                      value={language}
                      onValueChange={(value: 'en' | 'no') => setLanguage(value)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="en" id="en" />
                        <Label
                          htmlFor="en"
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          🇺🇸 English
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="no" />
                        <Label
                          htmlFor="no"
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          🇳🇴 Norsk
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/auth/signin" className="w-full">
                    <User className="mr-2 h-4 w-4" />
                    {language === 'no' ? 'Logg inn' : 'Sign In'}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Center - Site Title */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <Link
            href="/"
            className="font-semibold text-lg hover:opacity-80 transition-opacity"
          >
            nxfs.no
          </Link>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center space-x-2">
          {/* Language toggle for unauthenticated users */}
          {!isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'no' : 'en')}
              className="p-2"
              title={language === 'no' ? 'Switch to English' : 'Bytt til norsk'}
            >
              {language === 'en' ? '🇺🇸' : '🇳🇴'}
            </Button>
          )}

          {/* Authentication buttons */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user?.profile_picture}
                      alt={user?.display_name || user?.username}
                    />
                    <AvatarFallback>
                      {(user?.display_name || user?.username || 'U')
                        .charAt(0)
                        .toUpperCase()}
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
