import React from 'react';
import { motion } from 'framer-motion';
import { CaseCard } from './CaseCard';

interface Case {
  id: number;
  name: string;
  type: 'ad' | 'standard' | 'premium';
  price: number | null;
  imageUrl: string | null;
  description: string | null;
}

interface CasesGridProps {
  cases: Case[];
  onSelectCase: (caseItem: Case) => void;
}

export const CasesGrid: React.FC<CasesGridProps> = ({ cases, onSelectCase }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {cases.map((caseItem, index) => (
        <motion.div
          key={caseItem.id}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <CaseCard caseItem={caseItem} onClick={() => onSelectCase(caseItem)} />
        </motion.div>
      ))}
    </div>
  );
};