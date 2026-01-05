import { Truck, MapPin, ArrowRight, Shield, BarChart3, Clock } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignUp: () => void;
}

export default function LandingPage({ onGetStarted, onSignUp }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 border-b border-slate-200 shadow-sm bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img
                src="https://dqygnmjwprmoipcyhzzn.supabase.co/storage/v1/object/public/multimedia/1f694ce8-dec9-43cb-bc15-0bf8a018fe7f/logo/1767629183022-7xqmg.svg"
                alt="WebTrack Logo"
                className="h-12 w-auto"
              />
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={onSignUp}
                className="px-6 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Prueba Gratuita
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

      <section className="relative py-20 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold text-slate-900 mb-6">
                Soluciones Completas de Gestión de Flotas
              </h1>
              <p className="text-xl text-slate-600 mb-8">
                Rastrea, gestiona y optimiza toda tu flota en tiempo real. WebTrack proporciona
                a las empresas de transporte herramientas poderosas para monitorear vehículos, reducir costos
                y mejorar la eficiencia operativa.
              </p>
              <button
                onClick={onSignUp}
                className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Comienza Hoy
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </div>
            <div className="relative">
              <div className="rounded-2xl shadow-2xl bg-slate-100 p-8">
                <Truck className="w-full h-64 text-slate-700" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">¿Por Qué Elegir WebTrack?</h2>
            <p className="text-xl text-slate-600">Funcionalidades poderosas diseñadas para empresas de transporte modernas</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-xl bg-white hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-6">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Rastreo en Tiempo Real</h3>
              <p className="text-slate-600">
                Monitorea toda tu flota en tiempo real con rastreo GPS preciso. Sabe exactamente
                dónde está cada vehículo en cualquier momento.
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-white hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-6">
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Analítica Avanzada</h3>
              <p className="text-slate-600">
                Obtén reportes detallados e información sobre consumo de combustible, comportamiento del conductor,
                optimización de rutas y más.
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-white hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-6">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Seguridad Mejorada</h3>
              <p className="text-slate-600">
                Protege tus activos con geocercas, alertas y funciones de seguridad completas
                para prevenir robos y mal uso.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-2xl shadow-2xl bg-slate-100 p-8">
              <Clock className="w-full h-64 text-slate-700" />
            </div>
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">Optimiza tus Operaciones</h2>
              <p className="text-xl text-slate-600 mb-6">
                Ahorra tiempo y reduce costos con planificación inteligente de rutas, reportes automatizados
                y programación de mantenimiento.
              </p>
              <ul className="space-y-4 text-lg text-slate-600">
                <li className="flex items-start">
                  <ArrowRight className="w-6 h-6 mr-3 mt-1 text-blue-600 flex-shrink-0" />
                  <span>Reduce costos de combustible hasta un 30%</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="w-6 h-6 mr-3 mt-1 text-blue-600 flex-shrink-0" />
                  <span>Mejora la seguridad y responsabilidad del conductor</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="w-6 h-6 mr-3 mt-1 text-blue-600 flex-shrink-0" />
                  <span>Aumenta la satisfacción del cliente con tiempos estimados precisos</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">¿Listo para Transformar tu Flota?</h2>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Únete a cientos de empresas de transporte que usan WebTrack para optimizar operaciones
            y maximizar la eficiencia.
          </p>
          <button
            onClick={onSignUp}
            className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-black rounded-lg hover:bg-slate-800 transition-colors shadow-lg hover:shadow-xl"
          >
            Inicia tu Prueba Gratuita
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </section>

      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img
              src="https://dqygnmjwprmoipcyhzzn.supabase.co/storage/v1/object/public/multimedia/1f694ce8-dec9-43cb-bc15-0bf8a018fe7f/logo/1767629183022-7xqmg.svg"
              alt="WebTrack Logo"
              className="h-8 w-auto brightness-0 invert"
            />
          </div>
          <p className="text-slate-400">
            Soluciones profesionales de gestión de flotas para empresas de transporte
          </p>
        </div>
      </footer>
    </div>
  );
}
