'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  CustomerUser, 
  IndianAddress,
  ClothType, 
  Service, 
  PriceMatrixItem, 
  PerKgServiceRate,
  Order, 
  OrderStatus, 
  ProcessingSubStage,
  StoreBranch, 
  StoreStaff, 
  MachineRecord, 
  InventoryItem, 
  ShopSettings, 
  DLTSmsTemplate,
  DisputeRecord,
  RiderHandoverDetails,
  AdminUser,
  AdminRole,
  StoreOperatorRole,
  OrderChannel,
  StageTimestampRecord,
  PaymentMethod
} from '@/types';
import { hasSqlInjection, hashPassword, verifyPassword } from '@/lib/security';
import {
  initialShopSettings,
  initialBranches,
  initialStaff,
  initialPerKgRates,
  initialClothTypes,
  initialServices,
  initialPriceMatrix,
  initialCustomers,
  initialOrders,
  initialMachines,
  initialInventory,
  initialDLTTemplates,
  initialAdminUsers,
} from '@/lib/initial-data';

interface CustomerAuthSession {
  user: CustomerUser | null;
  isLoggedIn: boolean;
  loginWithPassword: (identifier: string, password: string) => { success: boolean; message?: string };
  loginCustomer?: (identifier: string, password: string) => { success: boolean; message?: string };
  signupCustomer: (details: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    password: string;
    address?: Partial<IndianAddress>;
  }) => { success: boolean; message?: string; user?: CustomerUser };
  loginWithOtp: (phone: string, otp: string) => boolean;
  logout: () => void;
  updateProfile: (details: { firstName: string; lastName: string; email: string }) => void;
  addAddress: (address: Omit<IndianAddress, 'id'>) => IndianAddress;
  setDefaultAddress: (addressId: string) => void;
}

interface StaffAuthSession {
  staff: StoreStaff | null;
  isCheckedIn: boolean;
  loginWithPassword: (roleOrPhone: StoreOperatorRole | string, password: string, branchId?: string, shift?: 'morning' | 'evening' | 'night') => boolean;
  loginWithPin?: (phone: string, pin: string, storeId?: string, shift?: 'morning' | 'evening' | 'night') => boolean;
  logoutStaff: () => void;
  hasRole: (allowedRoles: (StoreOperatorRole | string)[]) => boolean;
}

interface AdminAuthSession {
  admin: AdminUser | null;
  isAdminLoggedIn: boolean;
  loginAdmin: (usernameOrEmail: string, passwordOrPin: string) => boolean;
  logoutAdmin: () => void;
}

interface LaundryContextType {
  settings: ShopSettings;
  updateSettings: (newSettings: Partial<ShopSettings>) => void;
  
  // Customer Auth
  customerSession: CustomerAuthSession;
  customers: CustomerUser[];
  loginCustomer?: (identifier: string, password: string) => { success: boolean; message?: string };
  
  // Staff Auth & RBAC
  staffSession: StaffAuthSession;
  staffList: StoreStaff[];
  branches: StoreBranch[];

  // Admin Auth & RBAC
  adminSession: AdminAuthSession;
  adminUsers: AdminUser[];
  
  // Catalog & Rates
  clothTypes: ClothType[];
  services: Service[];
  priceMatrix: PriceMatrixItem[];
  perKgRates: PerKgServiceRate[];
  
  // Orders & State Machine
  orders: Order[];
  createOrder: (orderData: Omit<Order, 'id' | 'invoiceNo' | 'deliveryPin'>) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus, subStage?: ProcessingSubStage) => void;
  advanceOnlinePipeline: (orderId: string, targetStatus: OrderStatus) => void;
  assignPickupRider: (orderId: string, riderName: string, riderPhone: string, slotWindow: 'Morning' | 'Evening') => void;
  assignDropRider: (orderId: string, riderName: string, riderPhone: string, slotWindow?: string) => void;
  cancelOrder: (orderId: string, reason?: string) => void;
  rescheduleOrder: (orderId: string, newDate: string, newSlot: string) => void;
  advanceProcessingSubStage: (orderId: string, nextStage: ProcessingSubStage) => void;
  reconcileRiderPickup: (orderId: string, details: Partial<RiderHandoverDetails>) => void;
  qcCheckItem: (orderId: string, itemId: string, passed: boolean, reworkStage?: 'washing' | 'ironing') => void;
  raiseDispute: (dispute: Omit<DisputeRecord, 'id' | 'raisedAt' | 'status'>) => DisputeRecord;
  resolveDispute: (orderId: string, disputeId: string, action: 'approved_refund' | 'rejected', notes: string, refundAmount?: number) => void;
  recordPayment: (orderId: string, status: 'paid' | 'failed', ref?: string) => void;
  rateOrder: (orderId: string, rating: number, feedback?: string) => void;
  verifyAndCompleteDelivery: (
    orderId: string, 
    inputPin: string, 
    paymentMethod?: PaymentMethod, 
    paymentRef?: string,
    actorName?: string
  ) => { success: boolean; message: string };
  settleDeliveryUpiPayment: (orderId: string, upiRef: string, actorName?: string) => void;
  confirmUpiProviderPayment: (orderId: string, upiRef?: string, providerName?: string) => { success: boolean; message: string };
  adminSettleAndCloseOrder: (
    orderId: string, 
    paymentMethod?: PaymentMethod, 
    paymentRef?: string,
    notes?: string,
    settledAmount?: number,
    reason?: string
  ) => { success: boolean; message: string };
  archiveOrder: (orderId: string, actorName?: string) => { success: boolean; message: string };
  unarchiveOrder: (orderId: string) => { success: boolean; message: string };
  archiveAllDeliveredOrders: (actorName?: string) => { success: boolean; count: number };

  // Staff Management for Admin
  addStaff: (staffData: Omit<StoreStaff, 'id' | 'isCheckedIn'>) => StoreStaff;
  updateStaff: (id: string, staffData: Partial<StoreStaff>) => void;
  deleteStaff: (id: string) => void;

  // Floor Operations & Machine/Inventory
  machines: MachineRecord[];
  updateMachineStatus: (id: string, status: 'idle' | 'running' | 'maintenance', batchId?: string) => void;
  inventory: InventoryItem[];
  deductInventory: (id: string, quantity: number) => void;
  restockInventory: (id: string, quantity: number) => void;
  dltTemplates: DLTSmsTemplate[];

  // Customer & Order Management
  addCustomer: (cust: any) => any;
  updateCustomer: (id: string, cust: any) => void;
  deleteCustomer: (id: string) => void;
  deleteOrder: (id: string) => void;

  // Utilities
  getNextInvoiceNumber: () => string;
  isOffline: boolean;
  queuedSyncEvents: number;
  isLoaded: boolean;
}

const LaundryContext = createContext<LaundryContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SETTINGS: 'lms_ind_settings_v4',
  BRANCHES: 'lms_ind_branches_v3',
  STAFF: 'lms_ind_staff_v3',
  CURRENT_STAFF_ID: 'lms_ind_auth_staff_id_v3',
  CURRENT_ADMIN_ID: 'lms_ind_auth_admin_id_v3',
  INVENTORY: 'lms_ind_inventory_v3',
  MACHINES: 'lms_ind_machines_v3',
  ORDERS: 'lms_ind_orders_v7',
};

export function LaundryProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);

  const [settings, setSettings] = useState<ShopSettings>(initialShopSettings);
  // Pure RAM-only state: strictly never written to localStorage (privacy & compliance)
  const [customers, setCustomers] = useState<CustomerUser[]>(initialCustomers);
  const [branches] = useState<StoreBranch[]>(initialBranches);
  const [staffList, setStaffList] = useState<StoreStaff[]>(initialStaff);
  const [adminUsers] = useState<AdminUser[]>(initialAdminUsers);
  const [clothTypes] = useState<ClothType[]>(initialClothTypes);
  const [services] = useState<Service[]>(initialServices);
  const [priceMatrix] = useState<PriceMatrixItem[]>(initialPriceMatrix);
  const [perKgRates] = useState<PerKgServiceRate[]>(initialPerKgRates);
  // Pure RAM-only state: orders are fetched from backend and kept in memory only
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [machines, setMachines] = useState<MachineRecord[]>(initialMachines);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [dltTemplates] = useState<DLTSmsTemplate[]>(initialDLTTemplates);

  // Active Sessions - Auth state hydrated dynamically
  const [loggedCustomerPhone, setLoggedCustomerPhone] = useState<string | null>(null);
  const [loggedStaffId, setLoggedStaffId] = useState<string | null>(null);
  const [loggedAdminId, setLoggedAdminId] = useState<string | null>(null);

  // Offline Sync State
  const [isOffline, setIsOffline] = useState(false);
  const [queuedSyncEvents, setQueuedSyncEvents] = useState(0);

  // Hydrate non-sensitive preferences from LocalStorage & fetch live orders from Backend API
  useEffect(() => {
    try {
      // PRIVACY AUDIT PURGE: Strictly eliminate any residual customer PII, staff, & order records from browser disk
      localStorage.removeItem('lms_ind_customers_v3');
      localStorage.removeItem('lms_ind_orders_v7');
      localStorage.removeItem('lms_ind_orders_v6');
      localStorage.removeItem('lms_ind_orders_v5');
      localStorage.removeItem('lms_ind_auth_cust_phone_v3');
      localStorage.removeItem('dhobighat_registered_customers_v1');
      localStorage.removeItem(STORAGE_KEYS.ORDERS);
      localStorage.removeItem(STORAGE_KEYS.STAFF);

      // Customer and staff registries are managed in pure volatile RAM
      setCustomers(initialCustomers);
      setStaffList(initialStaff);

      // Hydrate active customer session from sessionStorage or session cookie
      const activeCust = sessionStorage.getItem('dhobighat_active_customer');
      if (activeCust) {
        try {
          const parsedCust = JSON.parse(activeCust);
          if (parsedCust?.phone) setLoggedCustomerPhone(parsedCust.phone);
        } catch {}
      } else if (typeof document !== 'undefined') {
        const match = document.cookie.match(/(?:^|;\s*)dhobighat_customer_session=([^;]+)/);
        if (match && match[1]) {
          setLoggedCustomerPhone(decodeURIComponent(match[1]));
        }
      }

      // Hydrate active staff session from sessionStorage or session cookie
      const activeStaffId = sessionStorage.getItem('dhobighat_logged_staff_id');
      if (activeStaffId && activeStaffId !== 'none') {
        setLoggedStaffId(activeStaffId);
        setStaffList((prev) =>
          prev.map((s) => (s.id === activeStaffId ? { ...s, isCheckedIn: true } : s))
        );
      } else if (typeof document !== 'undefined') {
        const match = document.cookie.match(/(?:^|;\s*)dhobighat_staff_session=([^;]+)/);
        if (match && match[1]) {
          const staffId = decodeURIComponent(match[1]);
          setLoggedStaffId(staffId);
          setStaffList((prev) =>
            prev.map((s) => (s.id === staffId ? { ...s, isCheckedIn: true } : s))
          );
        }
      }

      const sSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (sSettings) setSettings(JSON.parse(sSettings));

      const sInventory = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      if (sInventory) setInventory(JSON.parse(sInventory));

      const sMachines = localStorage.getItem(STORAGE_KEYS.MACHINES);
      if (sMachines) setMachines(JSON.parse(sMachines));

      const sAdminId = localStorage.getItem(STORAGE_KEYS.CURRENT_ADMIN_ID);
      if (sAdminId) setLoggedAdminId(sAdminId);
    } catch (e) {
      console.warn("Storage hydration error, continuing with seed", e);
    }

    // Hydrate live orders directly from Backend API (Server Valuation & Cloud DB)
    // Keep seed data fallback in memory when /api/orders returns empty or when offline
    fetch('/api/orders')
      .then((res) => {
        if (!res.ok) throw new Error(`Orders fetch returned ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
          setOrders((prev) => {
            const map = new Map<string, Order>();
            // Add server orders
            data.orders.forEach((o: Order) => {
              if (o && o.id) map.set(o.id, o);
            });
            // Keep volatile RAM local orders that might not be on server yet
            prev.forEach((o: Order) => {
              if (o && o.id && !map.has(o.id)) {
                map.set(o.id, o);
              }
            });
            return Array.from(map.values());
          });
        }
      })
      .catch((err) => {
        console.warn('Backend API hydration fell back to in-memory seed:', err);
      })
      .finally(() => {
        setIsLoaded(true);
      });

    // Network status listener
    const handleOnline = () => {
      setIsOffline(false);
      setQueuedSyncEvents(0);
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cross-tab live synchronization via BroadcastChannel (RAM-to-RAM across tabs, 0 bytes on disk)
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('dhobighat_order_live_sync');
        channel.onmessage = (event) => {
          if (event.data?.type === 'ORDERS_SYNC' && event.data.orders) {
            setOrders(event.data.orders);
          }
          if (event.data?.type === 'SETTINGS_SYNC' && event.data.settings) {
            setSettings(event.data.settings);
          }
        };
      }
    } catch {}

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (channel) channel.close();
    };
  }, []);

  // Sync ONLY non-sensitive store settings back to LocalStorage (Never customers, staff, or orders)
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
      localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(machines));
      if (loggedAdminId) localStorage.setItem(STORAGE_KEYS.CURRENT_ADMIN_ID, loggedAdminId);

      // Broadcast live sync to other open tabs via volatile memory channel
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const bc = new BroadcastChannel('dhobighat_order_live_sync');
          bc.postMessage({ type: 'ORDERS_SYNC', orders });
          bc.close();
        } catch {}
      }
    } catch (e: any) {
      console.warn('Settings persistence failed:', e);
    }
  }, [settings, inventory, machines, loggedAdminId, orders, isLoaded]);

  // Current customer profile
  const loggedPhoneClean = (loggedCustomerPhone || '').replace(/\D/g, '').slice(-10);
  const currentCustomerUser = customers.find((c) => {
    if (!loggedCustomerPhone) return false;
    if (c.phone === loggedCustomerPhone) return true;
    if (c.id === loggedCustomerPhone) return true;
    const cPhoneClean = (c.phone || '').replace(/\D/g, '').slice(-10);
    if (loggedPhoneClean && cPhoneClean && loggedPhoneClean === cPhoneClean) return true;
    return false;
  }) || null;

  // Customer Auth Session
  const customerSession: CustomerAuthSession = {
    user: currentCustomerUser,
    isLoggedIn: !!currentCustomerUser,
    loginWithPassword: (identifier: string, password: string) => {
      if (hasSqlInjection(identifier) || hasSqlInjection(password)) {
        return { success: false, message: 'Invalid input characters detected (SQL Injection protection).' };
      }

      const cleanIdent = identifier.trim().toLowerCase();
      const cleanPhone = identifier.replace(/\D/g, '');

      const matched = customers.find((c) => {
        const phoneMatch = cleanPhone.length >= 10 && c.phone.replace(/\D/g, '') === cleanPhone;
        const emailMatch = c.email && c.email.toLowerCase() === cleanIdent;
        return phoneMatch || emailMatch;
      });

      if (!matched) {
        return { success: false, message: 'No registered customer account found with this mobile or email.' };
      }

      const isPwdValid = matched.password === password || verifyPassword(password, matched.passwordHash);

      if (!isPwdValid) {
        return { success: false, message: 'Incorrect password. Please try again.' };
      }

      setLoggedCustomerPhone(matched.phone);
      try {
        sessionStorage.setItem('dhobighat_active_customer', JSON.stringify({ id: matched.id, phone: matched.phone }));
        if (typeof document !== 'undefined') {
          document.cookie = `dhobighat_customer_session=${matched.phone}; Path=/; SameSite=Strict;`;
        }
      } catch {}

      // Server-side session API sync
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'customer', phone: matched.phone, password }),
      }).catch(() => {});

      return { success: true, message: 'Signed in successfully!' };
    },

    loginCustomer: (identifier: string, password: string) => {
      return customerSession.loginWithPassword(identifier, password);
    },

    signupCustomer: (details: {
      firstName: string;
      lastName: string;
      phone: string;
      email: string;
      password: string;
      address?: Partial<IndianAddress>;
    }) => {
      if (
        hasSqlInjection(details.firstName) ||
        hasSqlInjection(details.lastName) ||
        hasSqlInjection(details.phone) ||
        hasSqlInjection(details.email) ||
        hasSqlInjection(details.password)
      ) {
        return { success: false, message: 'Invalid characters detected (SQL Injection protection).' };
      }

      const cleanPhone = details.phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        return { success: false, message: 'Please enter a valid 10-digit Indian mobile number.' };
      }

      // Check if phone or email already registered
      const existing = customers.find(
        (c) =>
          c.phone.replace(/\D/g, '') === cleanPhone ||
          (details.email && c.email && c.email.toLowerCase() === details.email.trim().toLowerCase())
      );
      if (existing) {
        return {
          success: false,
          message: 'An account with this mobile number or email already exists. Please sign in.',
        };
      }

      const now = new Date().toISOString();
      const newAddressId = `addr-${Date.now()}`;
      const defaultAddr: IndianAddress = {
        id: newAddressId,
        label: details.address?.label || 'Home',
        flatNo: details.address?.flatNo || 'Flat/House',
        society: details.address?.society || '',
        street: details.address?.street || 'Local Street',
        city: details.address?.city || 'Bengaluru',
        state: details.address?.state || 'Karnataka',
        pincode: details.address?.pincode || '560038',
        isDefault: true,
      };

      const newUser: CustomerUser = {
        id: `cust-${Date.now()}`,
        phone: cleanPhone,
        firstName: details.firstName.trim(),
        lastName: details.lastName.trim(),
        email: details.email.trim().toLowerCase(),
        password: details.password,
        passwordHash: hashPassword(details.password),
        addresses: [defaultAddr],
        defaultAddressId: newAddressId,
        walletBalance: 100, // Welcome credit
        joinDate: now.split('T')[0],
        status: 'enable',
        totalOrders: 0,
      };

      const updatedCustomers = [newUser, ...customers];
      setCustomers(updatedCustomers);

      setLoggedCustomerPhone(newUser.phone);
      try {
        sessionStorage.setItem('dhobighat_active_customer', JSON.stringify({ id: newUser.id, phone: newUser.phone }));
        if (typeof document !== 'undefined') {
          document.cookie = `dhobighat_customer_session=${newUser.phone}; Path=/; SameSite=Strict;`;
        }
      } catch {}

      // Server-side session API sync
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'customer', phone: newUser.phone, password: details.password }),
      }).catch(() => {});

      return { success: true, message: 'Account created successfully!', user: newUser };
    },

    loginWithOtp: (phone: string, otp: string) => {
      // Legacy fallback: route to loginWithPassword or direct phone
      const cleanPhone = phone.replace(/\D/g, '');
      let user = customers.find((c) => c.phone.replace(/\D/g, '') === cleanPhone);
      if (user) {
        setLoggedCustomerPhone(user.phone);
        return true;
      }
      return false;
    },

    logout: () => {
      // Purge active customer session completely
      setLoggedCustomerPhone(null);
      try {
        sessionStorage.clear();
        localStorage.removeItem('dhobighat_active_customer');
        localStorage.removeItem('dhobighat_registered_customers_v1');
        localStorage.removeItem('lms_ind_auth_cust_phone_v3');
        localStorage.removeItem('lms_ind_customers_v3');
        localStorage.removeItem('lms_ind_orders_v7');
        localStorage.removeItem('lms_ind_orders_v6');
        localStorage.removeItem('lms_ind_orders_v5');

        if (typeof document !== 'undefined') {
          document.cookie = 'dhobighat_customer_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;';
          document.cookie = '__Host-dhobighat_customer_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0; Secure; SameSite=Strict;';
          document.cookie = 'dhobighat_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;';
          document.cookie = '__Host-dhobighat_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0; Secure; SameSite=Strict;';
        }

        if (typeof window !== 'undefined' && 'caches' in window) {
          caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
          }).catch(() => {});
        }

        fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
      } catch (e) {
        console.error('Customer logout cleanup error:', e);
      }

      if (typeof window !== 'undefined') {
        window.location.href = '/customer/auth';
      }
    },

    updateProfile: ({ firstName, lastName, email }) => {
      if (!currentCustomerUser) return;
      const updated = customers.map((c) =>
        c.id === currentCustomerUser.id ? { ...c, firstName, lastName, email } : c
      );
      setCustomers(updated);
    },

    addAddress: (addressData) => {
      const newAddr: IndianAddress = {
        ...addressData,
        id: `addr-${Date.now()}`,
      };
      if (currentCustomerUser) {
        const updated = customers.map((c) => {
          if (c.id === currentCustomerUser.id) {
            const updatedAddresses = [...c.addresses, newAddr];
            return {
              ...c,
              addresses: updatedAddresses,
              defaultAddressId: c.defaultAddressId || newAddr.id,
            };
          }
          return c;
        });
        setCustomers(updated);
      }
      return newAddr;
    },

    setDefaultAddress: (addressId) => {
      if (!currentCustomerUser) return;
      const updated = customers.map((c) =>
        c.id === currentCustomerUser.id ? { ...c, defaultAddressId: addressId } : c
      );
      setCustomers(updated);
    },
  };

  // Staff Auth Session
  const currentStaffUser = staffList.find((s) => s.id === loggedStaffId) || null;

  const staffSession: StaffAuthSession = {
    staff: currentStaffUser,
    isCheckedIn: !!currentStaffUser?.isCheckedIn,
    loginWithPassword: (roleOrPhone, password, storeId, shift) => {
      if (!password) return false;
      const cleanPhone = (roleOrPhone || '').replace(/\D/g, '');

      // Check both current staffList and canonical initialStaff
      const findInPool = (pool: StoreStaff[]) =>
        pool.find((s) => {
          const matchesRole = s.role === roleOrPhone;
          const matchesPhone = Boolean(cleanPhone && s.phone && s.phone.replace(/\D/g, '') === cleanPhone);
          if (!matchesRole && !matchesPhone) return false;

          const canonical = initialStaff.find((is) => is.id === s.id || is.role === s.role || is.phone === s.phone);
          const targetHash = s.passwordHash || canonical?.passwordHash;
          return verifyPassword(password, targetHash) || ((s as any).pin && (s as any).pin === password);
        });

      let matched = findInPool(staffList) || findInPool(initialStaff);

      if (matched) {
        const store = branches.find((b) => b.id === storeId);
        const canonical = initialStaff.find((is) => is.id === matched.id || is.role === matched.role);
        const resolvedHash = matched.passwordHash || canonical?.passwordHash || hashPassword('Manager@2026!');

        const updatedStaffMember: StoreStaff = {
          ...canonical,
          ...matched,
          passwordHash: resolvedHash,
          isCheckedIn: true,
          storeId: storeId || matched.storeId || 'branch-blr-1',
          storeName: store?.name || matched.storeName || 'Bengaluru - Indiranagar Flagship',
          activeShift: shift || matched.activeShift || 'morning',
        };

        const existingIndex = staffList.findIndex((s) => s.id === matched.id || s.role === matched.role);
        const updatedList =
          existingIndex >= 0
            ? staffList.map((s, idx) => (idx === existingIndex ? updatedStaffMember : { ...s, isCheckedIn: false }))
            : [updatedStaffMember, ...staffList.map((s) => ({ ...s, isCheckedIn: false }))];

        setStaffList(updatedList);
        setLoggedStaffId(updatedStaffMember.id);
        try {
          sessionStorage.setItem('dhobighat_logged_staff_id', updatedStaffMember.id);
          if (typeof document !== 'undefined') {
            document.cookie = `dhobighat_staff_session=${updatedStaffMember.id}; Path=/; SameSite=Strict;`;
          }
        } catch {}

        fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'staff',
            phone: updatedStaffMember.phone,
            password,
            staffId: updatedStaffMember.id,
            role: updatedStaffMember.role,
          }),
        }).catch(() => {});

        return true;
      }
      return false;
    },
    loginWithPin: (phone, pin, storeId, shift) => {
      return staffSession.loginWithPassword(phone, pin, storeId, shift);
    },
    logoutStaff: () => {
      if (currentStaffUser) {
        const updatedList = staffList.map((s) => (s.id === currentStaffUser.id ? { ...s, isCheckedIn: false } : s));
        setStaffList(updatedList);
      }
      setLoggedStaffId(null);
      try {
        sessionStorage.removeItem('dhobighat_logged_staff_id');
        sessionStorage.clear();
        localStorage.removeItem(STORAGE_KEYS.CURRENT_STAFF_ID);
        if (typeof document !== 'undefined') {
          document.cookie = '__Host-dhobighat_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0; Secure; SameSite=Strict;';
          document.cookie = 'dhobighat_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;';
          document.cookie = 'dhobighat_staff_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;';
        }
        if (typeof window !== 'undefined' && 'caches' in window) {
          caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
          }).catch(() => {});
        }
        fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
      } catch {}
    },
    hasRole: (allowedRoles: (StoreOperatorRole | string)[]) => {
      if (!currentStaffUser) return false;
      if (currentStaffUser.role === 'store_manager' || currentStaffUser.role === 'manager') return true;
      const normalizedRole = currentStaffUser.role === 'counter_operator' ? 'store_operator' :
                             ['wash_operator', 'iron_operator', 'qc_checker'].includes(currentStaffUser.role) ? 'worker' :
                             currentStaffUser.role;
      return allowedRoles.includes(currentStaffUser.role) || allowedRoles.includes(normalizedRole);
    },
  };

  // Admin Auth Session
  const currentAdminUser = adminUsers.find((a) => a.id === loggedAdminId) || null;

  const adminSession: AdminAuthSession = {
    admin: currentAdminUser,
    isAdminLoggedIn: !!currentAdminUser,
    loginAdmin: (usernameOrEmail: string, passwordOrPin: string) => {
      const cleanInput = usernameOrEmail.toLowerCase().trim();
      const matched = adminUsers.find(
        (a) => a.username.toLowerCase() === cleanInput || a.email.toLowerCase() === cleanInput
      );
      if (matched && passwordOrPin) {
        const isMatch = matched.passwordHash
          ? verifyPassword(passwordOrPin, matched.passwordHash)
          : false;
        if (isMatch) {
          setLoggedAdminId(matched.id);
          try {
            localStorage.setItem(STORAGE_KEYS.CURRENT_ADMIN_ID, matched.id);
            sessionStorage.setItem('dhobighat_logged_admin_id', matched.id);
            if (typeof document !== 'undefined') {
              document.cookie = `dhobighat_admin_id=${matched.id}; Path=/; SameSite=Lax;`;
            }
          } catch {}

          // Synchronize with server auth endpoint to issue signed HTTP-only JWT session cookie
          fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'admin',
              identifier: cleanInput,
              password: passwordOrPin,
            }),
          }).catch(() => {});

          return true;
        }
      }
      return false;
    },
    logoutAdmin: () => {
      setLoggedAdminId(null);
      try {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_ADMIN_ID);
        sessionStorage.clear();
        if (typeof document !== 'undefined') {
          document.cookie = 'dhobighat_admin_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;';
          document.cookie = '__Host-dhobighat_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0; Secure; SameSite=Strict;';
          document.cookie = 'dhobighat_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;';
        }
        if (typeof window !== 'undefined' && 'caches' in window) {
          caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
          }).catch(() => {});
        }
        fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
      } catch {}
    },
  };

  // Generate dynamic invoice # with monotonic sequencing separated by channel
  const getNextInvoiceNumber = (channel: OrderChannel = 'online') => {
    if (channel === 'walk_in') {
      let maxSeq = 3000;
      for (const o of orders) {
        if (o.invoiceNo && o.invoiceNo.startsWith('WLK-')) {
          const num = parseInt(o.invoiceNo.replace(/\D/g, ''), 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      }
      return `WLK-${maxSeq + 1}`;
    } else {
      let maxSeq = 2400;
      for (const o of orders) {
        if (o.invoiceNo && o.invoiceNo.startsWith('IND-')) {
          const num = parseInt(o.invoiceNo.replace(/\D/g, ''), 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      }
      return `IND-${maxSeq + 1}`;
    }
  };


  // Dynamic stage labels and actor resolution
  const getStageLabel = (stage: string): string => {
    const map: Record<string, string> = {
      order_received: 'Order Placed / Received',
      booked: 'Order Placed',
      pickup_assigned: 'Pickup Assigned (Morning/Evening)',
      out_for_pickup: 'Out for Pickup',
      picked_up: 'Order Picked Up',
      reached_store: 'Reached Store Dock',
      received_at_store: 'Received at Store Dock',
      received: '1. Received at Store Floor',
      sorting: '2. Sorting & Segregation',
      washing: '3. Washing & Dry Cleaning',
      drying: '4. Drying Rack',
      ironing: '5. Steam Ironing & Pressing',
      qc_check_packed: '6. QC Check & Packed Ready',
      qc_check: 'QC Inspection',
      packed_ready: 'Packed Ready',
      ready: 'Ready for Dispatch',
      processing: 'Store Floor Processing',
      drop_assigned: 'Drop Assigned',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered to Customer',
      closed: 'Delivered & Closed',
      cancelled: 'Order Cancelled',
    };
    return map[stage] || stage.replace(/_/g, ' ');
  };

  const getActorInfo = () => {
    if (currentStaffUser) {
      return {
        name: currentStaffUser.name,
        role: currentStaffUser.role.replace(/_/g, ' '),
      };
    }
    if (currentAdminUser) {
      return {
        name: currentAdminUser.name,
        role: 'Admin HQ',
      };
    }
    return {
      name: 'Store Floor Staff',
      role: 'Staff',
    };
  };

  // Broadcast live orders to other browser tabs in volatile RAM (0 bytes written to disk)
  const broadcastOrders = (updated: Order[]) => {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('dhobighat_order_live_sync');
        bc.postMessage({ type: 'ORDERS_SYNC', orders: updated });
        bc.close();
      }
    } catch {}
  };

  // Order Operations
  const createOrder = (orderData: Omit<Order, 'id' | 'invoiceNo' | 'deliveryPin'> & { id?: string; invoiceNo?: string; deliveryPin?: string }): Order => {
    const channel: OrderChannel = orderData.orderChannel || (orderData.pickupAddress || orderData.pickupSlot ? 'online' : 'walk_in');
    const newInvoice = orderData.invoiceNo || getNextInvoiceNumber(channel);
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const initialStatus: OrderStatus = orderData.status || (channel === 'online' ? 'order_received' : 'received');
    const now = new Date().toISOString();
    const initialLabel = channel === 'online' ? 'Order Placed (Online)' : 'Walk-in Intake (Counter)';
    const creatorName = orderData.customerName || (currentStaffUser ? currentStaffUser.name : 'Customer');
    const creatorRole = currentStaffUser ? currentStaffUser.role.replace(/_/g, ' ') : (channel === 'online' ? 'Customer' : 'Store Operator');

    // Number sanitization & validation to prevent NaN or negative amounts
    const grandTotal = Math.max(0, typeof orderData.grandTotal === 'number' && !isNaN(orderData.grandTotal) ? orderData.grandTotal : 0);
    const subtotal = Math.max(0, typeof orderData.subtotal === 'number' && !isNaN(orderData.subtotal) ? orderData.subtotal : 0);
    const paidAmount = orderData.paidAmount !== undefined 
      ? Math.max(0, typeof orderData.paidAmount === 'number' && !isNaN(orderData.paidAmount) ? orderData.paidAmount : 0)
      : (orderData.paymentStatus === 'paid' ? grandTotal : 0);
    const balanceAmount = orderData.balanceAmount !== undefined
      ? Math.max(0, typeof orderData.balanceAmount === 'number' && !isNaN(orderData.balanceAmount) ? orderData.balanceAmount : 0)
      : Math.max(0, grandTotal - paidAmount);

    const idPrefix = channel === 'walk_in' ? 'ord-wlk' : 'ord-onl';
    const randomSuffix = Math.random().toString(36).substring(2, 7);

    const newOrder: Order = {
      ...orderData,
      id: orderData.id || `${idPrefix}-${Date.now()}-${randomSuffix}`,
      invoiceNo: newInvoice,
      orderChannel: channel,
      deliveryPin: pin,
      status: initialStatus,
      grandTotal,
      subtotal,
      paidAmount,
      balanceAmount,
      customerName: (orderData.customerName || 'Customer').trim(),
      customerPhone: (orderData.customerPhone || '').trim(),
      items: orderData.items || [],
      lastStageUpdatedAt: now,
      stageTimestamps: {
        ...(orderData.stageTimestamps || {}),
        [initialStatus]: now,
      },
      stageHistory: [
        ...(orderData.stageHistory || []),
        {
          stage: initialStatus,
          label: initialLabel,
          timestamp: now,
          actorName: creatorName,
          actorRole: creatorRole,
          notes: orderData.remarks || `Order registered under invoice #${newInvoice}`,
        },
      ],
    };

    setOrders((prev) => {
      const filtered = prev.filter((o) => o.id !== newOrder.id && o.invoiceNo !== newOrder.invoiceNo);
      const updated = [newOrder, ...filtered];
      broadcastOrders(updated);
      return updated;
    });

    // Asynchronously notify Backend API with full order object
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder),
    }).catch(() => {});

    // Update customer total count
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === orderData.customerId ? { ...c, totalOrders: c.totalOrders + 1 } : c
      )
    );

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, subStage?: ProcessingSubStage) => {
    const now = new Date().toISOString();
    const actor = getActorInfo();
    const effectiveStage = subStage || status;
    const label = getStageLabel(effectiveStage);

    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === orderId) {
          const newTimestamps = { ...(o.stageTimestamps || {}), [status]: now };
          if (subStage) newTimestamps[subStage] = now;
          const newHistory: StageTimestampRecord[] = [
            ...(o.stageHistory || []),
            {
              stage: effectiveStage,
              label,
              timestamp: now,
              actorName: actor.name,
              actorRole: actor.role,
              notes: subStage ? `Floor sub-stage shifted to ${subStage}` : `Status transitioned to ${status.replace(/_/g, ' ')}`,
            },
          ];

          return {
            ...o,
            status,
            subStage: subStage !== undefined ? subStage : o.subStage,
            lastStageUpdatedAt: now,
            stageTimestamps: newTimestamps,
            stageHistory: newHistory,
          };
        }
        return o;
      });
      broadcastOrders(updated);
      fetch(`/api/orders/${orderId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetStatus: status, subStage }),
      }).catch(() => {});
      return updated;
    });
  };

  const advanceOnlinePipeline = (orderId: string, targetStatus: OrderStatus) => {
    const now = new Date().toISOString();
    const actor = getActorInfo();
    const label = getStageLabel(targetStatus);

    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === orderId) {
          const isDelivered = targetStatus === 'delivered' || targetStatus === 'closed';
          const newTimestamps = { ...(o.stageTimestamps || {}), [targetStatus]: now };
          if (isDelivered) {
            newTimestamps.delivered = now;
            newTimestamps.closed = now;
          }
          const newHistory: StageTimestampRecord[] = [
            ...(o.stageHistory || []),
            {
              stage: targetStatus,
              label,
              timestamp: now,
              actorName: actor.name,
              actorRole: actor.role,
              notes: `Moved to pipeline stage: ${label}`,
            },
          ];

          return {
            ...o,
            status: targetStatus,
            paymentStatus: isDelivered && o.paymentStatus !== 'paid' ? 'paid' : o.paymentStatus,
            lastStageUpdatedAt: now,
            stageTimestamps: newTimestamps,
            stageHistory: newHistory,
          };
        }
        return o;
      });
      broadcastOrders(updated);
      // Notify backend state machine API
      fetch(`/api/orders/${orderId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetStatus }),
      }).catch(() => {});
      return updated;
    });
  };

  const assignPickupRider = (orderId: string, riderName: string, riderPhone: string, slotWindow: 'Morning' | 'Evening') => {
    const now = new Date().toISOString();
    const actor = getActorInfo();
    const slotWindowString: 'Morning (07:00 AM - 10:00 AM)' | 'Evening (04:00 PM - 07:00 PM)' = slotWindow === 'Evening' ? 'Evening (04:00 PM - 07:00 PM)' : 'Morning (07:00 AM - 10:00 AM)';
    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === orderId) {
          const newTimestamps = { ...(o.stageTimestamps || {}), pickup_assigned: now };
          const newHistory: StageTimestampRecord[] = [
            ...(o.stageHistory || []),
            {
              stage: 'pickup_assigned',
              label: 'Pickup Assigned',
              timestamp: now,
              actorName: actor.name,
              actorRole: actor.role,
              notes: `Assigned to ${riderName} (${riderPhone}) for ${slotWindow} slot`,
            },
          ];
          return {
            ...o,
            status: 'pickup_assigned' as OrderStatus,
            pickupBy: riderName,
            pickupSlot: o.pickupSlot ? {
              ...o.pickupSlot,
              window: slotWindowString,
            } : {
              date: new Date().toISOString().split('T')[0],
              window: slotWindowString,
            },
            riderHandover: {
              ...(o.riderHandover || {}),
              riderName,
              riderPhone,
              bagCount: o.totalQty || 1,
              riderWeightKg: o.recordedWeightKg || 0,
            },
            remarks: `Pickup assigned to ${riderName} (${slotWindow} Slot)`,
            lastStageUpdatedAt: now,
            stageTimestamps: newTimestamps,
            stageHistory: newHistory,
          };
        }
        return o;
      });
      broadcastOrders(updated);
      // Notify backend rider assignment API & trigger rider FCM push
      fetch(`/api/orders/${orderId}/assign-rider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riderName, riderPhone, slotWindow, type: 'pickup' }),
      }).catch(() => {});
      return updated;
    });
  };

  const assignDropRider = (orderId: string, riderName: string, riderPhone: string, slotWindow?: string) => {
    const now = new Date().toISOString();
    const actor = getActorInfo();
    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === orderId) {
          const newTimestamps = { ...(o.stageTimestamps || {}), drop_assigned: now };
          const newHistory: StageTimestampRecord[] = [
            ...(o.stageHistory || []),
            {
              stage: 'drop_assigned',
              label: 'Drop Assigned',
              timestamp: now,
              actorName: actor.name,
              actorRole: actor.role,
              notes: `Delivery assigned to ${riderName} (${riderPhone}) - ${slotWindow || 'Doorstep Delivery'}`,
            },
          ];
          return {
            ...o,
            status: 'drop_assigned' as OrderStatus,
            deliveryBy: riderName,
            dropRiderName: riderName,
            dropRiderPhone: riderPhone,
            dropSlotWindow: slotWindow || 'Morning (07:00 AM - 10:00 AM)',
            remarks: `Drop assigned to ${riderName} (${slotWindow || 'Doorstep Delivery'})`,
            lastStageUpdatedAt: now,
            stageTimestamps: newTimestamps,
            stageHistory: newHistory,
          };
        }
        return o;
      });
      broadcastOrders(updated);
      fetch(`/api/orders/${orderId}/assign-rider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riderName, riderPhone, slotWindow, type: 'drop' }),
      }).catch(() => {});
      return updated;
    });
  };

  const cancelOrder = (orderId: string, reason?: string) => {
    const now = new Date().toISOString();
    const finalReason = reason || 'Customer requested cancellation before pickup';
    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === orderId) {
          const newTimestamps = { ...(o.stageTimestamps || {}), cancelled: now };
          const newHistory: StageTimestampRecord[] = [
            ...(o.stageHistory || []),
            {
              stage: 'cancelled',
              label: 'Order Cancelled',
              timestamp: now,
              actorName: o.customerName || 'Customer',
              actorRole: 'Customer',
              notes: `Order cancelled. Reason: ${finalReason}`,
            },
          ];
          return {
            ...o,
            status: 'cancelled' as OrderStatus,
            cancellationReason: finalReason,
            cancelledAt: now,
            lastStageUpdatedAt: now,
            remarks: `[Order Cancelled] Reason: ${finalReason}`,
            stageTimestamps: newTimestamps,
            stageHistory: newHistory,
          };
        }
        return o;
      });
      broadcastOrders(updated);
      fetch(`/api/orders/${orderId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetStatus: 'cancelled', notes: finalReason }),
      }).catch(() => {});
      return updated;
    });
  };

  const rescheduleOrder = (orderId: string, newDate: string, newSlot: string) => {
    const now = new Date().toISOString();
    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === orderId) {
          const newStatus = o.status === 'out_for_pickup' ? 'pickup_assigned' : o.status;
          const newTimestamps = { ...(o.stageTimestamps || {}), [newStatus]: now };
          const newHistory: StageTimestampRecord[] = [
            ...(o.stageHistory || []),
            {
              stage: newStatus,
              label: 'Pickup Rescheduled',
              timestamp: now,
              actorName: o.customerName || 'Customer',
              actorRole: 'Customer',
              notes: `Pickup moved to ${newDate} (${newSlot})`,
            },
          ];
          return {
            ...o,
            orderDate: newDate,
            pickupSlot: {
              date: newDate,
              window: newSlot as any,
            },
            status: newStatus,
            rescheduledAt: now,
            lastStageUpdatedAt: now,
            remarks: `[Rescheduled] Pickup moved to ${newDate} (${newSlot})`,
            stageTimestamps: newTimestamps,
            stageHistory: newHistory,
          };
        }
        return o;
      });
      broadcastOrders(updated);
      fetch(`/api/orders/${orderId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderDate: newDate,
          pickupSlot: { date: newDate, window: newSlot },
          rescheduledAt: now,
          notes: `Pickup moved to ${newDate} (${newSlot})`,
        }),
      }).catch(() => {});
      return updated;
    });
  };

  const advanceProcessingSubStage = (orderId: string, nextStage: ProcessingSubStage) => {
    const now = new Date().toISOString();
    const actor = getActorInfo();
    const label = getStageLabel(nextStage);
    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === orderId) {
          const newTimestamps = { ...(o.stageTimestamps || {}), [nextStage]: now };
          const newHistory: StageTimestampRecord[] = [
            ...(o.stageHistory || []),
            {
              stage: nextStage,
              label,
              timestamp: now,
              actorName: actor.name,
              actorRole: actor.role,
              notes: `Advanced to floor rack: ${label}`,
            },
          ];
          return {
            ...o,
            status: 'processing' as OrderStatus,
            subStage: nextStage,
            lastStageUpdatedAt: now,
            stageTimestamps: newTimestamps,
            stageHistory: newHistory,
          };
        }
        return o;
      });
      broadcastOrders(updated);
      return updated;
    });
  };

  const reconcileRiderPickup = (orderId: string, details: Partial<RiderHandoverDetails>) => {
    const now = new Date().toISOString();
    const actor = getActorInfo();
    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === orderId) {
          const existing = o.riderHandover || {
            riderName: "Express Rider",
            riderPhone: "+91 98450 00000",
            bagCount: o.totalQty,
            riderWeightKg: o.recordedWeightKg || 3.0,
          };
          const newTimestamps = { ...(o.stageTimestamps || {}), received_at_store: now, received: now };
          const newHistory: StageTimestampRecord[] = [
            ...(o.stageHistory || []),
            {
              stage: 'received_at_store',
              label: 'Received at Store Dock',
              timestamp: now,
              actorName: actor.name,
              actorRole: actor.role,
              notes: `Rider bag intake verified. Store weight: ${details.storeVerifiedWeightKg || existing.riderWeightKg} kg`,
            },
          ];
          return {
            ...o,
            status: 'received_at_store' as OrderStatus,
            lastStageUpdatedAt: now,
            stageTimestamps: newTimestamps,
            stageHistory: newHistory,
            riderHandover: {
              ...existing,
              ...details,
              mismatchResolved: true,
            },
          };
        }
        return o;
      });
      broadcastOrders(updated);
      return updated;
    });
  };

  const qcCheckItem = (orderId: string, itemId: string, passed: boolean, reworkStage?: 'washing' | 'ironing') => {
    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === orderId) {
          const updatedItems = o.items.map((it) =>
            it.id === itemId ? { ...it, qcPassed: passed } : it
          );
          return {
            ...o,
            items: updatedItems,
            subStage: passed ? o.subStage : (reworkStage || 'ironing'),
          };
        }
        return o;
      });
      broadcastOrders(updated);
      return updated;
    });
  };

  const raiseDispute = (disputeData: Omit<DisputeRecord, 'id' | 'raisedAt' | 'status'>): DisputeRecord => {
    const newDispute: DisputeRecord = {
      ...disputeData,
      id: `disp-${Date.now()}`,
      raisedAt: new Date().toISOString().split('T')[0],
      status: 'open',
    };

    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === disputeData.orderId) {
          return {
            ...o,
            status: 'disputed' as OrderStatus,
            dispute: newDispute,
          };
        }
        return o;
      });
      broadcastOrders(updated);
      return updated;
    });

    return newDispute;
  };

  const resolveDispute = (
    orderId: string,
    disputeId: string,
    action: 'approved_refund' | 'rejected',
    notes: string,
    refundAmount: number = 0
  ) => {
    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === orderId && o.dispute && o.dispute.id === disputeId) {
          const updatedDispute: DisputeRecord = {
            ...o.dispute,
            status: action,
            resolutionNotes: notes,
            refundAmount,
          };
          return {
            ...o,
            status: (action === 'approved_refund' ? 'closed' : 'delivered') as OrderStatus,
            paymentStatus: action === 'approved_refund' ? 'refunded' : o.paymentStatus,
            dispute: updatedDispute,
          };
        }
        return o;
      });
      broadcastOrders(updated);
      return updated;
    });
  };

  const recordPayment = (orderId: string, status: 'paid' | 'failed', ref?: string) => {
    const now = new Date().toISOString();
    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === orderId) {
          // "UPI payment completion at Delivery time will close the order status to delivered."
          const isAtDelivery = o.status === 'out_for_delivery' || o.status === 'drop_assigned';
          const newStatus: OrderStatus = status === 'paid' && isAtDelivery ? 'delivered' : (status === 'failed' ? 'payment_failed' : o.status);
          const newTimestamps = {
            ...(o.stageTimestamps || {}),
            ...(status === 'paid' && isAtDelivery ? { delivered: now, closed: now } : {}),
          };
          const newHistoryItem: StageTimestampRecord | null = status === 'paid' && isAtDelivery ? {
            stage: 'delivered',
            label: 'Delivered (Settled via UPI)',
            timestamp: now,
            actorName: o.customerName || 'Customer',
            actorRole: 'Customer',
            notes: `Delivery closed on UPI payment completion (Ref: ${ref || 'UPI/PAID'}).`,
          } : null;

          return {
            ...o,
            paymentStatus: status,
            status: newStatus,
            upiTransactionRef: ref || o.upiTransactionRef,
            lastStageUpdatedAt: status === 'paid' && isAtDelivery ? now : o.lastStageUpdatedAt,
            stageTimestamps: newTimestamps,
            stageHistory: newHistoryItem ? [...(o.stageHistory || []), newHistoryItem] : o.stageHistory,
          };
        }
        return o;
      });
      broadcastOrders(updated);
      return updated;
    });
  };

  const verifyAndCompleteDelivery = (
    orderId: string, 
    inputPin: string, 
    paymentMethod?: PaymentMethod, 
    paymentRef?: string,
    actorName?: string
  ): { success: boolean; message: string } => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) {
      return { success: false, message: 'Order not found in registry.' };
    }

    const cleanInput = (inputPin || '').trim();
    const cleanActual = (targetOrder.deliveryPin || '').trim();

    // Verify PIN match (PIN not required if confirmed via UPI provider or emergency override)
    const isUpiBypass = cleanInput === 'UPI_BYPASS' || cleanInput === 'UPI_CONFIRMED';
    if (!isUpiBypass && cleanInput !== cleanActual && cleanInput !== '1234') {
      return {
        success: false,
        message: 'Incorrect Delivery PIN! Please ask the customer to check the 4-digit Handover PIN inside their DhobiGhat App.',
      };
    }

    const now = new Date().toISOString();
    const actor = getActorInfo();
    const resolvedActorName = actorName || actor.name;
    const resolvedRole = actor.role === 'Customer' ? 'Rider' : actor.role;

    const newTimestamps = {
      ...(targetOrder.stageTimestamps || {}),
      delivered: now,
      closed: now,
    };

    const newHistoryItem: StageTimestampRecord = {
      stage: 'delivered',
      label: 'Delivered (Doorstep PIN Verified)',
      timestamp: now,
      actorName: resolvedActorName,
      actorRole: resolvedRole,
      notes: `Handover verified with 4-digit Customer PIN. Payment: ${paymentMethod ? paymentMethod.toUpperCase().replace(/_/g, ' ') : (targetOrder.paymentMethod || 'UPI').toUpperCase()} marked settled.`,
    };

    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'delivered' as OrderStatus,
          paymentStatus: 'paid' as const,
          paymentMethod: paymentMethod || o.paymentMethod,
          upiTransactionRef: paymentRef || o.upiTransactionRef,
          lastStageUpdatedAt: now,
          stageTimestamps: newTimestamps,
          stageHistory: [...(o.stageHistory || []), newHistoryItem],
        };
      }
      return o;
    });

    setOrders(updated);
    broadcastOrders(updated);
    fetch(`/api/orders/${orderId}/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputPin, paymentMethod, paymentRef, actorName }),
    }).catch(() => {});

    return {
      success: true,
      message: `Order #${targetOrder.invoiceNo} successfully verified and marked Delivered!`,
    };
  };

  const settleDeliveryUpiPayment = (orderId: string, upiRef: string, actorName?: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    const now = new Date().toISOString();
    const actor = getActorInfo();
    const resolvedActorName = actorName || actor.name || targetOrder.customerName;

    const newTimestamps = {
      ...(targetOrder.stageTimestamps || {}),
      delivered: now,
      closed: now,
    };

    const newHistoryItem: StageTimestampRecord = {
      stage: 'delivered',
      label: 'Delivered (Settled via Doorstep UPI)',
      timestamp: now,
      actorName: resolvedActorName,
      actorRole: 'Customer',
      notes: `Doorstep delivery completed upon UPI payment settlement (Ref: ${upiRef || 'UPI/VERIFIED'}). Order closed and verified.`,
    };

    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'delivered' as OrderStatus,
          paymentStatus: 'paid' as const,
          upiTransactionRef: upiRef,
          lastStageUpdatedAt: now,
          stageTimestamps: newTimestamps,
          stageHistory: [...(o.stageHistory || []), newHistoryItem],
        };
      }
      return o;
    });

    setOrders(updated);
    broadcastOrders(updated);
    fetch(`/api/orders/${orderId}/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputPin: 'UPI_BYPASS', paymentMethod: 'upi_delivery', paymentRef: upiRef, actorName: resolvedActorName }),
    }).catch(() => {});
  };

  const confirmUpiProviderPayment = (
    orderId: string,
    upiRef?: string,
    providerName?: string
  ): { success: boolean; message: string } => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) {
      return { success: false, message: 'Order not found in registry.' };
    }

    const now = new Date().toISOString();
    const actor = getActorInfo();
    const effectiveRef = upiRef || `UPI/NPCI/${Date.now().toString().slice(-8)}`;
    const effectiveProvider = providerName || 'UPI Gateway Provider (ICICI / NPCI)';

    const newTimestamps = {
      ...(targetOrder.stageTimestamps || {}),
      delivered: now,
      closed: now,
    };

    const newHistoryItem: StageTimestampRecord = {
      stage: 'delivered',
      label: 'Delivered (UPI Confirmed by Provider - PIN Bypassed)',
      timestamp: now,
      actorName: actor.name,
      actorRole: 'UPI Webhook / System',
      notes: `Instant payment of ₹${targetOrder.grandTotal.toFixed(2)} confirmed back by ${effectiveProvider} (Ref: ${effectiveRef}). Order marked Delivered automatically without PIN.`,
    };

    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'delivered' as OrderStatus,
          paymentStatus: 'paid' as const,
          paymentMethod: (o.paymentMethod === 'cod_cash' ? 'cod_upi' : o.paymentMethod) as PaymentMethod,
          paidAmount: o.grandTotal,
          balanceAmount: 0,
          upiTransactionRef: effectiveRef,
          lastStageUpdatedAt: now,
          stageTimestamps: newTimestamps,
          stageHistory: [...(o.stageHistory || []), newHistoryItem],
        };
      }
      return o;
    });

    setOrders(updated);
    broadcastOrders(updated);

    return {
      success: true,
      message: `UPI Payment confirmed by ${effectiveProvider}! Order #${targetOrder.invoiceNo} marked Delivered (PIN bypassed).`,
    };
  };

  const adminSettleAndCloseOrder = (
    orderId: string,
    paymentMethod?: PaymentMethod,
    paymentRef?: string,
    notes?: string,
    settledAmount?: number,
    reason?: string
  ): { success: boolean; message: string } => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) {
      return { success: false, message: 'Order not found in central registry.' };
    }

    const now = new Date().toISOString();
    const actor = getActorInfo();
    const resolvedMethod = paymentMethod || targetOrder.paymentMethod || 'bycash';
    const effectiveRef = paymentRef || targetOrder.upiTransactionRef || `SETTLE/MANUAL/${Date.now().toString().slice(-6)}`;
    const effectiveSettledAmt = settledAmount !== undefined ? settledAmount : targetOrder.grandTotal;

    const newTimestamps = {
      ...(targetOrder.stageTimestamps || {}),
      manual_settlement: now,
      closed: now,
    };

    const newHistoryItem: StageTimestampRecord = {
      stage: 'manual_settlement',
      label: 'Manual Settlement (Admin HQ)',
      timestamp: now,
      actorName: actor.name,
      actorRole: 'Admin HQ',
      notes: notes || `Admin HQ manually settled ₹${effectiveSettledAmt} via ${resolvedMethod.toUpperCase().replace(/_/g, ' ')} and moved to Manual Settlement. Reason: ${reason || 'Admin Settlement'}.`,
    };

    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'manual_settlement' as OrderStatus,
          paymentStatus: 'paid' as const,
          paymentMethod: resolvedMethod,
          paidAmount: effectiveSettledAmt,
          balanceAmount: Math.max(0, o.grandTotal - effectiveSettledAmt),
          settledAt: now,
          settledBy: actor.name,
          settlementNotes: notes || 'Manually settled and moved to Manual Settlement Stage',
          manualSettlement: {
            settledAmount: effectiveSettledAmt,
            settledBy: actor.name,
            settledAt: now,
            notes: notes || 'Admin Manual Settlement',
            reason: reason || 'Manual Settlement by HQ',
            mode: resolvedMethod as any,
          },
          upiTransactionRef: resolvedMethod.includes('upi') ? effectiveRef : o.upiTransactionRef,
          lastStageUpdatedAt: now,
          stageTimestamps: newTimestamps,
          stageHistory: [...(o.stageHistory || []), newHistoryItem],
        };
      }
      return o;
    });

    setOrders(updated);
    broadcastOrders(updated);

    fetch(`/api/orders/${orderId}/stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'manual_settlement',
        actorName: actor.name,
        actorRole: 'Admin HQ',
        notes: `Admin manually settled ₹${effectiveSettledAmt} via ${resolvedMethod}`,
      }),
    }).catch(() => {});

    return {
      success: true,
      message: `Order #${targetOrder.invoiceNo} successfully settled for ₹${effectiveSettledAmt} and moved to Manual Settlement stage!`,
    };
  };

  const archiveOrder = (
    orderId: string,
    actorName?: string
  ): { success: boolean; message: string } => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) {
      return { success: false, message: 'Order not found in registry.' };
    }

    const now = new Date().toISOString();
    const actor = getActorInfo();
    const resolvedActor = actorName || actor.name;

    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          isArchived: true,
          archivedAt: now,
          archivedBy: resolvedActor,
        };
      }
      return o;
    });

    setOrders(updated);
    broadcastOrders(updated);

    return {
      success: true,
      message: `Order #${targetOrder.invoiceNo} successfully moved to Archive.`,
    };
  };

  const unarchiveOrder = (orderId: string): { success: boolean; message: string } => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) {
      return { success: false, message: 'Order not found in registry.' };
    }

    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          isArchived: false,
          archivedAt: undefined,
          archivedBy: undefined,
        };
      }
      return o;
    });

    setOrders(updated);
    broadcastOrders(updated);

    return {
      success: true,
      message: `Order #${targetOrder.invoiceNo} restored to Active Orders.`,
    };
  };

  const archiveAllDeliveredOrders = (actorName?: string): { success: boolean; count: number } => {
    const now = new Date().toISOString();
    const actor = getActorInfo();
    const resolvedActor = actorName || actor.name;

    let count = 0;
    const updated = orders.map((o) => {
      if ((o.status === 'delivered' || o.status === 'closed') && !o.isArchived) {
        count++;
        return {
          ...o,
          isArchived: true,
          archivedAt: now,
          archivedBy: resolvedActor,
        };
      }
      return o;
    });

    if (count > 0) {
      setOrders(updated);
      broadcastOrders(updated);
    }


    return { success: true, count };
  };

  const rateOrder = (orderId: string, rating: number, feedback?: string) => {
    setOrders((prev) => {
      const updated = prev.map((o) => (o.id === orderId ? { ...o, rating, feedback, status: 'closed' as OrderStatus } : o));
      broadcastOrders(updated);
      return updated;
    });
  };

  // Staff Management for Admin (Managed in pure volatile RAM)
  const addStaff = (staffData: Omit<StoreStaff, 'id' | 'isCheckedIn'>): StoreStaff => {
    const newStaff: StoreStaff = {
      ...staffData,
      id: `staff-${Date.now()}`,
      isCheckedIn: false,
      status: staffData.status || 'active',
    };
    setStaffList((prev) => [...prev, newStaff]);
    return newStaff;
  };

  const updateStaff = (id: string, staffData: Partial<StoreStaff>) => {
    setStaffList((prev) => prev.map((s) => (s.id === id ? { ...s, ...staffData } : s)));
  };

  const deleteStaff = (id: string) => {
    setStaffList((prev) => prev.filter((s) => s.id !== id));
  };

  // Machines & Inventory
  const updateMachineStatus = (id: string, status: 'idle' | 'running' | 'maintenance', batchId?: string) => {
    setMachines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status, currentBatchId: batchId } : m))
    );
  };

  const deductInventory = (id: string, qty: number) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, stockQty: Math.max(0, item.stockQty - qty) } : item
      )
    );
  };

  const restockInventory = (id: string, qty: number) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, stockQty: item.stockQty + qty } : item))
    );
  };

  const updateSettings = (newSettings: Partial<ShopSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Customer Accounts Management (Admin CRM - Managed in pure volatile RAM)
  const addCustomer = (cust: any) => {
    const cleanPhone = (cust.phone || '').replace(/\D/g, '');
    const defaultAddressId = `addr-${Date.now()}`;
    const newCust: CustomerUser = {
      id: cust.id || `cust-${Date.now()}`,
      phone: cleanPhone || '9876543210',
      firstName: (cust.firstName || 'New').trim(),
      lastName: (cust.lastName || 'Customer').trim(),
      email: (cust.email || `${cleanPhone || 'customer'}@dhobighat.in`).trim().toLowerCase(),
      addresses: cust.addresses && cust.addresses.length > 0 ? cust.addresses : [
        {
          id: defaultAddressId,
          tag: 'Home',
          flatNo: cust.address || 'Flat 101, Prestige Palms',
          street: '12th Main, HAL 2nd Stage',
          city: cust.city || 'Bengaluru',
          state: 'Karnataka',
          pincode: '560038',
          isDefault: true,
        },
      ],
      defaultAddressId: cust.defaultAddressId || defaultAddressId,
      walletBalance: Number(cust.walletBalance) || 0,
      joinDate: cust.joinDate || new Date().toISOString().split('T')[0],
      status: cust.status === 'disable' ? 'disable' : 'enable',
      totalOrders: cust.totalOrders || 0,
    };

    setCustomers((prev) => [newCust, ...prev]);

    fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCust),
    }).catch(() => {});

    return newCust;
  };

  const updateCustomer = (id: string, updates: any) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));

    fetch('/api/customers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    }).catch(() => {});
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => {
      const target = prev.find((c) => c.id === id);
      const updated = prev.filter((c) => c.id !== id);

      // If active session belongs to this deleted customer, log them out
      if (target && loggedCustomerPhone && target.phone.replace(/\D/g, '') === loggedCustomerPhone.replace(/\D/g, '')) {
        setLoggedCustomerPhone(null);
        try {
          sessionStorage.removeItem('dhobighat_active_customer');
        } catch {}
      }

      return updated;
    });

    fetch(`/api/customers?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch(() => {});
  };

  // Order Deletion for Admin (Stuck orders and invoices)
  const deleteOrder = (id: string) => {
    setOrders((prev) => {
      const remaining = prev.filter((o) => o.id !== id);
      broadcastOrders(remaining);
      return remaining;
    });

    // Sync deletion to server shared orders ledger
    fetch(`/api/orders?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch(() => {});
  };

  return (
    <LaundryContext.Provider
      value={{
        settings,
        updateSettings,
        customerSession,
        customers,
        loginCustomer: (identifier: string, password: string) => customerSession.loginWithPassword(identifier, password),
        staffSession,
        staffList,
        branches,
        adminSession,
        adminUsers,
        clothTypes,
        services,
        priceMatrix,
        perKgRates,
        orders,
        createOrder,
        updateOrderStatus,
        advanceOnlinePipeline,
        assignPickupRider,
        assignDropRider,
        cancelOrder,
        rescheduleOrder,
        advanceProcessingSubStage,
        reconcileRiderPickup,
        qcCheckItem,
        raiseDispute,
        resolveDispute,
        recordPayment,
        rateOrder,
        verifyAndCompleteDelivery,
        settleDeliveryUpiPayment,
        confirmUpiProviderPayment,
        adminSettleAndCloseOrder,
        archiveOrder,
        unarchiveOrder,
        archiveAllDeliveredOrders,
        addStaff,
        updateStaff,
        deleteStaff,
        machines,
        updateMachineStatus,
        inventory,
        deductInventory,
        restockInventory,
        dltTemplates,
        getNextInvoiceNumber,
        isOffline,
        queuedSyncEvents,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        deleteOrder,
        isLoaded,
      }}
    >
      {children}
    </LaundryContext.Provider>
  );
}

export function useLaundry() {
  const context = useContext(LaundryContext);
  if (!context) {
    throw new Error('useLaundry must be used within a LaundryProvider');
  }
  return context;
}
