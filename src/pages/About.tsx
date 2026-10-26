import { Link } from 'react-router-dom';
import { ScrollReveal, StaggerReveal, staggerItem } from '../components/ScrollReveal';
import TextReveal from '../components/TextReveal';
import Magnetic from '../components/Magnetic';
import { motion } from 'framer-motion';
import { WebPImg } from '../lib/webp';

export default function About() {
  return (
    <div className="px-4 sm:px-8 py-12 md:py-16 max-w-4xl mx-auto">
      <ScrollReveal variant="blur">
        <div className="rounded-3xl overflow-hidden mb-10 h-56 md:h-72 shadow-2xl">
          <WebPImg
            src="/images/india/doctors-group.jpg"
            alt="MBBSWala team"
            className="w-full h-full object-cover"
          />
        </div>
      </ScrollReveal>

      <ScrollReveal variant="fade-up">
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">About us</p>
        <TextReveal
          text="About MBBSWala"
          className="font-display text-4xl md:text-5xl font-bold text-primary-dark mb-6"
          as="h1"
        />
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={0.08} className="space-y-5 text-lg font-medium leading-relaxed text-text-grey">
        <p>
          <strong className="text-primary-dark">MBBSWala</strong> helps students and parents with
          NEET counselling for Indian MBBS seats — without confusion or pressure.
        </p>
        <p>
          We share cut-offs, seat lists, college options and paper work help. A real counsellor
          guides your family at every step.
        </p>
        <p>
          We work from <strong className="text-primary-dark">Bhopal, Madhya Pradesh</strong>, with
          strong local experience and colleges across India — 10+ years, 8000+ admissions,
          200+ college tie-ups.
        </p>
      </ScrollReveal>

      <StaggerReveal className="grid sm:grid-cols-2 gap-4 mt-10">
        {[
          { t: '10+ years of help', d: 'Guiding families through many NEET years' },
          { t: 'Clear counselling data', d: 'Seat lists, cut-offs and college facts' },
          { t: 'Real people on call', d: 'Phone, WhatsApp and face-to-face support' },
          { t: 'India MBBS focus', d: 'All India, state, deemed and private seats' },
        ].map((c) => (
          <motion.div key={c.t} variants={staggerItem} className="zn-card p-5">
            <h3 className="font-extrabold text-lg text-primary-dark mb-1">{c.t}</h3>
            <p className="text-sm text-text-grey font-medium">{c.d}</p>
          </motion.div>
        ))}
      </StaggerReveal>

      <ScrollReveal variant="scale" className="mt-10 flex flex-wrap gap-3">
        <Magnetic>
          <Link to="/contact" className="zn-cta zn-cta-primary">
            Contact us
          </Link>
        </Magnetic>
        <Magnetic>
          <Link to="/colleges" className="zn-cta">
            Browse colleges
          </Link>
        </Magnetic>
        <Link to="/careers" className="zn-cta">
          Careers
        </Link>
      </ScrollReveal>
    </div>
  );
}
