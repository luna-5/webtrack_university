import { useEffect, useState } from 'react';
import { LogOut, BookOpen, Clock, User, GraduationCap, Users, Home, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import CourseViewer from './CourseViewer';
import InlineTeamManagement from './InlineTeamManagement';
import InlineCourseManagement from './InlineCourseManagement';
import Events from './Events';

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  level: string;
  image_url: string;
  is_public: boolean;
}

interface Enrollment {
  id: string;
  course_id: string;
  progress: number;
}

type ViewType = 'dashboard' | 'teams' | 'courses' | 'events';

export default function Dashboard() {
  const { user, signOut, userRole } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingCourse, setViewingCourse] = useState<{ courseId: string; enrollmentId: string } | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [userTeamName, setUserTeamName] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      let coursesData: Course[] = [];

      // Fetch user's profile to get their team
      const { data: profileData } = await supabase
        .from('profiles')
        .select('default_team_id, teams(name)')
        .eq('id', user?.id)
        .maybeSingle();

      const userTeamId = profileData?.default_team_id;

      // System users can see all courses
      if (userRole === 'system_user') {
        const { data } = await supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: true });
        coursesData = data || [];
      } else if (userTeamId) {
        // Regular users only see public courses and courses assigned to their team
        const { data: publicCoursesData } = await supabase
          .from('courses')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: true });

        // Get team courses directly by joining with courses table
        const { data: teamCoursesData } = await supabase
          .from('courses')
          .select('*, team_courses!inner(team_id)')
          .eq('team_courses.team_id', userTeamId)
          .eq('is_public', false);

        // Combine and deduplicate courses
        const allCourses = [...(publicCoursesData || []), ...(teamCoursesData || [])];
        const uniqueCourses = Array.from(
          new Map(allCourses.map(course => [course.id, course])).values()
        );

        coursesData = uniqueCourses;
      } else {
        // Users without a team only see public courses
        const { data } = await supabase
          .from('courses')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: true });
        coursesData = data || [];
      }

      const { data: enrollmentsData } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user?.id);

      // Set team name if user has a team and is not a system user
      if (userRole !== 'system_user' && profileData?.teams) {
        setUserTeamName((profileData.teams as any).name);
      }

      setCourses(coursesData);
      setEnrollments(enrollmentsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          user_id: user?.id,
          course_id: courseId,
        });

      if (error) throw error;
      fetchData();
    } catch (error: any) {
      console.error('Error enrolling:', error);
      alert(error.message || 'Failed to enroll in course');
    }
  };

  const isEnrolled = (courseId: string) => {
    return enrollments.some((e) => e.course_id === courseId);
  };

  const getProgress = (courseId: string) => {
    const enrollment = enrollments.find((e) => e.course_id === courseId);
    return enrollment?.progress || 0;
  };

  const getEnrollmentId = (courseId: string) => {
    const enrollment = enrollments.find((e) => e.course_id === courseId);
    return enrollment?.id || '';
  };

  const handleContinueLearning = (courseId: string) => {
    const enrollmentId = getEnrollmentId(courseId);
    setViewingCourse({ courseId, enrollmentId });
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-700';
      case 'intermediate':
        return 'bg-blue-100 text-blue-700';
      case 'advanced':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando tus cursos...</p>
        </div>
      </div>
    );
  }

  const enrolledCourses = courses.filter((c) => isEnrolled(c.id));
  const availableCourses = courses.filter((c) => !isEnrolled(c.id));
  const publicCourses = availableCourses.filter((c) => c.is_public);
  const privateCourses = availableCourses.filter((c) => !c.is_public);

  if (viewingCourse) {
    return (
      <CourseViewer
        courseId={viewingCourse.courseId}
        enrollmentId={viewingCourse.enrollmentId}
        onBack={() => {
          setViewingCourse(null);
          fetchData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-slate-200">
          <img
            src="https://dqygnmjwprmoipcyhzzn.supabase.co/storage/v1/object/public/multimedia/1f694ce8-dec9-43cb-bc15-0bf8a018fe7f/logo/1767629183022-7xqmg.svg"
            alt="Logo"
            className="h-12 w-auto"
          />
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center space-x-2 mb-3">
            <User className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-medium text-slate-700 truncate">{user?.email}</span>
          </div>
          {userTeamName && (
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-slate-600" />
              <span className="text-xs text-slate-600 truncate">{userTeamName}</span>
            </div>
          )}
          {userRole && (
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
              userRole === 'system_user'
                ? 'bg-orange-100 text-orange-700'
                : userRole === 'team_leader'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {userRole === 'system_user'
                ? 'Administrador'
                : userRole === 'team_leader'
                ? 'Líder de Equipo'
                : 'Miembro'}
            </span>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  currentView === 'dashboard'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <Home className="w-5 h-5" />
                <span>Dashboard</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentView('events')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  currentView === 'events'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span>Eventos</span>
              </button>
            </li>
            {(userRole === 'system_user' || userRole === 'team_leader') && (
              <>
                <li>
                  <button
                    onClick={() => setCurrentView('courses')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      currentView === 'courses'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>Cursos</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentView('teams')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      currentView === 'teams'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    <span>Equipos</span>
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* Logout Button at Bottom */}
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {currentView === 'dashboard' && (
          <>
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
              <p className="text-xl text-slate-600">Continúa tu viaje de descubrimiento</p>
            </div>

            {enrolledCourses.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
              <GraduationCap className="w-7 h-7 mr-2 text-blue-600" />
              Mis Cursos Inscritos
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <img
                    src={course.image_url}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(
                          course.level
                        )}`}
                      >
                        {course.level === 'beginner' ? 'principiante' : course.level === 'intermediate' ? 'intermedio' : 'avanzado'}
                      </span>
                      <div className="flex items-center text-sm text-slate-600">
                        <Clock className="w-4 h-4 mr-1" />
                        {course.duration}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      {course.title}
                    </h3>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    <p className="text-sm text-slate-700 mb-4">
                      Instructor(a): {course.instructor}
                    </p>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-slate-600 mb-1">
                        <span>Progreso</span>
                        <span>{getProgress(course.id)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${getProgress(course.id)}%` }}
                        ></div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleContinueLearning(course.id)}
                      className="w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Continuar Aprendiendo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {publicCourses.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
              <BookOpen className="w-7 h-7 mr-2 text-blue-600" />
              Cursos Públicos
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <img
                    src={course.image_url}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(
                          course.level
                        )}`}
                      >
                        {course.level === 'beginner' ? 'principiante' : course.level === 'intermediate' ? 'intermedio' : 'avanzado'}
                      </span>
                      <div className="flex items-center text-sm text-slate-600">
                        <Clock className="w-4 h-4 mr-1" />
                        {course.duration}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      {course.title}
                    </h3>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    <p className="text-sm text-slate-700 mb-4">
                      Instructor(a): {course.instructor}
                    </p>
                    <button
                      onClick={() => handleEnroll(course.id)}
                      className="w-full py-2 bg-white text-blue-600 font-medium rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      Inscribirse Ahora
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {privateCourses.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
              <Users className="w-7 h-7 mr-2 text-blue-600" />
              Cursos de Equipo
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {privateCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border-2 border-blue-200"
                >
                  <img
                    src={course.image_url}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(
                          course.level
                        )}`}
                      >
                        {course.level === 'beginner' ? 'principiante' : course.level === 'intermediate' ? 'intermedio' : 'avanzado'}
                      </span>
                      <div className="flex items-center text-sm text-slate-600">
                        <Clock className="w-4 h-4 mr-1" />
                        {course.duration}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        Equipo
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      {course.title}
                    </h3>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    <p className="text-sm text-slate-700 mb-4">
                      Instructor(a): {course.instructor}
                    </p>
                    <button
                      onClick={() => handleEnroll(course.id)}
                      className="w-full py-2 bg-white text-blue-600 font-medium rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      Inscribirse Ahora
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

            {courses.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg">No hay cursos disponibles en este momento.</p>
              </div>
            )}
          </>
        )}

        {currentView === 'events' && <Events />}

        {currentView === 'teams' && <InlineTeamManagement />}

        {currentView === 'courses' && <InlineCourseManagement />}

        </div>
      </div>
    </div>
  );
}
