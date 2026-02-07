import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Clock, MapPin, ExternalLink, Bookmark, BookmarkCheck, Trophy, Code2 } from 'lucide-react';
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

// Generate a consistent color based on hackathon title
const getGradientFromTitle = (title: string, source: string): string => {
  const sourceGradients: Record<string, string[]> = {
    mlh: ['from-blue-600 via-indigo-600 to-purple-700', 'from-cyan-500 via-blue-600 to-indigo-700', 'from-indigo-500 via-purple-600 to-pink-600'],
    devfolio: ['from-emerald-500 via-teal-600 to-cyan-700', 'from-green-500 via-emerald-600 to-teal-700', 'from-teal-500 via-cyan-600 to-blue-600'],
    unstop: ['from-orange-500 via-red-500 to-pink-600', 'from-amber-500 via-orange-600 to-red-600', 'from-rose-500 via-pink-600 to-purple-600'],
    devpost: ['from-purple-500 via-violet-600 to-indigo-700', 'from-fuchsia-500 via-purple-600 to-blue-600', 'from-violet-500 via-purple-600 to-pink-600'],
    community: ['from-amber-500 via-yellow-500 to-orange-600', 'from-lime-500 via-green-600 to-emerald-600', 'from-sky-500 via-blue-600 to-indigo-600'],
  };
  
  const gradients = sourceGradients[source] || sourceGradients.community;
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
};

// Get icon pattern based on hackathon theme
const getPatternStyle = (title: string): string => {
  const patterns = [
    'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
    'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 40%)',
    'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
    'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.2) 0%, transparent 60%)',
  ];
  const hash = title.length;
  return patterns[hash % patterns.length];
};

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

  const gradient = getGradientFromTitle(hackathon.title, hackathon.source);
  const pattern = getPatternStyle(hackathon.title);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className="glass-card hover-lift overflow-hidden group h-full flex flex-col">
        {/* Image Header - Always shows something */}
        <Link to={`/hackathons/${hackathon.id}`} className="block">
          <div className="relative h-44 overflow-hidden">
            {hackathon.image_url ? (
              <img
                src={hackathon.image_url}
                alt={hackathon.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const placeholder = target.parentElement?.querySelector('.placeholder-bg');
                  if (placeholder) placeholder.classList.remove('hidden');
                }}
              />
            ) : null}
            
            {/* Beautiful gradient placeholder */}
            <div 
              className={cn(
                'absolute inset-0 bg-gradient-to-br flex flex-col items-center justify-center transition-transform duration-500 group-hover:scale-105 placeholder-bg',
                gradient,
                hackathon.image_url ? 'hidden' : ''
              )}
              style={{ backgroundImage: pattern }}
            >
              <Code2 className="h-12 w-12 text-white/30 mb-2" />
              <span className="text-white/50 text-xs font-medium tracking-wider uppercase">
                {hackathon.source}
              </span>
            </div>
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            
            {/* Source Badge */}
            <Badge className={cn('absolute top-3 left-3 z-10 shadow-lg', source.color)}>
              {source.name}
            </Badge>

            {/* Mode Badge */}
            <Badge variant="secondary" className="absolute top-3 right-3 z-10 shadow-lg bg-background/80 backdrop-blur-sm">
              {mode.icon} {mode.label}
            </Badge>

            {/* Title overlay on image */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
              <h3 className="font-bold text-lg text-foreground line-clamp-2 drop-shadow-sm">
                {hackathon.title}
              </h3>
            </div>
          </div>
        </Link>

        <CardContent className="p-4 flex-1 flex flex-col">
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
