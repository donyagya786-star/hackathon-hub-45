import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Calendar, Users, Bookmark, Trophy, Clock } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { HackathonCard } from '@/components/hackathons/HackathonCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Hackathon } from '@/types/database';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [savedHackathons, setSavedHackathons] = useState<Hackathon[]>([]);
  const [recommendedHackathons, setRecommendedHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, profile]);

  const fetchDashboardData = async () => {
    if (!user) return;

    // Fetch saved hackathons
    const { data: savedData } = await supabase
      .from('saved_hackathons')
      .select('hackathon_id')
      .eq('user_id', user.id);

    if (savedData && savedData.length > 0) {
      const hackathonIds = savedData.map((s) => s.hackathon_id);
      const { data: hackathonsData } = await supabase
        .from('hackathons')
        .select('*')
        .in('id', hackathonIds)
        .gte('registration_deadline', new Date().toISOString())
        .order('registration_deadline', { ascending: true });

      if (hackathonsData) {
        setSavedHackathons(hackathonsData as Hackathon[]);
      }
    }

    // Fetch recommended hackathons based on skills
    const { data: allHackathons } = await supabase
      .from('hackathons')
      .select('*')
      .eq('is_active', true)
      .gte('registration_deadline', new Date().toISOString())
      .order('registration_deadline', { ascending: true })
      .limit(10);

    if (allHackathons && profile?.skills) {
      // Filter by matching skills
      const recommended = (allHackathons as Hackathon[]).filter((h) =>
        h.skills?.some((skill) => profile.skills?.includes(skill))
      );
      setRecommendedHackathons(recommended.slice(0, 6));
    } else if (allHackathons) {
      setRecommendedHackathons((allHackathons as Hackathon[]).slice(0, 6));
    }

    setLoading(false);
  };

  const handleUnsave = async (hackathonId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('saved_hackathons')
      .delete()
      .eq('user_id', user.id)
      .eq('hackathon_id', hackathonId);

    if (!error) {
      setSavedHackathons((prev) => prev.filter((h) => h.id !== hackathonId));
      toast({
        title: 'Removed',
        description: 'Hackathon removed from saved list',
      });
    }
  };

  if (authLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="h-96 rounded-xl bg-secondary animate-pulse" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Developer'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Track your hackathons and discover new opportunities
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Saved Hackathons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{savedHackathons.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Your Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{profile?.skills?.length || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent" />
                <span className="text-2xl font-bold">
                  {savedHackathons.filter(
                    (h) => new Date(h.start_date) > new Date()
                  ).length}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ending Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-destructive" />
                <span className="text-2xl font-bold">
                  {savedHackathons.filter((h) => {
                    const deadline = new Date(h.registration_deadline);
                    const now = new Date();
                    const threeDays = 3 * 24 * 60 * 60 * 1000;
                    return deadline.getTime() - now.getTime() < threeDays;
                  }).length}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Saved Hackathons */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <Bookmark className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Your Saved Hackathons</h2>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-80 rounded-xl bg-secondary animate-pulse" />
              ))}
            </div>
          ) : savedHackathons.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedHackathons.map((hackathon) => (
                <HackathonCard
                  key={hackathon.id}
                  hackathon={hackathon}
                  isSaved={true}
                  onUnsave={handleUnsave}
                />
              ))}
            </div>
          ) : (
            <Card className="glass-card p-8 text-center">
              <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No saved hackathons yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Browse hackathons and save the ones you're interested in
              </p>
              <a href="/hackathons" className="text-primary hover:underline">
                Browse Hackathons →
              </a>
            </Card>
          )}
        </motion.section>

        {/* Recommended Hackathons */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-semibold">Recommended for You</h2>
            {profile?.skills && profile.skills.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                Based on your skills
              </Badge>
            )}
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-80 rounded-xl bg-secondary animate-pulse" />
              ))}
            </div>
          ) : recommendedHackathons.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedHackathons.map((hackathon) => (
                <HackathonCard
                  key={hackathon.id}
                  hackathon={hackathon}
                  isSaved={savedHackathons.some((h) => h.id === hackathon.id)}
                  showSaveButton={false}
                />
              ))}
            </div>
          ) : (
            <Card className="glass-card p-8 text-center">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Add skills to get recommendations</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Update your profile with your skills to see personalized hackathon recommendations
              </p>
              <a href="/profile" className="text-primary hover:underline">
                Update Profile →
              </a>
            </Card>
          )}
        </motion.section>
      </div>
    </MainLayout>
  );
}
