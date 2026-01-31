'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { UserPlus, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/createClient';

type FamilyStatus = 'pending' | 'accepted' | 'declined';

type FamilyMember = {
  id: string;
  name: string;
  status: FamilyStatus;
};

type FamilyData = {
  familyName: string;
  ownerName: string;
  myFamilyMembers: FamilyMember[];
  familiesImIn: FamilyMember[];
};

type PendingInvite = {
  id: string;
  contact: string;
  sentAt: string;
};

export default function FamilyPage() {
  const [familyData, setFamilyData] = useState<FamilyData>({
    familyName: 'Loading…',
    ownerName: '',
    myFamilyMembers: [],
    familiesImIn: [],
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteContact, setInviteContact] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isSavingInvite, setIsSavingInvite] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadFamily = useCallback(async () => {
    try {
      setLoadError(null);
      
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      
      if (error || !session?.user) {
        setLoadError('Please sign in to view your family.');
        return;
      }

      const user = session.user;
      setCurrentUserId((prev) => (prev === user.id ? prev : user.id));

      let displayName =
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.phone ??
        'Your';

      const { data: personal } = await supabase
        .from('personal')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle();

      if (personal?.display_name) {
        displayName = personal.display_name;
      }

      const familyName = `${displayName}'s Family`;

      // Fetch family links with better error handling
      const response = await fetch('/api/family/links', { 
        cache: 'no-store' 
      });
      
      if (!response.ok) {
        // Check if the response has content before trying to parse JSON
        const errorText = await response.text();
        let errorMessage = 'Unable to load family data.';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use the text or a default message
          errorMessage = errorText || `Error ${response.status}: ${response.statusText}`;
        }
        
        console.error('Failed to load family links:', errorMessage);
        setLoadError(errorMessage);
        
        // Set default data so the page still renders
        setFamilyData({
          familyName,
          ownerName: displayName,
          myFamilyMembers: [],
          familiesImIn: [],
        });
        return;
      }

      const linksData: {
        outgoing: Array<{
          id: string;
          memberId: string;
          status: FamilyStatus;
          displayName: string;
          createdAt: string;
        }>;
        incoming: Array<{
          id: string;
          memberId: string;
          status: FamilyStatus;
          displayName: string;
          createdAt: string;
        }>;
      } = await response.json();

      const myFamilyMembers = linksData.outgoing.map((link) => ({
        id: link.memberId,
        name: link.displayName,
        status: link.status,
      }));

      const familiesImIn = linksData.incoming.map((link) => ({
        id: link.memberId,
        name: link.displayName,
        status: link.status,
      }));

      const nextPendingInvites = linksData.outgoing
        .filter((link) => link.status === 'pending')
        .map((link) => ({
          id: link.id,
          contact: link.displayName,
          sentAt: link.createdAt,
        }));

      setPendingInvites(nextPendingInvites);

      setFamilyData({
        familyName,
        ownerName: displayName,
        myFamilyMembers,
        familiesImIn,
      });
    } catch (error) {
      console.error('Error loading family:', error);
      setLoadError('An unexpected error occurred while loading family data.');
    }
  }, []);

  useEffect(() => {
    loadFamily();
  }, [loadFamily]);

  const handleRemove = async (memberId: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from('family_links')
        .delete()
        .eq('requester_id', currentUserId)
        .eq('recipient_id', memberId);

      if (error) {
        console.error('Error removing family member:', error);
        return;
      }

      await loadFamily();
    } catch (error) {
      console.error('Error removing family member:', error);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inviteContact.trim();
    if (!trimmed) return;

    if (!currentUserId) {
      setInviteError('Please sign in again to send invites.');
      return;
    }

    setIsSavingInvite(true);
    setInviteError(null);

    try {
      const response = await fetch('/api/family/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: trimmed }),
      });

      if (!response.ok) {
        // Better error handling for non-200 responses
        const errorText = await response.text();
        let errorMessage = 'Unable to send invite.';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || `Error ${response.status}: ${response.statusText}`;
        }
        
        setInviteError(errorMessage);
        setIsSavingInvite(false);
        return;
      }

      setInviteContact('');
      setIsInviteOpen(false);
      setIsSavingInvite(false);
      await loadFamily();
    } catch (error) {
      console.error('Error sending invite:', error);
      setInviteError('An unexpected error occurred. Please try again.');
      setIsSavingInvite(false);
    }
  };

  const activeMembers = useMemo(
    () => familyData.myFamilyMembers.filter(m => m.status === 'accepted'),
    [familyData.myFamilyMembers]
  );

  return (
    <div className="min-h-screen bg-[#f4f7f8]">
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-6">

        {/* Error Alert */}
        {loadError && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
            <p className="text-rose-600 text-sm">{loadError}</p>
          </div>
        )}

        {/* Header */}
        <section className="bg-white rounded-3xl shadow-xl p-8">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm uppercase tracking-widest text-teal-600 font-semibold">
                Family
              </p>
              <h1 className="text-black text-3xl font-semibold mt-2">
                {familyData.familyName}
              </h1>
              <p className="text-slate-500 mt-2">
                Managed by <span className="font-semibold">{familyData.ownerName}</span>
              </p>
            </div>
            <button
              onClick={() => setIsInviteOpen(true)}
              className="flex items-center gap-2 bg-teal-600 text-white px-5 py-3 rounded-xl hover:bg-teal-700"
            >
              <UserPlus className="h-5 w-5" />
              Invite family member
            </button>
          </div>
        </section>

        {/* Members */}
        <section className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-black text-2xl font-semibold mb-4">Family Members</h2>

          {activeMembers.length === 0 ? (
            <p className="text-slate-500">No family members yet.</p>
          ) : (
            activeMembers.map(member => (
              <div
                key={member.id}
                className="flex justify-between items-center bg-slate-50 rounded-xl p-4 mb-2"
              >
                <p className="font-semibold">{member.name}</p>
                <button
                  onClick={() => handleRemove(member.id)}
                  className="flex items-center gap-2 text-rose-600 hover:bg-rose-50 px-3 py-1 rounded-full"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>
            ))
          )}
        </section>
      </main>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center">
              <h3 className="text-black font-semibold text-lg">Invite family member</h3>
              <button onClick={() => setIsInviteOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="mt-4 space-y-4">
              <input
                value={inviteContact}
                onChange={e => setInviteContact(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />

              {inviteError && (
                <p className="text-rose-600 text-sm">{inviteError}</p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingInvite}
                  className="flex-1 bg-teal-600 text-white py-2 rounded-xl hover:bg-teal-700 disabled:opacity-50"
                >
                  {isSavingInvite ? 'Sending…' : 'Send invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
