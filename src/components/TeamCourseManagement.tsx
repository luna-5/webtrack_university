import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Plus, Trash2, Globe, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

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
  is_public: boolean;
  image_url: string;
}

interface TeamCourse {
  id: string;
  course_id: string;
  courses: Course;
  isDirectAssignment?: boolean;
}

interface TeamCourseManagementProps {
  onBack: () => void;
}

export default function TeamCourseManagement({ onBack }: TeamCourseManagementProps) {
  const { userRole } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamCourses, setTeamCourses] = useState<TeamCourse[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');

  useEffect(() => {
    fetchTeams();
    fetchAllCourses();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamCourses(selectedTeam.id);
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
    } catch (error: any) {
      alert(error.message || 'Error al agregar curso');
    }
  };

  const handleRemoveCourse = async (teamCourseId: string, isDirectAssignment: boolean, courseId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este curso del equipo?')) return;

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
    } catch (error: any) {
      alert(error.message || 'Error al eliminar curso');
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
    } catch (error: any) {
      alert(error.message || 'Error al cambiar visibilidad');
    }
  };

  const getAvailableCourses = () => {
    const assignedCourseIds = teamCourses.map((tc) => tc.course_id);
    return allCourses.filter((course) => !assignedCourseIds.includes(course.id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando cursos...</p>
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Gestión de Cursos por Equipo</h1>
          <p className="text-lg text-slate-600">Asigna cursos a equipos y gestiona su visibilidad</p>
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
                        ? 'bg-blue-50 border-2 border-blue-600'
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
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                            )}
                            {!teamCourse.courses.is_public && (
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg">
                                <Lock className="w-4 h-4 inline mr-1" />
                                Solo Equipo
                              </span>
                            )}
                            {teamCourse.courses.is_public && (
                              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-lg">
                                <Globe className="w-4 h-4 inline mr-1" />
                                Público
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">{teamCourse.courses.description}</p>
                        <button
                          onClick={() => handleRemoveCourse(teamCourse.id, teamCourse.isDirectAssignment || false, teamCourse.courses.id)}
                          className="flex items-center gap-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Quitar del Equipo
                        </button>
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
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                  className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  Asignar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
