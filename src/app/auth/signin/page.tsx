'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { Loader2 } from 'lucide-react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, error, clearError } = useAuthStore();
  const { language } = useUIStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      // Error is handled by the store
    } finally {
      setIsLoading(false);
    }
  };

  const texts = {
    title: language === 'no' ? 'Logg inn' : 'Sign In',
    description:
      language === 'no'
        ? 'Logg inn på kontoen din for å fortsette'
        : 'Sign in to your account to continue',
    emailLabel: language === 'no' ? 'E-post' : 'Email',
    passwordLabel: language === 'no' ? 'Passord' : 'Password',
    signInButton: language === 'no' ? 'Logg inn' : 'Sign In',
    backToHome: language === 'no' ? 'Tilbake til hjemmesiden' : 'Back to home',
    invalidCredentials:
      language === 'no'
        ? 'Ugyldig e-post eller passord'
        : 'Invalid email or password',
    networkError:
      language === 'no'
        ? 'Nettverksfeil. Vennligst prøv igjen.'
        : 'Network error. Please try again.',
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">{texts.title}</CardTitle>
          <CardDescription className="text-center">
            {texts.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{texts.emailLabel}</Label>
              <Input
                id="email"
                type="email"
                placeholder={
                  language === 'no' ? 'din@epost.no' : 'your@email.com'
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{texts.passwordLabel}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {error === 'Invalid credentials'
                    ? texts.invalidCredentials
                    : texts.networkError}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === 'no' ? 'Logger inn...' : 'Signing in...'}
                </>
              ) : (
                texts.signInButton
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-primary underline"
            >
              {texts.backToHome}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
