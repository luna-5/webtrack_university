import { useEffect, useState } from 'react';
import { ArrowLeft, Users, Plus, Trash2, UserPlus, Lock, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Team {
  id: string;
  name: string;
  description: string;
  password: string;
}

interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  user_roles: {
    role: string;
  }[];
}

interface TeamManagementProps {
  onBack: () => void;
}

export default function TeamManagement({ onBack }: TeamManagementProps) {
  const { userRole } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [newTeamPassword, setNewTeamPassword] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');
  const [showTeamPassword, setShowTeamPassword] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [editPasswordValue, setEditPasswordValue] = useState('');
  const [copiedPassword, setCopiedPassword] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamMembers(selectedTeam.id);
    }
  }, [selectedTeam]);

  const fetchTeams = async () => {
    try {
      const { data } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: true });
      setTeams(data || []);
      if (data && data.length > 0 && !selectedTeam) {
        setSelectedTeam(data[0]);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    try {
      const { data: teamMembers } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          user_roles (role)
        `)
        .eq('default_team_id', teamId);

      const { data: admins } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          user_roles!inner (role)
        `)
        .eq('user_roles.role', 'system_user');

      const memberIds = new Set((teamMembers || []).map(m => m.id));
      const uniqueAdmins = (admins || []).filter(a => !memberIds.has(a.id));

      setMembers([...(teamMembers || []), ...uniqueAdmins]);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    if (!newTeamPassword.trim()) {
      alert('La contraseña del equipo es requerida');
      return;
    }

    try {
      const { error } = await supabase
        .from('teams')
        .insert({
          name: newTeamName,
          description: newTeamDescription,
          password: newTeamPassword,
        });

      if (error) throw error;

      setNewTeamName('');
      setNewTeamDescription('');
      setNewTeamPassword('');
      setShowAddTeam(false);
      fetchTeams();
    } catch (error: any) {
      alert(error.message || 'Error al crear equipo');
    }
  };

  const handleUpdatePassword = async () => {
    if (!selectedTeam || !editPasswordValue.trim()) return;

    try {
      const { error } = await supabase
        .from('teams')
        .update({ password: editPasswordValue })
        .eq('id', selectedTeam.id);

      if (error) throw error;

      setSelectedTeam({ ...selectedTeam, password: editPasswordValue });
      setEditingPassword(false);
      setEditPasswordValue('');
      fetchTeams();
    } catch (error: any) {
      alert(error.message || 'Error al actualizar contraseña');
    }
  };

  const copyPassword = () => {
    if (selectedTeam?.password) {
      navigator.clipboard.writeText(selectedTeam.password);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim() || !selectedTeam) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newMemberEmail)
        .maybeSingle();

      if (!profile) {
        alert('Usuario no encontrado');
        return;
      }

      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: profile.id,
          role: newMemberRole,
        }, { onConflict: 'user_id' });

      if (roleError) throw roleError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ default_team_id: selectedTeam.id })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      setNewMemberEmail('');
      setNewMemberRole('member');
      setShowAddMember(false);
      fetchTeamMembers(selectedTeam.id);
    } catch (error: any) {
      alert(error.message || 'Error al agregar miembro');
    }
  };

  const handleRemoveMember = async (profileId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este miembro del equipo?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ default_team_id: null })
        .eq('id', profileId);

      if (error) throw error;

      if (selectedTeam) {
        fetchTeamMembers(selectedTeam.id);
      }
    } catch (error: any) {
      alert(error.message || 'Error al eliminar miembro');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este equipo?')) return;

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      fetchTeams();
      setSelectedTeam(null);
    } catch (error: any) {
      alert(error.message || 'Error al eliminar equipo');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando equipos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver al Panel
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Gestión de Equipos</h1>
            <p className="text-lg text-slate-600">Administra equipos y miembros</p>
          </div>
          {userRole === 'system_user' && (
            <button
              onClick={() => setShowAddTeam(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nuevo Equipo
            </button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Equipos</h3>
              <div className="space-y-2">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedTeam?.id === team.id
                        ? 'bg-blue-50 border-2 border-blue-600'
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div onClick={() => setSelectedTeam(team)} className="flex-1">
                      <p className="font-semibold text-slate-900">{team.name}</p>
                      <p className="text-sm text-slate-600">{team.description}</p>
                    </div>
                    {userRole === 'system_user' && (
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedTeam ? (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center">
                      <Lock className="w-5 h-5 mr-2 text-blue-600" />
                      Contraseña del Equipo
                    </h3>
                    {!editingPassword && (
                      <button
                        onClick={() => {
                          setEditingPassword(true);
                          setEditPasswordValue(selectedTeam.password || '');
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Cambiar
                      </button>
                    )}
                  </div>

                  {editingPassword ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editPasswordValue}
                        onChange={(e) => setEditPasswordValue(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Nueva contraseña del equipo"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingPassword(false);
                            setEditPasswordValue('');
                          }}
                          className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleUpdatePassword}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 px-4 py-3 bg-slate-50 rounded-lg font-mono">
                        {showTeamPassword ? (
                          selectedTeam.password || '(sin contraseña)'
                        ) : (
                          '••••••••'
                        )}
                      </div>
                      <button
                        onClick={() => setShowTeamPassword(!showTeamPassword)}
                        className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title={showTeamPassword ? 'Ocultar' : 'Mostrar'}
                      >
                        {showTeamPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={copyPassword}
                        className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Copiar"
                      >
                        {copiedPassword ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  )}
                  <p className="text-sm text-slate-500 mt-3">
                    Comparte esta contraseña con los miembros que quieras que se unan al equipo
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-slate-900">
                      Miembros de {selectedTeam.name}
                    </h3>
                    <button
                      onClick={() => setShowAddMember(true)}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <UserPlus className="w-5 h-5 mr-2" />
                      Agregar Miembro
                    </button>
                  </div>

                  <div className="space-y-3">
                    {members.map((member) => {
                      const role = member.user_roles?.[0]?.role;
                      return (
                        <div
                          key={member.id}
                          className="flex justify-between items-center p-4 bg-slate-50 rounded-lg"
                        >
                          <div>
                            <p className="font-semibold text-slate-900">
                              {member.full_name || member.email}
                            </p>
                            <p className="text-sm text-slate-600">{member.email}</p>
                            <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                              role === 'system_user'
                                ? 'bg-slate-700 text-white'
                                : role === 'team_leader'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {role === 'system_user'
                                ? 'Administrador'
                                : role === 'team_leader'
                                ? 'Líder de Equipo'
                                : 'Miembro'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      );
                    })}
                    {members.length === 0 && (
                      <div className="text-center py-8 text-slate-600">
                        No hay miembros en este equipo
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Selecciona un equipo para ver sus miembros</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Crear Nuevo Equipo</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nombre del Equipo
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Nombre"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Descripción del equipo"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Contraseña del Equipo
                </label>
                <input
                  type="text"
                  value={newTeamPassword}
                  onChange={(e) => setNewTeamPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Contraseña para que miembros se unan"
                />
                <p className="text-sm text-slate-500 mt-1">
                  Los nuevos usuarios necesitarán esta contraseña para unirse al equipo
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowAddTeam(false);
                    setNewTeamName('');
                    setNewTeamDescription('');
                    setNewTeamPassword('');
                  }}
                  className="flex-1 py-3 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateTeam}
                  className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Agregar Miembro</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="usuario@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Rol
                </label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="member">Miembro</option>
                  <option value="team_leader">Líder de Equipo</option>
                  {userRole === 'system_user' && (
                    <option value="system_user">Administrador</option>
                  )}
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddMember(false)}
                  className="flex-1 py-3 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddMember}
                  className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
