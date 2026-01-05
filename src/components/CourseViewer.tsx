import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, Circle, Clock, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  video_url: string;
  order_index: number;
  duration_minutes: number;
}

interface LessonProgress {
  lesson_id: string;
  completed: boolean;
}

interface CourseViewerProps {
  courseId: string;
  enrollmentId: string;
  onBack: () => void;
}

const getYouTubeEmbedUrl = (url: string): string => {
  if (!url) return '';

  let videoId = '';

  if (url.includes('youtube.com/embed/')) {
    return url;
  }

  const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (watchMatch) {
    videoId = watchMatch[1];
  }

  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) {
    videoId = shortMatch[1];
  }

  const embedMatch = url.match(/youtube\.com\/embed\/([^?&]+)/);
  if (embedMatch) {
    videoId = embedMatch[1];
  }

  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }

  return url;
};

export default function CourseViewer({ courseId, enrollmentId, onBack }: CourseViewerProps) {
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .maybeSingle();

      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('lesson_id, completed')
        .eq('enrollment_id', enrollmentId);

      setCourse(courseData);
      setLessons(lessonsData || []);
      setProgress(progressData || []);

      if (lessonsData && lessonsData.length > 0) {
        setSelectedLesson(lessonsData[0]);
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isLessonCompleted = (lessonId: string) => {
    return progress.some((p) => p.lesson_id === lessonId && p.completed);
  };

  const markLessonComplete = async (lessonId: string) => {
    try {
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          enrollment_id: enrollmentId,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'enrollment_id,lesson_id' });

      if (error) throw error;

      const completedCount = progress.filter((p) => p.completed).length + 1;
      const totalLessons = lessons.length;
      const progressPercentage = Math.round((completedCount / totalLessons) * 100);

      await supabase
        .from('enrollments')
        .update({ progress: progressPercentage })
        .eq('id', enrollmentId);

      fetchCourseData();
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando curso...</p>
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
          <h1 className="text-4xl font-bold text-slate-900 mb-2">{course?.title}</h1>
          <p className="text-lg text-slate-600">{course?.description}</p>
          <p className="text-sm text-slate-500 mt-2">Instructor(a): {course?.instructor}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {selectedLesson ? (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="aspect-video bg-slate-900">
                  {selectedLesson.video_url ? (
                    <iframe
                      src={getYouTubeEmbedUrl(selectedLesson.video_url)}
                      title={selectedLesson.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <Play className="w-16 h-16" />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">
                    {selectedLesson.title}
                  </h2>
                  <p className="text-slate-600 mb-6">{selectedLesson.content}</p>
                  {!isLessonCompleted(selectedLesson.id) && (
                    <button
                      onClick={() => markLessonComplete(selectedLesson.id)}
                      className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Marcar como Completado
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <p className="text-slate-600">Selecciona una lección para comenzar</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Contenido del Curso</h3>
              <div className="space-y-2">
                {lessons.map((lesson, index) => (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    className={`w-full text-left p-4 rounded-lg transition-colors ${
                      selectedLesson?.id === lesson.id
                        ? 'bg-blue-50 border-2 border-blue-600'
                        : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {isLessonCompleted(lesson.id) ? (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium text-slate-900">
                          Lección {lesson.order_index}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mb-1 line-clamp-2">
                      {lesson.title}
                    </p>
                    <div className="flex items-center text-xs text-slate-600">
                      <Clock className="w-3 h-3 mr-1" />
                      {lesson.duration_minutes} min
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
