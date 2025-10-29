import React, { useEffect, useState } from 'react';
import { supabase, Opportunity } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Search, MapPin, Clock, Filter, X } from 'lucide-react';

interface OpportunitiesListProps {
  onApply?: (opportunityId: string) => void;
}

export function OpportunitiesList({ onApply }: OpportunitiesListProps) {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    skills: [] as string[],
    location: '',
    status: 'open' as 'open' | 'closed' | 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);

  useEffect(() => {
    loadOpportunities();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [opportunities, searchTerm, filters]);

  async function loadOpportunities() {
    try {
      let query = supabase
        .from('opportunities')
        .select('*, ngo:users!opportunities_ngo_id_fkey(name, organization_name, location)')
        .order('created_at', { ascending: false });

      if (user?.role === 'volunteer') {
        query = query.eq('status', 'open');
      } else if (user?.role === 'ngo') {
        query = query.eq('ngo_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      setOpportunities(data || []);

      const skills = new Set<string>();
      data?.forEach(opp => {
        opp.required_skills?.forEach(skill => skills.add(skill));
      });
      setAvailableSkills(Array.from(skills).sort());
    } catch (error) {
      console.error('Error loading opportunities:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...opportunities];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        opp =>
          opp.title.toLowerCase().includes(term) ||
          opp.description.toLowerCase().includes(term) ||
          opp.required_skills?.some(skill => skill.toLowerCase().includes(term))
      );
    }

    if (filters.skills.length > 0) {
      filtered = filtered.filter(opp =>
        filters.skills.some(skill => opp.required_skills?.includes(skill))
      );
    }

    if (filters.location) {
      filtered = filtered.filter(opp =>
        opp.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(opp => opp.status === filters.status);
    }

    setFilteredOpportunities(filtered);
  }

  function toggleSkillFilter(skill: string) {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill],
    }));
  }

  function resetFilters() {
    setFilters({
      skills: [],
      location: '',
      status: 'open',
    });
    setSearchTerm('');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading opportunities...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {user?.role === 'volunteer' ? 'Volunteering Opportunities' : 'Your Opportunities'}
        </h1>
        <p className="text-slate-600">
          {user?.role === 'volunteer'
            ? 'Find opportunities that match your skills and interests'
            : 'Manage your volunteering opportunities'}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search opportunities..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Filter size={20} />
            <span>Filters</span>
            {(filters.skills.length > 0 || filters.location) && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                {filters.skills.length + (filters.location ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Skills</label>
              <div className="flex flex-wrap gap-2">
                {availableSkills.map(skill => (
                  <button
                    key={skill}
                    onClick={() => toggleSkillFilter(skill)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filters.skills.includes(skill)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  placeholder="Search locations..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <button
              onClick={resetFilters}
              className="flex items-center space-x-2 text-sm text-slate-600 hover:text-slate-900"
            >
              <X size={16} />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {filteredOpportunities.map(opp => (
          <div key={opp.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{opp.title}</h3>
                <p className="text-slate-600 mb-1">{opp.ngo?.organization_name || opp.ngo?.name}</p>
              </div>
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  opp.status === 'open'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {opp.status}
              </span>
            </div>

            <p className="text-slate-700 mb-4">{opp.description}</p>

            {opp.required_skills && opp.required_skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {opp.required_skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center space-x-4 text-sm text-slate-600">
                {opp.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin size={16} />
                    <span>{opp.location}</span>
                  </div>
                )}
                {opp.duration && (
                  <div className="flex items-center space-x-1">
                    <Clock size={16} />
                    <span>{opp.duration}</span>
                  </div>
                )}
              </div>

              {user?.role === 'volunteer' && opp.status === 'open' && onApply && (
                <button
                  onClick={() => onApply(opp.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Apply
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredOpportunities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 mb-4">
              {opportunities.length === 0
                ? 'No opportunities available at the moment'
                : 'No opportunities match your filters'}
            </p>
            {(filters.skills.length > 0 || filters.location || searchTerm) && (
              <button
                onClick={resetFilters}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
