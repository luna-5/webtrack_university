import { useEffect, useState } from 'react';
import { BookOpen, Plus, Trash2, Globe, Lock, Edit2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import CourseEditor from './CourseEditor';
import { toast } from './Toast';

interface Team {
  id: string;
  name: string;
  description: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  level: string;
  is_public: boolean;
  image_url: string;
}

interface TeamCourse {
  id: string;
  course_id: string;
  courses: Course;
  isDirectAssignment?: boolean;
}

type ViewMode = 'list' | 'editor';

export default function InlineCourseManagement() {
  const { userRole, user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamCourses, setTeamCourses] = useState<TeamCourse[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingCourseId, setEditingCourseId] = useState<string | undefined>(undefined);
  const [userTeamId, setUserTeamId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserTeam = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('default_team_id')
        .eq('id', user.id)
        .maybeSingle();
      if (data?.default_team_id) {
        setUserTeamId(data.default_team_id);
      }
    };
    fetchUserTeam();
  }, [user]);

  useEffect(() => {
    if (userRole === 'team_leader' && !userTeamId) return;
    fetchTeams();
    fetchAllCourses();
  }, [userRole, userTeamId]);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamCourses(selectedTeam.id);
    }
  }, [selectedTeam]);

  const fetchTeams = async () => {
    try {
      let query = supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: true });

      if (userRole === 'team_leader' && userTeamId) {
        query = query.eq('id', userTeamId);
      }

      const { data } = await query;
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

  const fetchAllCourses = async () => {
    try {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: true });
      setAllCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchTeamCourses = async (teamId: string) => {
    try {
      const [teamCoursesResult, directCoursesResult] = await Promise.all([
        supabase
          .from('team_courses')
          .select(`
            id,
            course_id,
            courses (
              id,
              title,
              description,
              instructor,
              is_public,
              image_url
            )
          `)
          .eq('team_id', teamId),
        supabase
          .from('courses')
          .select('id, title, description, instructor, is_public, image_url')
          .eq('team_id', teamId)
      ]);

      const junctionCourses: TeamCourse[] = (teamCoursesResult.data || []).map((tc: any) => ({
        ...tc,
        isDirectAssignment: false
      }));

      const junctionCourseIds = junctionCourses.map(tc => tc.course_id);

      const directCourses: TeamCourse[] = (directCoursesResult.data || [])
        .filter((course: Course) => !junctionCourseIds.includes(course.id))
        .map((course: Course) => ({
          id: `direct-${course.id}`,
          course_id: course.id,
          courses: course,
          isDirectAssignment: true
        }));

      setTeamCourses([...junctionCourses, ...directCourses]);
    } catch (error) {
      console.error('Error fetching team courses:', error);
    }
  };

  const handleAddCourse = async () => {
    if (!selectedCourseId || !selectedTeam) return;

    try {
      const { error } = await supabase
        .from('team_courses')
        .insert({
          team_id: selectedTeam.id,
          course_id: selectedCourseId,
        });

      if (error) throw error;

      setSelectedCourseId('');
      setShowAddCourse(false);
      fetchTeamCourses(selectedTeam.id);
      toast.success('Curso asignado al equipo');
    } catch (error: any) {
      toast.error(error.message || 'Error al agregar curso');
    }
  };

  const handleRemoveCourse = async (teamCourseId: string, isDirectAssignment: boolean, courseId: string) => {
    if (!confirm('¿Estas seguro de que deseas eliminar este curso del equipo?')) return;

    try {
      if (isDirectAssignment) {
        const { error } = await supabase
          .from('courses')
          .update({ team_id: null })
          .eq('id', courseId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('team_courses')
          .delete()
          .eq('id', teamCourseId);

        if (error) throw error;
      }

      if (selectedTeam) {
        fetchTeamCourses(selectedTeam.id);
      }
      toast.success('Curso removido del equipo');
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar curso');
    }
  };

  const handleToggleCourseVisibility = async (courseId: string, currentVisibility: boolean) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_public: !currentVisibility })
        .eq('id', courseId);

      if (error) throw error;

      fetchAllCourses();
      if (selectedTeam) {
        fetchTeamCourses(selectedTeam.id);
      }
      toast.success(`Curso ahora es ${!currentVisibility ? 'publico' : 'privado'}`);
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar visibilidad');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('¿Estas seguro de que deseas eliminar este curso? Esto tambien eliminara todas sus lecciones.')) return;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      fetchAllCourses();
      if (selectedTeam) {
        fetchTeamCourses(selectedTeam.id);
      }
      toast.success('Curso eliminado exitosamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar curso');
    }
  };

  const handleCreateCourse = () => {
    setEditingCourseId(undefined);
    setViewMode('editor');
  };

  const handleEditCourse = (courseId: string) => {
    setEditingCourseId(courseId);
    setViewMode('editor');
  };

  const getAvailableCourses = () => {
    const assignedCourseIds = teamCourses.map((tc) => tc.course_id);
    return allCourses.filter((course) => !assignedCourseIds.includes(course.id));
  };

  const isSystemUserRole = userRole === 'system_user' || userRole === 'team_leader';

  if (viewMode === 'editor') {
    return (
      <CourseEditor
        courseId={editingCourseId}
        onBack={() => {
          setViewMode('list');
          setEditingCourseId(undefined);
          fetchAllCourses();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando cursos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Gestión de Cursos</h1>
          <p className="text-lg text-slate-600">Crea, edita y asigna cursos a equipos</p>
        </div>
        {userRole === 'system_user' && (
          <button
            onClick={handleCreateCourse}
            className="flex items-center px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Crear Nuevo Curso
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
                  onClick={() => setSelectedTeam(team)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedTeam?.id === team.id
                      ? 'bg-rose-50 border-2 border-rose-600'
                      : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-semibold text-slate-900">{team.name}</p>
                  <p className="text-sm text-slate-600">{team.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedTeam ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900">
                  Cursos de {selectedTeam.name}
                </h3>
                <button
                  onClick={() => setShowAddCourse(true)}
                  className="flex items-center px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Asignar Curso
                </button>
              </div>

              <div className="space-y-4">
                {teamCourses.map((teamCourse: any) => (
                  <div
                    key={teamCourse.id}
                    className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg"
                  >
                    <img
                      src={teamCourse.courses.image_url}
                      alt={teamCourse.courses.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-slate-900">{teamCourse.courses.title}</h4>
                          <p className="text-sm text-slate-600">{teamCourse.courses.instructor}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {userRole === 'system_user' && (
                            <>
                              <button
                                onClick={() => handleToggleCourseVisibility(
                                  teamCourse.courses.id,
                                  teamCourse.courses.is_public
                                )}
                                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                  teamCourse.courses.is_public
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                }`}
                              >
                                {teamCourse.courses.is_public ? (
                                  <>
                                    <Globe className="w-4 h-4" />
                                    Público
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-4 h-4" />
                                    Privado
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleEditCourse(teamCourse.courses.id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Editar curso"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {!userRole && !teamCourse.courses.is_public && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg">
                              <Lock className="w-4 h-4 inline mr-1" />
                              Solo Equipo
                            </span>
                          )}
                          {!userRole && teamCourse.courses.is_public && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-lg">
                              <Globe className="w-4 h-4 inline mr-1" />
                              Público
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{teamCourse.courses.description}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRemoveCourse(teamCourse.id, teamCourse.isDirectAssignment || false, teamCourse.courses.id)}
                          className="flex items-center gap-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Quitar del Equipo
                        </button>
                        {userRole === 'system_user' && (
                          <button
                            onClick={() => handleDeleteCourse(teamCourse.courses.id)}
                            className="flex items-center gap-1 px-3 py-1 text-red-700 hover:bg-red-100 rounded text-sm font-medium"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar Curso
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {teamCourses.length === 0 && (
                  <div className="text-center py-8 text-slate-600">
                    No hay cursos asignados a este equipo
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Selecciona un equipo para gestionar sus cursos</p>
            </div>
          )}
        </div>
      </div>

      {showAddCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Asignar Curso a {selectedTeam?.name}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Seleccionar Curso
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                >
                  <option value="">Selecciona un curso...</option>
                  {getAvailableCourses().map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} - {course.instructor}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowAddCourse(false);
                    setSelectedCourseId('');
                  }}
                  className="flex-1 py-3 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddCourse}
                  disabled={!selectedCourseId}
                  className="flex-1 py-3 bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  Asignar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
