import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Search, Sparkles } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { UserCard } from '@/components/team/UserCard';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { SKILL_OPTIONS } from '@/lib/constants';
import type { Profile, InviteStatus } from '@/types/database';

interface UserWithInviteStatus extends Profile {
  inviteStatus: InviteStatus | null;
  isIncoming: boolean;
}

export default function TeamMatchPage() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithInviteStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    if (!user) return;

    // Fetch all profiles except current user
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('user_id', user.id);

    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }

    // Fetch invites
    const { data: invites } = await supabase
      .from('team_invites')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    // Map profiles with invite status
    const usersWithStatus = (profiles as Profile[]).map((p) => {
      const sentInvite = invites?.find(
        (i) => i.sender_id === user.id && i.receiver_id === p.user_id
      );
      const receivedInvite = invites?.find(
        (i) => i.receiver_id === user.id && i.sender_id === p.user_id
      );

      return {
        ...p,
        inviteStatus: sentInvite?.status || receivedInvite?.status || null,
        isIncoming: !!receivedInvite && !sentInvite,
      };
    });

    setUsers(usersWithStatus);
    setLoading(false);
  };

  const handleSendInvite = async (receiverId: string) => {
    if (!user) return;

    const { error } = await supabase.from('team_invites').insert({
      sender_id: user.id,
      receiver_id: receiverId,
      status: 'pending',
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invite',
        variant: 'destructive',
      });
    } else {
      // Create notification for receiver
      await supabase.from('notifications').insert({
        user_id: receiverId,
        type: 'team_invite',
        title: 'New Team Invite',
        message: `${profile?.full_name || 'Someone'} wants to team up with you!`,
        data: { sender_id: user.id },
      });

      toast({
        title: 'Invite Sent!',
        description: 'Your team invite has been sent',
      });
      fetchUsers();
    }
  };

  const handleAcceptInvite = async (senderId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('team_invites')
      .update({ status: 'accepted' })
      .eq('sender_id', senderId)
      .eq('receiver_id', user.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept invite',
        variant: 'destructive',
      });
    } else {
      // Notify sender
      await supabase.from('notifications').insert({
        user_id: senderId,
        type: 'invite_accepted',
        title: 'Invite Accepted!',
        message: `${profile?.full_name || 'Someone'} accepted your team invite!`,
        data: { accepter_id: user.id },
      });

      toast({
        title: 'Accepted!',
        description: 'You are now teammates',
      });
      fetchUsers();
    }
  };

  const handleRejectInvite = async (senderId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('team_invites')
      .update({ status: 'rejected' })
      .eq('sender_id', senderId)
      .eq('receiver_id', user.id);

    if (!error) {
      // Notify sender
      await supabase.from('notifications').insert({
        user_id: senderId,
        type: 'invite_rejected',
        title: 'Invite Declined',
        message: `${profile?.full_name || 'Someone'} declined your team invite`,
        data: { rejecter_id: user.id },
      });

      toast({
        title: 'Declined',
        description: 'Invite has been declined',
      });
      fetchUsers();
    }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.skills?.some((s) => s.toLowerCase().includes(search.toLowerCase()));

    const matchesSkills =
      selectedSkills.length === 0 ||
      selectedSkills.some((skill) => u.skills?.includes(skill));

    return matchesSearch && matchesSkills;
  });

  // Sort: incoming invites first, then by skill match
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    // Incoming pending invites first
    if (a.isIncoming && a.inviteStatus === 'pending') return -1;
    if (b.isIncoming && b.inviteStatus === 'pending') return 1;

    // Then by number of matching skills
    const aMatches = a.skills?.filter((s) => profile?.skills?.includes(s)).length || 0;
    const bMatches = b.skills?.filter((s) => profile?.skills?.includes(s)).length || 0;
    return bMatches - aMatches;
  });

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
          <div className="flex items-center gap-3 mb-2">
            <div className="gradient-primary rounded-lg p-2">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold">Team Match</h1>
          </div>
          <p className="text-muted-foreground">
            Find developers with complementary skills and build your dream team
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4 mb-8"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground mr-2 self-center">
              Filter by skill:
            </span>
            {SKILL_OPTIONS.slice(0, 12).map((skill) => (
              <Badge
                key={skill}
                variant={selectedSkills.includes(skill) ? 'default' : 'outline'}
                className="cursor-pointer transition-colors"
                onClick={() => toggleSkill(skill)}
              >
                {skill}
              </Badge>
            ))}
          </div>
        </motion.div>

        {/* Pending Incoming Invites */}
        {sortedUsers.some((u) => u.isIncoming && u.inviteStatus === 'pending') && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold">Pending Invites</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedUsers
                .filter((u) => u.isIncoming && u.inviteStatus === 'pending')
                .map((user) => (
                  <UserCard
                    key={user.id}
                    profile={user}
                    inviteStatus={user.inviteStatus}
                    isIncoming={user.isIncoming}
                    onAcceptInvite={() => handleAcceptInvite(user.user_id)}
                    onRejectInvite={() => handleRejectInvite(user.user_id)}
                  />
                ))}
            </div>
          </motion.section>
        )}

        {/* All Users */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-sm text-muted-foreground mb-4">
            {sortedUsers.filter((u) => !(u.isIncoming && u.inviteStatus === 'pending')).length}{' '}
            developer{sortedUsers.length !== 1 ? 's' : ''} found
          </p>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 rounded-xl bg-secondary animate-pulse" />
              ))}
            </div>
          ) : sortedUsers.filter((u) => !(u.isIncoming && u.inviteStatus === 'pending')).length >
            0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedUsers
                .filter((u) => !(u.isIncoming && u.inviteStatus === 'pending'))
                .map((user) => (
                  <UserCard
                    key={user.id}
                    profile={user}
                    inviteStatus={user.inviteStatus}
                    isIncoming={user.isIncoming}
                    onSendInvite={handleSendInvite}
                    onAcceptInvite={() => handleAcceptInvite(user.user_id)}
                    onRejectInvite={() => handleRejectInvite(user.user_id)}
                  />
                ))}
            </div>
          ) : (
            <Card className="glass-card p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No developers found</h3>
              <p className="text-muted-foreground text-sm">
                Try adjusting your search or filters
              </p>
            </Card>
          )}
        </motion.section>
      </div>
    </MainLayout>
  );
}
