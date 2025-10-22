'use client';
import { useState, useEffect } from 'react';
import Link from "next/link";
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, Lock, Users, Zap, BarChart3, Shield, Moon, Sun } from 'lucide-react';

export default function EvotingLanding() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Cek preferensi sistem saat pertama kali load
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(prefersDark);

    // Listen untuk perubahan preferensi sistem
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const theme = {
    bg: isDark ? 'bg-black' : 'bg-white',
    text: isDark ? 'text-white' : 'text-gray-900',
    border: isDark ? 'border-white/10' : 'border-orange-200',
    secondary: isDark ? 'text-gray-400' : 'text-gray-600',
    card: isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-orange-50 hover:bg-orange-100',
    nav: isDark ? 'bg-black/80' : 'bg-white/80',
    input: isDark ? 'bg-white/10' : 'bg-orange-50',
    highlight: isDark ? 'from-orange-400 to-orange-300' : 'from-orange-600 to-orange-500',
  };

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} overflow-hidden transition-colors`}>
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 ${theme.nav} backdrop-blur-md border-b ${theme.border} transition-colors`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
            Evoting
          </div>
          <div className="hidden md:flex gap-8">
            <a href="#features" className={`text-sm ${theme.secondary} hover:${theme.text} trasition`}>Features</a>
            <a href="#security" className={`text-sm ${theme.secondary} hover:${theme.text} transition`}>Security</a>
            <a href="#community" className={`text-sm ${theme.secondary} hover:${theme.text} transition`}>Community</a>
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-lg ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-orange-100 hover:bg-orange-200'} transition`}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5 text-orange-600" />}
            </button>
            <Link href='auth/login'>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
              Get Started
            </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 px-4 sm:px-6 lg:px-8">
        <div className={`relative  pt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 rounded-xl overflow-hidden border ${theme.border} ${isDark ? 'bg-gradient-to-b from-orange-500/20 to-transparent' : 'bg-gradient-to-b from-orange-200/30 to-transparent'} transition-colors`}>
            <div className={`absolute inset-0 ${isDark ? 'bg-grid-white/[0.05]' : 'bg-grid-orange-500/[0.1]'} bg-[size:50px_50px]`} />
            <div className={`absolute top-1/4 left-1/4 w-64 h-64 ${isDark ? 'bg-orange-500/20' : 'bg-orange-400/20'} rounded-full blur-3xl`} />
            <div className={`absolute bottom-0 right-0 w-96 h-96 ${isDark ? 'bg-orange-600/10' : 'bg-orange-300/10'} rounded-full blur-3xl`} />
          
        <div className="max-w-4xl mx-auto text-center">
          {/* <div className="mb-8 inline-block">
            <span className={`px-4 py-2 rounded-full ${isDark ? 'bg-white/10 border-white/20' : 'bg-orange-100 border-orange-300'} border text-sm text-orange-500 transition-colors`}>
              Revolutionizing Digital Democracy
            </span>
          </div>
           */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Build in a weekend
            <br />
            <span className={`bg-gradient-to-r ${theme.highlight} bg-clip-text text-transparent`}>
              Scale to millions
            </span>
          </h1>
          
          <p className={`text-lg ${theme.secondary} mb-8 max-w-2xl mx-auto`}>
            Evoting adalah platform voting yang aman, scalable, dan transparan. Dirancang untuk organisasi modern yang membutuhkan solusi voting digital yang dapat diandalkan.
          </p>
          
          <div className="flex gap-4 justify-center mb-16 flex-wrap">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-6 text-lg">
              Start Voting <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              variant="outline"
              className={`${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-orange-100 hover:bg-orange-200'} font-semibold border ${theme.border} px-8 py-6 text-lg transition-colors`}
            >
              View Documentation
            </Button>
          </div>
</div>
          {/* Hero Visual */}
          
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={`py-20 px-4 sm:px-6 lg:px-8 border-t ${theme.border} transition-colors`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Fitur Powerful</h2>
            <p className={`${theme.secondary} text-lg`}>Semua yang Anda butuhkan untuk voting yang efisien</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Lock, title: "End-to-End Encryption", desc: "Keamanan tingkat enterprise dengan enkripsi end-to-end untuk setiap vote." },
              { icon: Zap, title: "Real-time Results", desc: "Lihat hasil voting secara real-time dengan dashboard yang intuitif dan responsif." },
              { icon: Users, title: "Multi-voter Support", desc: "Dukung jutaan pemilih sekaligus tanpa mengorbankan kecepatan atau keamanan." },
              { icon: BarChart3, title: "Advanced Analytics", desc: "Analisis mendalam tentang partisipasi dan pola voting dengan laporan komprehensif." },
              { icon: Shield, title: "Audit Trail", desc: "Transparansi penuh dengan audit trail yang lengkap dan dapat diverifikasi." },
              { icon: Zap, title: "Developer Friendly", desc: "API yang powerful dan dokumentasi lengkap untuk integrasi yang mudah." },
            ].map((feature, idx) => (
              <div key={idx} className={`p-6 rounded-lg border ${theme.border} ${theme.card} transition-all group`}>
                <feature.icon className="w-10 h-10 text-orange-500 mb-4 group-hover:scale-110 transition" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className={theme.secondary}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className={`py-20 px-4 sm:px-6 lg:px-8 border-t ${theme.border} transition-colors`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Keamanan Kelas Dunia</h2>
              <p className={`${theme.secondary} text-lg mb-8`}>
                Setiap vote dilindungi dengan teknologi keamanan terdepan. Evoting memenuhi standar internasional untuk sistem voting digital.
              </p>
              
              <div className="space-y-4">
                {[
                  "Zero-knowledge proofs untuk verifikasi tanpa keterbukaan",
                  "Blockchain integration untuk immutability",
                  "Multi-factor authentication untuk pengguna",
                  "Regular security audits oleh pihak ketiga independen",
                  "GDPR compliant dan privacy by design",
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-1" />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={`relative h-96 rounded-xl overflow-hidden border ${theme.border} transition-colors`}>
              <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-orange-500/20 via-transparent to-orange-600/20' : 'bg-gradient-to-br from-orange-200/30 via-transparent to-orange-300/20'}`} />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Shield className={`w-32 h-32 ${isDark ? 'text-orange-400/30' : 'text-orange-500/30'}`} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className={`py-20 px-4 sm:px-6 lg:px-8 border-t ${theme.border} transition-colors`}>
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Join the Community</h2>
          <p className={`${theme.secondary} text-lg mb-12`}>
            Bergabunglah dengan ribuan organisasi yang mempercayai Evoting
          </p>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { number: "10M+", label: "Votes Processed" },
              { number: "50K+", label: "Users" },
              { number: "99.99%", label: "Uptime" },
              { number: "180+", label: "Countries" },
            ].map((stat, idx) => (
              <div key={idx} className={`p-6 rounded-lg border ${theme.border} transition-colors`}>
                <div className="text-4xl font-bold text-orange-500 mb-2">{stat.number}</div>
                <div className={theme.secondary}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-20 px-4 sm:px-6 lg:px-8 border-t ${theme.border} transition-colors`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Build in a weekend, scale to millions
          </h2>
          <p className={`${theme.secondary} text-lg mb-8`}>
            Mulai dengan Evoting hari ini dan rasakan perbedaannya
          </p>
          <Link href='auth/signup'>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-6 text-lg">
            Get Started for Free <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t ${theme.border} py-12 px-4 sm:px-6 lg:px-8 transition-colors`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            <div>
              <div className="text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent mb-4">
                Evoting
              </div>
              <p className={`${theme.secondary} text-sm`}>Platform voting digital untuk era modern</p>
            </div>
            {[
              { title: "Product", links: ["Features", "Security", "Pricing", "Roadmap"] },
              { title: "Developers", links: ["Documentation", "API Reference", "Guides", "Community"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
              { title: "Legal", links: ["Privacy", "Terms", "Security", "Compliance"] },
            ].map((col, idx) => (
              <div key={idx}>
                <h4 className="font-semibold mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link, i) => (
                    <li key={i}>
                      <a href="#" className={`${theme.secondary} hover:${theme.text} transition text-sm`}>
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className={`border-t ${theme.border} pt-8 flex justify-between items-center transition-colors`}>
            <p className={`${theme.secondary} text-sm`}>© 2025 Evoting. All rights reserved.</p>
            <div className="flex gap-4">
              {['Twitter', 'GitHub', 'LinkedIn'].map((social) => (
                <a key={social} href="#" className={`${theme.secondary} hover:${theme.text} transition text-sm`}>
                  {social}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}