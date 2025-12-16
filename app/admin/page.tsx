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
import {
  createInvitation,
  getTenantInvitations,
  cancelInvitation,
  type Invitation,
} from '@/supabase/invitations';
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
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedUserForMember, setSelectedUserForMember] = useState<string>('');
  const [selectedMemberRole, setSelectedMemberRole] = useState<'owner' | 'admin' | 'user'>('user');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'owner' | 'admin' | 'user'>('user');
  const [tenantInvitations, setTenantInvitations] = useState<Invitation[]>([]);

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
      const [members, invitations] = await Promise.all([
        getTenantMembers(tenantId),
        getTenantInvitations(tenantId),
      ]);
      setTenantMembers(members);
      setTenantInvitations(invitations);
      setSelectedTenant(tenantId);
      setShowMembersModal(true);
    } catch (error) {
      console.error('Error loading tenant members:', error);
      alert('Error al cargar los miembros');
    }
  };

  const handleSendInvitation = async () => {
    if (!selectedTenant || !inviteEmail || !user) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      await createInvitation(selectedTenant, inviteEmail, inviteRole, user.id);
      // Recargar invitaciones
      const invitations = await getTenantInvitations(selectedTenant);
      setTenantInvitations(invitations);
      setInviteEmail('');
      setInviteRole('user');
      setShowInviteModal(false);
      alert('Invitación enviada exitosamente');
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      alert(error.message || 'Error al enviar la invitación');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('¿Estás seguro de que quieres cancelar esta invitación?')) {
      return;
    }

    try {
      await cancelInvitation(invitationId);
      if (selectedTenant) {
        const invitations = await getTenantInvitations(selectedTenant);
        setTenantInvitations(invitations);
      }
    } catch (error: any) {
      console.error('Error canceling invitation:', error);
      alert(error.message || 'Error al cancelar la invitación');
    }
  };

  const handleAddMember = async () => {
    if (!selectedTenant || !selectedUserForMember || !user) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      await addUserToTenant(selectedTenant, selectedUserForMember, selectedMemberRole);
      // Recargar miembros
      const members = await getTenantMembers(selectedTenant);
      setTenantMembers(members);
      setSelectedUserForMember('');
      setSelectedMemberRole('user');
      setShowAddMember(false);
      await loadData(); // Recargar datos generales
    } catch (error: any) {
      console.error('Error adding member:', error);
      alert(error.message || 'Error al agregar el miembro');
    }
  };

  const handleUpdateMemberRole = async (userId: string, newRole: 'owner' | 'admin' | 'user') => {
    if (!selectedTenant) return;

    try {
      await updateUserRoleInTenant(selectedTenant, userId, newRole);
      // Recargar miembros
      const members = await getTenantMembers(selectedTenant);
      setTenantMembers(members);
      await loadData();
    } catch (error: any) {
      console.error('Error updating member role:', error);
      alert(error.message || 'Error al actualizar el rol');
    }
  };

  const handleRemoveMember = async (userId: string, userEmail: string) => {
    if (!selectedTenant) return;

    if (!confirm(`¿Estás seguro de que quieres remover a ${userEmail} de esta empresa?`)) {
      return;
    }

    try {
      await removeUserFromTenant(selectedTenant, userId);
      // Recargar miembros
      const members = await getTenantMembers(selectedTenant);
      setTenantMembers(members);
      await loadData();
    } catch (error: any) {
      console.error('Error removing member:', error);
      alert(error.message || 'Error al remover el miembro');
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

      {/* Modal: Gestión de Miembros */}
      {showMembersModal && selectedTenant && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Gestión de Miembros</h3>
              <button
                onClick={() => {
                  setShowMembersModal(false);
                  setSelectedTenant(null);
                  setTenantMembers([]);
                  setShowAddMember(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Lista de miembros actuales */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-md font-medium">Miembros Actuales</h4>
                <Button onClick={() => setShowAddMember(true)} className="bg-green-600 hover:bg-green-700">
                  + Agregar Miembro
                </Button>
              </div>
              {tenantMembers.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay miembros en esta empresa</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tenantMembers.map((member: any) => (
                        <tr key={member.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {member.user?.email || member.user_id}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            <select
                              value={member.role}
                              onChange={(e) => handleUpdateMemberRole(member.user_id, e.target.value as 'owner' | 'admin' | 'user')}
                              className="border border-gray-300 rounded px-2 py-1 text-sm"
                            >
                              <option value="user">Usuario</option>
                              <option value="admin">Admin</option>
                              <option value="owner">Owner</option>
                            </select>
                          </td>
                          <td className="px-4 py-2 text-right text-sm">
                            <Button
                              onClick={() => handleRemoveMember(member.user_id, member.user?.email || member.user_id)}
                              className="bg-red-600 hover:bg-red-700 text-xs"
                            >
                              Remover
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Formulario para agregar miembro */}
            {showAddMember && (
              <div className="border-t pt-4 mt-4">
                <h4 className="text-md font-medium mb-4">Agregar Nuevo Miembro</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Usuario
                    </label>
                    <select
                      value={selectedUserForMember}
                      onChange={(e) => setSelectedUserForMember(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="">Selecciona un usuario</option>
                      {users
                        .filter((u) => !tenantMembers.some((m: any) => m.user_id === u.id))
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.email} {u.role === 'admin' ? '(Admin)' : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rol
                    </label>
                    <select
                      value={selectedMemberRole}
                      onChange={(e) => setSelectedMemberRole(e.target.value as 'owner' | 'admin' | 'user')}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="user">Usuario</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button onClick={() => setShowAddMember(false)}>Cancelar</Button>
                    <Button onClick={handleAddMember} className="bg-green-600 hover:bg-green-700">
                      Agregar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Sección de Invitaciones */}
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-md font-medium">Invitaciones Pendientes</h4>
                <Button onClick={() => setShowInviteModal(true)} className="bg-blue-600 hover:bg-blue-700">
                  + Enviar Invitación
                </Button>
              </div>
              {tenantInvitations.filter((inv) => inv.status === 'pending').length === 0 ? (
                <p className="text-gray-500 text-sm">No hay invitaciones pendientes</p>
              ) : (
                <div className="overflow-x-auto mt-2">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expira</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tenantInvitations
                        .filter((inv) => inv.status === 'pending')
                        .map((inv) => (
                          <tr key={inv.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">{inv.email}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{inv.role}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {new Date(inv.expires_at).toLocaleDateString('es-CL')}
                            </td>
                            <td className="px-4 py-2 text-right text-sm">
                              <Button
                                onClick={() => handleCancelInvitation(inv.id)}
                                className="bg-red-600 hover:bg-red-700 text-xs"
                              >
                                Cancelar
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Enviar Invitación */}
      {showInviteModal && selectedTenant && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Enviar Invitación</h3>
            <div className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'owner' | 'admin' | 'user')}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                  setInviteRole('user');
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleSendInvitation} className="bg-blue-600 hover:bg-blue-700">
                  Enviar Invitación
                </Button>
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
