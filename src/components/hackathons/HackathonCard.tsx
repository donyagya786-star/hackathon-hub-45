import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Clock, MapPin, ExternalLink, Bookmark, BookmarkCheck, Trophy, Layers } from 'lucide-react';
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

export function HackathonCard({ 
  hackathon, 
  isSaved = false, 
  onSave, 
  onUnsave,
  showSaveButton = true 
}: HackathonCardProps) {
  const timeLeft = useCountdown(hackathon.registration_deadline);
  const countdownStatus = getCountdownStatus(timeLeft);
  const source = HACKATHON_SOURCES[hackathon.source];
  const mode = HACKATHON_MODES[hackathon.mode];

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSaved && onUnsave) {
      onUnsave(hackathon.id);
    } else if (!isSaved && onSave) {
      onSave(hackathon.id);
    }
  };

  // Generate placeholder gradient based on source
  const getPlaceholderGradient = () => {
    const gradients: Record<string, string> = {
      mlh: 'from-blue-600 to-indigo-700',
      devfolio: 'from-emerald-500 to-teal-600',
      unstop: 'from-orange-500 to-red-600',
      devpost: 'from-purple-500 to-pink-600',
      community: 'from-amber-500 to-orange-600',
    };
    return gradients[hackathon.source] || 'from-primary to-accent';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className="glass-card hover-lift overflow-hidden group h-full flex flex-col">
        {/* Image Header - Fixed height with placeholder */}
        <Link to={`/hackathons/${hackathon.id}`} className="block">
          <div className="relative h-40 overflow-hidden">
            {hackathon.image_url ? (
              <img
                src={hackathon.image_url}
                alt={hackathon.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  // Hide broken images and show placeholder
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            {/* Placeholder gradient background */}
            <div className={cn(
              'absolute inset-0 bg-gradient-to-br flex items-center justify-center',
              getPlaceholderGradient(),
              hackathon.image_url ? 'hidden' : ''
            )}>
              <Layers className="h-12 w-12 text-white/50" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            
            {/* Source Badge */}
            <Badge className={cn('absolute top-3 left-3 z-10', source.color)}>
              {source.name}
            </Badge>

            {/* Mode Badge */}
            <Badge variant="secondary" className="absolute top-3 right-3 z-10">
              {mode.icon} {mode.label}
            </Badge>
          </div>
        </Link>

        <CardContent className="p-4 flex-1 flex flex-col">
          {/* Title - Fixed 2 lines */}
          <Link to={`/hackathons/${hackathon.id}`}>
            <h3 className="font-semibold text-lg mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-primary transition-colors cursor-pointer">
              {hackathon.title}
            </h3>
          </Link>

          {/* Description - Fixed 2 lines */}
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2 min-h-[2.5rem]">
            {hackathon.description || 'Join this exciting hackathon and build something amazing!'}
          </p>

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

          {/* Location - Fixed height */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 min-h-[1.25rem]">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">{hackathon.location || 'Online / TBA'}</span>
          </div>

          {/* Prize Pool - Fixed height */}
          <div className="flex items-center gap-2 text-sm font-medium mb-3 min-h-[1.25rem]">
            <Trophy className="h-4 w-4 text-accent shrink-0" />
            <span>{hackathon.prize_pool || 'Prizes TBA'}</span>
          </div>

          {/* Skills - Fixed height container with overflow */}
          <div className="flex flex-wrap gap-1.5 min-h-[2rem] mt-auto">
            {hackathon.skills && hackathon.skills.length > 0 ? (
              <>
                {hackathon.skills.slice(0, 3).map((skill) => (
                  <span key={skill} className="skill-tag text-xs">
                    {skill}
                  </span>
                ))}
                {hackathon.skills.length > 3 && (
                  <span className="skill-tag text-xs">+{hackathon.skills.length - 3}</span>
                )}
              </>
            ) : (
              <span className="skill-tag text-xs">Open to All</span>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex gap-2 mt-auto">
          <Button
            variant="default"
            className="flex-1 gradient-primary"
            asChild
          >
            <a 
              href={hackathon.registration_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              Register
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>

          {showSaveButton && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleSaveClick}
              className={cn(
                'shrink-0',
                isSaved && 'text-primary border-primary'
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
