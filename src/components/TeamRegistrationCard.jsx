import React, { useState } from 'react';
import { api } from '../utils/api';

export default function TeamRegistrationCard({ huntId, username, onEnrolled, onBack }) {
  const [playMode, setPlayMode] = useState(null); // 'solo' | 'team'
  const [teamAction, setTeamAction] = useState(null); // 'create' | 'join'
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [createdTeam, setCreatedTeam] = useState(null);

  const handleEnrollSolo = async () => {
    setLoading(true);
    setError(null);
    try {
      // First enroll in the hunt
      await api.enrollInHunt(huntId, username, 'BROWSE_PUBLIC');
      if (onEnrolled) onEnrolled(null); // enrolled solo (no team ID)
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to enroll');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // Create team
      const team = await api.createTeam(huntId, teamName.trim(), username);
      setCreatedTeam(team);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const team = await api.joinTeam(inviteCode.trim(), username);
      if (onEnrolled) onEnrolled(team.id);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid invite code or failed to join team');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatedTeamProceed = () => {
    if (createdTeam && onEnrolled) {
      onEnrolled(createdTeam.id);
    }
  };

  if (createdTeam) {
    return (
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 text-white backdrop-blur-md max-w-md mx-auto shadow-2xl">
        <h3 className="text-xl font-bold text-emerald-400 mb-2">Team Created Successfully!</h3>
        <p className="text-slate-300 text-sm mb-4">
          Share this invite code with your teammates so they can join your team.
        </p>
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-6 flex flex-col items-center justify-center">
          <span className="text-xs text-slate-400 uppercase tracking-widest mb-1">Invite Code</span>
          <span className="text-3xl font-mono font-bold tracking-wider text-emerald-300">{createdTeam.invite_code}</span>
        </div>
        <button
          onClick={handleCreatedTeamProceed}
          className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 font-semibold text-white transition-all shadow-lg hover:shadow-emerald-500/20"
        >
          Start Scavenger Hunt
        </button>
      </div>
    );
  }

  if (playMode === 'team') {
    return (
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 text-white backdrop-blur-md max-w-md mx-auto shadow-2xl">
        <button 
          onClick={() => { setPlayMode(null); setTeamAction(null); setError(null); }}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mb-4"
        >
          &larr; Back to mode selection
        </button>

        {!teamAction ? (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Team Setup</h3>
            <p className="text-sm text-slate-300">Would you like to create a new team or join an existing one?</p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                onClick={() => setTeamAction('create')}
                className="py-4 px-3 rounded-lg border border-slate-600 bg-slate-700/50 hover:bg-slate-700 text-sm font-medium transition-all"
              >
                Create Team
              </button>
              <button
                onClick={() => setTeamAction('join')}
                className="py-4 px-3 rounded-lg border border-slate-600 bg-slate-700/50 hover:bg-slate-700 text-sm font-medium transition-all"
              >
                Join Team
              </button>
            </div>
          </div>
        ) : teamAction === 'create' ? (
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <h3 className="text-lg font-bold">Create a Team</h3>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Team Name</label>
              <input
                type="text"
                placeholder="Enter team name..."
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTeamAction(null)}
                disabled={loading}
                className="flex-1 py-2 px-3 rounded-lg border border-slate-600 hover:bg-slate-700 text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !teamName.trim()}
                className="flex-1 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-xs font-semibold transition-all"
              >
                {loading ? 'Creating...' : 'Create & Join'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleJoinTeam} className="space-y-4">
            <h3 className="text-lg font-bold">Join a Team</h3>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Invite Code</label>
              <input
                type="text"
                placeholder="Enter 6-character code..."
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono placeholder-slate-500 uppercase tracking-widest text-center focus:outline-none focus:border-emerald-500"
                maxLength={6}
                required
              />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTeamAction(null)}
                disabled={loading}
                className="flex-1 py-2 px-3 rounded-lg border border-slate-600 hover:bg-slate-700 text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || inviteCode.trim().length !== 6}
                className="flex-1 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-xs font-semibold transition-all"
              >
                {loading ? 'Joining...' : 'Join Team'}
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 text-white backdrop-blur-md max-w-md mx-auto shadow-2xl">
      <h3 className="text-lg font-bold text-center mb-1">Choose How to Play</h3>
      <p className="text-slate-400 text-xs text-center mb-6">Select your game mode for this scavenger hunt</p>
      
      {error && <p className="text-red-400 text-xs text-center mb-4">{error}</p>}

      <div className="space-y-4">
        {/* Solo Option */}
        <button
          onClick={handleEnrollSolo}
          disabled={loading}
          className="w-full text-left p-4 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-700/30 hover:border-slate-500 active:bg-slate-700/50 transition-all flex items-start gap-3 group"
        >
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-sm">Play Solo</h4>
            <p className="text-xs text-slate-400">Complete tasks independently and compete on the leaderboard alone.</p>
          </div>
        </button>

        {/* Team Option */}
        <button
          onClick={() => setPlayMode('team')}
          disabled={loading}
          className="w-full text-left p-4 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-700/30 hover:border-slate-500 active:bg-slate-700/50 transition-all flex items-start gap-3 group"
        >
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-sm">Play as Team</h4>
            <p className="text-xs text-slate-400">Share progress in real-time. Cooperate to find targets and earn points together.</p>
          </div>
        </button>
      </div>

      {onBack && (
        <button 
          onClick={onBack}
          className="mt-6 w-full text-center text-xs text-slate-400 hover:text-white"
        >
          Cancel Enrollment
        </button>
      )}
    </div>
  );
}
