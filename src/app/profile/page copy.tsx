'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layouts/navbar';
import ChatBot from '@/components/features/chat/chatbot';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { usersAPI } from '@/lib/api';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Globe,
  MapPin,
  Edit,
  Save,
  X,
  Camera,
  Loader2,
} from 'lucide-react';

interface UserProfile {
  id: number;
  email: string;
  display_name: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  address: string;
  city: string;
  country: string;
  website: string;
  phone: string | null;
  profile_picture: string;
  date_joined: string;
  last_login: string;
  theme: 'light' | 'dark' | 'purple' | 'pink' | 'system';
  chat_session_id: string;
  language: string;
}

export default function ProfilePage() {
  const { user, isAuthenticated, updateUser, isLoading, initialize } =
    useAuthStore();
  const { language } = useUIStore();
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        display_name: user.display_name || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        date_of_birth: user.date_of_birth || '',
        address: user.address || '',
        city: user.city || '',
        country: user.country || '',
        website: user.website || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    const payload = { ...formData };
    if (!payload.date_of_birth) {
      delete payload.date_of_birth;
    }

    try {
      await updateUser(payload);
      setSuccess(true);
      setIsEditing(false);
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      const errorMessages = Object.values(err.response?.data ?? {}).flat();
      setError(
        errorMessages.length > 0
          ? errorMessages.join('\n')
          : language === 'no'
            ? 'Kunne ikke oppdatere profil'
            : 'Failed to update profile'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        display_name: user.display_name || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        date_of_birth: user.date_of_birth || '',
        address: user.address || '',
        city: user.city || '',
        country: user.country || '',
        website: user.website || '',
        phone: user.phone || '',
      });
    }
    setIsEditing(false);
    setError(null);
    setSuccess(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      language === 'no' ? 'nb-NO' : 'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  };

  const texts = {
    title: language === 'no' ? 'Profil' : 'Profile',
    editProfile: language === 'no' ? 'Rediger profil' : 'Edit Profile',
    saveProfile: language === 'no' ? 'Lagre profil' : 'Save Profile',
    cancel: language === 'no' ? 'Avbryt' : 'Cancel',
    personalInfo:
      language === 'no' ? 'Personlig informasjon' : 'Personal Information',
    displayName: language === 'no' ? 'Visningsnavn' : 'Display Name',
    firstName: language === 'no' ? 'Fornavn' : 'First Name',
    lastName: language === 'no' ? 'Etternavn' : 'Last Name',
    email: language === 'no' ? 'E-post' : 'Email',
    phone: language === 'no' ? 'Telefon' : 'Phone',
    dateOfBirth: language === 'no' ? 'Fødselsdato' : 'Date of Birth',
    address: language === 'no' ? 'Adresse' : 'Address',
    city: language === 'no' ? 'By' : 'City',
    country: language === 'no' ? 'Land' : 'Country',
    website: language === 'no' ? 'Nettsted' : 'Website',
    accountInfo: language === 'no' ? 'Kontoinformasjon' : 'Account Information',
    memberSince: language === 'no' ? 'Medlem siden' : 'Member Since',
    lastLogin: language === 'no' ? 'Sist innlogget' : 'Last Login',
    chatSessionId: language === 'no' ? 'Chat-økt-ID' : 'Chat Session ID',
    preferences: language === 'no' ? 'Preferanser' : 'Preferences',
    language: language === 'no' ? 'Språk' : 'Language',
    theme: language === 'no' ? 'Tema' : 'Theme',
    darkMode: language === 'no' ? 'Mørk modus' : 'Dark Mode',
    updateSuccess: language === 'no' ? 'Profil oppdatert!' : 'Profile updated!',
    updateError:
      language === 'no'
        ? 'Kunne ikke oppdatere profil'
        : 'Failed to update profile',
    loading: language === 'no' ? 'Laster...' : 'Loading...',
    save: language === 'no' ? 'Lagre' : 'Save',
    edit: language === 'no' ? 'Rediger' : 'Edit',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{texts.loading}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect to sign in
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">{texts.title}</h1>
              <p className="text-muted-foreground">{texts.personalInfo}</p>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                {texts.editProfile}
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  {texts.cancel}
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {texts.saveProfile}
                </Button>
              </div>
            )}
          </div>

          {/* Success/Error Messages */}
          {success && (
            <Alert className="mb-6">
              <AlertDescription className="text-green-600">
                {texts.updateSuccess}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Profile Card */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage
                      src={user.profile_picture}
                      alt={user.display_name || user.username}
                    />
                    <AvatarFallback className="text-2xl">
                      {(user.display_name || user.username || 'U')
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                      variant="secondary"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">
                    {user.display_name || user.username}
                  </h2>
                  <p className="text-muted-foreground">{user.email}</p>
                  <div className="flex space-x-2 mt-2">
                    <Badge variant="secondary">
                      {user.dark_mode ? texts.darkMode : texts.theme}
                    </Badge>
                    <Badge variant="outline">
                      {user.language === 'no' ? 'Norsk' : 'English'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Personal Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{texts.personalInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="displayName">{texts.displayName}</Label>
                  {isEditing ? (
                    <Input
                      id="displayName"
                      value={formData.display_name || ''}
                      onChange={(e) =>
                        handleInputChange('display_name', e.target.value)
                      }
                      placeholder={texts.displayName}
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-2 border rounded-md bg-muted/50">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{user.display_name || '-'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{texts.email}</Label>
                  <div className="flex items-center space-x-2 p-2 border rounded-md bg-muted/50">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firstName">{texts.firstName}</Label>
                  {isEditing ? (
                    <Input
                      id="firstName"
                      value={formData.first_name || ''}
                      onChange={(e) =>
                        handleInputChange('first_name', e.target.value)
                      }
                      placeholder={texts.firstName}
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-2 border rounded-md bg-muted/50">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{user.first_name || '-'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">{texts.lastName}</Label>
                  {isEditing ? (
                    <Input
                      id="lastName"
                      value={formData.last_name || ''}
                      onChange={(e) =>
                        handleInputChange('last_name', e.target.value)
                      }
                      placeholder={texts.lastName}
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-2 border rounded-md bg-muted/50">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{user.last_name || '-'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{texts.phone}</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone || ''}
                      onChange={(e) =>
                        handleInputChange('phone', e.target.value)
                      }
                      placeholder={texts.phone}
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-2 border rounded-md bg-muted/50">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{user.phone || '-'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">{texts.dateOfBirth}</Label>
                  {isEditing ? (
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.date_of_birth || ''}
                      onChange={(e) =>
                        handleInputChange('date_of_birth', e.target.value)
                      }
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-2 border rounded-md bg-muted/50">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {user.date_of_birth
                          ? new Date(user.date_of_birth).toLocaleDateString()
                          : '-'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="address">{texts.address}</Label>
                  {isEditing ? (
                    <Input
                      id="address"
                      value={formData.address || ''}
                      onChange={(e) =>
                        handleInputChange('address', e.target.value)
                      }
                      placeholder={texts.address}
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-2 border rounded-md bg-muted/50">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{user.address || '-'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">{texts.city}</Label>
                  {isEditing ? (
                    <Input
                      id="city"
                      value={formData.city || ''}
                      onChange={(e) =>
                        handleInputChange('city', e.target.value)
                      }
                      placeholder={texts.city}
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-2 border rounded-md bg-muted/50">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{user.city || '-'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">{texts.country}</Label>
                  {isEditing ? (
                    <Input
                      id="country"
                      value={formData.country || ''}
                      onChange={(e) =>
                        handleInputChange('country', e.target.value)
                      }
                      placeholder={texts.country}
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-2 border rounded-md bg-muted/50">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>{user.country || '-'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">{texts.website}</Label>
                {isEditing ? (
                  <Input
                    id="website"
                    value={formData.website || ''}
                    onChange={(e) =>
                      handleInputChange('website', e.target.value)
                    }
                    placeholder={texts.website}
                  />
                ) : (
                  <div className="flex items-center space-x-2 p-2 border rounded-md bg-muted/50">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {user.website ? (
                        <a
                          href={user.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {user.website}
                        </a>
                      ) : (
                        '-'
                      )}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{texts.accountInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{texts.memberSince}</Label>
                  <div className="flex items-center space-x-2 p-2 border rounded-md bg-muted/50">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(user.date_joined)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{texts.lastLogin}</Label>
                  <div className="flex items-center space-x-2 p-2 border rounded-md bg-muted/50">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {user.last_login ? formatDate(user.last_login) : '-'}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>{texts.chatSessionId}</Label>
                <div className="flex items-center space-x-2 p-2 border rounded-md bg-muted/50">
                  <span className="text-sm font-mono">
                    {user.chat_session_id}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <ChatBot />
    </div>
  );
}
