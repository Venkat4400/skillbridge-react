import React, { useEffect, useState } from 'react';
import { supabase, Application } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Filter, Check, X, MessageSquare } from 'lucide-react';

export function ApplicationsList() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  useEffect(() => {
    loadApplications();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [applications, searchTerm, statusFilter]);

  async function loadApplications() {
    if (!user) return;

    try {
      let query = supabase
        .from('applications')
        .select(`
          *,
          opportunity:opportunities(
            id,
            title,
            description,
            ngo_id,
            ngo:users!opportunities_ngo_id_fkey(name, organization_name)
          ),
          volunteer:users!applications_volunteer_id_fkey(
            name,
            email,
            skills,
            location,
            bio
          )
        `)
        .order('created_at', { ascending: false });

      if (user.role === 'volunteer') {
        query = query.eq('volunteer_id', user.id);
      } else if (user.role === 'ngo') {
        query = query.eq('opportunity.ngo_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...applications];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        app =>
          app.opportunity?.title.toLowerCase().includes(term) ||
          app.volunteer?.name.toLowerCase().includes(term) ||
          app.volunteer?.email.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    setFilteredApplications(filtered);
  }

  async function updateApplicationStatus(applicationId: string, status: 'accepted' | 'rejected') {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', applicationId);

      if (error) throw error;

      await loadApplications();
    } catch (error) {
      console.error('Error updating application:', error);
    }
  }

  const stats = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading applications...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {user?.role === 'volunteer' ? 'My Applications' : 'Manage Applications'}
        </h1>
        <p className="text-slate-600">
          {user?.role === 'volunteer'
            ? 'Track the status of your volunteer applications'
            : 'Review and manage volunteer applications for your opportunities'}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search applications..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Applications</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <div className="text-2xl font-bold text-slate-900">{stats.all}</div>
            <div className="text-xs text-slate-600">All</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
            <div className="text-xs text-slate-600">Pending</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">{stats.accepted}</div>
            <div className="text-xs text-slate-600">Accepted</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
            <div className="text-xs text-slate-600">Rejected</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredApplications.map(app => (
          <div key={app.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {user?.role === 'volunteer' ? app.opportunity?.title : app.volunteer?.name}
                </h3>
                <p className="text-slate-600">
                  {user?.role === 'volunteer'
                    ? app.opportunity?.ngo?.organization_name || app.opportunity?.ngo?.name
                    : app.opportunity?.title}
                </p>
                {user?.role === 'ngo' && app.volunteer?.email && (
                  <p className="text-sm text-slate-500 mt-1">{app.volunteer.email}</p>
                )}
              </div>
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  app.status === 'accepted'
                    ? 'bg-green-100 text-green-700'
                    : app.status === 'rejected'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
              </span>
            </div>

            {user?.role === 'ngo' && app.volunteer?.skills && app.volunteer.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {app.volunteer.skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            )}

            {app.cover_letter && (
              <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Cover Letter:</h4>
                <p className="text-sm text-slate-700">{app.cover_letter}</p>
              </div>
            )}

            {user?.role === 'ngo' && app.volunteer?.bio && (
              <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                <h4 className="text-sm font-medium text-slate-700 mb-2">About the Volunteer:</h4>
                <p className="text-sm text-slate-700">{app.volunteer.bio}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Applied {new Date(app.created_at).toLocaleDateString()}
              </div>

              {user?.role === 'ngo' && app.status === 'pending' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateApplicationStatus(app.id, 'accepted')}
                    className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <Check size={16} />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => updateApplicationStatus(app.id, 'rejected')}
                    className="flex items-center space-x-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    <X size={16} />
                    <span>Reject</span>
                  </button>
                </div>
              )}

              {user?.role === 'ngo' && app.status === 'accepted' && (
                <a
                  href="#messages"
                  className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <MessageSquare size={16} />
                  <span>Message</span>
                </a>
              )}
            </div>
          </div>
        ))}

        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">
              {applications.length === 0
                ? 'No applications yet'
                : 'No applications match your filters'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
