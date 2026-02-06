import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Save, X, Check } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { SKILL_OPTIONS, EDUCATION_OPTIONS } from '@/lib/constants';
import type { EducationLevel } from '@/types/database';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState('');
  const [education, setEducation] = useState<EducationLevel>('btech');
  const [skills, setSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setEducation(profile.education || 'btech');
      setSkills(profile.skills || []);
    }
  }, [profile]);

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        education,
        skills,
      })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } else {
      await refreshProfile();
      toast({
        title: 'Profile Updated',
        description: 'Your changes have been saved',
      });
    }

    setSaving(false);
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
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="gradient-primary rounded-lg p-2">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold">Profile</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your profile and skills for better team matching
          </p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="gradient-primary text-primary-foreground text-xl">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{profile?.full_name}</CardTitle>
                  <CardDescription>{profile?.email}</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>

              {/* Email (readonly) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile?.email || ''}
                  disabled
                  className="bg-secondary"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              {/* Education */}
              <div className="space-y-2">
                <Label>Education</Label>
                <Select value={education} onValueChange={(v) => setEducation(v as EducationLevel)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select education" />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Skills */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Skills & Tech Stack</Label>
                  <span className="text-xs text-muted-foreground">
                    {skills.length} selected
                  </span>
                </div>

                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-secondary/50 rounded-lg">
                    {skills.map((skill) => (
                      <Badge
                        key={skill}
                        className="gap-1 cursor-pointer"
                        onClick={() => toggleSkill(skill)}
                      >
                        {skill}
                        <X className="h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 border rounded-lg">
                  {SKILL_OPTIONS.map((skill) => (
                    <Badge
                      key={skill}
                      variant={skills.includes(skill) ? 'default' : 'outline'}
                      className="cursor-pointer transition-all"
                      onClick={() => toggleSkill(skill)}
                    >
                      {skills.includes(skill) && <Check className="h-3 w-3 mr-1" />}
                      {skill}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Select skills to get personalized hackathon recommendations and better team matches
                </p>
              </div>

              {/* Save Button */}
              <Button
                className="w-full gradient-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  );
}
