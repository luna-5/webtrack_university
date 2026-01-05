import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2, GripVertical, Save, Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from './Toast';
import { useAuth } from '../contexts/AuthContext';

interface Course {
  id?: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  level: string;
  image_url: string;
  is_public: boolean;
  team_id?: string;
}

interface Lesson {
  id?: string;
  course_id?: string;
  title: string;
  content: string;
  video_url: string;
  order_index: number;
  duration_minutes: number;
}

interface Team {
  id: string;
  name: string;
}

interface CourseEditorProps {
  courseId?: string;
  onBack: () => void;
}

export default function CourseEditor({ courseId, onBack }: CourseEditorProps) {
  const { user } = useAuth();
  const [course, setCourse] = useState<Course>({
    title: '',
    description: '',
    instructor: '',
    duration: '',
    level: 'beginner',
    image_url: '',
    is_public: true,
  });
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [userTeamId, setUserTeamId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (courseId) {
      fetchCourse();
      fetchLessons();
    }
  }, [courseId]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      const [profileResult, roleResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('default_team_id')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle()
      ]);

      if (profileResult.data?.default_team_id) {
        setUserTeamId(profileResult.data.default_team_id);
        setSelectedTeamId(profileResult.data.default_team_id);
      }

      if (roleResult.data?.role) {
        setUserRole(roleResult.data.role);

        if (roleResult.data.role === 'system_user') {
          const { data: teamsData } = await supabase
            .from('teams')
            .select('id, name')
            .order('name');
          if (teamsData) {
            setTeams(teamsData);
          }
        }
      }
    };
    fetchUserData();
  }, [user]);

  const fetchCourse = async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .maybeSingle();

      if (error) throw error;
      if (data) setCourse(data);
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async () => {
    if (!courseId) return;
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return course.image_url || null;

    setUploadingImage(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('course-images')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      toast.error(`Error al subir imagen: ${error.message}`);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setCourse({ ...course, image_url: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveCourse = async () => {
    if (!course.title.trim()) {
      toast.error('El titulo del curso es requerido');
      return;
    }

    setSaving(true);
    try {
      let imageUrl = course.image_url || '';

      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const courseData: Record<string, unknown> = {
        title: course.title,
        description: course.description || '',
        instructor: course.instructor || '',
        duration: course.duration || '',
        level: course.level || 'beginner',
        image_url: imageUrl,
        is_public: course.is_public,
        is_published: true,
      };

      if (courseId) {
        const { data, error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', courseId)
          .select()
          .single();

        if (error) throw error;

        if (data) {
          setCourse(data);
        }
        toast.success('Curso actualizado exitosamente');
      } else {
        if (userRole === 'system_user') {
          if (!selectedTeamId) {
            toast.error('Debes seleccionar un equipo para el curso');
            setSaving(false);
            return;
          }
          courseData.team_id = selectedTeamId;
        } else if (userTeamId) {
          courseData.team_id = userTeamId;
        }

        const { data, error } = await supabase
          .from('courses')
          .insert(courseData)
          .select()
          .single();

        if (error) throw error;

        if (data) {
          setCourse(data);
          window.history.replaceState(null, '', `?courseId=${data.id}`);
        }
        toast.success('Curso creado exitosamente');
      }
    } catch (error: any) {
      toast.error(`Error al guardar curso: ${error.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLesson = async () => {
    if (!editingLesson) return;
    if (!courseId && !course.id) {
      toast.error('Primero debes guardar el curso');
      return;
    }

    try {
      const lessonData = {
        ...editingLesson,
        course_id: courseId || course.id,
      };

      if (editingLesson.id) {
        const { error } = await supabase
          .from('lessons')
          .update(lessonData)
          .eq('id', editingLesson.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert(lessonData);

        if (error) throw error;
      }

      setShowLessonForm(false);
      setEditingLesson(null);
      fetchLessons();
      toast.success('Leccion guardada exitosamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar leccion');
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('¿Estas seguro de que deseas eliminar esta leccion?')) return;

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;
      fetchLessons();
      toast.success('Leccion eliminada');
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar leccion');
    }
  };

  const handleAddLesson = () => {
    setEditingLesson({
      title: '',
      content: '',
      video_url: '',
      order_index: lessons.length,
      duration_minutes: 0,
    });
    setShowLessonForm(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setShowLessonForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando curso...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center text-slate-600 hover:text-slate-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver a Cursos
        </button>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          {courseId ? 'Editar Curso' : 'Crear Nuevo Curso'}
        </h1>
        <p className="text-lg text-slate-600">Completa la información del curso y sus lecciones</p>
      </div>

      <div className="space-y-8">
        {/* Course Information */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Información del Curso</h2>
            <button
              onClick={handleSaveCourse}
              disabled={saving}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-400"
            >
              <Save className="w-5 h-5 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Curso'}
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Título del Curso
              </label>
              <input
                type="text"
                value={course.title}
                onChange={(e) => setCourse({ ...course, title: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Ej: Introducción a Webtrack"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descripción / Subtítulo
              </label>
              <textarea
                value={course.description}
                onChange={(e) => setCourse({ ...course, description: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Describe brevemente de qué trata el curso"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Instructor
              </label>
              <input
                type="text"
                value={course.instructor}
                onChange={(e) => setCourse({ ...course, instructor: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Nombre del instructor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Duración
              </label>
              <input
                type="text"
                value={course.duration}
                onChange={(e) => setCourse({ ...course, duration: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Ej: 8 semanas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nivel
              </label>
              <select
                value={course.level}
                onChange={(e) => setCourse({ ...course, level: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Visibilidad
              </label>
              <select
                value={course.is_public ? 'public' : 'private'}
                onChange={(e) => setCourse({ ...course, is_public: e.target.value === 'public' })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="public">Público</option>
                <option value="private">Privado (Solo equipos asignados)</option>
              </select>
            </div>

            {userRole === 'system_user' && !courseId && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Equipo
                </label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Seleccionar equipo...</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-slate-500">
                  Selecciona el equipo al que pertenecerá este curso
                </p>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Imagen del Curso
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              {!imagePreview && !course.image_url ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-48 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <Upload className="w-12 h-12 text-slate-400 mb-3" />
                  <span className="text-slate-600 font-medium">Haz clic para subir una imagen</span>
                  <span className="text-slate-400 text-sm mt-1">PNG, JPG hasta 5MB</span>
                </button>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview || course.image_url}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 bg-white rounded-full shadow-md hover:bg-slate-100 transition-colors"
                      title="Cambiar imagen"
                    >
                      <Upload className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                      title="Eliminar imagen"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              )}
              {uploadingImage && (
                <div className="mt-2 flex items-center text-sm text-slate-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Subiendo imagen...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lessons */}
        {(courseId || course.id) && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Lecciones</h2>
              <button
                onClick={handleAddLesson}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Agregar Lección
              </button>
            </div>

            <div className="space-y-3">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <GripVertical className="w-5 h-5 text-slate-400" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-500">Lección {index + 1}</span>
                      {lesson.duration_minutes > 0 && (
                        <span className="text-xs text-slate-500">({lesson.duration_minutes} min)</span>
                      )}
                    </div>
                    <h4 className="font-semibold text-slate-900">{lesson.title}</h4>
                    {lesson.video_url && (
                      <p className="text-xs text-slate-600 mt-1 truncate">Video: {lesson.video_url}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleEditLesson(lesson)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => lesson.id && handleDeleteLesson(lesson.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {lessons.length === 0 && (
                <div className="text-center py-8 text-slate-600">
                  No hay lecciones aún. Haz clic en "Agregar Lección" para comenzar.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lesson Form Modal */}
      {showLessonForm && editingLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              {editingLesson.id ? 'Editar Lección' : 'Nueva Lección'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Título de la Lección
                </label>
                <input
                  type="text"
                  value={editingLesson.title}
                  onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Ej: Introducción al tema"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Descripción / Contenido
                </label>
                <textarea
                  value={editingLesson.content}
                  onChange={(e) => setEditingLesson({ ...editingLesson, content: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Describe el contenido de la lección"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  URL del Video o Código Embebido
                </label>
                <textarea
                  value={editingLesson.video_url}
                  onChange={(e) => setEditingLesson({ ...editingLesson, video_url: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder='Ej: https://youtube.com/watch?v=... o <iframe src="..."></iframe>'
                  rows={3}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Puedes pegar una URL de YouTube, Vimeo, o el código embebido completo del video
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Duración (minutos)
                  </label>
                  <input
                    type="number"
                    value={editingLesson.duration_minutes}
                    onChange={(e) => setEditingLesson({ ...editingLesson, duration_minutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Orden
                  </label>
                  <input
                    type="number"
                    value={editingLesson.order_index}
                    onChange={(e) => setEditingLesson({ ...editingLesson, order_index: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowLessonForm(false);
                    setEditingLesson(null);
                  }}
                  className="flex-1 py-3 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveLesson}
                  className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Guardar Lección
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
