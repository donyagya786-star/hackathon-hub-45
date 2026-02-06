import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SKILL_OPTIONS, HACKATHON_SOURCES } from '@/lib/constants';

export interface HackathonFilters {
  search: string;
  source: string | null;
  mode: string | null;
  skills: string[];
  onlineOnly: boolean;
  sortBy: 'deadline' | 'newest' | 'prize';
}

interface HackathonFiltersProps {
  filters: HackathonFilters;
  onFiltersChange: (filters: HackathonFilters) => void;
}

export function HackathonFiltersComponent({ filters, onFiltersChange }: HackathonFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = <K extends keyof HackathonFilters>(
    key: K,
    value: HackathonFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleSkill = (skill: string) => {
    const newSkills = filters.skills.includes(skill)
      ? filters.skills.filter((s) => s !== skill)
      : [...filters.skills, skill];
    updateFilter('skills', newSkills);
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      source: null,
      mode: null,
      skills: [],
      onlineOnly: false,
      sortBy: 'deadline',
    });
  };

  const activeFiltersCount = 
    (filters.source ? 1 : 0) + 
    (filters.mode ? 1 : 0) + 
    filters.skills.length + 
    (filters.onlineOnly ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Search and Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search hackathons..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sort */}
        <Select
          value={filters.sortBy}
          onValueChange={(value) => updateFilter('sortBy', value as HackathonFilters['sortBy'])}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deadline">Deadline (Soonest)</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="prize">Highest Prize</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter Button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center gradient-primary">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filter Hackathons</SheetTitle>
              <SheetDescription>
                Narrow down hackathons based on your preferences
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Online Only Toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="online-only">Online Only</Label>
                <Switch
                  id="online-only"
                  checked={filters.onlineOnly}
                  onCheckedChange={(checked) => updateFilter('onlineOnly', checked)}
                />
              </div>

              {/* Source Filter */}
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select
                  value={filters.source || 'all'}
                  onValueChange={(value) => updateFilter('source', value === 'all' ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All platforms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    {Object.entries(HACKATHON_SOURCES).map(([key, { name }]) => (
                      <SelectItem key={key} value={key}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Skills Filter */}
              <div className="space-y-2">
                <Label>Skills / Tech Stack</Label>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {SKILL_OPTIONS.slice(0, 20).map((skill) => (
                    <Badge
                      key={skill}
                      variant={filters.skills.includes(skill) ? 'default' : 'outline'}
                      className="cursor-pointer transition-colors"
                      onClick={() => toggleSkill(skill)}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {activeFiltersCount > 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters Display */}
      {(filters.skills.length > 0 || filters.source || filters.onlineOnly) && (
        <div className="flex flex-wrap gap-2">
          {filters.onlineOnly && (
            <Badge variant="secondary" className="gap-1">
              Online Only
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('onlineOnly', false)}
              />
            </Badge>
          )}
          {filters.source && (
            <Badge variant="secondary" className="gap-1">
              {HACKATHON_SOURCES[filters.source as keyof typeof HACKATHON_SOURCES]?.name}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('source', null)}
              />
            </Badge>
          )}
          {filters.skills.map((skill) => (
            <Badge key={skill} variant="secondary" className="gap-1">
              {skill}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleSkill(skill)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
