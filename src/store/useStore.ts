import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { supabaseMutation } from '@/app/actions';

export type Role = 'SUPER_ADMIN' | 'FARM_ADMIN' | 'WORKER';

export interface User {
  id: string;
  fullName: string;
  username: string;
  role: Role;
  farmId?: string;
  isActive: boolean;
}

export interface Farm {
  id: string;
  name: string;
}

export interface TruckType {
  id: string;
  name: string;
  isActive: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  isActive: boolean;
}

export interface TruckRegistration {
  id: string;
  truckNumber: string;
  truckTypeId: string;
  farmId: string;
  workerId: string;
  custodyAmount: number;
  overnightAmount: number;
  date: string;
  driverName?: string;
  driverPhone?: string;
  truckLoad?: number;
  truckLoadUnit?: 'TON' | 'CRATE';
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  categoryId: string;
  farmId: string;
  workerId: string;
  date: string;
}

export interface Transaction {
  id: string;
  referenceNumber: string;
  type: 'RECEIPT' | 'EXPENSE' | 'CUSTODY' | 'OVERNIGHT';
  amount: number;
  description: string;
  farmId?: string;
  workerId?: string;
  date: string;
}

export interface DailyClosure {
  id: string;
  farmId: string;
  closedByUserId: string;
  date: string;
  closedAt: string;
  totalReceived: number;
  totalSpent: number;
  trucksCount: number;
}

interface StoreState {
  users: User[];
  farms: Farm[];
  truckTypes: TruckType[];
  expenseCategories: ExpenseCategory[];
  truckRegistrations: TruckRegistration[];
  expenses: Expense[];
  transactions: Transaction[];
  closures: DailyClosure[];
  currentUser: User | null;

  login: (username: string) => void;
  logout: () => void;
  
  // Super Admin actions
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  addTruckType: (name: string) => void;
  toggleTruckType: (id: string) => void;
  deleteTruckType: (id: string) => void;
  addExpenseCategory: (name: string) => void;
  toggleExpenseCategory: (id: string) => void;
  deleteExpenseCategory: (id: string) => void;
  addFarm: (name: string) => void;
  
  // Actions
  registerTruck: (data: Omit<TruckRegistration, 'id' | 'date'>) => { success: boolean; error?: string };
  updateTruck: (id: string, data: Partial<TruckRegistration>) => { success: boolean; error?: string };
  addExpense: (data: Omit<Expense, 'id' | 'date'>) => void;
  addReceipt: (amount: number, workerId: string, farmId: string, description: string) => void;
  addClosure: (data: Omit<DailyClosure, 'id' | 'closedAt'>) => void;
  initStore: (data: any) => void;
}

const generateRef = () => `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      users: [],
      farms: [],
      truckTypes: [],
      expenseCategories: [],
      truckRegistrations: [],
      expenses: [],
      transactions: [],
      closures: [],
      currentUser: null,

      initStore: (data) => set(() => ({ ...data })),

      login: (username) => {
        const user = get().users.find(u => u.username === username);
        if (user) set({ currentUser: user });
      },
      
      logout: () => set({ currentUser: null }),

      addUser: (user) => {
        const newUser = { ...user, id: uuidv4() };
        set(state => ({ users: [...state.users, newUser] }));
        supabaseMutation('User', 'insert', newUser).catch(console.error);
      },
      
      updateUser: (id, data) => {
        set(state => ({ users: state.users.map(u => u.id === id ? { ...u, ...data } : u) }));
        supabaseMutation('User', 'update', data, { id }).catch(console.error);
      },

      addTruckType: (name) => set(state => ({
        truckTypes: [...state.truckTypes, { id: uuidv4(), name, isActive: true }]
      })),

      toggleTruckType: (id) => set(state => ({
        truckTypes: state.truckTypes.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t)
      })),

      deleteTruckType: (id) => set(state => ({
        truckTypes: state.truckTypes.filter(t => t.id !== id)
      })),

      addExpenseCategory: (name) => set(state => ({
        expenseCategories: [...state.expenseCategories, { id: uuidv4(), name, isActive: true }]
      })),

      toggleExpenseCategory: (id) => set(state => ({
        expenseCategories: state.expenseCategories.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t)
      })),

      deleteExpenseCategory: (id) => set(state => ({
        expenseCategories: state.expenseCategories.filter(t => t.id !== id)
      })),

      addFarm: (name) => set(state => ({
        farms: [...state.farms, { id: uuidv4(), name }]
      })),

      registerTruck: (data) => {
        const state = get();
        // Check uniqueness in same farm
        const isDuplicate = state.truckRegistrations.some(
          t => t.truckNumber === data.truckNumber && t.farmId === data.farmId
        );

        if (isDuplicate) {
          const existing = state.truckRegistrations.find(t => t.truckNumber === data.truckNumber && t.farmId === data.farmId);
          const worker = state.users.find(u => u.id === existing?.workerId);
          return { success: false, error: `العربية دي اتسجلت قبل كده عن طريق ${worker?.fullName}.` };
        }

        const newRegistration: TruckRegistration = {
          ...data,
          id: uuidv4(),
          date: new Date().toISOString(),
        };

        const newTransactions: Transaction[] = [];

        if (data.custodyAmount > 0) {
          newTransactions.push({
            id: uuidv4(),
            referenceNumber: generateRef(),
            type: 'CUSTODY',
            amount: data.custodyAmount,
            description: `عهدة للعربية ${data.truckNumber}`,
            farmId: data.farmId,
            workerId: data.workerId,
            date: new Date().toISOString(),
          });
        }

        if (data.overnightAmount > 0) {
          newTransactions.push({
            id: uuidv4(),
            referenceNumber: generateRef(),
            type: 'OVERNIGHT',
            amount: data.overnightAmount,
            description: `مبيت للعربية ${data.truckNumber}`,
            farmId: data.farmId,
            workerId: data.workerId,
            date: new Date().toISOString(),
          });
        }

        set(state => ({
          truckRegistrations: [newRegistration, ...state.truckRegistrations],
          transactions: [...newTransactions, ...state.transactions],
        }));

        return { success: true };
      },

      updateTruck: (id, data) => {
        const state = get();
        const oldTruck = state.truckRegistrations.find(t => t.id === id);
        if (!oldTruck) return { success: false, error: 'العربية مش موجودة' };
        
        const newTruck = { ...oldTruck, ...data } as TruckRegistration;
        
        let updatedTransactions = [...state.transactions];
        
        const oldCustodyDesc = `عهدة للعربية ${oldTruck.truckNumber}`;
        const oldOvernightDesc = `مبيت للعربية ${oldTruck.truckNumber}`;
        const targetDateStr = oldTruck.date.split('T')[0];

        updatedTransactions = updatedTransactions.map(trx => {
          if (trx.farmId === oldTruck.farmId && trx.date.split('T')[0] === targetDateStr) {
            if (trx.type === 'CUSTODY' && trx.description === oldCustodyDesc) {
              return { ...trx, amount: newTruck.custodyAmount, description: `عهدة للعربية ${newTruck.truckNumber}` };
            }
            if (trx.type === 'OVERNIGHT' && trx.description === oldOvernightDesc) {
              return { ...trx, amount: newTruck.overnightAmount, description: `مبيت للعربية ${newTruck.truckNumber}` };
            }
          }
          return trx;
        });

        const hasCustodyTrx = updatedTransactions.some(t => t.description === `عهدة للعربية ${newTruck.truckNumber}` && t.farmId === newTruck.farmId && t.date.split('T')[0] === targetDateStr);
        if (!hasCustodyTrx && newTruck.custodyAmount > 0) {
          updatedTransactions.push({
            id: uuidv4(),
            referenceNumber: generateRef(),
            type: 'CUSTODY',
            amount: newTruck.custodyAmount,
            description: `عهدة للعربية ${newTruck.truckNumber}`,
            farmId: newTruck.farmId,
            workerId: newTruck.workerId,
            date: oldTruck.date,
          });
        }
        
        const hasOvernightTrx = updatedTransactions.some(t => t.description === `مبيت للعربية ${newTruck.truckNumber}` && t.farmId === newTruck.farmId && t.date.split('T')[0] === targetDateStr);
        if (!hasOvernightTrx && newTruck.overnightAmount > 0) {
          updatedTransactions.push({
            id: uuidv4(),
            referenceNumber: generateRef(),
            type: 'OVERNIGHT',
            amount: newTruck.overnightAmount,
            description: `مبيت للعربية ${newTruck.truckNumber}`,
            farmId: newTruck.farmId,
            workerId: newTruck.workerId,
            date: oldTruck.date,
          });
        }

        set(state => ({
          truckRegistrations: state.truckRegistrations.map(t => t.id === id ? newTruck : t),
          transactions: updatedTransactions,
        }));

        return { success: true };
      },

      addExpense: (data) => {
        const newExpense: Expense = {
          ...data,
          id: uuidv4(),
          date: new Date().toISOString(),
        };

        const newTransaction: Transaction = {
          id: uuidv4(),
          referenceNumber: generateRef(),
          type: 'EXPENSE',
          amount: data.amount,
          description: data.title,
          farmId: data.farmId,
          workerId: data.workerId,
          date: new Date().toISOString(),
        };

        set(state => ({
          expenses: [newExpense, ...state.expenses],
          transactions: [newTransaction, ...state.transactions],
        }));
        
        supabaseMutation('Expense', 'insert', newExpense).catch(console.error);
        supabaseMutation('Transaction', 'insert', newTransaction).catch(console.error);
      },

      addReceipt: (amount, workerId, farmId, description) => {
        const newTransaction: Transaction = {
          id: uuidv4(),
          referenceNumber: generateRef(),
          type: 'RECEIPT',
          amount,
          description,
          workerId,
          farmId,
          date: new Date().toISOString(),
        };

        set(state => ({
          transactions: [newTransaction, ...state.transactions],
        }));
        
        supabaseMutation('Transaction', 'insert', newTransaction).catch(console.error);
      },

      addClosure: (data) => {
        const newClosure: DailyClosure = {
          ...data,
          id: uuidv4(),
          closedAt: new Date().toISOString()
        };
        set(state => ({
          closures: [newClosure, ...state.closures]
        }));
        
        supabaseMutation('DailyClosure', 'insert', newClosure).catch(console.error);
      }
    }),
    {
      name: 'salsasys-storage',
    }
  )
);
