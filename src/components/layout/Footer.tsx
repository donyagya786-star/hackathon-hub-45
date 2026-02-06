import { Link } from 'react-router-dom';
import { Zap, Github, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="gradient-primary rounded-lg p-2">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">
                Future<span className="gradient-text">Stack</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-md">
              Discover hackathons, build teams, and launch your next big project. 
              We aggregate opportunities from top platforms so you never miss out.
            </p>
            <div className="flex gap-4 mt-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/hackathons" className="text-muted-foreground hover:text-foreground transition-colors">
                  Browse Hackathons
                </Link>
              </li>
              <li>
                <Link to="/team-match" className="text-muted-foreground hover:text-foreground transition-colors">
                  Team Matching
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Sources</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-muted-foreground">MLH</li>
              <li className="text-muted-foreground">Devfolio</li>
              <li className="text-muted-foreground">Unstop</li>
              <li className="text-muted-foreground">Devpost</li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} FutureStack. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground text-center md:text-right max-w-md">
              Disclaimer: We aggregate publicly available hackathons. All registrations happen on the original platforms.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
