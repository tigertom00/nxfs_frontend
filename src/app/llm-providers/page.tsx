'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/layouts/navbar';
import ChatBot from '@/components/features/chat/chatbot';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore, useUIStore } from '@/stores';
import { useDebounce, useLocalStorage } from '@/hooks';
import {
  ExternalLink,
  Search,
  Brain,
  Zap,
  Code,
  Book,
  Image,
  Mic,
  Video,
  Globe,
  Shield,
  Sparkles,
  Target,
  Rocket,
  Lightbulb,
  FileText,
  MessageSquare,
  Palette,
  Database,
} from 'lucide-react';

interface LLMProvider {
  id: string;
  name: string;
  url: string;
  description: string;
  features: string[];
  strengths: string[];
  category: string;
  pricing: string;
  icon: React.ReactNode;
  popular: boolean;
  new: boolean;
}

export default function LLMProvidersPage() {
  const { isAuthenticated } = useAuthStore();
  const { language, theme } = useUIStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useLocalStorage('llm-providers-category', 'all');

  // Debounce search term to avoid excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark', 'purple');
    document.documentElement.classList.add(theme);
  }, [theme]);

  const texts = {
    title: language === 'no' ? 'LLM-leverandører' : 'LLM Providers',
    subtitle:
      language === 'no'
        ? 'En omfattende liste over AI-modeller og plattformer'
        : 'A comprehensive list of AI models and platforms',
    search:
      language === 'no' ? 'Søk etter leverandører...' : 'Search providers...',
    allCategories: language === 'no' ? 'Alle kategorier' : 'All Categories',
    general: language === 'no' ? 'Generell' : 'General',
    coding: language === 'no' ? 'Koding' : 'Coding',
    creative: language === 'no' ? 'Kreativ' : 'Creative',
    research: language === 'no' ? 'Forskning' : 'Research',
    multimodal: language === 'no' ? 'Multimodal' : 'Multimodal',
    openSource: language === 'no' ? 'Åpen kildekode' : 'Open Source',
    enterprise: language === 'no' ? 'Bedrift' : 'Enterprise',
    free: language === 'no' ? 'Gratis' : 'Free',
    freemium: language === 'no' ? 'Freemium' : 'Freemium',
    paid: language === 'no' ? 'Betalt' : 'Paid',
    visitSite: language === 'no' ? 'Besøk nettsted' : 'Visit Site',
    popular: language === 'no' ? 'Populær' : 'Popular',
    new: language === 'no' ? 'Ny' : 'New',
    features: language === 'no' ? 'Funksjoner' : 'Features',
    strengths: language === 'no' ? 'Styrker' : 'Strengths',
    learnMore: language === 'no' ? 'Lær mer' : 'Learn More',
  };

  const providers: LLMProvider[] = [
    {
      id: 'chatgpt',
      name: 'ChatGPT',
      url: 'https://chatgpt.com',
      description:
        language === 'no'
          ? "OpenAI's flaggskiprodukt med GPT-4o, GPT-4, og GPT-3.5 for generell AI-assistanse."
          : "OpenAI's flagship product featuring GPT-4o, GPT-4, and GPT-3.5 for general AI assistance.",
      features: [texts.general, texts.coding, texts.creative, texts.multimodal],
      strengths: [
        language === 'no'
          ? 'Utmerkede skriveferdigheter'
          : 'Excellent writing capabilities',
        language === 'no'
          ? 'Sterk i koding og problemløsning'
          : 'Strong in coding and problem solving',
        language === 'no'
          ? 'Bilde- og dokumentanalyse'
          : 'Image and document analysis',
        language === 'no'
          ? 'Stort økosystem med plugins'
          : 'Large ecosystem with plugins',
      ],
      category: texts.general,
      pricing: texts.freemium,
      icon: <Brain className="h-6 w-6" />,
      popular: true,
      new: false,
    },
    {
      id: 'claude',
      name: 'Claude',
      url: 'https://claude.ai',
      description:
        language === 'no'
          ? "Anthropic's AI-assistent kjent for lange kontekstvinduer og sikkerhet."
          : "Anthropic's AI assistant known for long context windows and safety.",
      features: [texts.general, texts.coding, texts.research, texts.creative],
      strengths: [
        language === 'no' ? '200K tokens kontekst' : '200K tokens context',
        language === 'no'
          ? 'Sterk i dokumentanalyse'
          : 'Excellent at document analysis',
        language === 'no'
          ? 'Fokus på sikkerhet og etikk'
          : 'Focus on safety and ethics',
        language === 'no'
          ? 'God til komplekse oppgaver'
          : 'Good at complex tasks',
      ],
      category: texts.general,
      pricing: texts.freemium,
      icon: <Shield className="h-6 w-6" />,
      popular: true,
      new: false,
    },
    {
      id: 'gemini',
      name: 'Gemini',
      url: 'https://gemini.google.com',
      description:
        language === 'no'
          ? "Google's multimodale AI med integrasjon i Google-økosystemet."
          : "Google's multimodal AI with deep integration in Google ecosystem.",
      features: [texts.multimodal, texts.general, texts.creative],
      strengths: [
        language === 'no'
          ? 'Multimodal (tekst, bilder, lyd)'
          : 'Multimodal (text, images, audio)',
        language === 'no' ? 'Google-integrasjoner' : 'Google integrations',
        language === 'no' ? 'Sanntidsinformasjon' : 'Real-time information',
        language === 'no' ? 'Gratis tilgang' : 'Free access',
      ],
      category: texts.multimodal,
      pricing: texts.free,
      icon: <Sparkles className="h-6 w-6" />,
      popular: true,
      new: false,
    },
    {
      id: 'grok',
      name: 'Grok',
      url: 'https://grok.com',
      description:
        language === 'no'
          ? "xAI's AI-assistent med tilgang til sanntidsinformasjon fra X/Twitter."
          : "xAI's AI assistant with access to real-time information from X/Twitter.",
      features: [texts.general, texts.research],
      strengths: [
        language === 'no' ? 'Sanntidsdata fra X' : 'Real-time data from X',
        language === 'no' ? 'Oppdatert informasjon' : 'Up-to-date information',
        language === 'no' ? 'Sarkastisk personlighet' : 'Sarcastic personality',
        language === 'no' ? 'Raske svar' : 'Fast responses',
      ],
      category: texts.general,
      pricing: texts.paid,
      icon: <Zap className="h-6 w-6" />,
      popular: true,
      new: false,
    },
    {
      id: 'copilot',
      name: 'Microsoft Copilot',
      url: 'https://copilot.microsoft.com',
      description:
        language === 'no'
          ? "Microsoft's AI-assistent integrert i Windows og Office-produkter."
          : "Microsoft's AI assistant integrated into Windows and Office products.",
      features: [texts.general, texts.enterprise, texts.coding],
      strengths: [
        language === 'no'
          ? 'Dyp Office-integrasjon'
          : 'Deep Office integration',
        language === 'no' ? 'Windows-integrasjon' : 'Windows integration',
        language === 'no' ? 'Bedriftsfokus' : 'Enterprise focus',
        language === 'no' ? 'Produktivitetsverktøy' : 'Productivity tools',
      ],
      category: texts.enterprise,
      pricing: texts.freemium,
      icon: <Target className="h-6 w-6" />,
      popular: true,
      new: false,
    },
    {
      id: 'perplexity',
      name: 'Perplexity',
      url: 'https://perplexity.ai',
      description:
        language === 'no'
          ? 'AI-drevet søkemotor med kildehenvisninger og nøyaktige svar.'
          : 'AI-powered search engine with source citations and accurate answers.',
      features: [texts.research, texts.general],
      strengths: [
        language === 'no' ? 'Kildehenvisninger' : 'Source citations',
        language === 'no' ? 'Akademisk nøyaktighet' : 'Academic accuracy',
        language === 'no' ? 'Forskningsassistanse' : 'Research assistance',
        language === 'no' ? 'Sanntidsinformasjon' : 'Real-time information',
      ],
      category: texts.research,
      pricing: texts.freemium,
      icon: <Book className="h-6 w-6" />,
      popular: true,
      new: false,
    },
    {
      id: 'meta',
      name: 'Meta AI',
      url: 'https://meta.ai',
      description:
        language === 'no'
          ? 'Metas Llama 3-modeller med fokus på åpenhet og tilgjengelighet.'
          : "Meta's Llama 3 models focusing on openness and accessibility.",
      features: [texts.general, texts.openSource],
      strengths: [
        language === 'no' ? 'Åpen kildekode' : 'Open source',
        language === 'no' ? 'Høy ytelse' : 'High performance',
        language === 'no' ? 'Lokal kjøring mulig' : 'Local execution possible',
        language === 'no' ? 'Stort samfunn' : 'Large community',
      ],
      category: texts.openSource,
      pricing: texts.free,
      icon: <Rocket className="h-6 w-6" />,
      popular: true,
      new: false,
    },
    {
      id: 'groq',
      name: 'Groq',
      url: 'https://chat.groq.com',
      description:
        language === 'no'
          ? 'Ekstremt rask AI-inferens med LPU-teknologi for sanntidsapplikasjoner.'
          : 'Extremely fast AI inference with LPU technology for real-time applications.',
      features: [texts.general, texts.coding],
      strengths: [
        language === 'no' ? 'Blinkende rask' : 'Blazing fast',
        language === 'no' ? 'Lav latens' : 'Low latency',
        language === 'no' ? 'Sanntidsapplikasjoner' : 'Real-time applications',
        language === 'no' ? 'Utviklervennlig' : 'Developer friendly',
      ],
      category: texts.coding,
      pricing: texts.free,
      icon: <Lightbulb className="h-6 w-6" />,
      popular: false,
      new: false,
    },
    {
      id: 'mistral',
      name: 'Mistral',
      url: 'https://chat.mistral.ai',
      description:
        language === 'no'
          ? 'Europeisk ledende AI med fokus på effektivitet og flerspråklig støtte.'
          : 'European leading AI focusing on efficiency and multilingual support.',
      features: [texts.general, texts.openSource, texts.enterprise],
      strengths: [
        language === 'no' ? 'Flerspråklig sterk' : 'Multilingual strength',
        language === 'no' ? 'Europeisk personvern' : 'European privacy',
        language === 'no' ? 'Effektive modeller' : 'Efficient models',
        language === 'no' ? 'Bedriftsløsninger' : 'Enterprise solutions',
      ],
      category: texts.enterprise,
      pricing: texts.freemium,
      icon: <Globe className="h-6 w-6" />,
      popular: true,
      new: false,
    },
    {
      id: 'cohere',
      name: 'Coral',
      url: 'https://coral.cohere.com',
      description:
        language === 'no'
          ? 'Coheres enterprise-fokuserte AI med RAG- og søkekapabiliteter.'
          : "Cohere's enterprise-focused AI with RAG and search capabilities.",
      features: [texts.enterprise, texts.research],
      strengths: [
        language === 'no' ? 'RAG-integrasjon' : 'RAG integration',
        language === 'no' ? 'Bedriftssikkerhet' : 'Enterprise security',
        language === 'no' ? 'Dokumentforståelse' : 'Document understanding',
        language === 'no' ? 'Søkefunksjoner' : 'Search capabilities',
      ],
      category: texts.enterprise,
      pricing: texts.paid,
      icon: <Database className="h-6 w-6" />,
      popular: false,
      new: true,
    },
    {
      id: 'you',
      name: 'You.com',
      url: 'https://you.com',
      description:
        language === 'no'
          ? 'AI-søkemotor som kombinerer tradisjonell søk med AI-svar.'
          : 'AI search engine combining traditional search with AI answers.',
      features: [texts.research, texts.general],
      strengths: [
        language === 'no' ? 'Søk + AI kombinert' : 'Search + AI combined',
        language === 'no' ? 'Personlige resultater' : 'Personalized results',
        language === 'no' ? 'Privatlivsfokus' : 'Privacy focused',
        language === 'no'
          ? 'Rask informasjonstilgang'
          : 'Quick information access',
      ],
      category: texts.research,
      pricing: texts.freemium,
      icon: <Search className="h-6 w-6" />,
      popular: false,
      new: false,
    },
    {
      id: 'poe',
      name: 'Poe',
      url: 'https://poe.com',
      description:
        language === 'no'
          ? 'Plattform som gir tilgang til mange forskjellige AI-modeller i ett grensesnitt.'
          : 'Platform providing access to many different AI models in one interface.',
      features: [texts.general, texts.multimodal],
      strengths: [
        language === 'no'
          ? 'Mange modeller tilgjengelige'
          : 'Many models available',
        language === 'no' ? 'Ett grensesnitt' : 'Single interface',
        language === 'no' ? 'Samfunnsfunksjoner' : 'Community features',
        language === 'no' ? 'Eksperimentelle modeller' : 'Experimental models',
      ],
      category: texts.general,
      pricing: texts.freemium,
      icon: <MessageSquare className="h-6 w-6" />,
      popular: true,
      new: false,
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      url: 'https://deepseek.com',
      description:
        language === 'no'
          ? 'Kinesisk AI-selskap med sterke koding- og matematikkmodeller.'
          : 'Chinese AI company with strong coding and mathematics models.',
      features: [texts.coding, texts.research],
      strengths: [
        language === 'no' ? 'Sterk i matematikk' : 'Strong in mathematics',
        language === 'no' ? 'Kodingsekspertise' : 'Coding expertise',
        language === 'no' ? 'Åpen forskning' : 'Open research',
        language === 'no' ? 'Høy ytelse' : 'High performance',
      ],
      category: texts.coding,
      pricing: texts.free,
      icon: <Code className="h-6 w-6" />,
      popular: true,
      new: true,
    },
    {
      id: 'zai',
      name: 'Z.ai',
      url: 'https://z.ai',
      description:
        language === 'no'
          ? 'AI-plattform med fokus på koding og utviklerverktøy.'
          : 'AI platform focusing on coding and developer tools.',
      features: [texts.coding, texts.creative],
      strengths: [
        language === 'no' ? 'Utviklerfokusert' : 'Developer focused',
        language === 'no' ? 'Kodingsassistanse' : 'Coding assistance',
        language === 'no' ? 'Kreativ skriving' : 'Creative writing',
        language === 'no' ? 'Prosjektintegrasjon' : 'Project integration',
      ],
      category: texts.coding,
      pricing: texts.freemium,
      icon: <Palette className="h-6 w-6" />,
      popular: false,
      new: true,
    },
  ];

  const categories = [
    texts.allCategories,
    texts.general,
    texts.coding,
    texts.creative,
    texts.research,
    texts.multimodal,
    texts.openSource,
    texts.enterprise,
  ];

  const filteredProviders = providers.filter((provider) => {
    const matchesSearch =
      provider.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      provider.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      provider.strengths.some((strength) =>
        strength.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === texts.allCategories ||
      provider.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case texts.coding:
        return <Code className="h-4 w-4" />;
      case texts.creative:
        return <Palette className="h-4 w-4" />;
      case texts.research:
        return <Book className="h-4 w-4" />;
      case texts.multimodal:
        return <Image className="h-4 w-4" />;
      case texts.openSource:
        return <Rocket className="h-4 w-4" />;
      case texts.enterprise:
        return <Shield className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getPricingColor = (pricing: string) => {
    switch (pricing) {
      case texts.free:
        return 'bg-green-100 text-green-800';
      case texts.freemium:
        return 'bg-blue-100 text-blue-800';
      case texts.paid:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">{texts.title}</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {texts.subtitle}
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder={texts.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={
                    selectedCategory === category ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="flex items-center space-x-2"
                >
                  {category !== texts.allCategories &&
                    getCategoryIcon(category)}
                  <span>{category}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Providers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map((provider) => (
              <Card
                key={provider.id}
                className="h-full hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {provider.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <span>{provider.name}</span>
                          {provider.popular && (
                            <Badge variant="default" className="text-xs">
                              {texts.popular}
                            </Badge>
                          )}
                          {provider.new && (
                            <Badge variant="secondary" className="text-xs">
                              {texts.new}
                            </Badge>
                          )}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {provider.category}
                          </Badge>
                          <Badge
                            className={`text-xs ${getPricingColor(provider.pricing)}`}
                          >
                            {provider.pricing}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm leading-relaxed">
                    {provider.description}
                  </CardDescription>

                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center">
                      <Target className="h-4 w-4 mr-2" />
                      {texts.strengths}
                    </h4>
                    <ul className="space-y-1">
                      {provider.strengths.map((strength, index) => (
                        <li
                          key={index}
                          className="text-sm text-muted-foreground flex items-start"
                        >
                          <span className="w-1 h-1 bg-primary rounded-full mt-2 mr-2 flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center">
                      <Sparkles className="h-4 w-4 mr-2" />
                      {texts.features}
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {provider.features.map((feature, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={() =>
                      window.open(provider.url, '_blank', 'noopener,noreferrer')
                    }
                    className="w-full"
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {texts.visitSite}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProviders.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">
                {language === 'no'
                  ? 'Ingen leverandører funnet'
                  : 'No providers found'}
              </h3>
              <p className="text-muted-foreground">
                {language === 'no'
                  ? 'Prøv å justere søket eller filteret'
                  : 'Try adjusting your search or filters'}
              </p>
            </div>
          )}
        </div>
      </main>
      {isAuthenticated && <ChatBot />}
    </div>
  );
}
