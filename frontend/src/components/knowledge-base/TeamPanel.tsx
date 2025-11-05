/**
 * Team Panel Component
 */

import React, { useState } from 'react';
import { Users, UserPlus, Shield, Trash2, Mail } from 'lucide-react';
import { useUI } from '../../contexts/UIContext';
import { Modal } from '../shared/Modal';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'support' | 'marketing' | 'custom';
  permissions: {
    orders: 'access' | 'denied';
    products: 'access' | 'denied';
    reports: 'access' | 'denied';
    collections: 'access' | 'denied';
    documents: 'access' | 'denied';
    pii: boolean;
    financial: boolean;
  };
}

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    role: 'owner',
    permissions: {
      orders: 'access',
      products: 'access',
      reports: 'access',
      collections: 'access',
      documents: 'access',
      pii: true,
      financial: true
    }
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike@example.com',
    role: 'manager',
    permissions: {
      orders: 'access',
      products: 'access',
      reports: 'access',
      collections: 'access',
      documents: 'access',
      pii: false,
      financial: false
    }
  },
  {
    id: '3',
    name: 'Emma Davis',
    email: 'emma@example.com',
    role: 'support',
    permissions: {
      orders: 'access',
      products: 'access',
      reports: 'denied',
      collections: 'access',
      documents: 'access',
      pii: false,
      financial: false
    }
  }
];

const TeamPanel: React.FC = () => {
  const { showToast } = useUI();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleInvite = (email: string, role: TeamMember['role']) => {
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: email.split('@')[0],
      email,
      role,
      permissions: getDefaultPermissions(role)
    };
    setTeamMembers([...teamMembers, newMember]);
    showToast(`Invitation sent to ${email}`, 'success');
    setShowInviteModal(false);
  };

  const handleRemove = (id: string) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      setTeamMembers(teamMembers.filter(m => m.id !== id));
      showToast('Team member removed', 'success');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b-2 border-border/50">
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-2">Team & Permissions</h3>
          <p className="text-base text-foreground/70">
            <span className="font-semibold text-foreground">{teamMembers.length}</span> team members
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-3 px-6 py-3 bg-primary-gradient text-white rounded-modern text-base font-semibold hover:shadow-neon transition-all"
        >
          <UserPlus className="w-5 h-5" />
          Invite Member
        </button>
      </div>

      {/* Team Members List */}
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {teamMembers.map((member) => (
          <div
            key={member.id}
            className="p-6 bg-background/30 border-2 border-border/50 rounded-modern hover:border-primary/50 hover:bg-background/40 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary-gradient flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground mb-1">{member.name}</p>
                  <p className="text-base text-foreground/70 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {member.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRemove(member.id)}
                className="p-3 hover:bg-red-500/10 rounded-modern transition-colors border-2 border-transparent hover:border-red-500/30"
              >
                <Trash2 className="w-5 h-5 text-foreground/60 hover:text-red-500" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-base font-bold text-foreground capitalize">{member.role}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                <span className="text-foreground/70">Orders:</span>
                <span className={`font-bold capitalize ${
                  member.permissions.orders === 'access' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {member.permissions.orders === 'access' ? 'Access' : 'Denied'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                <span className="text-foreground/70">Products:</span>
                <span className={`font-bold capitalize ${
                  member.permissions.products === 'access' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {member.permissions.products === 'access' ? 'Access' : 'Denied'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                <span className="text-foreground/70">Reports:</span>
                <span className={`font-bold capitalize ${
                  member.permissions.reports === 'access' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {member.permissions.reports === 'access' ? 'Access' : 'Denied'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                <span className="text-foreground/70">Collections:</span>
                <span className={`font-bold capitalize ${
                  member.permissions.collections === 'access' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {member.permissions.collections === 'access' ? 'Access' : 'Denied'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                <span className="text-foreground/70">Documents:</span>
                <span className={`font-bold capitalize ${
                  member.permissions.documents === 'access' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {member.permissions.documents === 'access' ? 'Access' : 'Denied'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                <span className="text-foreground/70">PII Access:</span>
                <span className={`font-bold ${member.permissions.pii ? 'text-green-500' : 'text-red-500'}`}>
                  {member.permissions.pii ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                <span className="text-foreground/70">Financial:</span>
                <span className={`font-bold ${member.permissions.financial ? 'text-green-500' : 'text-red-500'}`}>
                  {member.permissions.financial ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteMemberModal
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInvite}
        />
      )}
    </div>
  );
};

const InviteMemberModal: React.FC<{
  onClose: () => void;
  onInvite: (email: string, role: TeamMember['role']) => void;
}> = ({ onClose, onInvite }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamMember['role']>('support');

  const handleSubmit = () => {
    if (!email.trim() || !email.includes('@')) {
      return;
    }
    onInvite(email, role);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Invite Team Member">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@example.com"
            className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-modern text-foreground placeholder:text-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as TeamMember['role'])}
            className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-modern text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="owner">Owner - Full access</option>
            <option value="manager">Manager - All except billing</option>
            <option value="support">Support - Customer-facing only</option>
            <option value="marketing">Marketing - Products & content</option>
            <option value="custom">Custom - Define permissions</option>
          </select>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-foreground/70 hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!email.trim() || !email.includes('@')}
            className="px-4 py-2 bg-primary-gradient text-white rounded-modern font-semibold hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send Invitation
          </button>
        </div>
      </div>
    </Modal>
  );
};

function getDefaultPermissions(role: TeamMember['role']): TeamMember['permissions'] {
  switch (role) {
    case 'owner':
      return {
        orders: 'access',
        products: 'access',
        reports: 'access',
        collections: 'access',
        documents: 'access',
        pii: true,
        financial: true
      };
    case 'manager':
      return {
        orders: 'access',
        products: 'access',
        reports: 'access',
        collections: 'access',
        documents: 'access',
        pii: false,
        financial: false
      };
    case 'support':
      return {
        orders: 'access',
        products: 'access',
        reports: 'denied',
        collections: 'access',
        documents: 'access',
        pii: false,
        financial: false
      };
    case 'marketing':
      return {
        orders: 'access',
        products: 'access',
        reports: 'access',
        collections: 'access',
        documents: 'access',
        pii: false,
        financial: false
      };
    default:
      return {
        orders: 'access',
        products: 'access',
        reports: 'access',
        collections: 'access',
        documents: 'access',
        pii: false,
        financial: false
      };
  }
}

export default TeamPanel;

