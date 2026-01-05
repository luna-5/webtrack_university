import { useEffect, useState } from 'react';
import { Users, CheckCircle, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Team {
  id: string;
  name: string;
  description: string;
}

interface TeamSelectionProps {
  userId: string;
  onTeamSelected: () => void;
}

export default function TeamSelection({ userId, onTeamSelected }: TeamSelectionProps) {
  const { signOut } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const { data } = await supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true });
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTeamId) {
      alert('Por favor selecciona un equipo');
      return;
    }

    setSubmitting(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ default_team_id: selectedTeamId })
        .eq('id', userId);

      if (profileError) throw profileError;

      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: selectedTeamId,
          user_id: userId,
        });

      if (memberError && !memberError.message.includes('duplicate key')) {
        throw memberError;
      }

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'member',
        });

      if (roleError && !roleError.message.includes('duplicate key')) {
        throw roleError;
      }

      onTeamSelected();
    } catch (error: any) {
      alert(error.message || 'Error al seleccionar equipo');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando equipos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="absolute top-4 right-4">
          <button
            onClick={() => signOut()}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 bg-white rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img
              src="https://dqygnmjwprmoipcyhzzn.supabase.co/storage/v1/object/public/multimedia/1f694ce8-dec9-43cb-bc15-0bf8a018fe7f/logo/1767629183022-7xqmg.svg"
              alt="Logo"
              className="h-20 w-auto"
            />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Bienvenido
          </h1>
          <p className="text-xl text-slate-600">
            Selecciona tu equipo para comenzar
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center">
              <Users className="w-7 h-7 mr-2 text-blue-600" />
              Equipos Disponibles
            </h2>
            <p className="text-slate-600">
              Elige el equipo al que perteneces para acceder a los cursos correspondientes
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {teams.map((team) => (
              <div
                key={team.id}
                onClick={() => setSelectedTeamId(team.id)}
                className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedTeamId === team.id
                    ? 'border-blue-600 bg-blue-50 shadow-lg'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {selectedTeamId === team.id && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-900 mb-2">{team.name}</h3>
                <p className="text-slate-600">{team.description}</p>
              </div>
            ))}
          </div>

          {teams.length === 0 && (
            <div className="text-center py-8 text-slate-600">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p>No hay equipos disponibles en este momento.</p>
              <p className="text-sm mt-2">Por favor contacta al administrador.</p>
            </div>
          )}

          {teams.length > 0 && (
            <button
              onClick={handleSubmit}
              disabled={!selectedTeamId || submitting}
              className="w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                'Continuar'
              )}
            </button>
          )}
        </div>

        <p className="text-center text-slate-500 mt-6 text-sm">
          Podrás cambiar tu equipo más tarde si es necesario
        </p>
      </div>
    </div>
  );
}
