import { motion } from 'framer-motion';
import { BadgeCheck, CircleDollarSign, Landmark, ReceiptText } from 'lucide-react';
import { Card, CardBody } from '../ui/card';
import { staggerContainer, staggerItem } from '../../utils/motionVariants';

const moneyFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatLakh(value) {
  return `Rs. ${moneyFormatter.format(Number(value || 0))}L`;
}

function Metric({ label, value, hint, icon: Icon }) {
  return (
    <motion.article
      variants={staggerItem}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <Card className="group h-full border border-[rgb(var(--line)/0.12)] bg-white/92 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.35)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_70px_-44px_rgba(15,23,42,0.42)]">
        <CardBody>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{label}</div>
              <div className="mt-2 text-2xl font-semibold text-[rgb(var(--text))]">{value}</div>
              <div className="mt-1 text-xs text-slate-500">{hint}</div>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/10 transition group-hover:scale-105">
              {Icon ? <Icon className="h-5 w-5" /> : null}
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.article>
  );
}

export function BillingKPIRow({ summary = {} }) {
  return (
    <motion.div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" variants={staggerContainer}>
      <Metric label="Invoice Count" value={summary.invoiceCount || 0} hint="Live invoice records" icon={ReceiptText} />
      <Metric label="Total" value={formatLakh(summary.total)} hint="Portfolio value" icon={CircleDollarSign} />
      <Metric label="Received" value={formatLakh(summary.received)} hint="Collected so far" icon={BadgeCheck} />
      <Metric label="Balance" value={formatLakh(summary.balance)} hint="Outstanding" icon={Landmark} />
    </motion.div>
  );
}
