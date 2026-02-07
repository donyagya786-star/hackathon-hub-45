import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, MapPin, ExternalLink, Bookmark, BookmarkCheck, 
  Clock, Trophy, ArrowLeft, Globe, Zap, Code2, Users, Share2
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCountdown, getCountdownStatus } from '@/hooks/useCountdown';
import { HACKATHON_SOURCES, HACKATHON_MODES } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Hackathon } from '@/types/database';
import { cn } from '@/lib/utils';

// Generate gradient background colors
const getGradientColors = (source: string): { from: string; via: string; to: string } => {
  const gradients: Record<string, { from: string; via: string; to: string }> = {
    mlh: { from: '#3b82f6', via: '#6366f1', to: '#8b5cf6' },
    devfolio: { from: '#10b981', via: '#14b8a6', to: '#06b6d4' },
    unstop: { from: '#f97316', via: '#ef4444', to: '#ec4899' },
    devpost: { from: '#a855f7', via: '#8b5cf6', to: '#6366f1' },
    community: { from: '#f59e0b', via: '#eab308', to: '#84cc16' },
  };
  return gradients[source] || gradients.community;
};

export default function HackathonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const timeLeft = useCountdown(hackathon?.registration_deadline || new Date().toISOString());
  const countdownStatus = getCountdownStatus(timeLeft);

  useEffect(() => {
    if (id) {
      fetchHackathon();
      if (user) {
        checkIfSaved();
      }
    }
  }, [id, user]);

  const fetchHackathon = async () => {
    const { data, error } = await supabase
      .from('hackathons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching hackathon:', error);
    } else {
      setHackathon(data as Hackathon);
    }
    setLoading(false);
  };

  const checkIfSaved = async () => {
    if (!user || !id) return;

    const { data } = await supabase
      .from('saved_hackathons')
      .select('id')
      .eq('user_id', user.id)
      .eq('hackathon_id', id)
      .single();

    setIsSaved(!!data);
  };

  const handleSaveToggle = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save hackathons',
        variant: 'destructive',
      });
      return;
    }

    if (!hackathon) return;

    if (isSaved) {
      const { error } = await supabase
        .from('saved_hackathons')
        .delete()
        .eq('user_id', user.id)
        .eq('hackathon_id', hackathon.id);

      if (!error) {
        setIsSaved(false);
        toast({
          title: 'Removed',
          description: 'Hackathon removed from saved list',
        });
      }
    } else {
      const { error } = await supabase
        .from('saved_hackathons')
        .insert({ user_id: user.id, hackathon_id: hackathon.id });

      if (!error) {
        setIsSaved(true);
        toast({
          title: 'Saved!',
          description: 'Hackathon added to your dashboard',
        });
      }
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: hackathon?.title,
          text: `Check out ${hackathon?.title} on FutureStack!`,
          url,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied!',
        description: 'Hackathon link copied to clipboard',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="h-96 rounded-xl bg-secondary animate-pulse" />
        </div>
      </MainLayout>
    );
  }

  if (!hackathon) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 text-center">
          <Code2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-4">Hackathon not found</h1>
          <p className="text-muted-foreground mb-6">This hackathon may have been removed or the link is incorrect.</p>
          <Link to="/hackathons">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Browse Hackathons
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const source = HACKATHON_SOURCES[hackathon.source];
  const mode = HACKATHON_MODES[hackathon.mode];
  const gradientColors = getGradientColors(hackathon.source);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link to="/hackathons">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Hackathons
            </Button>
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            {/* Hero Banner - Always visible with beautiful design */}
            <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-6 shadow-xl">
              {/* Gradient background */}
              <div 
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${gradientColors.from}, ${gradientColors.via}, ${gradientColors.to})`
                }}
              />
              
              {/* Pattern overlay */}
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
              
              {/* If actual image exists, show it */}
              {hackathon.image_url && (
                <img
                  src={hackathon.image_url}
                  alt={hackathon.title}
                  className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50"
                />
              )}
              
              {/* Central logo/icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/30">
                  <Code2 className="h-12 w-12 text-white" />
                </div>
              </div>
              
              {/* Bottom gradient for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                <div className={cn('px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg', source.color)}>
                  {source.name}
                </div>
                <div className="px-3 py-1.5 rounded-full text-sm font-medium bg-background/90 backdrop-blur-sm shadow-lg">
                  {mode.icon} {mode.label}
                </div>
              </div>
              
              {/* Share button */}
              <Button 
                variant="outline" 
                size="icon"
                className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm shadow-lg"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              
              {/* Title on banner */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                  {hackathon.title}
                </h1>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <p className="text-lg text-muted-foreground leading-relaxed">
                {hackathon.description || `Join ${hackathon.title} - an exciting hackathon hosted on ${source.name}. Build innovative projects, collaborate with talented developers, and compete for amazing prizes!`}
              </p>
            </div>

            {/* Skills */}
            {hackathon.skills && hackathon.skills.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Technologies & Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {hackathon.skills.map((skill) => (
                    <span key={skill} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Separator className="my-6" />

            {/* Event Details Grid */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Event Details
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="glass-card border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Start Date</p>
                        <p className="font-semibold">{formatShortDate(hackathon.start_date)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-l-4 border-l-accent">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-accent/10">
                        <Calendar className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">End Date</p>
                        <p className="font-semibold">{formatShortDate(hackathon.end_date)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Location</p>
                        <p className="font-semibold">{hackathon.location || 'Online / TBA'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-l-4 border-l-accent">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-accent/10">
                        <Globe className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Mode</p>
                        <p className="font-semibold">{mode.icon} {mode.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* About Section */}
            <Separator className="my-6" />
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-primary" />
                About This Hackathon
              </h3>
              <div className="bg-muted/50 rounded-xl p-6 space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  {hackathon.description || `${hackathon.title} is an exciting hackathon event where developers, designers, and innovators come together to build amazing projects. Whether you're a beginner or an experienced developer, this is your chance to learn, create, and compete for prizes.`}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Registration and participation happen on <span className="font-semibold text-foreground">{source.name}</span>. Click the "Register Now" button to visit the official hackathon page and secure your spot.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Sticky Card */}
            <Card className="glass-card sticky top-24 overflow-hidden shadow-xl">
              {/* Prize banner */}
              <div 
                className="p-6 text-center"
                style={{
                  background: `linear-gradient(135deg, ${gradientColors.from}, ${gradientColors.via})`
                }}
              >
                <Trophy className="h-10 w-10 text-white mx-auto mb-2" />
                <p className="text-white/80 text-sm">Total Prize Pool</p>
                <p className="text-3xl font-bold text-white">{hackathon.prize_pool || 'Prizes TBA'}</p>
              </div>
              
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Registration Deadline
                </h3>

                {/* Countdown Timer */}
                <div className={cn(
                  'text-center p-4 rounded-xl mb-4',
                  countdownStatus === 'urgent' && 'bg-destructive/10 border-2 border-destructive',
                  countdownStatus === 'soon' && 'bg-warning/10 border-2 border-warning',
                  countdownStatus === 'normal' && 'bg-primary/10 border-2 border-primary'
                )}>
                  {timeLeft.total > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      <div className="text-center">
                        <p className="text-3xl font-bold">{timeLeft.days}</p>
                        <p className="text-xs text-muted-foreground font-medium">DAYS</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold">{timeLeft.hours}</p>
                        <p className="text-xs text-muted-foreground font-medium">HRS</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold">{timeLeft.minutes}</p>
                        <p className="text-xs text-muted-foreground font-medium">MIN</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold">{timeLeft.seconds}</p>
                        <p className="text-xs text-muted-foreground font-medium">SEC</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-lg font-semibold text-destructive">Registration Closed</p>
                  )}
                </div>

                <p className="text-sm text-muted-foreground text-center mb-6">
                  {formatDate(hackathon.registration_deadline)}
                </p>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    className="w-full text-lg py-6 shadow-lg"
                    size="lg"
                    asChild
                    disabled={timeLeft.total <= 0}
                    style={{
                      background: `linear-gradient(135deg, ${gradientColors.from}, ${gradientColors.to})`
                    }}
                  >
                    <a
                      href={hackathon.registration_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Register Now
                      <ExternalLink className="ml-2 h-5 w-5" />
                    </a>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    onClick={handleSaveToggle}
                  >
                    {isSaved ? (
                      <>
                        <BookmarkCheck className="mr-2 h-5 w-5 text-primary" />
                        Saved to Dashboard
                      </>
                    ) : (
                      <>
                        <Bookmark className="mr-2 h-5 w-5" />
                        Save for Later
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Registration happens on {source.name}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
