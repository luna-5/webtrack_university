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
                alt="WebTrack GPS Logo"
                className="h-12 w-auto"
              />
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={onSignUp}
                className="px-6 py-2 text-sm font-bold text-white bg-black rounded-lg hover:bg-slate-800 transition-colors"
              >
                Start Free Trial
              </button>
              <button
                onClick={onGetStarted}
                className="px-4 py-2 text-sm font-medium text-slate-900 hover:text-slate-700 transition-colors"
              >
                Sign In
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
                Complete Fleet Management Solutions
              </h1>
              <p className="text-xl text-slate-600 mb-8">
                Track, manage, and optimize your entire fleet in real-time. WebTrack GPS provides
                transport companies with powerful tools to monitor vehicles, reduce costs, and
                improve operational efficiency.
              </p>
              <button
                onClick={onSignUp}
                className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-black rounded-lg hover:bg-slate-800 transition-colors shadow-lg hover:shadow-xl"
              >
                Get Started Today
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
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Why Choose WebTrack GPS?</h2>
            <p className="text-xl text-slate-600">Powerful features designed for modern transport companies</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-xl bg-white hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-6">
                <MapPin className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Real-Time Tracking</h3>
              <p className="text-slate-600">
                Monitor your entire fleet in real-time with accurate GPS tracking. Know exactly
                where each vehicle is at any moment.
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-white hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-6">
                <BarChart3 className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Advanced Analytics</h3>
              <p className="text-slate-600">
                Get detailed reports and insights on fuel consumption, driver behavior,
                route optimization, and more.
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-white hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-6">
                <Shield className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Enhanced Security</h3>
              <p className="text-slate-600">
                Protect your assets with geofencing, alerts, and comprehensive security
                features to prevent theft and misuse.
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
              <h2 className="text-4xl font-bold text-slate-900 mb-6">Optimize Your Operations</h2>
              <p className="text-xl text-slate-600 mb-6">
                Save time and reduce costs with intelligent route planning, automated reporting,
                and maintenance scheduling.
              </p>
              <ul className="space-y-4 text-lg text-slate-600">
                <li className="flex items-start">
                  <ArrowRight className="w-6 h-6 mr-3 mt-1 text-black flex-shrink-0" />
                  <span>Reduce fuel costs by up to 30%</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="w-6 h-6 mr-3 mt-1 text-black flex-shrink-0" />
                  <span>Improve driver safety and accountability</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="w-6 h-6 mr-3 mt-1 text-black flex-shrink-0" />
                  <span>Increase customer satisfaction with accurate ETAs</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">Ready to Transform Your Fleet?</h2>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Join hundreds of transport companies using WebTrack GPS to streamline operations
            and maximize efficiency.
          </p>
          <button
            onClick={onSignUp}
            className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-black rounded-lg hover:bg-slate-800 transition-colors shadow-lg hover:shadow-xl"
          >
            Start Your Free Trial
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </section>

      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img
              src="https://dqygnmjwprmoipcyhzzn.supabase.co/storage/v1/object/public/multimedia/1f694ce8-dec9-43cb-bc15-0bf8a018fe7f/logo/1767629183022-7xqmg.svg"
              alt="WebTrack GPS Logo"
              className="h-8 w-auto brightness-0 invert"
            />
          </div>
          <p className="text-slate-400">
            Professional fleet management solutions for transport companies
          </p>
        </div>
      </footer>
    </div>
  );
}
