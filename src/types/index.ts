// Domain Models for Indian Laundry Management System (DhobiGhat India)

export type OrderStatus = 
  // Online Fulfillment Pipeline (Store & Customer):
  | 'order_received'         // Step 1: Order receive queue / Order Placed
  | 'pickup_assigned'        // Step 2: Pickup assigned (Morning/Evening)
  | 'out_for_pickup'         // Step 3: Out for Pickup
  | 'picked_up'              // Step 4: Order Picked-up
  | 'reached_store'          // Step 5: Reached Store
  // Internal Store Processing Pipeline (Stages 1 to 6):
  | 'received'               // Store Stage 1: Received & scanned in
  | 'sorting'                // Store Stage 2: Sorting by fabric & color
  | 'washing'                // Store Stage 3: Washing machine cycle
  | 'drying'                 // Store Stage 4: Drying
  | 'ironing'                // Store Stage 5: Steam Ironing
  | 'qc_check_packed'        // Store Stage 6: Merged QC Check & Packed Ready
  | 'qc_check'               // Backward compat
  | 'packed_ready'           // Backward compat
  // Fulfillment & Finalization:
  | 'drop_assigned'          // Drop Assigned (Rider assigned for delivery)
  | 'out_for_delivery'       // Out for Delivery
  | 'delivered'              // Delivered & verified
  | 'manual_settlement'      // Manually Closed & Settled by Admin
  | 'closed'                 // Settlement & feedback
  | 'payment_failed'         // Payment Failure
  | 'disputed'               // Dispute Investigation
  | 'cancelled'              // Cancelled (Optional, till pickup stage)
  // Backward compatibility aliases:
  | 'booked'
  | 'received_at_store'
  | 'processing'
  | 'ready'
  | 'pending';

export type OrderChannel = 'online' | 'walk_in';

export type ProcessingSubStage = 
  | 'sorting' 
  | 'washing' 
  | 'drying' 
  | 'ironing' 
  | 'qc_check_packed'
  | 'qc_check' 
  | 'packing' 
  | 'ready';

export type PaymentMethod = 
  | 'upi_qr' 
  | 'upi_intent' 
  | 'cod' 
  | 'cod_cash'
  | 'cod_upi'
  | 'pos_machine'
  | 'card' 
  | 'wallet'
  | 'bycash' 
  | 'bycheque' 
  | 'online'
  | 'online_upi';

export type StarchLevel = 'none' | 'light' | 'medium' | 'heavy';
export type FoldStyle = 'hanger' | 'flat_fold' | 'roll_fold';

export interface IndianAddress {
  id: string;
  label?: 'Home' | 'Work' | 'Other' | string;
  flatNo: string;        // Flat/House/Plot No
  society?: string;      // Apartment / Society / Colony
  street: string;        // Street / Road / Area
  landmark?: string;     // Nearby landmark
  city: string;          // Bengaluru, Mumbai, Delhi, etc.
  state: string;         // Karnataka, Maharashtra, Delhi, etc.
  pincode: string;       // 6-digit Indian Pincode (e.g. 560038)
  isDefault?: boolean;
  tag?: string;          // Optional alias for label
}

export interface CustomerUser {
  id: string;
  phone: string;         // 10-digit Indian mobile (e.g. 9876543210)
  firstName: string;
  lastName: string;
  email: string;
  password?: string;     // Password authentication for customer account
  passwordHash?: string;
  addresses: IndianAddress[];
  defaultAddressId?: string;
  walletBalance: number;
  joinDate: string;
  status: 'enable' | 'disable';
  totalOrders: number;
  // Compatibility aliases
  address?: string;
  city?: string;
}

export type Customer = CustomerUser;

export interface ClothType {
  id: string;
  name: string;
  code: string;
  category?: 'Men' | 'Women' | 'Kids' | 'Household' | 'Woollen' | 'Ethnic';
  icon?: string;
}

export interface Service {
  id: string;
  name: string;          // e.g. Wash & Fold, Wash & Steam Iron, Dry Cleaning, Premium Saree Care
  code: string;
  color?: string;
  durationHours?: number; // e.g. 48 for standard, 24 for express
}

export interface PriceMatrixItem {
  id: string;
  serviceId: string;
  clothId: string;
  shortCode: string;
  price: number;         // Price in Indian Rupees (₹)
}

export interface PerKgServiceRate {
  id: string;
  serviceName: string;
  ratePerKg: number;     // e.g. ₹79/kg for Wash & Fold, ₹119/kg for Wash & Steam Iron
  minWeightKg: number;   // e.g. 3 kg
  durationHours: number; // e.g. 24 or 48 hrs
  description: string;
}

export interface GarmentOrderItem {
  id: string;
  clothId?: string;
  clothName: string;
  serviceId?: string;
  serviceName: string;
  priceCodeId?: string;
  unitPrice: number;
  quantity: number;
  total: number;
  starchLevel?: StarchLevel;
  foldStyle?: FoldStyle;
  stainNote?: string;
  qcPassed?: boolean;
  tagBarcode?: string;
}

export type OrderItem = GarmentOrderItem;

export interface RiderHandoverDetails {
  riderName: string;
  riderPhone: string;
  bagCount: number;
  riderWeightKg: number;
  storeVerifiedWeightKg?: number;
  riderPhotoEvidence?: string;
  mismatchResolved?: boolean;
  mismatchReason?: string;
}

export interface DisputeRecord {
  id: string;
  orderId: string;
  invoiceNo: string;
  raisedAt: string;
  issueType: 'damage' | 'stain_not_removed' | 'missing_item' | 'weight_mismatch';
  description: string;
  photoUrl?: string;
  status: 'open' | 'investigating' | 'approved_refund' | 'rejected';
  resolutionNotes?: string;
  refundAmount?: number;
}

export interface StageTimestampRecord {
  stage: OrderStatus | ProcessingSubStage;
  label?: string;
  timestamp: string; // ISO date-time string
  actorName?: string;
  actorRole?: string;
  notes?: string;
}

export interface Order {
  id: string;
  invoiceNo: string;     // e.g. IND-2401, SC07
  orderChannel?: OrderChannel; // 'online' | 'walk_in'
  storeId?: string;
  storeName?: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  pickupAddress?: IndianAddress;
  orderDate: string;
  pickupSlot?: {
    date: string;
    window: 'Morning (07:00 AM - 10:00 AM)' | 'Morning (10:00 AM - 01:00 PM)' | 'Evening (04:00 PM - 07:00 PM)' | 'Evening (07:00 PM - 10:00 PM)';
  };
  deliveryDate?: string;
  deliverySlotWindow?: string;
  items: GarmentOrderItem[];
  isPerKgOrder?: boolean;
  perKgRate?: number;
  recordedWeightKg?: number;
  totalQty: number;
  subtotal: number;
  discountPct: number;
  discountAmount: number;
  couponCode?: string;
  deliveryFee?: number;
  gstRate?: number;       // 18% GST standard in India
  gstAmount?: number;
  taxPct?: number;        // Compatibility alias for gstRate
  taxAmount?: number;     // Compatibility alias for gstAmount
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus?: 'paid' | 'pending' | 'failed' | 'refunded';
  upiTransactionRef?: string;
  status: OrderStatus;
  subStage?: ProcessingSubStage;
  deliveryPin?: string;   // 4-digit security PIN for rider handover
  rating?: number;        // 1-5 stars
  feedback?: string;
  riderHandover?: RiderHandoverDetails;
  dispute?: DisputeRecord;
  remarks?: string;
  pickupBy?: string;
  deliveryBy?: string;
  dropRiderName?: string;
  dropRiderPhone?: string;
  dropSlotWindow?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  rescheduledAt?: string;
  lastStageUpdatedAt?: string;
  stageTimestamps?: Record<string, string>;
  stageHistory?: StageTimestampRecord[];
  chequeNo?: string;
  chequeDate?: string;
  posDetails?: {
    terminalId: string;
    authCode: string;
    rrn: string;
    cardBrand?: string;
    cardLast4?: string;
  };
  isArchived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
  settledAt?: string;
  settledBy?: string;
  settlementNotes?: string;
  paidAmount?: number;
  balanceAmount?: number;
  manualSettlement?: {
    settledAmount: number;
    settledBy: string;
    settledAt: string;
    notes: string;
    reason?: string;
    mode?: 'cash' | 'upi' | 'bank_transfer' | 'waiver';
  };
}

export interface Expense {
  id: string;
  date: string;
  payeeName: string;
  type: string;
  amount: number;
  paidBy: PaymentMethod;
  chequeNo?: string;
  remarks?: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  joinDate: string;
  status: 'enable' | 'disable';
  role: string;
}

export type StoreOperatorRole = 
  | 'store_manager' 
  | 'store_operator' 
  | 'worker' 
  | 'rider'
  // Backward compatibility aliases:
  | 'counter_operator' 
  | 'wash_operator' 
  | 'iron_operator' 
  | 'qc_checker';

export interface StoreStaff {
  id: string;
  name: string;
  phone: string;
  pin: string;           // 4-digit quick shift PIN
  role: StoreOperatorRole | 'counter' | 'washer' | 'ironer' | 'qc' | 'dispatch' | 'manager';
  storeId: string;
  storeName: string;
  activeShift?: 'morning' | 'evening' | 'night';
  isCheckedIn: boolean;
  avatar?: string;
  status?: 'active' | 'on_leave' | 'inactive';
}

export type AdminRole = 
  | 'super_admin' 
  | 'franchise_owner' 
  | 'finance_auditor';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: AdminRole;
  avatar?: string;
  permissions: string[];
  passwordHash?: string;
}

export interface StoreBranch {
  id: string;
  name: string;          // e.g. Bengaluru - Indiranagar Flagship
  city: string;
  address: string;
  phone: string;
  servicePincodes: string[];
  operatingHours: string;
  dailyCapacityKg: number;
  activeWashers: number;
  activeDryers: number;
}

export interface MachineRecord {
  id: string;
  storeId: string;
  name: string;          // e.g. Washer #1 (15kg Primus)
  type: 'washer' | 'dryer' | 'steam_press';
  capacityKg: number;
  status: 'idle' | 'running' | 'maintenance';
  currentBatchId?: string;
  lastMaintained: string;
}

export interface InventoryItem {
  id: string;
  storeId: string;
  name: string;          // e.g. Diversey Softener, Tag Rolls, Poly Hanger Rolls
  category: 'Chemical' | 'Packaging' | 'Stationery' | 'Tag';
  stockQty: number;
  unit: 'Liters' | 'Kg' | 'Rolls' | 'Pcs';
  minThreshold: number;
  costPerUnit: number;
}

export interface PosMachineConfig {
  enabled: boolean;
  provider: 'pine_labs' | 'paytm_pos' | 'mosambee' | 'razorpay_pos' | 'ingenico_pax';
  terminalId: string;     // e.g. PL-A920-8491
  merchantId?: string;    // e.g. MID-DHOBIGHAT-BLR
  connectionType: 'lan_wifi' | 'bluetooth' | 'usb_serial' | 'cloud_api';
  ipAddress?: string;     // e.g. 192.168.1.150:8080
  soundboxAlerts?: boolean;
}

export interface ShopSettings {
  shopName: string;
  tagline?: string;
  gstin?: string;         // Indian GST Number (e.g. 29AABCU9603R1ZM)
  address: string;
  city: string;
  state?: string;
  pincode?: string;
  phone: string;
  email: string;
  currency: string;      // "INR" (₹)
  taxRate: number;       // 18%
  minOrderValue?: number; // ₹299
  freeDeliveryThreshold?: number; // ₹299
  standardDeliveryFee?: number;   // ₹40
  upiId?: string;         // e.g. laundrycare@icici
  storeUpiId?: string;    // Store Floor Counter UPI ID e.g. dhobighat.store@icici
  upiMerchantName?: string;
  posMachineConfig?: PosMachineConfig;
}

export interface DLTSmsTemplate {
  templateId: string;
  title: string;
  category: 'Transactional' | 'Promotional';
  content: string;
}
