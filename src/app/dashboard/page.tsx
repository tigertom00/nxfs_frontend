'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/navbar';
import ChatBot from '@/components/chat/chatbot';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import {
  FileText,
  Users,
  Settings,
  BarChart3,
  MessageSquare,
  Image,
  Video,
  Music,
  Code,
  BookOpen,
  Calendar,
  Bell,
  Star,
  TrendingUp,
} from 'lucide-react';

interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

function DashboardCard({ title, description, icon, action }: DashboardCardProps) {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            {icon}
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="mb-4">
          {description}
        </CardDescription>
        {action && (
          <Button onClick={action.onClick} className="w-full">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { isAuthenticated, user, isLoading, initialize } = useAuthStore();
  const { language, theme } = useUIStore();
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark', 'purple');
    document.documentElement.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            {language === 'no' ? 'Laster...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect to sign in
  }

  const texts = {
    welcome: language === 'no' ? 'Velkommen tilbake' : 'Welcome back',
    dashboard: language === 'no' ? 'Kontrollpanel' : 'Dashboard',
    subtitle: language === 'no' ? 'Her er en oversikt over aktivitetene dine' : 'Here\'s an overview of your activities',
    documents: language === 'no' ? 'Dokumenter' : 'Documents',
    documentsDesc: language === 'no' ? 'Se og administrer dokumentene dine' : 'View and manage your documents',
    team: language === 'no' ? 'Team' : 'Team',
    teamDesc: language === 'no' ? 'Administrer teammedlemmer og roller' : 'Manage team members and roles',
    analytics: language === 'no' ? 'Analyse' : 'Analytics',
    analyticsDesc: language === 'no' ? 'Se innsikt og statistikk' : 'View insights and statistics',
    messages: language === 'no' ? 'Meldinger' : 'Messages',
    messagesDesc: language === 'no' ? 'Se samtaler og meldinger' : 'View conversations and messages',
    media: language === 'no' ? 'Mediebibliotek' : 'Media Library',
    mediaDesc: language === 'no' ? 'Se bilder, videoer og filer' : 'View images, videos and files',
    projects: language === 'no' ? 'Prosjekter' : 'Projects',
    projectsDesc: language === 'no' ? 'Administrer prosjekter og oppgaver' : 'Manage projects and tasks',
    calendar: language === 'no' ? 'Kalender' : 'Calendar',
    calendarDesc: language === 'no' ? 'Se kommende arrangementer' : 'View upcoming events',
    notifications: language === 'no' ? 'Varsler' : 'Notifications',
    notificationsDesc: language === 'no' ? 'Se siste varsler' : 'View latest notifications',
    favorites: language === 'no' ? 'Favoritter' : 'Favorites',
    favoritesDesc: language === 'no' ? 'Se favorittelementene dine' : 'View your favorite items',
    viewAll: language === 'no' ? 'Se alle' : 'View All',
  };

  const dashboardCards = [
    {
      title: texts.documents,
      description: texts.documentsDesc,
      icon: <FileText className="h-5 w-5 text-primary" />,
      action: { label: texts.viewAll, onClick: () => console.log('View documents') },
    },
    {
      title: texts.team,
      description: texts.teamDesc,
      icon: <Users className="h-5 w-5 text-primary" />,
      action: { label: texts.viewAll, onClick: () => console.log('View team') },
    },
    {
      title: texts.analytics,
      description: texts.analyticsDesc,
      icon: <BarChart3 className="h-5 w-5 text-primary" />,
      action: { label: texts.viewAll, onClick: () => console.log('View analytics') },
    },
    {
      title: texts.messages,
      description: texts.messagesDesc,
      icon: <MessageSquare className="h-5 w-5 text-primary" />,
      action: { label: texts.viewAll, onClick: () => console.log('View messages') },
    },
    {
      title: texts.media,
      description: texts.mediaDesc,
      icon: <Image className="h-5 w-5 text-primary" aria-hidden="true" />, // eslint-disable-line jsx-a11y/alt-text
      action: { label: texts.viewAll, onClick: () => console.log('View media') },
    },
    {
      title: texts.projects,
      description: texts.projectsDesc,
      icon: <Code className="h-5 w-5 text-primary" />,
      action: { label: texts.viewAll, onClick: () => console.log('View projects') },
    },
    {
      title: texts.calendar,
      description: texts.calendarDesc,
      icon: <Calendar className="h-5 w-5 text-primary" />,
      action: { label: texts.viewAll, onClick: () => console.log('View calendar') },
    },
    {
      title: texts.notifications,
      description: texts.notificationsDesc,
      icon: <Bell className="h-5 w-5 text-primary" />,
      action: { label: texts.viewAll, onClick: () => console.log('View notifications') },
    },
    {
      title: texts.favorites,
      description: texts.favoritesDesc,
      icon: <Star className="h-5 w-5 text-primary" />,
      action: { label: texts.viewAll, onClick: () => console.log('View favorites') },
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {texts.welcome}, {user.display_name || user.username}!
            </h1>
            <p className="text-muted-foreground">
              {texts.subtitle}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === 'no' ? 'Totalt Prosjekter' : 'Total Projects'}
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">
                  +2.1% {language === 'no' ? 'fra forrige måned' : 'from last month'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === 'no' ? 'Aktive Brukere' : 'Active Users'}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">
                  +12% {language === 'no' ? 'fra forrige måned' : 'from last month'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === 'no' ? 'Nye Meldinger' : 'New Messages'}
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">
                  +1 {language === 'no' ? 'fra i dag' : 'from today'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === 'no' ? 'Fullført Oppgaver' : 'Completed Tasks'}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">
                  +4% {language === 'no' ? 'fra forrige uke' : 'from last week'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Dashboard Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardCards.map((card, index) => (
              <DashboardCard
                key={index}
                title={card.title}
                description={card.description}
                icon={card.icon}
                action={card.action}
              />
            ))}
          </div>
        </div>
      </main>
      <ChatBot />
    </div>
  );
}