'use client';

// Página principal del panel de administración (Super Admin)
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase-auth-context';
import {
  getAllUsers,
  getAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
  updateUserRole,
  deleteUser,
  getSystemStats,
  type AccessRequest,
  type UserWithRequest,
} from '@/supabase/admin';
import {
  getAllTenants,
  createTenant,
  updateTenant,
  deleteTenant,
  getTenantMembers,
  addUserToTenant,
  updateUserRoleInTenant,
  removeUserFromTenant,
  type TenantWithMembers,
} from '@/supabase/tenants';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

type TabType = 'overview' | 'tenants' | 'users' | 'requests';

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserWithRequest[]>([]);
  const [tenants, setTenants] = useState<TenantWithMembers[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalTenants: 0, pendingRequests: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Estados para modales
  const [showCreateTenant, setShowCreateTenant] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantSlug, setNewTenantSlug] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [tenantMembers, setTenantMembers] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, requestsData, tenantsData, statsData] = await Promise.all([
        getAllUsers(),
        getAccessRequests(),
        getAllTenants(),
        getSystemStats(),
      ]);
      setUsers(usersData);
      setRequests(requestsData);
      setTenants(tenantsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async () => {
    if (!user || !newTenantName || !newTenantSlug) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      await createTenant(newTenantName, newTenantSlug, user.id);
      setShowCreateTenant(false);
      setNewTenantName('');
      setNewTenantSlug('');
      await loadData();
    } catch (error: any) {
      console.error('Error creating tenant:', error);
      alert(error.message || 'Error al crear la empresa');
    }
  };

  const handleDeleteTenant = async (tenantId: string, tenantName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la empresa "${tenantName}"? Esta acción eliminará todos los datos relacionados.`)) {
      return;
    }

    try {
      await deleteTenant(tenantId);
      await loadData();
    } catch (error) {
      console.error('Error deleting tenant:', error);
      alert('Error al eliminar la empresa');
    }
  };

  const handleViewTenantMembers = async (tenantId: string) => {
    try {
      const members = await getTenantMembers(tenantId);
      setTenantMembers(members);
      setSelectedTenant(tenantId);
    } catch (error) {
      console.error('Error loading tenant members:', error);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!user) return;
    try {
      await approveAccessRequest(requestId, user.id);
      await loadData();
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error al aprobar la solicitud');
    }
  };

  const handleReject = async (requestId: string) => {
    if (!user) return;
    try {
      await rejectAccessRequest(requestId, user.id);
      await loadData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error al rechazar la solicitud');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'user') => {
    if (!user) return;
    try {
      await updateUserRole(userId, newRole);
      await loadData();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Error al actualizar el rol');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!user) return;
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      return;
    }
    try {
      await deleteUser(userId);
      await loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar el usuario');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Usuarios</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Empresas</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalTenants}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Solicitudes Pendientes</h3>
            <p className="mt-2 text-3xl font-bold text-yellow-600">{stats.pendingRequests}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Resumen
          </button>
          <button
            onClick={() => setActiveTab('tenants')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tenants'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Empresas ({tenants.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Solicitudes ({requests.filter((r) => r.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Usuarios ({users.length})
          </button>
        </nav>
      </div>

      {/* Tab: Tenants */}
      {activeTab === 'tenants' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Gestión de Empresas</h2>
            <Button onClick={() => setShowCreateTenant(true)}>Crear Empresa</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Miembros</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No hay empresas
                    </td>
                  </tr>
                ) : (
                  tenants.map((tenant) => (
                    <tr key={tenant.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {tenant.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tenant.slug}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tenant.owner?.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tenant.member_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(tenant.created_at).toLocaleDateString('es-CL')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Button
                          onClick={() => handleViewTenantMembers(tenant.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Ver Miembros
                        </Button>
                        <Button
                          onClick={() => handleDeleteTenant(tenant.id, tenant.name)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Eliminar
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Crear Tenant */}
      {showCreateTenant && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Crear Nueva Empresa</h3>
            <div className="space-y-4">
              <Input
                label="Nombre de la Empresa"
                value={newTenantName}
                onChange={(e) => setNewTenantName(e.target.value)}
                placeholder="Ej: Empresa MIC"
              />
              <Input
                label="Slug (URL)"
                value={newTenantSlug}
                onChange={(e) => setNewTenantSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="Ej: mic"
              />
              <div className="flex justify-end space-x-2">
                <Button onClick={() => setShowCreateTenant(false)}>Cancelar</Button>
                <Button onClick={handleCreateTenant}>Crear</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Requests */}
      {activeTab === 'requests' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Solicitudes de Acceso</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No hay solicitudes de acceso
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {request.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.requested_at).toLocaleDateString('es-CL')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            request.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : request.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {request.status === 'pending'
                            ? 'Pendiente'
                            : request.status === 'approved'
                            ? 'Aprobada'
                            : 'Rechazada'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {request.status === 'pending' && (
                          <div className="flex justify-end space-x-2">
                            <Button
                              onClick={() => handleApprove(request.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Aprobar
                            </Button>
                            <Button
                              onClick={() => handleReject(request.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Rechazar
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Users */}
      {activeTab === 'users' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Gestión de Usuarios</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No hay usuarios
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.display_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role || 'user'}
                          onChange={(e) =>
                            handleUpdateRole(user.id, e.target.value as 'admin' | 'user')
                          }
                          className="text-sm border-gray-300 rounded-md"
                        >
                          <option value="user">Usuario</option>
                          <option value="admin">Super Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString('es-CL')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Eliminar
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
