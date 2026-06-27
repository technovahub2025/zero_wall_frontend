import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { GlobalFooter } from '../shared/GlobalFooter';

const logo = `${import.meta.env.BASE_URL}icon-512.png`;

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.16, ease: 'easeOut' },
  },
};

const surfaceVariants = {
  initial: { opacity: 0, y: 16, scale: 0.995 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
  },
};

function BackgroundOrb({ className, delay = 0, size = 'h-72 w-72' }) {
  return (
    <motion.div
      className={cn('absolute rounded-full blur-3xl', size, className)}
      animate={{ y: [0, -14, 0], x: [0, 10, 0], scale: [1, 1.05, 1] }}
      transition={{ duration: 10 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  );
}

export function AuthPageShell({
  mode = 'center',
  title,
  subtitle,
  backLink,
  badge,
  hero,
  children,
  footer,
}) {
  const isSplit = mode === 'split';

  return (
    <motion.div
      className="relative min-h-screen overflow-hidden bg-[#07111E] text-slate-100"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="pointer-events-none absolute inset-0">
        <BackgroundOrb className="left-[-6rem] top-20 bg-sky-500/18" delay={0.1} />
        <BackgroundOrb className="right-[-5rem] top-8 bg-amber-400/12" delay={0.6} size="h-80 w-80" />
        <BackgroundOrb className="bottom-[-6rem] left-1/3 bg-emerald-400/10" delay={1.1} size="h-96 w-96" />
        <div
          className="absolute inset-0 opacity-45"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div
        className={cn(
          'relative z-10 mx-auto flex min-h-screen w-full flex-col px-5 py-8 lg:px-10 lg:py-10',
          isSplit ? 'max-w-[1600px]' : 'max-w-3xl',
        )}
      >
        <div
          className={cn(
            'flex-1',
            isSplit
              ? 'grid gap-10 lg:grid-cols-[1.04fr_0.96fr] lg:gap-12'
              : 'flex items-center justify-center',
          )}
        >
          {isSplit ? hero : null}

          <motion.section
            className={cn(
              'relative w-full rounded-[30px] border border-white/10 bg-slate-950/42 p-5 shadow-[0_30px_110px_rgba(0,0,0,0.38)] backdrop-blur-2xl will-change-transform sm:p-8 lg:p-10',
              isSplit ? 'self-center' : 'max-w-[520px]',
            )}
            variants={surfaceVariants}
          >
            {backLink ? (
              <Link
                to={backLink.to}
                className="inline-flex items-center gap-2 text-sm font-medium text-white/85 transition hover:text-white"
              >
                {backLink.label}
              </Link>
            ) : null}

            {badge ? <div className="mt-4">{badge}</div> : null}

            <div className="mt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/95 shadow-lg shadow-black/20">
                  <img src={logo} alt="PG Infrastructure logo" className="h-9 w-9 object-contain" />
                </div>
                <div>
                  <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/78">{subtitle}</p>
                </div>
              </div>
            </div>

            <div className="mt-8">{children}</div>

            {footer ? <div className="mt-6">{footer}</div> : null}
          </motion.section>
        </div>

        <div className="pt-8 pb-2">
          <GlobalFooter />
        </div>
      </div>
    </motion.div>
  );
}
