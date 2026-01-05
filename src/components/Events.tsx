import { useEffect, useState, useRef } from 'react';
import { Calendar, MapPin, Plus, Edit2, Trash2, Clock, Upload, X, Facebook, Instagram, Twitter, MessageCircle, Link as LinkIcon, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from './Toast';
import { useAuth } from '../contexts/AuthContext';

interface Event {
  id: string;
  team_id: string;
  title: string;
  description: string;
  event_date: string;
  end_date?: string;
  location: string;
  image_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  whatsapp_url?: string;
  other_url?: string;
  is_free?: boolean;
  price?: number;
  currency?: string;
  created_by: string;
  created_at: string;
}

interface Team {
  id: string;
  name: string;
}

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userTeamId, setUserTeamId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    end_date: '',
    location: '',
    team_id: '',
    image_url: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    whatsapp_url: '',
    other_url: '',
    is_free: true,
    price: '0',
    currency: 'GTQ',
  });

  useEffect(() => {
    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (userTeamId || userRole === 'system_user') {
      fetchEvents();
    }
  }, [userTeamId, userRole]);

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
        .maybeSingle(),
    ]);

    if (profileResult.data?.default_team_id) {
      setUserTeamId(profileResult.data.default_team_id);
      setFormData((prev) => ({ ...prev, team_id: profileResult.data.default_team_id }));
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

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  const canCreateEvents = () => {
    return userRole === 'system_user' || userRole === 'team_leader';
  };

  const canEditEvent = (event: Event) => {
    if (userRole === 'system_user') return true;
    if (userRole === 'team_leader' && event.team_id === userTeamId) return true;
    return false;
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
    if (!imageFile) return formData.image_url || null;

    setUploadingImage(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
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
    setFormData({ ...formData, image_url: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toLocalDatetimeString = (isoString: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const toISOString = (datetimeLocal: string): string => {
    if (!datetimeLocal) return '';
    const date = new Date(datetimeLocal);
    return date.toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.event_date || !formData.team_id) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    try {
      let imageUrl = formData.image_url || '';

      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const eventData = {
        title: formData.title,
        description: formData.description,
        event_date: toISOString(formData.event_date),
        end_date: formData.end_date ? toISOString(formData.end_date) : null,
        location: formData.location,
        team_id: formData.team_id,
        image_url: imageUrl,
        facebook_url: formData.facebook_url,
        instagram_url: formData.instagram_url,
        twitter_url: formData.twitter_url,
        whatsapp_url: formData.whatsapp_url,
        other_url: formData.other_url,
        is_free: formData.is_free,
        price: formData.is_free ? 0 : parseFloat(formData.price) || 0,
        currency: formData.currency,
      };

      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', editingEvent.id);

        if (error) throw error;
        toast.success('Evento actualizado exitosamente');
      } else {
        const { error } = await supabase
          .from('events')
          .insert({
            ...eventData,
            created_by: user!.id,
          });

        if (error) throw error;
        toast.success('Evento creado exitosamente');
      }

      setShowEventForm(false);
      setEditingEvent(null);
      resetForm();
      fetchEvents();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const roundToNearestHalfHour = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const minutes = date.getMinutes();
    const roundedMinutes = Math.round(minutes / 30) * 30;
    date.setMinutes(roundedMinutes);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return toLocalDatetimeString(date.toISOString());
  };

  const addOneHour = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    date.setHours(date.getHours() + 1);
    return toLocalDatetimeString(date.toISOString());
  };

  const handleStartDateChange = (value: string) => {
    const roundedValue = roundToNearestHalfHour(value);
    setFormData({
      ...formData,
      event_date: roundedValue,
      end_date: addOneHour(roundedValue),
    });
  };

  const handleEndDateChange = (value: string) => {
    const roundedValue = roundToNearestHalfHour(value);
    setFormData({ ...formData, end_date: roundedValue });
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      event_date: toLocalDatetimeString(event.event_date),
      end_date: event.end_date ? toLocalDatetimeString(event.end_date) : '',
      location: event.location,
      team_id: event.team_id,
      image_url: event.image_url || '',
      facebook_url: event.facebook_url || '',
      instagram_url: event.instagram_url || '',
      twitter_url: event.twitter_url || '',
      whatsapp_url: event.whatsapp_url || '',
      other_url: event.other_url || '',
      is_free: event.is_free ?? true,
      price: event.price?.toString() || '0',
      currency: event.currency || 'GTQ',
    });
    setImagePreview(event.image_url || null);
    setShowEventForm(true);
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este evento?')) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      toast.success('Evento eliminado exitosamente');
      fetchEvents();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_date: '',
      end_date: '',
      location: '',
      team_id: userTeamId || '',
      image_url: '',
      facebook_url: '',
      instagram_url: '',
      twitter_url: '',
      whatsapp_url: '',
      other_url: '',
      is_free: true,
      price: '0',
      currency: 'GTQ',
    });
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTimeRange = (startDate: string, endDate?: string) => {
    if (!endDate) {
      return formatDateTime(startDate);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const isSameDay = start.toDateString() === end.toDateString();

    if (isSameDay) {
      return `${formatDate(startDate)}, ${formatTime(startDate)} - ${formatTime(endDate)}`;
    } else {
      return `${formatDateTime(startDate)} - ${formatDateTime(endDate)}`;
    }
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) >= new Date();
  };

  const getDaysUntil = (dateString: string): number => {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Eventos</h1>
            <p className="text-lg text-slate-600">Próximos eventos y actividades del equipo</p>
          </div>
          {canCreateEvents() && (
            <button
              onClick={() => {
                setEditingEvent(null);
                resetForm();
                setShowEventForm(true);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Crear Evento
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No hay eventos</h3>
            <p className="text-slate-600">
              {canCreateEvents() ? 'Crea tu primer evento para comenzar' : 'No hay eventos programados en este momento'}
            </p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow ${
                !isUpcoming(event.event_date) ? 'opacity-60' : ''
              }`}
            >
              {event.image_url && (
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <span
                      className={`inline-flex items-center justify-between px-3 py-1 rounded-full text-xs font-medium mb-3 ${
                        isUpcoming(event.event_date)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <span>{isUpcoming(event.event_date) ? 'Próximo' : 'Pasado'}</span>
                      {isUpcoming(event.event_date) && getDaysUntil(event.event_date) > 0 && (
                        <span className="ml-2 font-semibold">
                          {getDaysUntil(event.event_date)} {getDaysUntil(event.event_date) === 1 ? 'día' : 'días'}
                        </span>
                      )}
                      {isUpcoming(event.event_date) && getDaysUntil(event.event_date) === 0 && (
                        <span className="ml-2 font-semibold">Hoy</span>
                      )}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{event.title}</h3>
                  </div>
                  {canEditEvent(event) && (
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={() => handleEdit(event)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {event.description && (
                  <p className="text-slate-600 mb-4 line-clamp-3">{event.description}</p>
                )}

                <div className="space-y-2 text-sm text-slate-600 mb-4">
                  <div className="flex items-start">
                    <Clock className="w-4 h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                    <span className="capitalize">{formatDateTimeRange(event.event_date, event.end_date)}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-2 text-blue-600" />
                    <span className="font-semibold">
                      {event.is_free ? (
                        <span className="text-green-600">Gratis</span>
                      ) : (
                        <span>{event.currency} {event.price?.toFixed(2)}</span>
                      )}
                    </span>
                  </div>
                </div>

                {(event.facebook_url || event.instagram_url || event.twitter_url || event.whatsapp_url || event.other_url) && (
                  <div className="flex gap-2 pt-3 border-t border-slate-200">
                    {event.facebook_url && (
                      <a
                        href={event.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Facebook"
                      >
                        <Facebook className="w-5 h-5" />
                      </a>
                    )}
                    {event.instagram_url && (
                      <a
                        href={event.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-pink-600 hover:bg-pink-50 rounded transition-colors"
                        title="Instagram"
                      >
                        <Instagram className="w-5 h-5" />
                      </a>
                    )}
                    {event.twitter_url && (
                      <a
                        href={event.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-sky-600 hover:bg-sky-50 rounded transition-colors"
                        title="Twitter/X"
                      >
                        <Twitter className="w-5 h-5" />
                      </a>
                    )}
                    {event.whatsapp_url && (
                      <a
                        href={event.whatsapp_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </a>
                    )}
                    {event.other_url && (
                      <a
                        href={event.other_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-slate-600 hover:bg-slate-50 rounded transition-colors"
                        title="Enlace"
                      >
                        <LinkIcon className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showEventForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              {editingEvent ? 'Editar Evento' : 'Crear Nuevo Evento'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Título del Evento *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Ej: Reunión mensual del equipo"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Describe el evento..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fecha y Hora de Inicio *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.event_date}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    step="1800"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fecha y Hora de Fin
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    step="1800"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Ej: Sala de conferencias"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Precio
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        checked={formData.is_free}
                        onChange={() => setFormData({ ...formData, is_free: true })}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-slate-700">Evento Gratuito</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        checked={!formData.is_free}
                        onChange={() => setFormData({ ...formData, is_free: false })}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-slate-700">Evento de Pago</span>
                    </label>
                  </div>

                  {!formData.is_free && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-1">
                        <select
                          value={formData.currency}
                          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                          <option value="GTQ">GTQ</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="MXN">MXN</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {userRole === 'system_user' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Equipo *
                  </label>
                  <select
                    value={formData.team_id}
                    onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="">Seleccionar equipo...</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Imagen del Evento
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                {!imagePreview && !formData.image_url ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <Upload className="w-10 h-10 text-slate-400 mb-2" />
                    <span className="text-slate-600 font-medium">Haz clic para subir una imagen</span>
                    <span className="text-slate-400 text-sm mt-1">PNG, JPG hasta 5MB</span>
                  </button>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview || formData.image_url}
                      alt="Preview"
                      className="w-full h-40 object-cover rounded-lg"
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Enlaces de Redes Sociales
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Facebook className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <input
                      type="url"
                      value={formData.facebook_url}
                      onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Instagram className="w-5 h-5 text-pink-600 flex-shrink-0" />
                    <input
                      type="url"
                      value={formData.instagram_url}
                      onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Twitter className="w-5 h-5 text-sky-600 flex-shrink-0" />
                    <input
                      type="url"
                      value={formData.twitter_url}
                      onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="https://twitter.com/... o https://x.com/..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <input
                      type="url"
                      value={formData.whatsapp_url}
                      onChange={(e) => setFormData({ ...formData, whatsapp_url: e.target.value })}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="https://wa.me/..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-slate-600 flex-shrink-0" />
                    <input
                      type="url"
                      value={formData.other_url}
                      onChange={(e) => setFormData({ ...formData, other_url: e.target.value })}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Otro enlace relevante..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEventForm(false);
                    setEditingEvent(null);
                    resetForm();
                  }}
                  className="flex-1 py-3 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingEvent ? 'Actualizar' : 'Crear'} Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
