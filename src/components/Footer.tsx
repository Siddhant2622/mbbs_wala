import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Youtube, Phone, Mail, MapPin } from 'lucide-react';
import BrandLogo from './BrandLogo';

const quick = [
  { name: 'Rank → colleges', path: '/rank-calculator' },
  { name: 'Compare colleges', path: '/compare' },
  { name: 'Colleges', path: '/colleges' },
  { name: 'Packages', path: '/packages' },
  { name: 'Cut-offs', path: '/cutoffs' },
  { name: 'Seat matrix', path: '/seat-matrix' },
  { name: 'Blogs', path: '/blogs' },
];

const company = [
  { name: 'About', path: '/about-us' },
  { name: 'Contact', path: '/contact' },
  { name: 'Testimonials', path: '/testimonials' },
  { name: 'Careers', path: '/careers' },
  { name: 'Student Login', path: '/login' },
  { name: 'Staff & Counsellor', path: '/admin/login' },
];

const legal = [
  { name: 'Privacy', path: '/privacy-policy' },
  { name: 'Terms', path: '/terms-and-conditions' },
  { name: 'Cookies', path: '/cookie-policy' },
];

export default function Footer() {
  return (
    <footer className="bg-[#0E1117] text-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
        {/* Brand col always full-width on mobile; all 4 cols at md+ */}
        <div className="mb-12">
          {/* Brand info */}
          <div className="mb-10 max-w-sm">
            <div className="mb-5 inline-flex !bg-transparent p-0 m-0 border-0 shadow-none">
              <BrandLogo to="/" size="md" onDark />
            </div>
            <p className="text-white/55 text-sm font-medium leading-relaxed mb-5">
              Stress-free NEET counselling for India — seat matrix, cut-offs and human experts from Bhopal.
            </p>
            <div className="space-y-2 text-sm font-medium text-white/70">
              <a href="tel:+917880119983" className="flex items-center gap-2 hover:text-[#F97316]">
                <Phone className="w-3.5 h-3.5 text-[#F97316]" /> +91 78801 19983
              </a>
              <a href="https://wa.me/7880119983" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-[#F97316]">
                <Phone className="w-3.5 h-3.5 text-[#25D366]" /> WhatsApp 78801 19983
              </a>
              <a href="mailto:info@mbbswala.in" className="flex items-center gap-2 hover:text-[#F97316]">
                <Mail className="w-3.5 h-3.5 text-[#F97316]" /> info@mbbswala.in
              </a>
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#F97316]" /> Bhopal, Madhya Pradesh
              </p>
            </div>
          </div>

          {/* Link columns: 3-col grid at sm, 3-col portion of 4-col at md (via parent layout) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            {[
              { title: 'Explore', items: quick },
              { title: 'Company', items: company },
              { title: 'Legal', items: legal },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/60 mb-4">
                  {col.title}
                </p>
                <ul className="space-y-2.5">
                  {col.items.map((l) => (
                    <li key={l.path}>
                      <Link
                        to={l.path}
                        className="text-sm font-semibold text-white/65 hover:text-white transition-colors"
                      >
                        {l.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/10">
          <p className="text-xs text-white/60 font-medium">
            © {new Date().getFullYear()} MBBSWALA. All rights reserved.
          </p>
          <div className="flex gap-2">
            {[
              { Icon: Instagram, href: 'https://www.instagram.com/mbbswalaofficial', label: 'Instagram' },
              { Icon: Facebook, href: 'https://www.facebook.com/mbbswala/', label: 'Facebook' },
              { Icon: Youtube, href: 'https://www.youtube.com/@mbbswala23', label: 'YouTube' },
              { Icon: Linkedin, href: 'https://www.linkedin.com/company/mbbswalaedu', label: 'LinkedIn' },
            ].map(({ Icon, href, label }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 grid place-items-center rounded-full bg-white/8 hover:bg-[#F97316] transition-colors"
                aria-label={label}
              >
                <Icon className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
