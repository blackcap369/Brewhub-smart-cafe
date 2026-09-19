import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePermission } from '../../hooks/usePermission';
import { 
  getStaffMembers, 
  inviteStaff, 
  updateStaffRole, 
  deactivateStaff,
  reactivateStaff,
  type StaffMember 
} from '../../services/staffService';
import { ROLE_DESCRIPTIONS, getAvailableRoles, type UserRole } from '../../utils/rbac';
import { UserPlus, Edit2, UserCheck, UserX, Activity } from 'lucide-react';
import { supabase } from '../../services/supabase';

export function StaffManagement() {
  const { user } = useAuth();
  const { isOwner, isManagerOrAbove } = usePermission();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [cafeId, setCafeId] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState({
    phone: '',
    name: '',
    role: 'staff' as UserRole,
  });

  useEffect(() => {
    if (user?.id) {
      loadCafeId();
    }
  }, [user?.id]);

  const loadCafeId = async () => {
    if (!user?.id) return;
    
    try {
      const { data } = await supabase
        .from('users')
        .select('cafe_id')
        .eq('auth_user_id', user.id)
        .single();
      
      if (data) {
        setCafeId(data.cafe_id);
      }
    } catch (error) {
      console.error('Error loading cafe_id:', error);
    }
  };

  useEffect(() => {
    if (cafeId) {
      loadStaff();
    }
  }, [cafeId]);

  const loadStaff = async () => {
    if (!cafeId) return;
    
    try {
      setLoading(true);
      const staffData = await getStaffMembers(cafeId);
      setStaff(staffData);
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!user?.id || !cafeId) return;
    
    try {
      await inviteStaff(cafeId, inviteData, user.id);
      setShowInviteModal(false);
      setInviteData({ phone: '', name: '', role: 'staff' });
      loadStaff();
    } catch (error) {
      console.error('Error inviting staff:', error);
      alert('Failed to invite staff member');
    }
  };

  const handleRoleChange = async (staffId: string, newRole: UserRole) => {
    if (!user?.id || !cafeId) return;
    
    try {
      await updateStaffRole(staffId, newRole, user.id, cafeId);
      setEditingStaff(null);
      loadStaff();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    }
  };

  const handleToggleActive = async (staffMember: StaffMember) => {
    if (!user?.id || !cafeId) return;
    
    try {
      if (staffMember.is_active) {
        await deactivateStaff(staffMember.id, user.id, cafeId);
      } else {
        await reactivateStaff(staffMember.id, user.id, cafeId);
      }
      loadStaff();
    } catch (error) {
      console.error('Error toggling active status:', error);
      alert('Failed to update status');
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'staff':
        return 'bg-green-100 text-green-800';
      case 'kitchen':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isManagerOrAbove) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">You don't have permission to manage staff.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading staff...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
          <p className="text-gray-600">Manage your team members and their roles</p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <UserPlus size={20} />
            Invite Staff
          </button>
        )}
      </div>

      {/* Staff List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staff.map((staffMember) => (
              <tr key={staffMember.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {staffMember.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {staffMember.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Joined {new Date(staffMember.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{staffMember.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(staffMember.role)}`}>
                    {staffMember.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    staffMember.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {staffMember.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    {isOwner && (
                      <>
                        <button
                          onClick={() => setEditingStaff(staffMember)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Change Role"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(staffMember)}
                          className={staffMember.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                          title={staffMember.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {staffMember.is_active ? <UserX size={18} /> : <UserCheck size={18} />}
                        </button>
                      </>
                    )}
                    <button
                      className="text-gray-600 hover:text-gray-900"
                      title="View Activity"
                    >
                      <Activity size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Invite Staff Member</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={inviteData.phone}
                  onChange={(e) => setInviteData({ ...inviteData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  value={inviteData.name}
                  onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={inviteData.role}
                  onChange={(e) => setInviteData({ ...inviteData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {getAvailableRoles('owner').map((role) => (
                    <option key={role} value={role}>
                      {role} - {ROLE_DESCRIPTIONS[role]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={!inviteData.phone}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Change Role</h3>
            <p className="text-gray-600 mb-4">
              Change role for <span className="font-semibold">{editingStaff.name}</span>
            </p>
            <div className="space-y-3">
              {getAvailableRoles('owner').map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleChange(editingStaff.id, role)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                    editingStaff.role === role
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="font-semibold">{role}</div>
                  <div className="text-sm text-gray-600">{ROLE_DESCRIPTIONS[role]}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setEditingStaff(null)}
              className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
