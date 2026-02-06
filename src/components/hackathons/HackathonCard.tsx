import { motion } from 'framer-motion';
import { Clock, MapPin, ExternalLink, Bookmark, BookmarkCheck } from 'lucide-react';
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

  const handleSaveClick = () => {
    if (isSaved && onUnsave) {
      onUnsave(hackathon.id);
    } else if (!isSaved && onSave) {
      onSave(hackathon.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-card hover-lift overflow-hidden group">
        {/* Image Header */}
        {hackathon.image_url && (
          <div className="relative h-40 overflow-hidden">
            <img
              src={hackathon.image_url}
              alt={hackathon.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            
            {/* Source Badge */}
            <Badge className={cn('absolute top-3 left-3', source.color)}>
              {source.name}
            </Badge>

            {/* Mode Badge */}
            <Badge variant="secondary" className="absolute top-3 right-3">
              {mode.icon} {mode.label}
            </Badge>
          </div>
        )}

        {!hackathon.image_url && (
          <div className="p-4 pb-0 flex gap-2">
            <Badge className={source.color}>{source.name}</Badge>
            <Badge variant="secondary">{mode.icon} {mode.label}</Badge>
          </div>
        )}

        <CardContent className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {hackathon.title}
          </h3>

          {/* Description */}
          {hackathon.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {hackathon.description}
            </p>
          )}

          {/* Countdown */}
          <div className={cn(
            'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border mb-3',
            countdownStatus === 'urgent' && 'countdown-urgent',
            countdownStatus === 'soon' && 'countdown-soon',
            countdownStatus === 'normal' && 'countdown-normal'
          )}>
            <Clock className="h-4 w-4" />
            {formatCountdown(timeLeft)}
          </div>

          {/* Location */}
          {hackathon.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <MapPin className="h-4 w-4" />
              {hackathon.location}
            </div>
          )}

          {/* Prize Pool */}
          {hackathon.prize_pool && (
            <div className="text-sm font-medium mb-3">
              🏆 Prize: {hackathon.prize_pool}
            </div>
          )}

          {/* Skills */}
          {hackathon.skills && hackathon.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {hackathon.skills.slice(0, 4).map((skill) => (
                <span key={skill} className="skill-tag">
                  {skill}
                </span>
              ))}
              {hackathon.skills.length > 4 && (
                <span className="skill-tag">+{hackathon.skills.length - 4}</span>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0 flex gap-2">
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
