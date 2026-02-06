import { motion } from 'framer-motion';
import { User, Mail, GraduationCap, Send, Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EDUCATION_OPTIONS } from '@/lib/constants';
import type { Profile, InviteStatus } from '@/types/database';
import { cn } from '@/lib/utils';

interface UserCardProps {
  profile: Profile;
  inviteStatus?: InviteStatus | null;
  onSendInvite?: (userId: string) => void;
  onAcceptInvite?: () => void;
  onRejectInvite?: () => void;
  showInviteActions?: boolean;
  isIncoming?: boolean;
}

export function UserCard({
  profile,
  inviteStatus,
  onSendInvite,
  onAcceptInvite,
  onRejectInvite,
  showInviteActions = true,
  isIncoming = false,
}: UserCardProps) {
  const education = EDUCATION_OPTIONS.find((e) => e.value === profile.education);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="glass-card hover-lift">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <Avatar className="h-14 w-14">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="gradient-primary text-primary-foreground text-lg">
                {profile.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{profile.full_name}</h3>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{profile.email}</span>
              </div>

              {education && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span>{education.label}</span>
                </div>
              )}
            </div>
          </div>

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {profile.skills.slice(0, 5).map((skill) => (
                <span key={skill} className="skill-tag">
                  {skill}
                </span>
              ))}
              {profile.skills.length > 5 && (
                <span className="skill-tag">+{profile.skills.length - 5}</span>
              )}
            </div>
          )}
        </CardContent>

        {showInviteActions && (
          <CardFooter className="p-4 pt-0">
            {inviteStatus === 'pending' && !isIncoming && (
              <Badge variant="secondary" className="w-full justify-center py-2">
                <Clock className="h-4 w-4 mr-2" />
                Invite Sent
              </Badge>
            )}

            {inviteStatus === 'pending' && isIncoming && (
              <div className="flex gap-2 w-full">
                <Button
                  variant="default"
                  className="flex-1 gradient-primary"
                  onClick={onAcceptInvite}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Accept
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onRejectInvite}
                >
                  <X className="h-4 w-4 mr-2" />
                  Decline
                </Button>
              </div>
            )}

            {inviteStatus === 'accepted' && (
              <Badge className="w-full justify-center py-2 bg-success text-success-foreground">
                <Check className="h-4 w-4 mr-2" />
                Teammate
              </Badge>
            )}

            {inviteStatus === 'rejected' && (
              <Badge variant="secondary" className="w-full justify-center py-2 text-muted-foreground">
                <X className="h-4 w-4 mr-2" />
                Declined
              </Badge>
            )}

            {!inviteStatus && onSendInvite && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onSendInvite(profile.user_id)}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Team Invite
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}
