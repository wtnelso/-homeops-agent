import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AdminService, BetaUser } from '../services/adminService';
import { useToast } from '../contexts/ToastContext';
import { 
  Shield, 
  Users, 
  Mail,
  RefreshCw,
  Plus,
  X,
  UserPlus
} from 'lucide-react';

const AdminPage: React.FC = () => {
  const { user, userData } = useAuth();
  const { showToast } = useToast();
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [betaUsers, setBetaUsers] = useState<BetaUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [betaLoading, setBetaLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newBetaEmail, setNewBetaEmail] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load both admin emails and beta users
      const [adminResult, betaResult] = await Promise.all([
        AdminService.listAdminEmails(),
        AdminService.listBetaUsers()
      ]);

      if (adminResult.success && adminResult.emails) {
        setAdminEmails(adminResult.emails);
      } else {
        setError(adminResult.error || 'Failed to load admin data');
      }

      if (betaResult.success && betaResult.betaUsers) {
        setBetaUsers(betaResult.betaUsers);
      } else if (!betaResult.success) {
        console.error('Failed to load beta users:', betaResult.error);
      }
    } catch (err) {
      setError('Failed to load admin data');
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAdminData();
  };

  const handleAddBetaUser = async () => {
    if (!newBetaEmail.trim()) {
      showToast('Please enter an email address', 'error');
      return;
    }

    setBetaLoading(true);
    try {
      const result = await AdminService.addBetaUser(newBetaEmail.trim());
      if (result.success) {
        showToast('Beta user added successfully', 'success');
        setNewBetaEmail('');
        // Refresh beta users list
        const betaResult = await AdminService.listBetaUsers();
        if (betaResult.success && betaResult.betaUsers) {
          setBetaUsers(betaResult.betaUsers);
        }
      } else {
        showToast(result.error || 'Failed to add beta user', 'error');
      }
    } catch (error) {
      console.error('Error adding beta user:', error);
      showToast('Failed to add beta user', 'error');
    } finally {
      setBetaLoading(false);
    }
  };

  const handleRemoveBetaUser = async (betaUserId: string, email: string) => {
    if (!confirm(`Remove ${email} from beta users?`)) {
      return;
    }

    setBetaLoading(true);
    try {
      const result = await AdminService.removeBetaUser(betaUserId);
      if (result.success) {
        showToast('Beta user removed successfully', 'success');
        // Refresh beta users list
        const betaResult = await AdminService.listBetaUsers();
        if (betaResult.success && betaResult.betaUsers) {
          setBetaUsers(betaResult.betaUsers);
        }
      } else {
        showToast(result.error || 'Failed to remove beta user', 'error');
      }
    } catch (error) {
      console.error('Error removing beta user:', error);
      showToast('Failed to remove beta user', 'error');
    } finally {
      setBetaLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-xl dark:bg-gray-800/95 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
                <p className="text-gray-600 dark:text-gray-400">HomeOps Administration</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Welcome, {user?.email}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage beta user access to the HomeOps platform. Add or remove email addresses to control who can access the app during beta.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Admin Users Count */}
          <div className="bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Admin Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{adminEmails.length}</p>
              </div>
            </div>
          </div>

          {/* Beta Users Count */}
          <div className="bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Beta Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{betaUsers.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Admin Users */}
          <div className="bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Admin Users
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Users with administrative access to the platform
              </p>
            </div>
            
            <div className="p-6">
              {error ? (
                <div className="text-center py-8">
                  <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                  <button
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : adminEmails.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No admin users found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {adminEmails.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{email}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {email === user?.email ? 'You' : 'Admin User'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                          Active
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Beta Users Management */}
          <div className="bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Beta Users
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Email addresses with beta access to the platform
              </p>
            </div>
            
            <div className="p-6">
              {/* Add Beta User Form */}
              <div className="mb-6">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="email"
                      value={newBetaEmail}
                      onChange={(e) => setNewBetaEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddBetaUser();
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={handleAddBetaUser}
                    disabled={betaLoading || !newBetaEmail.trim()}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </button>
                </div>
              </div>

              {/* Beta Users List */}
              {betaUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No beta users added yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Add email addresses above to grant beta access</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {betaUsers.map((betaUser) => (
                    <div
                      key={betaUser.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {betaUser.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{betaUser.email}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Added {new Date(betaUser.added_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleRemoveBetaUser(betaUser.id, betaUser.email)}
                          disabled={betaLoading}
                          className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                          title="Remove beta user"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;