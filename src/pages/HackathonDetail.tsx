import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, MapPin, ExternalLink, Bookmark, BookmarkCheck, 
  Clock, Trophy, Users, ArrowLeft, Globe, Zap
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCountdown, formatCountdown, getCountdownStatus } from '@/hooks/useCountdown';
import { HACKATHON_SOURCES, HACKATHON_MODES } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Hackathon } from '@/types/database';
import { cn } from '@/lib/utils';

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
          <h1 className="text-2xl font-bold mb-4">Hackathon not found</h1>
          <Link to="/hackathons">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Hackathons
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const source = HACKATHON_SOURCES[hackathon.source];
  const mode = HACKATHON_MODES[hackathon.mode];

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
            {/* Hero Image */}
            {hackathon.image_url && (
              <div className="relative h-64 md:h-80 rounded-xl overflow-hidden mb-6">
                <img
                  src={hackathon.image_url}
                  alt={hackathon.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
              </div>
            )}

            {/* Header */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className={source.color}>{source.name}</Badge>
              <Badge variant="secondary">{mode.icon} {mode.label}</Badge>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4">{hackathon.title}</h1>

            {hackathon.description && (
              <p className="text-lg text-muted-foreground mb-6">
                {hackathon.description}
              </p>
            )}

            {/* Skills */}
            {hackathon.skills && hackathon.skills.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Required Skills & Technologies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {hackathon.skills.map((skill) => (
                    <span key={skill} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Separator className="my-6" />

            {/* Event Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Event Details</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Start Date</p>
                        <p className="font-medium">{formatDate(hackathon.start_date)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-accent" />
                      <div>
                        <p className="text-sm text-muted-foreground">End Date</p>
                        <p className="font-medium">{formatDate(hackathon.end_date)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {hackathon.location && (
                  <Card className="glass-card">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Location</p>
                          <p className="font-medium">{hackathon.location}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-accent" />
                      <div>
                        <p className="text-sm text-muted-foreground">Mode</p>
                        <p className="font-medium">{mode.icon} {mode.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
            {/* Countdown Timer */}
            <Card className="glass-card sticky top-24">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Registration Deadline
                </h3>

                <div className={cn(
                  'text-center p-4 rounded-xl mb-4',
                  countdownStatus === 'urgent' && 'bg-destructive/10 border border-destructive',
                  countdownStatus === 'soon' && 'bg-warning/10 border border-warning',
                  countdownStatus === 'normal' && 'bg-primary/10 border border-primary'
                )}>
                  {timeLeft.total > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{timeLeft.days}</p>
                        <p className="text-xs text-muted-foreground">Days</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{timeLeft.hours}</p>
                        <p className="text-xs text-muted-foreground">Hours</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{timeLeft.minutes}</p>
                        <p className="text-xs text-muted-foreground">Mins</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{timeLeft.seconds}</p>
                        <p className="text-xs text-muted-foreground">Secs</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-lg font-semibold text-destructive">Registration Closed</p>
                  )}
                </div>

                <p className="text-sm text-muted-foreground text-center mb-4">
                  Deadline: {formatDate(hackathon.registration_deadline)}
                </p>

                {/* Prize Pool */}
                {hackathon.prize_pool && (
                  <div className="bg-accent/10 rounded-xl p-4 mb-4 text-center">
                    <Trophy className="h-6 w-6 text-accent mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Prize Pool</p>
                    <p className="text-2xl font-bold text-accent">{hackathon.prize_pool}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    className="w-full gradient-primary"
                    size="lg"
                    asChild
                    disabled={timeLeft.total <= 0}
                  >
                    <a
                      href={hackathon.registration_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Register Now
                      <ExternalLink className="ml-2 h-4 w-4" />
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
                        Saved
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
