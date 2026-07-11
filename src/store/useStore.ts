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
  passwordHash: string;
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

  initStore: (data: any) => void;
  login: (username: string, password: string) => { success: boolean; error?: string } | void;
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

      login: (username: string, password: string) => {
        const user = get().users.find(u => u.username === username);
        if (!user) return { success: false, error: 'اسم المستخدم غير صحيح' };
        if (user.passwordHash !== password) return { success: false, error: 'كلمة المرور غير صحيحة' };
        if (!user.isActive) return { success: false, error: 'هذا الحساب موقوف، يرجى مراجعة مدير النظام' };
        
        set({ currentUser: user });
        return { success: true };
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

      addTruckType: (name) => {
        const newType = { id: uuidv4(), name, isActive: true };
        set(state => ({ truckTypes: [...state.truckTypes, newType] }));
        supabaseMutation('TruckType', 'insert', newType).catch(console.error);
      },

      toggleTruckType: (id) => {
        const item = get().truckTypes.find(t => t.id === id);
        if (!item) return;
        set(state => ({ truckTypes: state.truckTypes.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t) }));
        supabaseMutation('TruckType', 'update', { isActive: !item.isActive }, { id }).catch(console.error);
      },

      deleteTruckType: (id) => {
        set(state => ({ truckTypes: state.truckTypes.filter(t => t.id !== id) }));
        supabaseMutation('TruckType', 'delete', null, { id }).catch(console.error);
      },

      addExpenseCategory: (name) => {
        const newCat = { id: uuidv4(), name, isActive: true };
        set(state => ({ expenseCategories: [...state.expenseCategories, newCat] }));
        supabaseMutation('ExpenseCategory', 'insert', newCat).catch(console.error);
      },

      toggleExpenseCategory: (id) => {
        const item = get().expenseCategories.find(t => t.id === id);
        if (!item) return;
        set(state => ({ expenseCategories: state.expenseCategories.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t) }));
        supabaseMutation('ExpenseCategory', 'update', { isActive: !item.isActive }, { id }).catch(console.error);
      },

      deleteExpenseCategory: (id) => {
        set(state => ({ expenseCategories: state.expenseCategories.filter(t => t.id !== id) }));
        supabaseMutation('ExpenseCategory', 'delete', null, { id }).catch(console.error);
      },

      addFarm: (name) => {
        const newFarm = { id: uuidv4(), name };
        set(state => ({ farms: [...state.farms, newFarm] }));
        supabaseMutation('Farm', 'insert', newFarm).catch(console.error);
      },

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

        // Persist to Supabase
        supabaseMutation('TruckRegistration', 'insert', newRegistration).catch(console.error);
        newTransactions.forEach(trx => {
          supabaseMutation('Transaction', 'insert', trx).catch(console.error);
        });

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
              const updated = { ...trx, amount: newTruck.custodyAmount, description: `عهدة للعربية ${newTruck.truckNumber}` };
              supabaseMutation('Transaction', 'update', { amount: updated.amount, description: updated.description }, { id: trx.id }).catch(console.error);
              return updated;
            }
            if (trx.type === 'OVERNIGHT' && trx.description === oldOvernightDesc) {
              const updated = { ...trx, amount: newTruck.overnightAmount, description: `مبيت للعربية ${newTruck.truckNumber}` };
              supabaseMutation('Transaction', 'update', { amount: updated.amount, description: updated.description }, { id: trx.id }).catch(console.error);
              return updated;
            }
          }
          return trx;
        });

        const hasCustodyTrx = updatedTransactions.some(t => t.description === `عهدة للعربية ${newTruck.truckNumber}` && t.farmId === newTruck.farmId && t.date.split('T')[0] === targetDateStr);
        if (!hasCustodyTrx && newTruck.custodyAmount > 0) {
          const newTrx = {
            id: uuidv4(),
            referenceNumber: generateRef(),
            type: 'CUSTODY' as const,
            amount: newTruck.custodyAmount,
            description: `عهدة للعربية ${newTruck.truckNumber}`,
            farmId: newTruck.farmId,
            workerId: newTruck.workerId,
            date: oldTruck.date,
          };
          updatedTransactions.push(newTrx);
          supabaseMutation('Transaction', 'insert', newTrx).catch(console.error);
        }
        
        const hasOvernightTrx = updatedTransactions.some(t => t.description === `مبيت للعربية ${newTruck.truckNumber}` && t.farmId === newTruck.farmId && t.date.split('T')[0] === targetDateStr);
        if (!hasOvernightTrx && newTruck.overnightAmount > 0) {
          const newTrx = {
            id: uuidv4(),
            referenceNumber: generateRef(),
            type: 'OVERNIGHT' as const,
            amount: newTruck.overnightAmount,
            description: `مبيت للعربية ${newTruck.truckNumber}`,
            farmId: newTruck.farmId,
            workerId: newTruck.workerId,
            date: oldTruck.date,
          };
          updatedTransactions.push(newTrx);
          supabaseMutation('Transaction', 'insert', newTrx).catch(console.error);
        }

        set(state => ({
          truckRegistrations: state.truckRegistrations.map(t => t.id === id ? newTruck : t),
          transactions: updatedTransactions,
        }));

        // Persist truck update to Supabase
        const { id: _id, ...truckUpdateData } = newTruck;
        supabaseMutation('TruckRegistration', 'update', truckUpdateData, { id }).catch(console.error);

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
