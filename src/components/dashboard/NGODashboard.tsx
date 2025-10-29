import React, { useEffect, useState } from 'react';
import { supabase, Opportunity, Application } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Users, FileText, Clock, MessageSquare } from 'lucide-react';

export function NGODashboard() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;

    try {
      const [oppsResponse, appsResponse] = await Promise.all([
        supabase
          .from('opportunities')
          .select('*')
          .eq('ngo_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('applications')
          .select('*, opportunity:opportunities!inner(id, title, ngo_id), volunteer:users!applications_volunteer_id_fkey(name, email, skills, location)')
          .eq('opportunity.ngo_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (oppsResponse.error) throw oppsResponse.error;
      if (appsResponse.error) throw appsResponse.error;

      setOpportunities(oppsResponse.data || []);
      setApplications(appsResponse.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const stats = {
    activeOpportunities: opportunities.filter(o => o.status === 'open').length,
    totalApplications: applications.length,
    activeVolunteers: applications.filter(a => a.status === 'accepted').length,
    pendingApplications: applications.filter(a => a.status === 'pending').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{user?.organization_name || user?.name}</h1>
            <p className="text-slate-600 mt-1">NGO Dashboard</p>
          </div>
          <a
            href="#create-opportunity"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>Create Opportunity</span>
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <FileText size={24} />
            </div>
            <div className="text-3xl font-bold mb-1">{stats.activeOpportunities}</div>
            <div className="text-blue-100 text-sm">Active Opportunities</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Users size={24} />
            </div>
            <div className="text-3xl font-bold mb-1">{stats.totalApplications}</div>
            <div className="text-green-100 text-sm">Total Applications</div>
          </div>

          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Users size={24} />
            </div>
            <div className="text-3xl font-bold mb-1">{stats.activeVolunteers}</div>
            <div className="text-teal-100 text-sm">Active Volunteers</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Clock size={24} />
            </div>
            <div className="text-3xl font-bold mb-1">{stats.pendingApplications}</div>
            <div className="text-yellow-100 text-sm">Pending Applications</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Recent Applications</h2>
            <a href="#applications" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </a>
          </div>

          <div className="space-y-4">
            {applications.slice(0, 5).map((app) => (
              <div key={app.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{app.volunteer?.name}</h3>
                    <p className="text-sm text-slate-600">{app.opportunity?.title}</p>
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
                    {app.status}
                  </span>
                </div>

                {app.volunteer?.skills && app.volunteer.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {app.volunteer.skills.slice(0, 3).map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {app.cover_letter && (
                  <p className="text-sm text-slate-700 line-clamp-2">{app.cover_letter}</p>
                )}
              </div>
            ))}

            {applications.length === 0 && (
              <p className="text-center text-slate-500 py-8">No applications yet</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Your Opportunities</h2>
            <a href="#opportunities" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Manage All
            </a>
          </div>

          <div className="space-y-4">
            {opportunities.slice(0, 5).map((opp) => (
              <div key={opp.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{opp.title}</h3>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{opp.description}</p>
                  </div>
                  <span
                    className={`ml-4 px-3 py-1 text-xs font-medium rounded-full ${
                      opp.status === 'open'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {opp.status}
                  </span>
                </div>

                {opp.required_skills && opp.required_skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {opp.required_skills.slice(0, 3).map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-600">
                    {applications.filter(a => a.opportunity_id === opp.id).length} applications
                  </span>
                  <a
                    href={`#opportunity/${opp.id}`}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View details
                  </a>
                </div>
              </div>
            ))}

            {opportunities.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-500 mb-4">No opportunities created yet</p>
                <a
                  href="#create-opportunity"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus size={16} />
                  <span>Create Your First Opportunity</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="#create-opportunity"
            className="flex items-center justify-center space-x-3 p-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Plus size={24} className="text-slate-600" />
            <span className="font-medium text-slate-700">Create New Opportunity</span>
          </a>

          <a
            href="#messages"
            className="flex items-center justify-center space-x-3 p-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <MessageSquare size={24} className="text-slate-600" />
            <span className="font-medium text-slate-700">View Messages</span>
          </a>
        </div>
      </div>
    </div>
  );
}
