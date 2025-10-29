import React, { useState, useEffect } from 'react';
import { supabase, Opportunity } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X } from 'lucide-react';

interface ApplicationFormProps {
  opportunityId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApplicationForm({ opportunityId, onClose, onSuccess }: ApplicationFormProps) {
  const { user } = useAuth();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [coverLetter, setCoverLetter] = useState('');

  useEffect(() => {
    loadOpportunity();
  }, [opportunityId]);

  async function loadOpportunity() {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*, ngo:users!opportunities_ngo_id_fkey(name, organization_name)')
        .eq('id', opportunityId)
        .maybeSingle();

      if (error) throw error;
      setOpportunity(data);
    } catch (error) {
      console.error('Error loading opportunity:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const { error: insertError } = await supabase.from('applications').insert({
        opportunity_id: opportunityId,
        volunteer_id: user.id,
        cover_letter: coverLetter,
        status: 'pending',
      });

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('You have already applied to this opportunity');
        }
        throw insertError;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  }

  if (!opportunity) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="text-slate-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Apply for Opportunity</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-slate-50 rounded-lg">
            <h3 className="text-lg font-bold text-slate-900 mb-2">{opportunity.title}</h3>
            <p className="text-sm text-slate-600 mb-3">
              {opportunity.ngo?.organization_name || opportunity.ngo?.name}
            </p>
            <p className="text-sm text-slate-700">{opportunity.description}</p>
            {opportunity.required_skills && opportunity.required_skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {opportunity.required_skills.map((skill, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Cover Letter / Message
              </label>
              <textarea
                required
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell us why you're interested in this opportunity and how your skills align..."
                rows={8}
              />
              <p className="mt-2 text-xs text-slate-500">
                This message will be sent to the organization along with your profile information.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
