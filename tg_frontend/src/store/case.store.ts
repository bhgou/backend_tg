import { create } from 'zustand';

interface CaseItem {
  id: number;
  name: string;
  type: 'ad' | 'standard' | 'premium';
  price: number | null;
  imageUrl: string | null;
  description: string | null;
}

interface CaseStore {
  cases: CaseItem[];
  selectedCase: CaseItem | null;
  isLoading: boolean;
  error: string | null;
  
  setCases: (cases: CaseItem[]) => void;
  setSelectedCase: (caseItem: CaseItem | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCaseStore = create<CaseStore>((set) => ({
  cases: [],
  selectedCase: null,
  isLoading: false,
  error: null,
  
  setCases: (cases) => set({ cases }),
  setSelectedCase: (selectedCase) => set({ selectedCase }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));