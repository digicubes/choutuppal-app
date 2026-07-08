'use client';

import React, { useEffect, useState } from 'react';
import { getAdminUsers, updateAdminUserRole, toggleAdminUserPremium, resetAdminUserPassword, deleteAdminUser, toggleAdminUserFeatured, getAdminUserContent, deleteAdminListing, deleteAdminUserPost, deleteAdminStory } from '@/app/actions/admin-actions';
import { Trash2, Key, Crown, Shield, User as UserIcon, Loader2, Star, Eye, X } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // store userId + action

  const [selectedUserForContent, setSelectedUserForContent] = useState<any | null>(null);
  const [userContent, setUserContent] = useState<{listings: any[], posts: any[], stories: any[]} | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ fullName: '', email: '', phone: '', password: '', role: 'user' });
  const [isAddingUser, setIsAddingUser] = useState(false);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingUser(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add user');
      toast.success('User added successfully');
      setNewUserForm({ fullName: '', email: '', phone: '', password: '', role: 'user' });
      setShowAddUserModal(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsAddingUser(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (error) {
      toast.error('Failed to load users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(`${userId}-role`);
    try {
      await updateAdminUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success('Role updated successfully');
    } catch (error) {
      toast.error('Failed to update role');
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePremiumToggle = async (userId: string, currentTier: string) => {
    const isPremium = currentTier === 'premium';
    setActionLoading(`${userId}-premium`);
    try {
      await toggleAdminUserPremium(userId, !isPremium);
      setUsers(users.map(u => u.id === userId ? { ...u, subscriptionTier: !isPremium ? 'premium' : 'free' } : u));
      toast.success(!isPremium ? 'User upgraded to Premium 👑' : 'Premium removed');
    } catch (error) {
      toast.error('Failed to toggle premium');
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleFeaturedToggle = async (userId: string, currentFeatured: boolean) => {
    setActionLoading(`${userId}-featured`);
    try {
      await toggleAdminUserFeatured(userId, !currentFeatured);
      setUsers(users.map(u => u.id === userId ? { ...u, isFeatured: !currentFeatured } : u));
      toast.success(!currentFeatured ? 'User marked as Featured ⭐' : 'Featured status removed');
    } catch (error) {
      toast.error('Failed to toggle featured status');
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (userId: string, email: string) => {
    if (!email) {
      toast.error('User has no email');
      return;
    }
    setActionLoading(`${userId}-reset`);
    try {
      await resetAdminUserPassword(email);
      toast.success(`Password reset email sent to ${email}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    setActionLoading(`${userId}-delete`);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user');
      
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('User deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewContent = async (user: any) => {
    setSelectedUserForContent(user);
    setLoadingContent(true);
    setUserContent(null);
    try {
      const content = await getAdminUserContent(user.id);
      setUserContent(content);
    } catch (error) {
      toast.error('Failed to load user content');
    } finally {
      setLoadingContent(false);
    }
  };

  const handleDeleteContent = async (id: string, type: 'listing' | 'post' | 'story') => {
    if (!window.confirm('Delete this item permanently?')) return;
    try {
      if (type === 'listing') await deleteAdminListing(id, 'business');
      else if (type === 'post') await deleteAdminUserPost(id);
      else if (type === 'story') await deleteAdminStory(id);
      
      toast.success('Item deleted');
      if (selectedUserForContent) {
        handleViewContent(selectedUserForContent);
      }
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <UserIcon className="w-5 h-5 mr-2 text-[#4169E1]" />
          Users Management
        </h3>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500 font-bold bg-white px-3 py-1 rounded-full border border-gray-200">
            Total: {users.length}
          </div>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="bg-[#4169E1] hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition shadow-sm"
          >
            + Add New User
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase text-xs tracking-wider">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Premium / Featured</th>
              <th className="px-6 py-4">Joined Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{user.fullName || 'No Name'}</div>
                  <div className="text-xs text-gray-500">{user.id.slice(0, 8)}...</div>
                  <div className="mt-1 flex gap-2 text-[10px] font-semibold text-gray-500">
                    <span>{user._count?.listings ?? 0} Listings</span>
                    <span>{user._count?.posts ?? 0} Posts</span>
                    <span>{user._count?.stories ?? 0} Stories</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-gray-900">{user.email || 'No Email'}</div>
                  <div className="text-gray-500 text-xs mt-0.5">{user.phone || 'No Phone'}</div>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={user.role || 'user'}
                    disabled={actionLoading === `${user.id}-role`}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-2 py-1 text-xs font-semibold focus:ring-[#4169E1] focus:border-[#4169E1] transition-all"
                  >
                    <option value="user">User</option>
                    <option value="agent">Agent</option>
                    <option value="city_manager">City Manager</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handlePremiumToggle(user.id, user.subscriptionTier)}
                      disabled={actionLoading === `${user.id}-premium`}
                      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all w-24 ${
                        user.subscriptionTier === 'premium'
                          ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20'
                          : 'bg-gray-100 text-gray-500 border border-transparent hover:bg-gray-200'
                      }`}
                    >
                      <Crown className={`w-3.5 h-3.5 ${user.subscriptionTier === 'premium' ? 'fill-current' : ''}`} />
                      {user.subscriptionTier === 'premium' ? 'Premium' : 'Standard'}
                    </button>
                    <button
                      onClick={() => handleFeaturedToggle(user.id, user.isFeatured)}
                      disabled={actionLoading === `${user.id}-featured`}
                      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all w-24 ${
                        user.isFeatured
                          ? 'bg-yellow-50 text-yellow-600 border border-yellow-200 hover:bg-yellow-100'
                          : 'bg-gray-100 text-gray-500 border border-transparent hover:bg-gray-200'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${user.isFeatured ? 'fill-current' : ''}`} />
                      {user.isFeatured ? 'Featured' : 'Regular'}
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleViewContent(user)}
                      title="View Postings"
                      className="p-2 text-gray-500 hover:text-green-500 hover:bg-green-50 rounded-lg transition"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleResetPassword(user.id, user.email)}
                      disabled={actionLoading === `${user.id}-reset`}
                      title="Force Password Reset"
                      className="p-2 text-gray-500 hover:text-[#4169E1] hover:bg-blue-50 rounded-lg transition"
                    >
                      {actionLoading === `${user.id}-reset` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={actionLoading === `${user.id}-delete`}
                      title="Delete User"
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      {actionLoading === `${user.id}-delete` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedUserForContent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-lg">
                Content by {selectedUserForContent.fullName || 'User'}
              </h3>
              <button onClick={() => setSelectedUserForContent(null)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 space-y-6">
              {loadingContent ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <p>Loading user content...</p>
                </div>
              ) : userContent ? (
                <>
                  {/* Listings */}
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3 text-lg border-b pb-2">Listings ({userContent.listings.length})</h4>
                    {userContent.listings.length === 0 ? (
                      <p className="text-gray-500 text-sm">No listings found.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {userContent.listings.map((l: any) => (
                          <div key={l.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl hover:shadow-sm">
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-gray-900 truncate">{l.name}</span>
                              <span className="text-xs text-gray-500 truncate">{l.category} • {l.status}</span>
                            </div>
                            <button onClick={() => handleDeleteContent(l.id, 'listing')} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Community Posts */}
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3 text-lg border-b pb-2">Community Posts ({userContent.posts.length})</h4>
                    {userContent.posts.length === 0 ? (
                      <p className="text-gray-500 text-sm">No posts found.</p>
                    ) : (
                      <div className="space-y-3">
                        {userContent.posts.map((p: any) => (
                          <div key={p.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl hover:shadow-sm">
                            <div className="flex flex-col min-w-0 flex-1 pr-3">
                              <span className="text-sm text-gray-700 line-clamp-2">{p.content || p.textContent || '(No content)'}</span>
                              <span className="text-xs text-gray-400 mt-1">{new Date(p.createdAt).toLocaleDateString()}</span>
                            </div>
                            <button onClick={() => handleDeleteContent(p.id, 'post')} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stories */}
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3 text-lg border-b pb-2">Stories ({userContent.stories.length})</h4>
                    {userContent.stories.length === 0 ? (
                      <p className="text-gray-500 text-sm">No stories found.</p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {userContent.stories.map((s: any) => (
                          <div key={s.id} className="relative aspect-[9/16] rounded-xl overflow-hidden border border-gray-100 group">
                            {s.mediaUrl ? (
                              <img src={s.mediaUrl} className="w-full h-full object-cover" alt="Story" />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center"><span className="text-xs text-gray-400">No Media</span></div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button onClick={() => handleDeleteContent(s.id, 'story')} className="p-2 bg-white text-red-500 hover:bg-red-500 hover:text-white rounded-full">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-xl">Add New User</h3>
              <button onClick={() => setShowAddUserModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input required type="text" value={newUserForm.fullName} onChange={e => setNewUserForm({...newUserForm, fullName: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#4169E1] outline-none" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                <input required type="tel" value={newUserForm.phone} onChange={e => setNewUserForm({...newUserForm, phone: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#4169E1] outline-none" placeholder="+91..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                <input type="email" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#4169E1] outline-none" placeholder="john@example.com (optional)" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                <input required type="password" value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#4169E1] outline-none" placeholder="Min 6 characters" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
                <select value={newUserForm.role} onChange={e => setNewUserForm({...newUserForm, role: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#4169E1] outline-none bg-white">
                  <option value="user">User</option>
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddUserModal(false)} className="px-5 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition">Cancel</button>
                <button type="submit" disabled={isAddingUser} className="px-5 py-2.5 rounded-xl font-bold text-white bg-[#4169E1] hover:bg-blue-700 transition flex items-center gap-2">
                  {isAddingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
