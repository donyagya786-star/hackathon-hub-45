import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { HackathonCard } from '@/components/hackathons/HackathonCard';
import { HackathonFiltersComponent, HackathonFilters } from '@/components/hackathons/HackathonFilters';
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
      .gte('registration_deadline', new Date().toISOString())
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

  const filteredHackathons = useMemo(() => {
    let result = [...hackathons];

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
  }, [hackathons, filters]);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="gradient-primary rounded-lg p-2">
              <Layers className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold">Hackathons</h1>
          </div>
          <p className="text-muted-foreground">
            Discover upcoming hackathons from top platforms
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <HackathonFiltersComponent filters={filters} onFiltersChange={setFilters} />
        </motion.div>

        {/* Results Count */}
        <p className="text-sm text-muted-foreground mb-6">
          Showing {filteredHackathons.length} hackathon{filteredHackathons.length !== 1 ? 's' : ''}
        </p>

        {/* Hackathon Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 rounded-xl bg-secondary animate-pulse" />
            ))}
          </div>
        ) : filteredHackathons.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {filteredHackathons.map((hackathon) => (
              <HackathonCard
                key={hackathon.id}
                hackathon={hackathon}
                isSaved={savedIds.has(hackathon.id)}
                onSave={handleSave}
                onUnsave={handleUnsave}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Layers className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hackathons found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or check back later
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
