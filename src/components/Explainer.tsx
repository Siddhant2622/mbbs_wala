import { useState } from 'react';
import { Play, X, Clapperboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { WebPImg } from '../lib/webp';

export default function Explainer() {
  const [open, setOpen] = useState(false);

  return (
    <section className="premium-section bg-white relative overflow-hidden">
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-secondary/10 blur-[100px] rounded-full" />

      <div className="max-w-5xl mx-auto flex flex-col items-center gap-12 relative z-10">
        <div className="text-center max-w-2xl">
          <p className="eyebrow justify-center mb-4">
            <Clapperboard className="w-3.5 h-3.5" /> Watch & understand
          </p>
          <h2 className="section-title text-4xl md:text-5xl lg:text-6xl mb-5 text-slate-900">
            Give us <span className="zn-highlight orange">two minutes</span>
          </h2>
          <p className="text-slate-600 font-medium text-lg leading-relaxed">
            See how MBBSWala helps you go from NEET rank to a clear list of Indian medical colleges.
          </p>
        </div>

        <motion.button
          type="button"
          onClick={() => setOpen(true)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="relative w-full max-w-[920px] aspect-video rounded-[2rem] overflow-hidden group shadow-[0_40px_100px_rgba(12,18,34,0.2)] border border-black/5 text-left"
        >
          <WebPImg
            src="/images/india/students.jpg"
            alt="MBBSWala counselling explainer"
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-ink/10" />
          <span className="absolute inset-0 grid place-items-center">
            <span className="relative">
              <span className="absolute inset-0 rounded-full bg-white/30 animate-ping opacity-40" />
              <span className="relative w-18 h-18 md:w-24 md:h-24 rounded-full bg-white grid place-items-center shadow-2xl group-hover:scale-110 transition-transform duration-500 w-20 h-20">
                <Play className="w-8 h-8 md:w-10 md:h-10 fill-secondary text-secondary ml-1" />
              </span>
            </span>
          </span>
          <span className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
            <p className="font-display text-2xl md:text-3xl tracking-tight mb-1">How our counselling works</p>
            <p className="text-white/70 text-sm font-medium">Rank → college list → choice filling → seat</p>
          </span>
        </motion.button>

        {open && (
          <div
            className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md grid place-items-center p-4"
            onClick={() => setOpen(false)}
          >
            <div
              className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 z-10 bg-white rounded-full p-2.5 shadow-lg hover:scale-105 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
              <iframe
                title="MBBSWala Explainer"
                className="w-full h-full"
                src="https://www.youtube.com/embed?listType=user_uploads&list=@mbbswala23&autoplay=1"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
