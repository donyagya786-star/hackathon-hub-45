import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Layers, RefreshCw, Play, Clock } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { HackathonCard } from '@/components/hackathons/HackathonCard';
import { HackathonFiltersComponent, HackathonFilters } from '@/components/hackathons/HackathonFilters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Hackathon } from '@/types/database';

export default function HackathonsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [filters, setFilters] = useState<HackathonFilters>({
    search: '',
    source: null,
    mode: null,
    skills: [],
    onlineOnly: false,
    sortBy: 'deadline',
  });

  useEffect(() => {
    fetchHackathons();
    if (user) {
      fetchSavedHackathons();
    }
  }, [user]);

  const fetchHackathons = async () => {
    const { data, error } = await supabase
      .from('hackathons')
      .select('*')
      .eq('is_active', true)
      .order('registration_deadline', { ascending: true });

    if (error) {
      console.error('Error fetching hackathons:', error);
    } else {
      setHackathons(data as Hackathon[]);
    }
    setLoading(false);
  };

  const fetchSavedHackathons = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('saved_hackathons')
      .select('hackathon_id')
      .eq('user_id', user.id);

    if (!error && data) {
      setSavedIds(new Set(data.map((s) => s.hackathon_id)));
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-hackathons');
      
      if (error) {
        toast({
          title: 'Sync failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Sync complete!',
          description: data.message,
        });
        // Refresh hackathons list
        await fetchHackathons();
      }
    } catch (err) {
      toast({
        title: 'Sync failed',
        description: 'Could not sync hackathons',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = async (hackathonId: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save hackathons',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('saved_hackathons')
      .insert({ user_id: user.id, hackathon_id: hackathonId });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save hackathon',
        variant: 'destructive',
      });
    } else {
      setSavedIds((prev) => new Set([...prev, hackathonId]));
      toast({
        title: 'Saved!',
        description: 'Hackathon added to your dashboard',
      });
    }
  };

  const handleUnsave = async (hackathonId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('saved_hackathons')
      .delete()
      .eq('user_id', user.id)
      .eq('hackathon_id', hackathonId);

    if (!error) {
      setSavedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(hackathonId);
        return newSet;
      });
      toast({
        title: 'Removed',
        description: 'Hackathon removed from saved list',
      });
    }
  };

  // Categorize hackathons
  const categorizedHackathons = useMemo(() => {
    const now = new Date();
    
    const ongoing = hackathons.filter((h) => {
      const start = new Date(h.start_date);
      const end = new Date(h.end_date);
      return start <= now && end >= now;
    });

    const upcoming = hackathons.filter((h) => {
      const start = new Date(h.start_date);
      return start > now;
    });

    const saved = hackathons.filter((h) => savedIds.has(h.id));

    return { ongoing, upcoming, saved };
  }, [hackathons, savedIds]);

  // Apply filters to current tab's hackathons
  const getFilteredHackathons = (list: Hackathon[]) => {
    let result = [...list];

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (h) =>
          h.title.toLowerCase().includes(search) ||
          h.description?.toLowerCase().includes(search) ||
          h.skills?.some((s) => s.toLowerCase().includes(search))
      );
    }

    // Source filter
    if (filters.source) {
      result = result.filter((h) => h.source === filters.source);
    }

    // Online only filter
    if (filters.onlineOnly) {
      result = result.filter((h) => h.mode === 'online' || h.mode === 'hybrid');
    }

    // Skills filter
    if (filters.skills.length > 0) {
      result = result.filter((h) =>
        filters.skills.some((skill) => h.skills?.includes(skill))
      );
    }

    // Sorting
    if (filters.sortBy === 'deadline') {
      result.sort((a, b) => 
        new Date(a.registration_deadline).getTime() - new Date(b.registration_deadline).getTime()
      );
    } else if (filters.sortBy === 'newest') {
      result.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return result;
  };

  const currentHackathons = useMemo(() => {
    switch (activeTab) {
      case 'ongoing':
        return getFilteredHackathons(categorizedHackathons.ongoing);
      case 'upcoming':
        return getFilteredHackathons(categorizedHackathons.upcoming);
      case 'saved':
        return getFilteredHackathons(categorizedHackathons.saved);
      default:
        return getFilteredHackathons(categorizedHackathons.upcoming);
    }
  }, [activeTab, categorizedHackathons, filters]);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="gradient-primary rounded-lg p-2">
                <Layers className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold">Hackathons</h1>
            </div>
            <Button
              variant="outline"
              onClick={handleSync}
              disabled={syncing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Latest'}
            </Button>
          </div>
          <p className="text-muted-foreground">
            Discover upcoming hackathons from MLH, Devfolio, Unstop, Devpost & more
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <HackathonFiltersComponent filters={filters} onFiltersChange={setFilters} />
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="ongoing" className="gap-2">
              <Play className="h-4 w-4" />
              Ongoing
              <Badge variant="secondary" className="ml-1">
                {categorizedHackathons.ongoing.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2">
              <Clock className="h-4 w-4" />
              Upcoming
              <Badge variant="secondary" className="ml-1">
                {categorizedHackathons.upcoming.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2">
              Saved
              <Badge variant="secondary" className="ml-1">
                {categorizedHackathons.saved.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <p className="text-sm text-muted-foreground">
            Showing {currentHackathons.length} hackathon{currentHackathons.length !== 1 ? 's' : ''}
          </p>

          {/* Hackathon Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 rounded-xl bg-secondary animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <TabsContent value="ongoing" className="mt-0">
                <HackathonGrid
                  hackathons={currentHackathons}
                  savedIds={savedIds}
                  onSave={handleSave}
                  onUnsave={handleUnsave}
                  emptyMessage="No ongoing hackathons right now"
                  emptyDescription="Check the upcoming tab for future events"
                />
              </TabsContent>

              <TabsContent value="upcoming" className="mt-0">
                <HackathonGrid
                  hackathons={currentHackathons}
                  savedIds={savedIds}
                  onSave={handleSave}
                  onUnsave={handleUnsave}
                  emptyMessage="No upcoming hackathons found"
                  emptyDescription="Try adjusting your filters or check back later"
                />
              </TabsContent>

              <TabsContent value="saved" className="mt-0">
                <HackathonGrid
                  hackathons={currentHackathons}
                  savedIds={savedIds}
                  onSave={handleSave}
                  onUnsave={handleUnsave}
                  emptyMessage="No saved hackathons"
                  emptyDescription="Save hackathons to track them here"
                />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
}

interface HackathonGridProps {
  hackathons: Hackathon[];
  savedIds: Set<string>;
  onSave: (id: string) => void;
  onUnsave: (id: string) => void;
  emptyMessage: string;
  emptyDescription: string;
}

function HackathonGrid({ 
  hackathons, 
  savedIds, 
  onSave, 
  onUnsave, 
  emptyMessage, 
  emptyDescription 
}: HackathonGridProps) {
  if (hackathons.length === 0) {
    return (
      <div className="text-center py-16">
        <Layers className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">{emptyMessage}</h3>
        <p className="text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
      {hackathons.map((hackathon) => (
        <HackathonCard
          key={hackathon.id}
          hackathon={hackathon}
          isSaved={savedIds.has(hackathon.id)}
          onSave={onSave}
          onUnsave={onUnsave}
        />
      ))}
    </div>
  );
}
