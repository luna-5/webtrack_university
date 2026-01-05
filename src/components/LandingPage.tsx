import { BookOpen, Users, ArrowRight, Heart } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignUp: () => void;
}

export default function LandingPage({ onGetStarted, onSignUp }: LandingPageProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1eee3' }}>
      <nav className="sticky top-0 z-50 border-b border-slate-200 shadow-sm" style={{ backgroundColor: '#f1eee3' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img
                src="https://dqygnmjwprmoipcyhzzn.supabase.co/storage/v1/object/public/multimedia/8c104b01-51bf-49d3-a6ea-ee71a69358ae/other/1763877410260-ekarr7.png"
                alt="Logo"
                className="h-12 w-auto"
              />
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={onSignUp}
                className="px-4 py-2 text-sm font-bold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors"
              >
                Inscríbete HOY
              </button>
              <button
                onClick={onGetStarted}
                className="px-4 py-2 text-sm font-medium text-slate-900 hover:text-slate-700 transition-colors"
              >
                Iniciar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src="https://dqygnmjwprmoipcyhzzn.supabase.co/storage/v1/object/public/multimedia/6b6dffa1-3565-43e1-81c7-248b3fb35a8c/other/1763989359249-0ifyjx.png"
                alt="Descubre la Belleza del Amor y la Dignidad Humana"
                className="w-full mb-6"
              />
              <p className="text-xl text-slate-600 mb-8">
                Explora las profundas enseñanzas de San Juan Pablo II sobre el significado del cuerpo,
                el amor y lo que significa ser humano a través de nuestros cursos en línea.
              </p>
              <button
                onClick={onSignUp}
                className="inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Comienza a Aprender Hoy
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </div>
            <div className="relative">
              <img
                src="https://polishheritagecentertx.org/sites/default/files/styles/max_1300x1300/public/2021-03/00870_AOSTA1991.jpg?itok=9vt-Auu3"
                alt="Pope John Paul II"
                className="rounded-2xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">¿Por Qué Estudiar la Teología del Cuerpo?</h2>
            <p className="text-xl text-slate-600">Transforma tu comprensión del amor, las relaciones y la dignidad humana</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 rounded-full mb-6">
                <BookOpen className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Currículo Integral</h3>
              <p className="text-slate-600">
                Sumérgete en las enseñanzas completas con lecciones estructuradas diseñadas para
                un aprendizaje progresivo desde nivel principiante hasta avanzado.
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 rounded-full mb-6">
                <Users className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Instructores Expertos</h3>
              <p className="text-slate-600">
                Aprende de teólogos y académicos que han dedicado sus vidas a
                comprender y enseñar estas profundas verdades.
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 rounded-full mb-6">
                <Heart className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Sabiduría Transformadora</h3>
              <p className="text-slate-600">
                Aplica principios eternos a las relaciones modernas, preparación matrimonial
                y crecimiento espiritual personal.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">¿Listo para Comenzar tu Viaje?</h2>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Únete a miles de estudiantes explorando la profunda belleza del amor auténtico y la dignidad humana.
          </p>
          <button
            onClick={onSignUp}
            className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Comenzar Ahora
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </section>

      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img
              src="https://dqygnmjwprmoipcyhzzn.supabase.co/storage/v1/object/public/multimedia/8c104b01-51bf-49d3-a6ea-ee71a69358ae/other/1763877410260-ekarr7.png"
              alt="Logo"
              className="h-8 w-auto"
            />
          </div>
          <p className="text-slate-400">
            Inspirado por las enseñanzas de San Juan Pablo II
          </p>
        </div>
      </footer>
    </div>
  );
}
