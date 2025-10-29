import React, { useEffect, useState } from 'react';
import { supabase, Opportunity, Application } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Search, MapPin, Clock, Plus, MessageSquare } from 'lucide-react';

export function VolunteerDashboard() {
  const { user, updateProfile } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    location: user?.location || '',
    bio: user?.bio || '',
    skills: user?.skills?.join(', ') || '',
  });

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;

    try {
      const [oppsResponse, appsResponse] = await Promise.all([
        supabase
          .from('opportunities')
          .select('*, ngo:users!opportunities_ngo_id_fkey(name, organization_name)')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('applications')
          .select('*, opportunity:opportunities(title, ngo_id, ngo:users!opportunities_ngo_id_fkey(name, organization_name))')
          .eq('volunteer_id', user.id)
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

  async function handleUpdateProfile() {
    try {
      await updateProfile({
        name: profileData.name,
        location: profileData.location,
        bio: profileData.bio,
        skills: profileData.skills.split(',').map(s => s.trim()).filter(Boolean),
      });
      setEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  }

  const stats = {
    applications: applications.length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    pending: applications.filter(a => a.status === 'pending').length,
    skills: user?.skills?.length || 0,
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user?.name?.charAt(0) || 'V'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
                <p className="text-sm text-slate-600">Volunteer</p>
              </div>
            </div>

            {!editingProfile ? (
              <>
                <div className="space-y-4 mb-6">
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-2">Skills</h3>
                    {user?.skills && user.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {user.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No skills added yet</p>
                    )}
                  </div>

                  {user?.location && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-700 mb-1">Location</h3>
                      <p className="text-sm text-slate-600">{user.location}</p>
                    </div>
                  )}

                  {user?.bio && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-700 mb-1">Bio</h3>
                      <p className="text-sm text-slate-600">{user.bio}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setProfileData({
                      name: user?.name || '',
                      location: user?.location || '',
                      bio: user?.bio || '',
                      skills: user?.skills?.join(', ') || '',
                    });
                    setEditingProfile(true);
                  }}
                  className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Edit Profile
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Skills</label>
                  <input
                    type="text"
                    value={profileData.skills}
                    onChange={(e) => setProfileData({ ...profileData, skills: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="Comma separated"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    rows={3}
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleUpdateProfile}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingProfile(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Impact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{stats.applications}</div>
                <div className="text-xs text-slate-600">Applications</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{stats.accepted}</div>
                <div className="text-xs text-slate-600">Accepted</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
                <div className="text-xs text-slate-600">Pending</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{stats.skills}</div>
                <div className="text-xs text-slate-600">Skills</div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Find Opportunities</h2>
              <a
                href="#opportunities"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Browse All
              </a>
            </div>

            <div className="space-y-4">
              {opportunities.slice(0, 5).map((opp) => (
                <div key={opp.id} className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">{opp.title}</h3>
                      <p className="text-sm text-slate-600 mb-3">{opp.ngo?.organization_name || opp.ngo?.name}</p>
                      <p className="text-sm text-slate-700 mb-3 line-clamp-2">{opp.description}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {opp.required_skills?.slice(0, 3).map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-slate-600">
                        {opp.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin size={14} />
                            <span>{opp.location}</span>
                          </div>
                        )}
                        {opp.duration && (
                          <div className="flex items-center space-x-1">
                            <Clock size={14} />
                            <span>{opp.duration}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="ml-4 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Open
                    </span>
                  </div>
                </div>
              ))}

              {opportunities.length === 0 && (
                <p className="text-center text-slate-500 py-8">No opportunities available at the moment</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Recent Applications</h3>
            <div className="space-y-3">
              {applications.slice(0, 5).map((app) => (
                <div key={app.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-slate-900">{app.opportunity?.title}</h4>
                    <p className="text-sm text-slate-600">
                      {app.opportunity?.ngo?.organization_name || app.opportunity?.ngo?.name}
                    </p>
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
              ))}

              {applications.length === 0 && (
                <p className="text-center text-slate-500 py-8">No applications yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
