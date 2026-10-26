import { Mail, Phone, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { StaggerReveal, staggerItem } from './ScrollReveal';

const cards = [
  {
    title: 'Answers for your case',
    desc: 'We look at your rank, category, budget and home state — not one common list for everyone.',
    img: '/images/india/counsel-meet.jpg',
    webp: '/images/india/counsel-meet.webp',
    w: 640, h: 384,
  },
  {
    title: 'Talk to real counsellors',
    desc: 'People who handle All India and state counselling every year, including Madhya Pradesh.',
    img: '/images/india/doctors-group.jpg',
    webp: '/images/india/doctors-group.webp',
    w: 640, h: 384,
  },
  {
    title: 'Ask as much as you need',
    desc: 'Call or message until you and your family feel clear about the next step.',
    img: '/images/india/family-consult.jpg',
    webp: '/images/india/family-consult.webp',
    w: 640, h: 384,
  },
];

export default function Support() {
  return (
    <section id="contact" className="premium-section bg-slate-50 relative overflow-hidden">
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F97316]/10 blur-[100px] rounded-full" />

      <div className="text-center max-w-2xl mx-auto mb-14 relative z-10">
        <p className="eyebrow justify-center mb-4">Human support</p>
        <h2 className="section-title text-4xl md:text-5xl lg:text-6xl mb-5 text-slate-900">
          Counsellors{' '}
          <span className="zn-highlight orange">one call away</span>
        </h2>
        <p className="text-slate-600 font-medium mb-8 text-lg leading-relaxed">
          Call the MBBSWala team for simple, honest help with NEET counselling — any day of the week.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="tel:+917880119983" className="btn-orange gap-2 px-6 py-3.5">
            <Phone className="w-5 h-5 text-white" />
            <span className="!text-white">+91 78801 19983</span>
          </a>
          <a
            href="https://wa.me/7880119983"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold bg-[#25D366] !text-white hover:brightness-110 transition-all"
          >
            <MessageCircle className="w-5 h-5 text-white" />
            <span className="!text-white">WhatsApp</span>
          </a>
          <a
            href="mailto:info@mbbswala.in"
            className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold bg-white text-slate-900 border border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Mail className="w-5 h-5 text-slate-900" />
            <span className="text-slate-900">info@mbbswala.in</span>
          </a>
        </div>
      </div>

      <StaggerReveal className="grid md:grid-cols-3 gap-5 max-w-6xl mx-auto relative z-10" stagger={0.08}>
        {cards.map((c) => (
          <motion.div
            key={c.title}
            variants={staggerItem}
            className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
          >
            <div className="h-48 overflow-hidden">
              <picture>
                <source srcSet={c.webp} type="image/webp" />
                <img
                  src={c.img}
                  alt={c.title}
                  width={c.w}
                  height={c.h}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </picture>
            </div>
            <div className="p-6 md:p-7">
              <h3 className="text-xl font-bold text-slate-900 mb-2">{c.title}</h3>
              <p className="font-medium text-sm text-slate-600 leading-relaxed">{c.desc}</p>
            </div>
          </motion.div>
        ))}
      </StaggerReveal>

      <div className="text-center mt-12 relative z-10">
        <Link to="/contact" className="btn-orange px-8 py-3.5">
          Send a message
        </Link>
      </div>
    </section>
  );
}
