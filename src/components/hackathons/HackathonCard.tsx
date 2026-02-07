import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Clock, MapPin, Bookmark, BookmarkCheck, Trophy, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useCountdown, formatCountdown, getCountdownStatus } from '@/hooks/useCountdown';
import { HACKATHON_SOURCES, HACKATHON_MODES } from '@/lib/constants';
import type { Hackathon } from '@/types/database';
import { cn } from '@/lib/utils';

interface HackathonCardProps {
  hackathon: Hackathon;
  isSaved?: boolean;
  onSave?: (hackathonId: string) => void;
  onUnsave?: (hackathonId: string) => void;
  showSaveButton?: boolean;
}

// Generate dynamic placeholder image URL using DiceBear API
const getPlaceholderImage = (title: string, source: string): string => {
  // Use a hash of the title to get consistent but unique images
  const seed = encodeURIComponent(title.replace(/[^a-zA-Z0-9]/g, ''));
  
  // Different styles based on source for variety
  const styles: Record<string, string> = {
    mlh: 'shapes',
    devfolio: 'rings', 
    unstop: 'glass',
    devpost: 'thumbs',
    community: 'identicon',
  };
  
  const style = styles[source] || 'shapes';
  
  // Colors based on source
  const colors: Record<string, string> = {
    mlh: '3b82f6,6366f1,8b5cf6',
    devfolio: '10b981,14b8a6,06b6d4',
    unstop: 'f97316,ef4444,ec4899',
    devpost: 'a855f7,8b5cf6,6366f1',
    community: 'f59e0b,eab308,84cc16',
  };
  
  const colorSet = colors[source] || '6366f1,8b5cf6,a855f7';
  
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=${colorSet.split(',')[0]}&size=400`;
};

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

export function HackathonCard({ 
  hackathon, 
  isSaved = false, 
  onSave, 
  onUnsave,
  showSaveButton = true 
}: HackathonCardProps) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const timeLeft = useCountdown(hackathon.registration_deadline);
  const countdownStatus = getCountdownStatus(timeLeft);
  const source = HACKATHON_SOURCES[hackathon.source];
  const mode = HACKATHON_MODES[hackathon.mode];
  const placeholderImage = getPlaceholderImage(hackathon.title, hackathon.source);
  const gradientColors = getGradientColors(hackathon.source);
  
  // Use actual image if available and not errored, otherwise use placeholder
  const hasRealImage = hackathon.image_url && !imageError;

  const handleCardClick = () => {
    navigate(`/hackathons/${hackathon.id}`);
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSaved && onUnsave) {
      onUnsave(hackathon.id);
    } else if (!isSaved && onSave) {
      onSave(hackathon.id);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card 
        className="glass-card hover-lift overflow-hidden group h-full flex flex-col cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Image Header - Large thumbnail */}
        <div className="relative h-52 overflow-hidden">
          {hasRealImage ? (
            /* Show actual hackathon image */
            <img
              src={hackathon.image_url!}
              alt={hackathon.title}
              className="absolute inset-0 w-full h-full object-cover"
              onError={handleImageError}
            />
          ) : (
            /* Fallback: Gradient with pattern and icon */
            <>
              <div 
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${gradientColors.from}, ${gradientColors.via}, ${gradientColors.to})`
                }}
              />
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Code2 className="h-12 w-12 text-white" />
                </div>
              </div>
            </>
          )}
          
          {/* Overlay gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          
          {/* Source Badge */}
          <div className={cn('absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-xs font-semibold shadow-lg', source.color)}>
            {source.name}
          </div>

          {/* Mode Badge */}
          <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-xs font-medium bg-background/90 backdrop-blur-sm shadow-lg">
            {mode.icon} {mode.label}
          </div>
        </div>

        <CardContent className="p-4 flex-1 flex flex-col">
          {/* Title */}
          <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors min-h-[3.5rem]">
            {hackathon.title}
          </h3>

          {/* Countdown */}
          <div className={cn(
            'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border mb-3 w-fit',
            countdownStatus === 'urgent' && 'countdown-urgent',
            countdownStatus === 'soon' && 'countdown-soon',
            countdownStatus === 'normal' && 'countdown-normal'
          )}>
            <Clock className="h-4 w-4" />
            {formatCountdown(timeLeft)}
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span className="line-clamp-1">{hackathon.location || 'Online / TBA'}</span>
          </div>

          {/* Prize Pool */}
          <div className="flex items-center gap-2 text-sm font-semibold mb-3">
            <Trophy className="h-4 w-4 text-accent shrink-0" />
            <span className="text-accent">{hackathon.prize_pool || 'Prizes TBA'}</span>
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {hackathon.skills && hackathon.skills.length > 0 ? (
              <>
                {hackathon.skills.slice(0, 3).map((skill) => (
                  <span key={skill} className="skill-tag text-xs">
                    {skill}
                  </span>
                ))}
                {hackathon.skills.length > 3 && (
                  <span className="skill-tag text-xs opacity-70">+{hackathon.skills.length - 3}</span>
                )}
              </>
            ) : (
              <span className="skill-tag text-xs">Open to All</span>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex gap-2">
          <Button
            variant="default"
            className="flex-1 gradient-primary"
          >
            View Details
          </Button>

          {showSaveButton && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleSaveClick}
              className={cn(
                'shrink-0',
                isSaved && 'text-primary border-primary bg-primary/10'
              )}
            >
              {isSaved ? (
                <BookmarkCheck className="h-5 w-5" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
