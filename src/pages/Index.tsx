import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  ArrowRight, 
  Search, 
  Users, 
  Bell, 
  Calendar,
  Globe,
  Trophy,
  Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';

const features = [
  {
    icon: Search,
    title: 'Discover Hackathons',
    description: 'Browse real hackathons from MLH, Devfolio, Unstop, Devpost, and community events.',
  },
  {
    icon: Users,
    title: 'Find Teammates',
    description: 'Match with developers who share your skills and interests. Build winning teams.',
  },
  {
    icon: Bell,
    title: 'Never Miss Deadlines',
    description: 'Get notified about registration deadlines for your saved hackathons.',
  },
  {
    icon: Calendar,
    title: 'Smart Dashboard',
    description: 'Track all your upcoming hackathons and team activities in one place.',
  },
];

const sources = [
  { name: 'MLH', emoji: '🥇' },
  { name: 'Devfolio', emoji: '🥈' },
  { name: 'Unstop', emoji: '🥉' },
  { name: 'Devpost', emoji: '🏆' },
  { name: 'Community', emoji: '🎯' },
];

export default function Index() {
  const { user } = useAuth();

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse-slow" />

        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <Badge variant="secondary" className="mb-6 py-1.5 px-4">
              <Sparkles className="h-3.5 w-3.5 mr-2" />
              Aggregating 100+ hackathons
            </Badge>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Find Your Next
              <br />
              <span className="gradient-text">Hackathon</span> & Team
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Discover real, upcoming hackathons from top platforms. 
              Build teams with matched skills. Never miss a deadline.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={user ? '/hackathons' : '/auth?mode=signup'}>
                <Button size="lg" className="gradient-primary glow-primary w-full sm:w-auto">
                  {user ? 'Browse Hackathons' : 'Get Started Free'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/hackathons">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <Globe className="mr-2 h-5 w-5" />
                  Explore All Hackathons
                </Button>
              </Link>
            </div>

            {/* Source Badges */}
            <div className="flex flex-wrap justify-center gap-3 mt-12">
              {sources.map((source) => (
                <Badge key={source.name} variant="secondary" className="py-1.5 px-3">
                  {source.emoji} {source.name}
                </Badge>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to
              <br />
              <span className="gradient-text">Win Hackathons</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Stop wasting time searching across multiple platforms. 
              FutureStack brings everything together.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 hover-lift"
              >
                <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="gradient-primary rounded-3xl p-8 md:p-12 text-primary-foreground">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">100+</div>
                <div className="text-primary-foreground/80">Active Hackathons</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">5</div>
                <div className="text-primary-foreground/80">Platforms Tracked</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">$1M+</div>
                <div className="text-primary-foreground/80">In Prizes</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">10K+</div>
                <div className="text-primary-foreground/80">Developers</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <Trophy className="h-16 w-16 mx-auto mb-6 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Win Your Next Hackathon?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join FutureStack today and never miss another hackathon opportunity. 
              It's completely free to get started.
            </p>
            <Link to={user ? '/hackathons' : '/auth?mode=signup'}>
              <Button size="lg" className="gradient-primary glow-primary">
                {user ? 'View Hackathons' : 'Create Free Account'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </MainLayout>
  );
}
