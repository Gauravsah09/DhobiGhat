'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Building2, 
  UserCheck, 
  KeyRound, 
  Phone, 
  Clock, 
  LogOut, 
  Tag, 
  Scale, 
  Printer, 
  QrCode, 
  AlertTriangle, 
  Camera, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Layers, 
  Truck, 
  Package, 
  Shirt, 
  Banknote, 
  Wifi, 
  WifiOff, 
  Check, 
  Plus, 
  Search, 
  ArrowRight,
  Flame,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Sparkles,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckSquare,
  History,
  ChevronDown,
  ChevronUp,
  Smartphone,
  CreditCard,
  Volume2,
  Settings2,
  ExternalLink,
  Copy
} from 'lucide-react';
import { useLaundry } from '@/context/LaundryContext';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  Order, 
  GarmentOrderItem, 
  OrderStatus, 
  ProcessingSubStage, 
  StarchLevel, 
  FoldStyle, 
  StoreOperatorRole,
  PaymentMethod,
  IndianAddress
} from '@/types';
import { formatCurrency, formatDateTime, formatTimeShort, generateUpiUri } from '@/lib/utils';

export default function StoreFloorApp() {
  const router = useRouter();
  const { 
    staffSession, 
    staffList, 
    branches, 
    orders, 
    createOrder,
    clothTypes, 
    services, 
    priceMatrix, 
    updateOrderStatus, 
    advanceOnlinePipeline,
    assignPickupRider,
    assignDropRider,
    cancelOrder,
    advanceProcessingSubStage,
    reconcileRiderPickup,
    qcCheckItem,
    raiseDispute,
    resolveDispute,
    verifyAndCompleteDelivery,
    settleDeliveryUpiPayment,
    confirmUpiProviderPayment,
    machines, 
    updateMachineStatus, 
    inventory, 
    deductInventory,
    settings,
    updateSettings,
    isOffline,
    queuedSyncEvents,
    isLoaded
  } = useLaundry();

  const { staff, isCheckedIn, loginWithPin, logoutStaff, hasRole } = staffSession;

  // Strict Redirect Guard: If not checked in, immediately redirect to /store/login
  useEffect(() => {
    if (!isLoaded) return;
    if (!isCheckedIn || !staff) {
      router.replace('/store/login');
    }
  }, [isLoaded, isCheckedIn, staff, router]);

  // Primary store division: Online vs Walk-in Orders
  type StoreSection = 'online_pipeline' | 'walkin_orders' | 'kanban_floor' | 'cash_close';
  const [activeSection, setActiveSection] = useState<StoreSection>('online_pipeline');

  // Online Pipeline Filter: 'all' or specific milestone
  const [onlineMilestoneFilter, setOnlineMilestoneFilter] = useState<string>('all');
  const [onlineSearch, setOnlineSearch] = useState('');

  // Calendar Left Side Panel State (1-year toggle from current month)
  const [calendarYear, setCalendarYear] = useState<number>(2026);
  const [calendarMonth, setCalendarMonth] = useState<number>(9);
  const [selectedBookingDate, setSelectedBookingDate] = useState<string | null>(null);
  const [showCalendarPanel, setShowCalendarPanel] = useState<boolean>(true);
  const [currentNow, setCurrentNow] = useState<Date | null>(null);

  useEffect(() => {
    const now = new Date();
    setCurrentNow(now);
    setCalendarYear(now.getFullYear());
    setCalendarMonth(now.getMonth());
  }, []);

  // Rider assignment modal state (Pickup)
  const [assignModalOrder, setAssignModalOrder] = useState<Order | null>(null);
  const [selectedRiderName, setSelectedRiderName] = useState('Mahesh Rider');
  const [selectedRiderPhone, setSelectedRiderPhone] = useState('+91 91234 56789');
  // Dynamic available riders list from staffList
  const availableRiders = useMemo(() => {
    const list = (staffList || []).filter((s) => s && (s.role === 'rider' || s.role === 'dispatch'));
    if (list.length > 0) {
      return list.map((s) => ({
        id: s.id,
        name: s.name || 'Store Rider',
        phone: s.phone && typeof s.phone === 'string' ? (s.phone.startsWith('+91') ? s.phone : `+91 ${s.phone}`) : '+91 98765 43216',
        status: s.status === 'active' ? 'Active on Route' : (s.status || 'Active on Route'),
      }));
    }
    return [
      { id: 'rider-1', name: 'Mahesh Rider', phone: '+91 98765 43216', status: 'Active on Route' },
      { id: 'rider-2', name: 'Kiran Delivery', phone: '+91 91234 56780', status: 'Available at Indiranagar Hub' },
      { id: 'rider-3', name: 'Anand Kumar', phone: '+91 98450 11223', status: 'Available at Indiranagar Hub' },
    ];
  }, [staffList]);
  const [selectedSlotWindow, setSelectedSlotWindow] = useState<'Morning' | 'Evening'>('Morning');

  // Drop Rider assignment modal state (Drop Delivery)
  const [dropModalOrder, setDropModalOrder] = useState<Order | null>(null);
  const [dropRiderName, setDropRiderName] = useState('Mahesh Rider');
  const [dropRiderPhone, setDropRiderPhone] = useState('+91 91234 56789');
  const [dropSlotWindow, setDropSlotWindow] = useState('Morning (07:00 AM - 10:00 AM)');

  // Rider handover weight modal state & photo evidence (Cloudflare R2)
  const [weightModalOrder, setWeightModalOrder] = useState<Order | null>(null);
  const [handoverWeight, setHandoverWeight] = useState('3.5');
  const [handoverPieces, setHandoverPieces] = useState('5');
  const [handoverPhoto, setHandoverPhoto] = useState('');
  const [isUploadingR2Photo, setIsUploadingR2Photo] = useState(false);
  const [r2UploadMessage, setR2UploadMessage] = useState('');

  const handleR2PhotoUpload = async (file: File) => {
    try {
      setIsUploadingR2Photo(true);
      setR2UploadMessage('Uploading photo to Cloudflare R2 storage...');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'rider-evidence');

      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.fileUrl) {
        setHandoverPhoto(data.fileUrl);
        setR2UploadMessage(
          data.r2Configured
            ? '✓ Verified: Uploaded to Cloudflare R2 Storage Bucket'
            : '✓ Verified: Uploaded to Cloudflare R2 Storage (Mock Dev Server)'
        );
      } else {
        alert(data.message || 'Photo upload failed. Please try again.');
        setR2UploadMessage('');
      }
    } catch (err: any) {
      console.error('Error uploading photo to R2:', err);
      alert('Network error while uploading photo to R2. Please try again.');
      setR2UploadMessage('');
    } finally {
      setIsUploadingR2Photo(false);
    }
  };

  const handleQuickR2Proof = async () => {
    try {
      setIsUploadingR2Photo(true);
      setR2UploadMessage('Generating Cloudflare R2 proof token...');
      const res = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: 'rider-pickup-proof.jpg', folder: 'rider-evidence' }),
      });
      const data = await res.json();
      if (data.fileUrl) {
        setHandoverPhoto(data.fileUrl);
        setR2UploadMessage(data.r2Configured ? '✓ Cloudflare R2 Object Reference Attached' : '✓ Cloudflare R2 Dev Object Reference Attached');
      } else {
        setHandoverPhoto('https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=400&q=80');
      }
    } catch {
      setHandoverPhoto('https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=400&q=80');
    } finally {
      setIsUploadingR2Photo(false);
    }
  };

  // Store Manager Dispute Settlement Modal State
  const [clearDisputeOrder, setClearDisputeOrder] = useState<Order | null>(null);
  const [disputeResolutionNotes, setDisputeResolutionNotes] = useState('');
  const [disputeAction, setDisputeAction] = useState<'approved_refund' | 'rejected'>('approved_refund');
  const [disputeRefundAmt, setDisputeRefundAmt] = useState('0');

  // Floor Dispute Filing Modal State (Delivered Orders)
  const [storeDisputeModalOrder, setStoreDisputeModalOrder] = useState<Order | null>(null);
  const [storeDisputeType, setStoreDisputeType] = useState<'damage' | 'stain_not_removed' | 'missing_item' | 'weight_mismatch'>('damage');
  const [storeDisputeDesc, setStoreDisputeDesc] = useState('');

  // Walk-in Counter intake state
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [intakeClothId, setIntakeClothId] = useState(clothTypes[0]?.id || 'c-1');
  const [intakeServiceId, setIntakeServiceId] = useState(services[0]?.id || 's-2');
  const [intakeQty, setIntakeQty] = useState(1);
  const [intakeStarch, setIntakeStarch] = useState<StarchLevel>('medium');
  const [intakeFold, setIntakeFold] = useState<FoldStyle>('hanger');
  const [intakeStain, setIntakeStain] = useState('');
  const [intakeItems, setIntakeItems] = useState<GarmentOrderItem[]>([]);
  const [walkinPayment, setWalkinPayment] = useState<'bycash' | 'upi_qr' | 'pos_machine'>('upi_qr');
  const [lastCreatedWalkin, setLastCreatedWalkin] = useState<Order | null>(null);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  const handlePrintReceipt = (order: Order) => {
    setPrintingOrder(order);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // POS Machine & Soundbox state
  const [posCharging, setPosCharging] = useState(false);
  const [posAuthResult, setPosAuthResult] = useState<{
    terminalId: string;
    authCode: string;
    rrn: string;
    cardBrand: string;
    cardLast4: string;
  } | null>(null);
  const [showPosConfigModal, setShowPosConfigModal] = useState(false);
  const [soundboxAlertPlaying, setSoundboxAlertPlaying] = useState(false);

  // Rider Doorstep Delivery & Handover PIN Modal
  const [handoverModalOrder, setHandoverModalOrder] = useState<Order | null>(null);
  const [handoverInputPin, setHandoverInputPin] = useState('');
  const [handoverPaymentMethod, setHandoverPaymentMethod] = useState<'upi' | 'cash'>('upi');
  const [handoverUpiRef, setHandoverUpiRef] = useState('');
  const [handoverError, setHandoverError] = useState('');
  const [handoverSuccessMsg, setHandoverSuccessMsg] = useState('');

  // Cash tally close state
  const [actualCashTally, setActualCashTally] = useState('');

  // Timeline / Audit Trail Modal state
  const [viewTimelineOrder, setViewTimelineOrder] = useState<Order | null>(null);

  // The Canonical 4-Role Resolution & Stage Permissions Matrix
  const currentRole: StoreOperatorRole = staff
    ? (staff.role === 'store_manager' || staff.role === 'manager' ? 'store_manager' :
       staff.role === 'store_operator' || staff.role === 'counter_operator' || staff.role === 'counter' ? 'store_operator' :
       staff.role === 'rider' || staff.role === 'dispatch' ? 'rider' : 'worker')
    : 'store_operator';

  // Split orders into Online and Walk-in collections
  const onlineOrders = orders.filter((o: Order) => o.orderChannel !== 'walk_in');
  const walkinOrders = orders.filter((o: Order) => o.orderChannel === 'walk_in');

  // Role authorization checkers across Online and Walk-in orders:
  // 1. Store Manager: Whole pipeline access for Online Orders, Walk-in orders, Floor Processing Racks, Disputes & cash close
  // 2. Store Operator:
  //    - "Order Received" -> Move order access to "Pickup Assigned" Stage
  //    - "Pickup Assigned" -> Access to assign Pickup rider and move stage to "Out For Pickup"
  //    - "Reached Store" -> Move Reached Store status to "Received"
  //    - "Drop Assigned" / "QC Check Packed" -> Access to assign Drop rider
  //    - Walk-in Counter POS Intake & Shift Cash Close
  // 3. Rider:
  //    - "Out For Pickup" -> Collect clothes from customer based on weight and/or Pieces, upload pictures as evidence, move to "Order Picked-up"
  //    - "Order Picked-up" -> Move status to "Reached Store"
  //    - "Drop Assigned" -> Dispatch with clothes and move to "Out for Delivery"
  //    - "Out for Delivery" -> Pick clothes, take UPI on Delivery or Cash on Delivery, verify PIN, complete delivery
  // 4. Worker: Floor Operations ONLY - Received, Sorting, Washing, Drying, Ironing, QC check and Pack Ready
  const isAuthorizedForStage = (stage: OrderStatus, subStage?: ProcessingSubStage): boolean => {
    const norm = normalizeStatus(stage, subStage);
    if (currentRole === 'store_manager') return true;
    if (currentRole === 'store_operator') {
      return (
        norm === 'order_received' ||
        norm === 'pickup_assigned' ||
        norm === 'reached_store' ||
        norm === 'qc_check_packed' ||
        norm === 'drop_assigned' ||
        norm === 'cancelled'
      );
    }
    if (currentRole === 'rider') {
      return (
        norm === 'out_for_pickup' ||
        norm === 'picked_up' ||
        norm === 'drop_assigned' ||
        norm === 'out_for_delivery'
      );
    }
    if (currentRole === 'worker') {
      return (
        norm === 'received' ||
        norm === 'sorting' ||
        norm === 'washing' ||
        norm === 'drying' ||
        norm === 'ironing' ||
        norm === 'qc_check_packed'
      );
    }
    return false;
  };

  const canPerformWalkinIntake = currentRole === 'store_manager' || currentRole === 'store_operator';
  const canPerformKanbanFloor = currentRole === 'store_manager' || currentRole === 'worker';
  const canPerformCashClose = currentRole === 'store_manager' || currentRole === 'store_operator';

  // Online Pipeline Milestones:
  // 14-Stage Workflow + Disputed Claims + Cancelled
  const operatorMilestones: { key: OrderStatus; label: string; stageNumber?: string; group: 'pickup' | 'store' | 'delivery' | 'status' }[] = [
    { key: 'order_received', label: 'Order Receive Queue', group: 'pickup' },
    { key: 'pickup_assigned', label: 'Pickup Assigned (M/E)', group: 'pickup' },
    { key: 'out_for_pickup', label: 'Out for Pickup', group: 'pickup' },
    { key: 'picked_up', label: 'Order Picked-up', group: 'pickup' },
    { key: 'reached_store', label: 'Reached Store', group: 'pickup' },
    { key: 'received', label: '1. Received', stageNumber: '1', group: 'store' },
    { key: 'sorting', label: '2. Sorting', stageNumber: '2', group: 'store' },
    { key: 'washing', label: '3. Washing', stageNumber: '3', group: 'store' },
    { key: 'drying', label: '4. Drying', stageNumber: '4', group: 'store' },
    { key: 'ironing', label: '5. Ironing', stageNumber: '5', group: 'store' },
    { key: 'qc_check_packed', label: '6. QC Check & Packed Ready', stageNumber: '6', group: 'store' },
    { key: 'drop_assigned', label: 'Drop Assigned', group: 'delivery' },
    { key: 'out_for_delivery', label: 'Out for Delivery', group: 'delivery' },
    { key: 'delivered', label: 'Delivered (Closed)', group: 'delivery' },
    { key: 'disputed', label: 'Disputes & Claims', group: 'status' },
    { key: 'cancelled', label: 'Cancelled (Optional)', group: 'status' },
    { key: 'manual_settlement', label: 'Manual Settlement (HQ)', group: 'status' },
  ];

  // Helper to normalize booking and processing statuses to current pipeline stage
  const normalizeStatus = (status: OrderStatus, subStage?: ProcessingSubStage): OrderStatus => {
    if (status === 'booked' || status === 'pending') return 'order_received';
    if (status === 'received_at_store') return 'received';
    if (status === 'ready' || status === 'qc_check' || status === 'packed_ready') return 'qc_check_packed';
    if (status === 'processing' && subStage) return subStage as OrderStatus;
    return status;
  };

  // 1-year window limits (from current month to +11 months)
  const safeNowYear = currentNow ? currentNow.getFullYear() : calendarYear;
  const safeNowMonth = currentNow ? currentNow.getMonth() : calendarMonth;
  const currentYearMonthVal = safeNowYear * 12 + safeNowMonth;
  const activeYearMonthVal = calendarYear * 12 + calendarMonth;
  const canGoPrev = activeYearMonthVal > currentYearMonthVal - 3;
  const canGoNext = activeYearMonthVal < currentYearMonthVal + 11;

  const handlePrevMonth = () => {
    if (canGoPrev) {
      if (calendarMonth === 0) {
        setCalendarMonth(11);
        setCalendarYear((y) => y - 1);
      } else {
        setCalendarMonth((m) => m - 1);
      }
    }
  };

  const handleNextMonth = () => {
    if (canGoNext) {
      if (calendarMonth === 11) {
        setCalendarMonth(0);
        setCalendarYear((y) => y + 1);
      } else {
        setCalendarMonth((m) => m + 1);
      }
    }
  };

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 = Sunday

  const handleDateClick = (day: number) => {
    const monthStr = String(calendarMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const fullDate = `${calendarYear}-${monthStr}-${dayStr}`;
    if (selectedBookingDate === fullDate) {
      setSelectedBookingDate(null);
    } else {
      setSelectedBookingDate(fullDate);
      setOnlineMilestoneFilter('order_received');
    }
  };

  // Map of booking counts by date (YYYY-MM-DD) for calendar highlight indicators
  const ordersBookedByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const ord of onlineOrders) {
      const d = (ord.pickupSlot?.date || ord.orderDate || '').split('T')[0];
      if (d) {
        map[d] = (map[d] || 0) + 1;
      }
    }
    return map;
  }, [onlineOrders]);

  // Filtered online orders list (with Calendar date filter)
  const filteredOnlineOrders = onlineOrders.filter((ord) => {
    const normalized = normalizeStatus(ord.status, ord.subStage);
    const matchesFilter = onlineMilestoneFilter === 'all' || normalized === onlineMilestoneFilter;
    const searchLower = onlineSearch.toLowerCase();
    const matchesSearch = 
      (ord.invoiceNo || '').toLowerCase().includes(searchLower) ||
      (ord.customerName || '').toLowerCase().includes(searchLower) ||
      (ord.customerPhone && ord.customerPhone.includes(onlineSearch));
    
    const ordDate = (ord.pickupSlot?.date || ord.orderDate || '').split('T')[0];
    const matchesDate = !selectedBookingDate || ordDate === selectedBookingDate;

    return matchesFilter && matchesSearch && matchesDate;
  });

  // Handle adding items in walk-in intake
  const handleAddWalkinItem = () => {
    const cloth = clothTypes.find((c) => c.id === intakeClothId) || clothTypes[0];
    const srv = services.find((s) => s.id === intakeServiceId) || services[0];
    const matchCode = priceMatrix.find((p) => p.clothId === cloth?.id && p.serviceId === srv?.id);
    const unitPrice = matchCode ? matchCode.price : 49;

    const newItem: GarmentOrderItem = {
      id: `walkin-item-${Date.now()}-${intakeItems.length}`,
      clothId: cloth?.id,
      clothName: cloth?.name || 'Garment',
      serviceId: srv?.id,
      serviceName: srv?.name || 'Laundry',
      quantity: intakeQty,
      unitPrice,
      total: unitPrice * intakeQty,
      starchLevel: intakeStarch,
      foldStyle: intakeFold,
      stainNote: intakeStain.trim() || undefined,
      tagBarcode: `TAG-${Math.floor(100000 + Math.random() * 900000)}`,
      qcPassed: false,
    };

    setIntakeItems((prev) => [...prev, newItem]);
    setIntakeStain('');
    setIntakeQty(1);
  };

  const triggerPosCharge = (amount: number) => {
    setPosCharging(true);
    setTimeout(() => {
      const auth = `${Math.floor(100000 + Math.random() * 900000)}`;
      const rrn = `${Date.now().toString().slice(-10)}`;
      setPosAuthResult({
        terminalId: settings.posMachineConfig?.terminalId || 'PL-A920-8491',
        authCode: auth,
        rrn,
        cardBrand: 'RuPay Platinum',
        cardLast4: '7201',
      });
      setPosCharging(false);
    }, 1200);
  };

  const triggerSoundboxAlert = (amount: number) => {
    setSoundboxAlertPlaying(true);
    setTimeout(() => {
      setSoundboxAlertPlaying(false);
    }, 3000);
  };

  // Submit new walk-in order
  const handleCreateWalkinOrder = (e?: React.SyntheticEvent) => {
    e?.preventDefault?.();
    if (!staff) {
      alert('Please check in to store floor before creating an order.');
      return;
    }
    if (!walkinName.trim() || !walkinPhone.trim()) {
      alert('Please enter customer name and 10-digit mobile number.');
      return;
    }
    if (intakeItems.length === 0) {
      alert('Please add at least one garment item.');
      return;
    }

    const subtotal = intakeItems.reduce((sum, it) => sum + it.total, 0);
    const gstAmount = (subtotal * settings.taxRate) / 100;
    const grandTotal = subtotal + gstAmount;

    const newOrder = createOrder({
      orderChannel: 'walk_in',
      status: 'received',
      storeId: staff.storeId,
      storeName: staff.storeName,
      customerId: `walkin-${walkinPhone.replace(/\D/g, '')}`,
      customerName: walkinName.trim(),
      customerPhone: walkinPhone.trim(),
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      items: intakeItems,
      totalQty: intakeItems.reduce((s, it) => s + it.quantity, 0),
      subtotal,
      discountPct: 0,
      discountAmount: 0,
      deliveryFee: 0,
      gstRate: settings.taxRate,
      gstAmount,
      grandTotal,
      paymentMethod: walkinPayment,
      paymentStatus: 'paid',
      posDetails: walkinPayment === 'pos_machine' ? (posAuthResult || {
        terminalId: settings.posMachineConfig?.terminalId || 'PL-A920-8491',
        authCode: `${Math.floor(100000 + Math.random() * 900000)}`,
        rrn: `${Date.now().toString().slice(-10)}`,
        cardBrand: 'RuPay Platinum',
        cardLast4: '7201'
      }) : undefined,
      upiTransactionRef: walkinPayment === 'upi_qr' ? `UPI/${Date.now().toString().slice(-8)}/STORE` : undefined,
      remarks: `[Store Floor Walk-In Intake] Checked in by ${staff.name} (${staff.role.replace('_', ' ')}). Payment: ${walkinPayment.toUpperCase()}`,
    });

    setPosAuthResult(null);

    setLastCreatedWalkin(newOrder);
    setWalkinName('');
    setWalkinPhone('');
    setIntakeItems([]);
  };

  // Submit Rider Assignment
  const [lastAssignedRiderOrder, setLastAssignedRiderOrder] = useState<{ invoiceNo: string; riderName: string; slot: string } | null>(null);

  const handleConfirmRiderAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalOrder) return;
    const inv = assignModalOrder.invoiceNo;
    const rider = selectedRiderName;
    const slot = selectedSlotWindow;
    assignPickupRider(assignModalOrder.id, selectedRiderName, selectedRiderPhone, selectedSlotWindow);
    setAssignModalOrder(null);
    setLastAssignedRiderOrder({ invoiceNo: inv, riderName: rider, slot });
    if (onlineMilestoneFilter === 'order_received') {
      setOnlineMilestoneFilter('pickup_assigned');
    }
    setTimeout(() => {
      setLastAssignedRiderOrder(null);
    }, 7000);
  };

  // Store Manager: Clear and settle customer dispute
  const handleConfirmClearDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clearDisputeOrder || !clearDisputeOrder.dispute) return;
    resolveDispute(
      clearDisputeOrder.id,
      clearDisputeOrder.dispute.id,
      disputeAction,
      disputeResolutionNotes || 'Dispute reviewed and cleared by Store Manager Vikas Patil',
      parseFloat(disputeRefundAmt) || 0
    );
    alert(`Dispute for Order #${clearDisputeOrder.invoiceNo} has been cleared and settled.`);
    setClearDisputeOrder(null);
  };

  // Report dispute from store floor on delivered order
  const handleConfirmStoreDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeDisputeModalOrder) return;
    raiseDispute({
      orderId: storeDisputeModalOrder.id,
      invoiceNo: storeDisputeModalOrder.invoiceNo,
      issueType: storeDisputeType,
      description: storeDisputeDesc || 'Customer reported issue upon receiving clothes.',
    });
    alert(`Dispute filed for Order #${storeDisputeModalOrder.invoiceNo}. Moved to Disputes queue for Store Manager resolution.`);
    setStoreDisputeModalOrder(null);
  };

  // Submit Drop Rider Assignment
  const handleConfirmDropAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dropModalOrder) return;
    assignDropRider(dropModalOrder.id, dropRiderName, dropRiderPhone, dropSlotWindow);
    setDropModalOrder(null);
  };

  // Cancel order before pickup (Operator / Manager)
  const handleCancelOnlineOrder = (orderId: string, invoiceNo: string) => {
    const reason = prompt(`Enter reason to cancel Order #${invoiceNo} (e.g. Customer cancelled via call):`, 'Customer requested cancellation prior to pickup');
    if (reason) {
      cancelOrder(orderId, reason);
      alert(`Order #${invoiceNo} has been marked Cancelled.`);
    }
  };

  // Submit Rider Weight Handover with Photo Evidence (Cloudflare R2)
  const handleConfirmWeightHandover = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weightModalOrder) return;
    if (isUploadingR2Photo) {
      alert('Please wait a moment while the garment photo finishes uploading to Cloudflare R2 storage.');
      return;
    }
    const photoEvidence = handoverPhoto || 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=400&q=80';
    reconcileRiderPickup(weightModalOrder.id, {
      riderWeightKg: parseFloat(handoverWeight) || 3.0,
      bagCount: parseInt(handoverPieces, 10) || weightModalOrder.totalQty,
      storeVerifiedWeightKg: parseFloat(handoverWeight) || 3.0,
      riderPhotoEvidence: photoEvidence,
      mismatchResolved: true,
    });
    advanceOnlinePipeline(weightModalOrder.id, 'picked_up');
    setWeightModalOrder(null);
    setHandoverPhoto('');
    setR2UploadMessage('');
  };

  // Unauthenticated Guard
  if (!isCheckedIn || !staff) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-white mb-2">Store Staff Authentication Required</h2>
        <p className="text-slate-400 max-w-md mb-6 text-sm">
          Access to the floor operations, intake desk, and pipeline requires an active staff shift check-in. Redirecting to staff login screen...
        </p>
        <Link
          href="/store/login"
          className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm transition-all shadow-lg shadow-sky-500/20"
        >
          Go to Store Shift Login Screen ➔
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--c-canvas)] text-[var(--c-ink)] flex flex-col font-mono transition-colors duration-150">
      
      {/* Top Floor Bar with Operator RBAC & Role Switcher */}
      <header className="sticky top-0 z-40 bg-[var(--c-canvas-surface)]/95 backdrop-blur-md border-b border-[var(--c-border)] px-4 sm:px-6 py-2.5 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Building2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight text-white">{staff.storeName}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Floor Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Store Floor Operations & Logistics Engine</p>
            </div>
          </div>

          {/* Active Operator Badge & RBAC Controls */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700">
              <div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-[10px]">
                {staff.name[0]}
              </div>
              <div className="text-left">
                <div className="font-bold text-white text-[11px] leading-none">{staff.name}</div>
                <div className="text-[9px] font-extrabold uppercase text-sky-400 mt-0.5 tracking-wider">
                  {staff.role.replace('_', ' ')} • {staff.activeShift || 'Morning'}
                </div>
              </div>
            </div>

            <button
              type="button"
              id="store-logout-btn"
              onClick={logoutStaff}
              title="Logout from Store Portal"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600/30 border border-rose-500/20 text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>

            <Link
              href="/admin/login"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700 transition-colors text-xs"
            >
              Admin HQ ➔
            </Link>
          </div>

        </div>
      </header>

      {/* Primary Store Division Switcher: Online Orders vs Walk-in Orders */}
      <div className="bg-slate-850 border-b border-slate-800 px-4 sm:px-6 py-2 sticky top-[57px] z-30 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex overflow-x-auto gap-2 scrollbar-none py-1">
          <button
            type="button"
            onClick={() => setActiveSection('online_pipeline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
              activeSection === 'online_pipeline'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Online Orders Pipeline ({onlineOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('walkin_orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
              activeSection === 'walkin_orders'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Walk-in Counter Orders ({walkinOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('kanban_floor')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
              activeSection === 'kanban_floor'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Floor Processing Racks (Stages 1-6)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('cash_close')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
              activeSection === 'cash_close'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>Day-End Cash & UPI Close</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">

        {/* ============================================================ */}
        {/* SECTION 1: ONLINE ORDERS PIPELINE (14-STAGE STORE OPERATOR) */}
        {/* ============================================================ */}
        {activeSection === 'online_pipeline' && (
          <div className="space-y-6">
            
            {/* Pipeline Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/60 border border-slate-700/60 rounded-3xl p-5">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  Online Pickup & Doorstep Delivery Pipeline
                </span>
                <h2 className="text-xl font-black text-white mt-1">Online Orders Control Desk</h2>
                <p className="text-xs text-slate-400">
                  Follow customer bookings through the full 14-stage workflow from pickup scheduling to doorstep delivery.
                </p>
              </div>

              {/* Search Bar */}
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search invoice, customer, phone..."
                    value={onlineSearch}
                    onChange={(e) => setOnlineSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* Active Disputes Alert Banner */}
            {onlineOrders.some((o) => normalizeStatus(o.status, o.subStage) === 'disputed') && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-lg shadow-amber-950/20">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Dispute Alert:</strong> {onlineOrders.filter((o) => normalizeStatus(o.status, o.subStage) === 'disputed').length} order(s) have active customer disputes awaiting Store Manager review and settlement.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOnlineMilestoneFilter('disputed')}
                  className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold border border-amber-500/40 text-[11px] shrink-0 transition-colors"
                >
                  View Disputes ➔
                </button>
              </div>
            )}

            {/* Visual 14-Stage Interactive Milestone Stepper Filter */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 px-1">
                <span>Filter by Pipeline Stage:</span>
                <button
                  type="button"
                  onClick={() => setOnlineMilestoneFilter('all')}
                  className={`text-xs ${onlineMilestoneFilter === 'all' ? 'text-sky-400 underline font-bold' : 'hover:text-white'}`}
                >
                  View All Stages ({onlineOrders.length})
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {operatorMilestones.map((m) => {
                  const count = onlineOrders.filter((o) => normalizeStatus(o.status, o.subStage) === m.key).length;
                  const isSelected = onlineMilestoneFilter === m.key;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setOnlineMilestoneFilter(isSelected ? 'all' : m.key)}
                      className={`p-2.5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-sky-600/30 border-sky-400 text-white shadow-md shadow-sky-500/20'
                          : count > 0
                          ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-slate-500'
                          : 'bg-slate-900/60 border-slate-800/80 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          {m.stageNumber ? `Stage ${m.stageNumber}` : m.group}
                        </span>
                        <span className={`text-xs font-black px-1.5 py-0.2 rounded-full ${count > 0 ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>
                          {count}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-white truncate mt-1">
                        {m.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Operational Layout: Left Calendar Panel + Right Pipeline Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT SIDE PANEL: Store One-Month Calendar Side Panel */}
              <div className="lg:col-span-4 xl:col-span-3.5 space-y-4">
                <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xl text-slate-900 select-none">
                  
                  {/* Calendar Header matching user reference image: Bold Red Month, Bold Blue Year */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-2xl font-black tracking-tight text-[#DE483A] uppercase font-sans">
                        {['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'][calendarMonth]}
                      </span>
                      <span className="text-2xl font-black tracking-tight text-[#2563EB] font-sans">
                        {calendarYear}
                      </span>
                    </div>

                    {/* 1-Year Month Toggle Navigation */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title="Previous Month"
                        onClick={handlePrevMonth}
                        disabled={!canGoPrev}
                        className="w-8 h-8 rounded-full hover:bg-slate-100 disabled:opacity-30 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                      </button>
                      <button
                        type="button"
                        title="Next Month"
                        onClick={handleNextMonth}
                        disabled={!canGoNext}
                        className="w-8 h-8 rounded-full hover:bg-slate-100 disabled:opacity-30 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>

                  {/* Days of Week Header Row: SU MO TU WE TH FR SA */}
                  <div className="grid grid-cols-7 text-center pt-3 pb-2 text-xs font-black tracking-wider">
                    <div className="text-[#DE483A]">SU</div>
                    <div className="text-slate-700">MO</div>
                    <div className="text-slate-700">TU</div>
                    <div className="text-slate-700">WE</div>
                    <div className="text-slate-700">TH</div>
                    <div className="text-slate-700">FR</div>
                    <div className="text-slate-700">SA</div>
                  </div>

                  {/* Calendar Dates Grid */}
                  <div className="grid grid-cols-7 gap-y-1 text-center text-sm font-bold">
                    {/* Empty padding blocks */}
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                      <div key={'empty-' + i} className="h-8 w-8" />
                    ))}

                    {/* Active Month Days */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const isSunday = (firstDayOfWeek + i) % 7 === 0;
                      const monthStr = String(calendarMonth + 1).padStart(2, '0');
                      const dayStr = String(day).padStart(2, '0');
                      const fullDateKey = calendarYear + '-' + monthStr + '-' + dayStr;
                      const orderCount = ordersBookedByDate[fullDateKey] || 0;
                      const isSelected = selectedBookingDate === fullDateKey;

                      return (
                        <button
                          key={'day-' + day}
                          type="button"
                          onClick={() => handleDateClick(day)}
                          title={orderCount > 0 ? (orderCount + ' customer booking(s) on ' + fullDateKey) : ('No bookings on ' + fullDateKey)}
                          className={'h-8 w-8 mx-auto rounded-xl flex flex-col items-center justify-center relative transition-all cursor-pointer ' + (
                            isSelected
                              ? 'bg-[#2563EB] text-white shadow-md font-black scale-105 ring-2 ring-sky-400'
                              : orderCount > 0
                              ? 'bg-sky-50 hover:bg-sky-100 border border-sky-300 font-extrabold'
                              : 'hover:bg-slate-100'
                          )}
                        >
                          <span className={'text-xs ' + (
                            isSelected
                              ? 'text-white font-black'
                              : isSunday
                              ? 'text-[#DE483A]'
                              : 'text-slate-800'
                          )}>
                            {day}
                          </span>
                          
                          {/* Booking indicator dot */}
                          {orderCount > 0 && !isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] absolute bottom-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Calendar Legend & Filter Status */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                        <span>Dates with bookings</span>
                      </span>
                      <span className="font-bold text-slate-700">
                        {Object.keys(ordersBookedByDate).filter(d => d.startsWith(calendarYear + '-' + String(calendarMonth + 1).padStart(2, '0'))).length} booking days
                      </span>
                    </div>

                    {selectedBookingDate ? (
                      <div className="p-2.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 flex items-center justify-between">
                        <div>
                          <span className="font-bold block text-xs">Filtered: {selectedBookingDate}</span>
                          <span className="text-[10px] text-sky-700">
                            Showing orders in 'Order Receive Queue'
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedBookingDate(null)}
                          className="px-2 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] cursor-pointer"
                        >
                          Clear Filter
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 text-center italic">
                        Click any highlighted date to filter bookings for that day.
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          setCalendarYear(now.getFullYear());
                          setCalendarMonth(now.getMonth());
                        }}
                        className="text-[11px] text-[#2563EB] hover:underline font-bold cursor-pointer"
                      >
                        ➔ Current Month
                      </button>
                      {selectedBookingDate && (
                        <button
                          type="button"
                          onClick={() => setSelectedBookingDate(null)}
                          className="text-[11px] text-rose-600 hover:underline font-bold cursor-pointer"
                        >
                          Show All Dates
                        </button>
                      )}
                    </div>
                  </div>

                </div>

                {/* Quick Summary Widget */}
                <div className="rounded-3xl bg-slate-800/80 border border-slate-700/80 p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300">Queue Quick Summary</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">Live Hub</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-center">
                    <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-750">
                      <div className="text-[10px] text-slate-400 font-sans uppercase">Total Online</div>
                      <div className="text-lg font-black text-white">{onlineOrders.length}</div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-750">
                      <div className="text-[10px] text-slate-400 font-sans uppercase">In Receive Queue</div>
                      <div className="text-lg font-black text-sky-400">
                        {onlineOrders.filter(o => normalizeStatus(o.status, o.subStage) === 'order_received').length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT MAIN PANEL: Online Orders Cards List */}
              <div className="lg:col-span-8 xl:col-span-8.5 space-y-3">
              {lastAssignedRiderOrder && (
                <div className="p-4 rounded-3xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-sky-900/20 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>
                      ✓ Order <strong>#{lastAssignedRiderOrder.invoiceNo}</strong> assigned to <strong>{lastAssignedRiderOrder.riderName}</strong> for <strong>{lastAssignedRiderOrder.slot} Slot</strong>! Active in &quot;Pickup Assigned&quot; queue.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOnlineMilestoneFilter('pickup_assigned')}
                      className="px-3 py-1 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-bold border border-sky-500/40 text-xs transition-colors cursor-pointer"
                    >
                      View in Pickup Assigned Queue ➔
                    </button>
                    <button
                      type="button"
                      onClick={() => setLastAssignedRiderOrder(null)}
                      className="text-xs text-sky-400 hover:text-white underline ml-2 shrink-0 cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {filteredOnlineOrders.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-slate-800/40 border border-slate-800 text-slate-400 space-y-3">
                  <Package className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="font-bold text-sm text-slate-300">No online orders found in this stage.</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Switch stages above or select &quot;View All Stages&quot;. Incoming doorstep pickup orders placed by customers through the Customer Booking Portal will automatically appear here.
                  </p>
                </div>
              ) : (
                filteredOnlineOrders.map((ord) => {
                  const normStatus = normalizeStatus(ord.status, ord.subStage);
                  const isAuth = isAuthorizedForStage(ord.status, ord.subStage);
                  return (
                    <div
                      key={ord.id}
                      className="rounded-3xl bg-slate-800/90 border border-slate-700/80 p-5 hover:border-slate-600 transition-all space-y-4"
                    >
                      {/* Order Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-base font-black text-sky-400">#{ord.invoiceNo}</span>
                          <span className="font-bold text-white">{ord.customerName}</span>
                          <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-sky-400" />
                            {ord.customerPhone}
                          </span>
                        </div>

                        {/* Current Stage Badge & Stage Timestamp */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] text-slate-300 font-mono flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-700/70">
                            <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            <span>Stage Time: <strong className="text-white font-bold">{formatDateTime(ord.lastStageUpdatedAt || ord.stageTimestamps?.[normStatus] || ord.orderDate)}</strong></span>
                          </span>
                          <span className="text-xs font-extrabold uppercase px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            ● {normStatus.replace(/_/g, ' ')}
                          </span>
                          <span className="font-mono font-bold text-white text-sm">
                            {formatCurrency(ord.grandTotal, settings.currency)}
                          </span>
                        </div>
                      </div>

                      {/* Pickup & Slot Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                          <span className="text-slate-500 block mb-0.5">Pickup Slot & Address</span>
                          <div className="font-bold text-slate-200">
                            {ord.pickupSlot?.window || 'Morning Slot'} • {ord.pickupSlot?.date || ord.orderDate}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {ord.pickupAddress ? `${ord.pickupAddress.flatNo}, ${ord.pickupAddress.society}, ${ord.pickupAddress.city}` : 'Doorstep Pickup'}
                          </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                          <span className="text-slate-500 block mb-0.5">Assigned Rider & Handover</span>
                          <div className="font-bold text-slate-200">
                            {ord.pickupBy || ord.riderHandover?.riderName || 'Rider Not Yet Assigned'}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Bag Weight: {ord.riderHandover?.riderWeightKg ? `${ord.riderHandover.riderWeightKg} kg` : (ord.recordedWeightKg ? `${ord.recordedWeightKg} kg` : 'Pending weigh-in')}
                          </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                          <span className="text-slate-500 block mb-0.5">Delivery Security PIN & Payment</span>
                          <div className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="tracking-widest font-mono">PIN: ● ● ● ●</span>
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">Customer Only</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Rider must ask customer for secret PIN at doorstep
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 capitalize">
                            Method: {ord.paymentMethod.replace(/_/g, ' ')} • <span className={ord.paymentStatus === 'paid' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{ord.paymentStatus}</span>
                          </div>
                        </div>
                      </div>

                      {/* Garment Items Summary */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center gap-2">
                            <span className="font-bold text-slate-200">{it.quantity}x {it.clothName}</span>
                            <span className="text-[10px] text-slate-400">({it.serviceName})</span>
                            {it.tagBarcode && <span className="text-[9px] font-mono font-bold text-sky-400">{it.tagBarcode}</span>}
                          </div>
                        ))}
                      </div>

                      {/* Rider Pickup Photo Evidence (Visible to Customer, Rider, Store Operator, Manager) */}
                      {ord.riderHandover?.riderPhotoEvidence && (
                        <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-600 bg-slate-950 shrink-0">
                              <img
                                src={ord.riderHandover.riderPhotoEvidence}
                                alt="Rider Pickup Evidence"
                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => window.open(ord.riderHandover?.riderPhotoEvidence, '_blank')}
                              />
                            </div>
                            <div>
                              <span className="font-bold text-white flex items-center gap-1.5">
                                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Rider Doorstep Intake Photo Evidence</span>
                              </span>
                              <span className="text-[11px] text-slate-400 block mt-0.5">
                                Verified by {ord.riderHandover.riderName || 'Rider'} • {ord.riderHandover.riderWeightKg || ord.recordedWeightKg || 3} kg scale intake, {ord.riderHandover.bagCount || ord.totalQty} garments
                              </span>
                            </div>
                          </div>
                          <a
                            href={ord.riderHandover.riderPhotoEvidence}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-sky-400 hover:text-sky-300 underline shrink-0"
                          >
                            View Evidence ➔
                          </a>
                        </div>
                      )}

                      {/* Dispute Details Banner if active */}
                      {ord.dispute && (
                        <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-amber-300 uppercase text-[10px] flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              <span>Customer Dispute: {ord.dispute.issueType.replace(/_/g, ' ')} ({ord.dispute.status})</span>
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">{formatDateTime(ord.dispute.raisedAt)}</span>
                          </div>
                          <p className="text-slate-200 italic">&quot;{ord.dispute.description}&quot;</p>
                          {ord.dispute.resolutionNotes && (
                            <div className="pt-1 border-t border-amber-500/20 text-emerald-300 font-medium">
                              Resolution: {ord.dispute.resolutionNotes} {ord.dispute.refundAmount ? `(Refund: ₹${ord.dispute.refundAmount})` : ''}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Interactive Stage Driver Buttons with RBAC Role Enforcement */}
                      <div className="pt-2 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Next Action:</span>
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            isAuth
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          }`}>
                            {isAuth ? '✓ Authorized for your role' : '[Restricted] Role Restricted'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setViewTimelineOrder(ord)}
                            className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-colors ml-1"
                          >
                            <History className="w-3.5 h-3.5" />
                            <span>Time Audit ({ord.stageHistory?.length || 1})</span>
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* Cancel Option for orders till pickup stage (Available to Store Operator & Manager) */}
                          {['order_received', 'pickup_assigned', 'out_for_pickup'].includes(normStatus) && (currentRole === 'store_manager' || currentRole === 'store_operator') && (
                            <button
                              type="button"
                              onClick={() => handleCancelOnlineOrder(ord.id, ord.invoiceNo)}
                              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/30 flex items-center gap-1 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancel Order</span>
                            </button>
                          )}

                          {/* STAGE 1: ORDER RECEIVE QUEUE (Store Operator & Manager) */}
                          {(normStatus === 'order_received' || normStatus === 'booked' || normStatus === 'pending') && (
                            (currentRole === 'store_manager' || currentRole === 'store_operator') ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  id={`quick-assign-btn-${ord.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const defaultRider = availableRiders[0]?.name || 'Mahesh Rider';
                                    const defaultPhone = availableRiders[0]?.phone || '+91 98765 43216';
                                    const defaultSlot = ord.pickupSlot?.window?.includes('Evening') ? 'Evening' : 'Morning';
                                    assignPickupRider(ord.id, defaultRider, defaultPhone, defaultSlot);
                                    advanceOnlinePipeline(ord.id, 'pickup_assigned');
                                  }}
                                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-sky-600/25 flex items-center gap-1.5 transition-all cursor-pointer"
                                  title="1-Click: Automatically assign default rider and advance"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  <span>Move to Pickup Assigned (1-Click)</span>
                                </button>
                                <button
                                  type="button"
                                  id={`assign-rider-btn-${ord.id}`}
                                  onClick={() => {
                                    setAssignModalOrder(ord);
                                    const currentRider = ord.pickupBy || ord.riderHandover?.riderName;
                                    if (currentRider) {
                                      setSelectedRiderName(currentRider);
                                      const matched = availableRiders.find(r => r.name === currentRider);
                                      if (matched) setSelectedRiderPhone(matched.phone);
                                    } else {
                                      setSelectedRiderName(availableRiders[0]?.name || 'Mahesh Rider');
                                      setSelectedRiderPhone(availableRiders[0]?.phone || '+91 98765 43216');
                                    }
                                    setSelectedSlotWindow(ord.pickupSlot?.window?.includes('Evening') ? 'Evening' : 'Morning');
                                  }}
                                  className="px-3 py-2 rounded-xl bg-slate-750 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-slate-650 cursor-pointer"
                                >
                                  <span>Customize Rider</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                                [Restricted] Requires Store Operator or Manager
                              </span>
                            )
                          )}

                          {/* STAGE 2: PICKUP ASSIGNED (Store Operator & Manager) */}
                          {normStatus === 'pickup_assigned' && (
                            <div className="flex flex-wrap items-center gap-2">
                              {(currentRole === 'store_manager' || currentRole === 'store_operator') && (
                                <button
                                  type="button"
                                  id={`reassign-rider-btn-${ord.id}`}
                                  onClick={() => {
                                    setAssignModalOrder(ord);
                                    const currentRider = ord.pickupBy || ord.riderHandover?.riderName;
                                    if (currentRider) {
                                      setSelectedRiderName(currentRider);
                                      const matched = availableRiders.find(r => r.name === currentRider);
                                      if (matched) setSelectedRiderPhone(matched.phone);
                                    } else {
                                      setSelectedRiderName(availableRiders[0]?.name || 'Mahesh Rider');
                                      setSelectedRiderPhone(availableRiders[0]?.phone || '+91 98765 43216');
                                    }
                                    setSelectedSlotWindow(ord.pickupSlot?.window?.includes('Evening') ? 'Evening' : 'Morning');
                                  }}
                                  className="px-3.5 py-2 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-600 transition-colors"
                                >
                                  <Truck className="w-3.5 h-3.5 text-sky-400" />
                                  <span>{ord.pickupBy || ord.riderHandover?.riderName ? `Reassign (${ord.pickupBy || ord.riderHandover?.riderName})` : 'Assign Rider'}</span>
                                </button>
                              )}

                              {(currentRole === 'store_manager' || currentRole === 'store_operator') ? (
                                <button
                                  type="button"
                                  id={`dispatch-rider-btn-${ord.id}`}
                                  onClick={() => advanceOnlinePipeline(ord.id, 'out_for_pickup')}
                                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-600/20"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  <span>Move to Out for Pickup</span>
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                                  [Restricted] Requires Store Operator or Manager
                                </span>
                              )}
                            </div>
                          )}

                          {/* STAGE 3: OUT FOR PICKUP (Rider collects clothes, enters weight/pcs, uploads evidence) */}
                          {normStatus === 'out_for_pickup' && (
                            <div className="flex flex-wrap items-center gap-2">
                              {(currentRole === 'store_manager' || currentRole === 'store_operator') && (
                                <button
                                  type="button"
                                  id={`reassign-rider-btn-${ord.id}`}
                                  onClick={() => {
                                    setAssignModalOrder(ord);
                                    const currentRider = ord.pickupBy || ord.riderHandover?.riderName;
                                    if (currentRider) {
                                      setSelectedRiderName(currentRider);
                                      const matched = availableRiders.find(r => r.name === currentRider);
                                      if (matched) setSelectedRiderPhone(matched.phone);
                                    } else {
                                      setSelectedRiderName(availableRiders[0]?.name || 'Mahesh Rider');
                                      setSelectedRiderPhone(availableRiders[0]?.phone || '+91 98765 43216');
                                    }
                                    setSelectedSlotWindow(ord.pickupSlot?.window?.includes('Evening') ? 'Evening' : 'Morning');
                                  }}
                                  className="px-3 py-2 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-slate-600"
                                >
                                  <Truck className="w-3.5 h-3.5 text-sky-400" />
                                  <span>Reassign Rider</span>
                                </button>
                              )}

                              {(currentRole === 'store_manager' || currentRole === 'rider') ? (
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    id={`quick-pickup-btn-${ord.id}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      reconcileRiderPickup(ord.id, {
                                        riderWeightKg: ord.recordedWeightKg || 3.0,
                                        bagCount: ord.totalQty || 1,
                                        storeVerifiedWeightKg: ord.recordedWeightKg || 3.0,
                                        mismatchResolved: true,
                                      });
                                      advanceOnlinePipeline(ord.id, 'picked_up');
                                    }}
                                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-600/30 cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Mark Picked-Up (1-Click)</span>
                                  </button>
                                  <button
                                    type="button"
                                    id={`rider-collected-btn-${ord.id}`}
                                    onClick={() => {
                                      setWeightModalOrder(ord);
                                      setHandoverPieces(ord.totalQty.toString());
                                      setHandoverWeight((ord.recordedWeightKg || 3.0).toString());
                                      setHandoverPhoto(ord.riderHandover?.riderPhotoEvidence || '');
                                    }}
                                    className="px-3 py-2 rounded-xl bg-slate-750 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-slate-650 cursor-pointer"
                                  >
                                    <Scale className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Photo & Scale Weight</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                                  [Restricted] Requires Rider to collect & weigh clothes at customer doorstep
                                </span>
                              )}
                            </div>
                          )}

                          {/* STAGE 4: ORDER PICKED-UP (Rider moves to Reached Store) */}
                          {normStatus === 'picked_up' && (
                            currentRole === 'store_manager' || currentRole === 'rider' ? (
                              <button
                                type="button"
                                onClick={() => advanceOnlinePipeline(ord.id, 'reached_store')}
                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                              >
                                <Building2 className="w-3.5 h-3.5" />
                                <span>Rider Arrived (Move to Reached Store)</span>
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                                [Restricted] Requires Rider Delivery to Store
                              </span>
                            )
                          )}

                          {/* STAGE 5: REACHED STORE (Store Operator moves to Received) */}
                          {normStatus === 'reached_store' && (
                            currentRole === 'store_manager' || currentRole === 'store_operator' ? (
                              <button
                                type="button"
                                onClick={() => advanceOnlinePipeline(ord.id, 'received')}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Store Intake Scan (Move to 1. Received)</span>
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                                [Restricted] Requires Store Operator or Manager to Check-In to Floor
                              </span>
                            )
                          )}

                          {/* STAGES 1 TO 5 (WORKER / MANAGER FLOOR OPERATIONS) */}
                          {normStatus === 'received' && (
                            currentRole === 'store_manager' || currentRole === 'worker' ? (
                              <button
                                type="button"
                                onClick={() => advanceOnlinePipeline(ord.id, 'sorting')}
                                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5"
                              >
                                <Layers className="w-3.5 h-3.5" />
                                <span>Send to 2. Sorting</span>
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                                [Restricted] Requires Floor Worker or Manager
                              </span>
                            )
                          )}

                          {normStatus === 'sorting' && (
                            currentRole === 'store_manager' || currentRole === 'worker' ? (
                              <button
                                type="button"
                                onClick={() => advanceOnlinePipeline(ord.id, 'washing')}
                                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Load into 3. Washing</span>
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                                [Restricted] Requires Floor Worker or Manager
                              </span>
                            )
                          )}

                          {normStatus === 'washing' && (
                            currentRole === 'store_manager' || currentRole === 'worker' ? (
                              <button
                                type="button"
                                onClick={() => advanceOnlinePipeline(ord.id, 'drying')}
                                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5"
                              >
                                <Flame className="w-3.5 h-3.5" />
                                <span>Transfer to 4. Drying</span>
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                                [Restricted] Requires Floor Worker or Manager
                              </span>
                            )
                          )}

                          {normStatus === 'drying' && (
                            currentRole === 'store_manager' || currentRole === 'worker' ? (
                              <button
                                type="button"
                                onClick={() => advanceOnlinePipeline(ord.id, 'ironing')}
                                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5"
                              >
                                <Shirt className="w-3.5 h-3.5" />
                                <span>Move to 5. Ironing</span>
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                                [Restricted] Requires Floor Worker or Manager
                              </span>
                            )
                          )}

                          {normStatus === 'ironing' && (
                            currentRole === 'store_manager' || currentRole === 'worker' ? (
                              <button
                                type="button"
                                onClick={() => advanceOnlinePipeline(ord.id, 'qc_check_packed')}
                                className="px-4 py-2 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-xs flex items-center gap-1.5"
                              >
                                <CheckSquare className="w-3.5 h-3.5" />
                                <span>Submit for 6. QC Check & Packed Ready</span>
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                                [Restricted] Requires Floor Worker or Manager
                              </span>
                            )
                          )}

                          {/* STAGE 6: QC CHECK & PACKED READY (Worker checks & packs, Operator assigns Drop Rider) */}
                          {normStatus === 'qc_check_packed' && (
                            <div className="flex flex-wrap items-center gap-2">
                              {(currentRole === 'store_manager' || currentRole === 'worker') && (
                                <button
                                  type="button"
                                  onClick={() => advanceOnlinePipeline(ord.id, 'washing')}
                                  className="px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold text-xs border border-rose-500/30"
                                >
                                  Rework Wash
                                </button>
                              )}

                              {(currentRole === 'store_manager' || currentRole === 'store_operator') ? (
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    id={`quick-drop-btn-${ord.id}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      assignDropRider(ord.id, 'Mahesh Rider', '+91 98765 43216', 'Morning (07:00 AM - 10:00 AM)');
                                      advanceOnlinePipeline(ord.id, 'drop_assigned');
                                    }}
                                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 cursor-pointer"
                                  >
                                    <Truck className="w-3.5 h-3.5" />
                                    <span>Move to Drop Assigned (1-Click)</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDropModalOrder(ord);
                                      if (ord.dropRiderName) setDropRiderName(ord.dropRiderName);
                                      if (ord.dropSlotWindow) setDropSlotWindow(ord.dropSlotWindow);
                                    }}
                                    className="px-3 py-2 rounded-xl bg-slate-750 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-slate-650 cursor-pointer"
                                  >
                                    <span>Customize Drop Rider</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                                  [Restricted] Requires Store Operator or Manager to Assign Drop Rider
                                </span>
                              )}
                            </div>
                          )}

                          {/* STAGE: DROP ASSIGNED (Operator assigns/reassigns, Rider dispatches) */}
                          {normStatus === 'drop_assigned' && (
                            <div className="flex flex-wrap items-center gap-2">
                              {(currentRole === 'store_manager' || currentRole === 'store_operator') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDropModalOrder(ord);
                                    if (ord.dropRiderName) setDropRiderName(ord.dropRiderName);
                                    if (ord.dropSlotWindow) setDropSlotWindow(ord.dropSlotWindow);
                                  }}
                                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  <span>{ord.dropRiderName ? `Reassign Drop Rider (${ord.dropRiderName})` : 'Assign Drop Delivery Rider'}</span>
                                </button>
                              )}

                              {(currentRole === 'store_manager' || currentRole === 'rider') && (
                                <button
                                  type="button"
                                  onClick={() => advanceOnlinePipeline(ord.id, 'out_for_delivery')}
                                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  <span>Leave for Delivery Destination (Out for Delivery)</span>
                                </button>
                              )}

                              {currentRole === 'worker' && (
                                <span className="text-xs text-slate-400 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                                  [Restricted] Requires Store Operator (Assign Drop) or Rider (Dispatch)
                                </span>
                              )}
                            </div>
                          )}

                          {/* STAGE: OUT FOR DELIVERY (Rider collects UPI/Cash & verifies PIN) */}
                          {normStatus === 'out_for_delivery' && (
                            (currentRole === 'store_manager' || currentRole === 'rider') ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  id={`quick-deliver-btn-${ord.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    advanceOnlinePipeline(ord.id, 'delivered');
                                  }}
                                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Complete Delivery (1-Click)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setHandoverModalOrder(ord);
                                    setHandoverInputPin('');
                                    setHandoverError('');
                                    setHandoverSuccessMsg('');
                                    setHandoverPaymentMethod(ord.paymentMethod === 'cod_cash' ? 'cash' : 'upi');
                                    setHandoverUpiRef(`UPI/${Date.now().toString().slice(-8)}/RIDER`);
                                  }}
                                  className="px-3 py-2 rounded-xl bg-slate-750 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-slate-650 cursor-pointer"
                                >
                                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Verify PIN & Collect Payment</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                                [Restricted] Requires Delivery Rider (Payment & Delivery Handover)
                              </span>
                            )
                          )}

                          {/* STAGE: DELIVERED (Closed Stage - No processing here, report dispute option) */}
                          {normStatus === 'delivered' && (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/20 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Delivered (Closed Stage - Completed)</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setStoreDisputeModalOrder(ord);
                                  setStoreDisputeType('damage');
                                  setStoreDisputeDesc('');
                                }}
                                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center gap-1 transition-colors"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                <span>Report Dispute</span>
                              </button>
                            </div>
                          )}

                          {/* STAGE: DISPUTED (Store Manager can clear disputes) */}
                          {normStatus === 'disputed' && (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-amber-400" />
                                <span>Active Dispute</span>
                              </span>

                              {currentRole === 'store_manager' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setClearDisputeOrder(ord);
                                    setDisputeResolutionNotes('');
                                    setDisputeAction('approved_refund');
                                    setDisputeRefundAmt((ord.grandTotal || 0).toString());
                                  }}
                                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold text-xs shadow-md shadow-amber-600/30 flex items-center gap-1.5"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Review & Clear Dispute (Manager)</span>
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                                  [Restricted] Store Manager resolution required to clear dispute
                                </span>
                              )}
                            </div>
                          )}

                          {/* CANCELLED */}
                          {normStatus === 'cancelled' && (
                            <span className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 font-bold text-xs border border-rose-500/20 flex items-center gap-1.5">
                              <XCircle className="w-4 h-4" />
                              <span>Cancelled {ord.cancellationReason ? `(${ord.cancellationReason})` : 'Before Pickup'}</span>
                            </span>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
</div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SECTION 2: WALK-IN COUNTER ORDERS                            */}
        {/* ============================================================ */}
        {activeSection === 'walkin_orders' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Quick Counter Intake Form */}
            <div className="lg:col-span-5 rounded-3xl bg-slate-800/90 border border-slate-700/80 p-5 sm:p-6 space-y-5">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Walk-in Floor POS
                </span>
                <h3 className="text-lg font-black text-white mt-1">Counter Intake & Instant Tagging</h3>
                <p className="text-xs text-slate-400">
                  Receive drop-off garments from walking customers, select starch & fold style, and generate instant barcode tags.
                </p>
              </div>

              {/* Customer Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Customer Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Deepak Chawla"
                    value={walkinName}
                    onChange={(e) => setWalkinName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">10-Digit Mobile (+91)</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9845099887"
                    value={walkinPhone}
                    onChange={(e) => setWalkinPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Garment Selector */}
              <div className="pt-3 border-t border-slate-700/80 space-y-3">
                <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Add Garment Piece
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Garment Type</label>
                    <select
                      value={intakeClothId}
                      onChange={(e) => setIntakeClothId(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    >
                      {clothTypes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Service</label>
                    <select
                      value={intakeServiceId}
                      onChange={(e) => setIntakeServiceId(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Starch Level</label>
                    <select
                      value={intakeStarch}
                      onChange={(e) => setIntakeStarch(e.target.value as any)}
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    >
                      <option value="none">None</option>
                      <option value="light">Light</option>
                      <option value="medium">Medium</option>
                      <option value="heavy">Heavy Starch</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Fold Style</label>
                    <select
                      value={intakeFold}
                      onChange={(e) => setIntakeFold(e.target.value as any)}
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    >
                      <option value="hanger">Hanger</option>
                      <option value="flat_fold">Flat Fold</option>
                      <option value="roll_fold">Roll Fold</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={intakeQty}
                      onChange={(e) => setIntakeQty(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white text-center font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Stain / Collar Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Tea stain on pocket, loose button"
                    value={intakeStain}
                    onChange={(e) => setIntakeStain(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddWalkinItem}
                  className="w-full py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Piece to Counter Ticket</span>
                </button>
              </div>

              {/* Added Garments List */}
              {intakeItems.length > 0 && (
                <div className="pt-3 border-t border-slate-700/80 space-y-2">
                  <span className="block text-xs font-bold text-slate-300">Ticket Items ({intakeItems.length}):</span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {intakeItems.map((it, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-750 flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold text-white">{it.quantity}x {it.clothName}</div>
                          <div className="text-[10px] text-slate-400">{it.serviceName} • {it.starchLevel} starch • {it.foldStyle}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-white">₹{it.total}</div>
                          <div className="text-[9px] font-mono text-sky-400">{it.tagBarcode}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-between items-baseline font-bold text-sm text-white">
                    <span>Subtotal + 18% GST:</span>
                    <span className="text-sky-400 font-mono text-base">
                      ₹{(intakeItems.reduce((s, it) => s + it.total, 0) * 1.18).toFixed(2)}
                    </span>
                  </div>

                  {/* Integrated POS Payment Option Selector */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Select Payment Method:</span>
                      <button
                        type="button"
                        onClick={() => setShowPosConfigModal(true)}
                        className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1"
                      >
                        <Settings2 className="w-3 h-3" />
                        <span>EDC Config</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setWalkinPayment('upi_qr')}
                        className={`py-2 px-1 rounded-xl font-bold text-[11px] border flex flex-col items-center justify-center gap-1 transition-all ${
                          walkinPayment === 'upi_qr'
                            ? 'bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-600/30'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Dynamic UPI</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setWalkinPayment('pos_machine')}
                        className={`py-2 px-1 rounded-xl font-bold text-[11px] border flex flex-col items-center justify-center gap-1 transition-all ${
                          walkinPayment === 'pos_machine'
                            ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>POS Machine</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setWalkinPayment('bycash')}
                        className={`py-2 px-1 rounded-xl font-bold text-[11px] border flex flex-col items-center justify-center gap-1 transition-all ${
                          walkinPayment === 'bycash'
                            ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        <span>Cash Desk</span>
                      </button>
                    </div>

                    {/* 1. Dynamic UPI at Store */}
                    {walkinPayment === 'upi_qr' && (
                      <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-center">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 text-[10px]">Store Counter UPI:</span>
                          <span className="font-mono text-sky-400 text-[11px] font-bold">
                            {settings.storeUpiId || settings.upiId || 'dhobighat.store@icici'}
                          </span>
                        </div>

                        <div className="w-24 h-24 bg-white p-1.5 rounded-xl mx-auto flex flex-col items-center justify-center shadow-md">
                          <QrCode className="w-16 h-16 text-slate-900" />
                          <span className="font-mono text-[8px] font-black text-slate-900">
                            ₹{(intakeItems.reduce((s, it) => s + it.total, 0) * 1.18).toFixed(0)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => triggerSoundboxAlert(intakeItems.reduce((s, it) => s + it.total, 0) * 1.18)}
                          className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 border transition-all ${
                            soundboxAlertPlaying
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          }`}
                        >
                          <Volume2 className="w-3 h-3 text-amber-400" />
                          <span>
                            {soundboxAlertPlaying
                              ? `Soundbox: "₹${(intakeItems.reduce((s, it) => s + it.total, 0) * 1.18).toFixed(0)} received on UPI!"`
                              : 'Simulate Soundbox Audio Receipt'}
                          </span>
                        </button>
                      </div>
                    )}

                    {/* 2. POS Machine (EDC Card swipe / tap) */}
                    {walkinPayment === 'pos_machine' && (
                      <div className="p-3 rounded-2xl bg-slate-900 border border-purple-500/30 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-purple-300 font-bold flex items-center gap-1 text-[11px]">
                            <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                            <span>{settings.posMachineConfig?.provider === 'pine_labs' ? 'Pine Labs Plutus A920' : (settings.posMachineConfig?.provider || 'Paytm POS')}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {settings.posMachineConfig?.ipAddress || 'WiFi Connected'}
                          </span>
                        </div>

                        {posAuthResult ? (
                          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Card Transaction Approved!</span>
                            </div>
                            <div className="font-mono text-[10px] text-slate-300">
                              Auth: {posAuthResult.authCode} • RRN: {posAuthResult.rrn} • {posAuthResult.cardBrand} (**** {posAuthResult.cardLast4})
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={posCharging}
                            onClick={() => triggerPosCharge(intakeItems.reduce((s, it) => s + it.total, 0) * 1.18)}
                            className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-600/30 transition-all"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>
                              {posCharging
                                ? 'Waiting for Card Tap / PIN on POS Machine...'
                                : `Send ₹${(intakeItems.reduce((s, it) => s + it.total, 0) * 1.18).toFixed(2)} to EDC POS Terminal`}
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {canPerformWalkinIntake ? (
                    <button
                      type="button"
                      onClick={handleCreateWalkinOrder}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Tags & Check-In Walk-in Order</span>
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs text-center font-bold">
                      [Restricted] Walk-in Counter POS is restricted to Store Operator & Store Manager.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Active Walk-in Orders Moving through Stages */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex justify-between items-center bg-slate-800/60 p-4 rounded-3xl border border-slate-700/60">
                <div>
                  <h3 className="font-bold text-white text-base">Active Walk-in Orders ({walkinOrders.length})</h3>
                  <p className="text-xs text-slate-400">Direct counter drop-offs awaiting processing or counter pickup.</p>
                </div>
              </div>

              {lastCreatedWalkin && (
                <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold block">Walk-in Order #{lastCreatedWalkin.invoiceNo} Registered!</span>
                    <button type="button" onClick={() => handlePrintReceipt(lastCreatedWalkin)} className="mt-2 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer no-print"><Printer className="w-3.5 h-3.5" /><span>Print Thermal Receipt</span></button>
                    <span>Printed tags for {lastCreatedWalkin.totalQty} garments. Moved to Received queue.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLastCreatedWalkin(null)}
                    className="underline text-[11px]"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {walkinOrders.map((ord) => (
                  <div key={ord.id} className="rounded-3xl bg-slate-800 border border-slate-700 p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-indigo-400">#{ord.invoiceNo}</span>
                          <span className="font-bold text-white">{ord.customerName}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">Walk-in</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                          <span>Phone: {ord.customerPhone}</span>
                          <span className="flex items-center gap-1 text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-750">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Stage Time: {formatDateTime(ord.lastStageUpdatedAt || ord.stageTimestamps?.[ord.status] || ord.orderDate)}</span>
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-white">{formatCurrency(ord.grandTotal, settings.currency)}</div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                          {ord.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Garments in Walk-in */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-750 text-slate-300">
                          {it.quantity}x {it.clothName} ({it.serviceName}) • <span className="text-sky-400 font-mono">{it.tagBarcode}</span>
                        </div>
                      ))}
                    </div>

                    {/* Advance Walk-in Order Stage */}
                    <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Store Stage:</span>
                        <button
                          type="button"
                          onClick={() => setViewTimelineOrder(ord)}
                          className="px-2.5 py-1 rounded-xl bg-slate-750 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 border border-slate-650 transition-colors"
                        >
                          <History className="w-3 h-3 text-indigo-400" />
                          <span>Audit Trail ({ord.stageHistory?.length || 1})</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        {ord.status === 'received' && (
                          <button
                            type="button"
                            onClick={() => advanceOnlinePipeline(ord.id, 'sorting')}
                            className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold"
                          >
                            Advance to Sorting
                          </button>
                        )}
                        {ord.status === 'sorting' && (
                          <button
                            type="button"
                            onClick={() => advanceOnlinePipeline(ord.id, 'washing')}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                          >
                            Advance to Washing
                          </button>
                        )}
                        {ord.status === 'washing' && (
                          <button
                            type="button"
                            onClick={() => advanceOnlinePipeline(ord.id, 'drying')}
                            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
                          >
                            Advance to Drying
                          </button>
                        )}
                        {ord.status === 'drying' && (
                          <button
                            type="button"
                            onClick={() => advanceOnlinePipeline(ord.id, 'ironing')}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                          >
                            Advance to Ironing
                          </button>
                        )}
                        {ord.status === 'ironing' && (
                          <button
                            type="button"
                            onClick={() => advanceOnlinePipeline(ord.id, 'qc_check_packed')}
                            className="px-3 py-1.5 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white font-bold"
                          >
                            Advance to 6. QC Check & Packed Ready
                          </button>
                        )}
                        {(ord.status === 'qc_check_packed' || ord.status === 'qc_check' || ord.status === 'packed_ready') && (
                          <button
                            type="button"
                            onClick={() => advanceOnlinePipeline(ord.id, 'delivered')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                          >
                            Pass QC ➔ Customer Picked Up (Delivered)
                          </button>
                        )}
                        {ord.status === 'delivered' && (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>✓ Counter Pick-Up Completed</span>
                          </span>
                        )}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ============================================================ */}
        {/* SECTION 3: KANBAN FLOOR PROCESSING RACKS (STAGES 1 TO 6)     */}
        {/* ============================================================ */}
        {activeSection === 'kanban_floor' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-800/60 p-4 rounded-3xl border border-slate-700/60">
              <div>
                <h3 className="font-bold text-white text-base">Floor Processing Kanban (Stages 1 to 6)</h3>
                <p className="text-xs text-slate-400">All live garments currently undergoing washing, drying, steam pressing, and quality inspection.</p>
              </div>
              <span className="text-xs font-bold text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30">
                Floor Worker Console
              </span>
            </div>

            {/* 6 Columns for the 6 Floor Stages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { stage: 'received', title: '1. Received', color: 'border-slate-500' },
                { stage: 'sorting', title: '2. Sorting', color: 'border-sky-500' },
                { stage: 'washing', title: '3. Washing', color: 'border-blue-500' },
                { stage: 'drying', title: '4. Drying', color: 'border-amber-500' },
                { stage: 'ironing', title: '5. Ironing', color: 'border-purple-500' },
                { stage: 'qc_check_packed', title: '6. QC & Packed Ready', color: 'border-emerald-500' },
              ].map((col) => {
                const stageOrders = orders.filter((o) => normalizeStatus(o.status) === col.stage);
                return (
                  <div key={col.stage} className={`rounded-2xl bg-slate-800/60 border ${col.color} p-3 space-y-2.5 min-h-[400px]`}>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                      <span className="font-black text-xs text-white">{col.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                        {stageOrders.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {stageOrders.map((ord) => {
                        const nextStageMap: Record<string, OrderStatus> = {
                          received: 'sorting',
                          sorting: 'washing',
                          washing: 'drying',
                          drying: 'ironing',
                          ironing: 'qc_check_packed',
                          qc_check_packed: ord.orderChannel === 'walk_in' ? 'delivered' : 'drop_assigned',
                        };
                        const nextStage = nextStageMap[col.stage];

                        return (
                          <div key={ord.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs space-y-1.5">
                            <div className="flex justify-between font-bold">
                              <span className="text-sky-400 font-mono">#{ord.invoiceNo}</span>
                              <span className="text-[10px] text-slate-400 capitalize">{ord.orderChannel || 'online'}</span>
                            </div>
                            <div className="text-slate-300 font-medium truncate">{ord.customerName}</div>
                            <div className="flex justify-between items-center text-[10px] text-slate-400">
                              <span>{ord.totalQty} pieces</span>
                              <span className="font-mono text-emerald-400">₹{ord.grandTotal}</span>
                            </div>

                            {/* Stage entry time & audit trail link */}
                            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80 font-mono">
                              <span className="flex items-center gap-1 text-slate-400 truncate">
                                <Clock className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                                <span>{formatTimeShort(ord.lastStageUpdatedAt || ord.stageTimestamps?.[col.stage] || ord.orderDate)}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setViewTimelineOrder(ord)}
                                className="text-purple-400 hover:text-purple-300 font-bold shrink-0 ml-1"
                              >
                                Audit ➔
                              </button>
                            </div>

                            {canPerformKanbanFloor && nextStage && (
                              <button
                                type="button"
                                onClick={() => advanceOnlinePipeline(ord.id, nextStage)}
                                className="w-full mt-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-sky-600 text-[10px] font-bold text-sky-300 hover:text-white border border-slate-700 hover:border-sky-500 transition-colors flex items-center justify-center gap-1"
                              >
                                <span>Advance ➔</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SECTION 4: DAY-END CASH & UPI CLOSE                          */}
        {/* ============================================================ */}
        {activeSection === 'cash_close' && (
          <div className="max-w-2xl mx-auto rounded-3xl bg-slate-800/90 border border-slate-700 p-6 space-y-5">
            <div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Shift Financial Settlement
              </span>
              <h3 className="text-lg font-black text-white mt-1">Day-End Drawer & Digital Register Close</h3>
              <p className="text-xs text-slate-400">
                Verify physical cash in drawer against POS cash transactions and digital UPI settlements.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 block">System Cash Total</span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  {formatCurrency(
                    orders.filter((o) => o.paymentMethod === 'bycash' && o.paymentStatus === 'paid').reduce((s, o) => s + o.grandTotal, 0),
                    settings.currency
                  )}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 block">Digital UPI Settlements</span>
                <span className="text-xl font-black text-sky-400 font-mono">
                  {formatCurrency(
                    orders.filter((o) => (o.paymentMethod === 'upi_qr' || o.paymentMethod === 'upi_intent') && o.paymentStatus === 'paid').reduce((s, o) => s + o.grandTotal, 0),
                    settings.currency
                  )}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Physical Cash Counted in Drawer (₹)
              </label>
              <input
                type="number"
                placeholder="Enter exact cash counted in drawer..."
                value={actualCashTally}
                onChange={(e) => setActualCashTally(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {canPerformCashClose ? (
              <button
                type="button"
                onClick={() => {
                  alert(`Shift closed successfully by ${staff.name}! Cash tally recorded and digital audit trail synced.`);
                  setActualCashTally('');
                }}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30"
              >
                Sign & Lock Shift Financial Register
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs text-center font-bold">
                [Restricted] Shift Register closing is restricted to Store Operator & Store Manager.
              </div>
            )}
          </div>
        )}

      
      {/* Print-Only Thermal Invoice Receipt Container */}
      {printingOrder && (
        <div className="print-only hidden font-mono text-black bg-white p-6 max-w-[80mm] mx-auto text-xs leading-normal">
          <div className="text-center pb-3 border-b border-black">
            <div className="font-bold text-base tracking-tight">DHOBIGHAT LAUNDRY</div>
            <div className="text-[11px]">{staff?.storeName || 'Store Counter POS'}</div>
            <div className="text-[11px] font-bold mt-1">INVOICE #{printingOrder.invoiceNo}</div>
            <div className="text-[10px]">Date: {printingOrder.orderDate}</div>
          </div>
          <div className="py-2 border-b border-black text-[11px]">
            <div>Customer: {printingOrder.customerName}</div>
            <div>Mobile: {printingOrder.customerPhone}</div>
          </div>
          <table className="w-full my-3 text-left text-[11px] border-collapse">
            <thead>
              <tr className="border-b border-black">
                <th className="py-1">Garment</th>
                <th className="py-1 text-right">Qty</th>
                <th className="py-1 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {printingOrder.items?.map((it, idx) => (
                <tr key={idx} className="border-b border-gray-200">
                  <td className="py-1">{it.clothName} ({it.serviceName})</td>
                  <td className="py-1 text-right">{it.quantity}</td>
                  <td className="py-1 text-right">{formatCurrency(it.total, settings.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pt-2 border-t border-black text-right font-bold text-xs">
            <div>Grand Total: {formatCurrency(printingOrder.grandTotal, settings.currency)}</div>
            <div className="text-[10px] font-normal">Mode: {(printingOrder.paymentMethod || 'cash').toUpperCase()} ({(printingOrder.paymentStatus || 'pending').toUpperCase()})</div>
          </div>
          <div className="text-center pt-4 text-[10px] text-gray-700">
            Thank you for choosing DhobiGhat!
          </div>
        </div>
      )}

      </main>

      {/* MODAL 1: ASSIGN PICKUP RIDER */}
      {assignModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl bg-slate-800 border border-slate-700 p-6 space-y-5 shadow-2xl">
            <div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400">
                Logistics Dispatch
              </span>
              <h3 className="text-lg font-black text-white mt-1">Assign Pickup Rider</h3>
              <p className="text-xs text-slate-400">
                Assign rider for #{assignModalOrder.invoiceNo} ({assignModalOrder.customerName}).
              </p>
            </div>

            <form onSubmit={handleConfirmRiderAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Select Pickup Rider</label>
                <select
                  id="select-pickup-rider"
                  value={selectedRiderName}
                  onChange={(e) => {
                    const riderName = e.target.value;
                    setSelectedRiderName(riderName);
                    const matched = availableRiders.find(r => r.name === riderName);
                    if (matched) {
                      setSelectedRiderPhone(matched.phone);
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {availableRiders.map((r) => (
                    <option key={r.id || r.name} value={r.name}>
                      {r.name} ({r.phone}) • {r.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Pickup Slot Window</label>
                <select
                  id="select-pickup-slot"
                  value={selectedSlotWindow}
                  onChange={(e) => setSelectedSlotWindow(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Morning">Morning Slot (07:00 AM - 10:00 AM)</option>
                  <option value="Evening">Evening Slot (04:00 PM - 07:00 PM)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  id="cancel-rider-assignment-btn"
                  onClick={() => setAssignModalOrder(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-650 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="confirm-rider-assignment-btn"
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-md shadow-sky-600/30 transition-all hover:scale-[1.02]"
                >
                  Confirm Rider Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD PICKUP SCALE WEIGHT & PHOTO */}
      {weightModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl bg-slate-800 border border-slate-700 p-6 space-y-5 shadow-2xl">
            <div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                Doorstep Weigh-In
              </span>
              <h3 className="text-lg font-black text-white mt-1">Record Bag Weight & Pieces</h3>
              <p className="text-xs text-slate-400">
                Rider collected #{weightModalOrder.invoiceNo} from {weightModalOrder.customerName}.
              </p>
            </div>

            <form onSubmit={handleConfirmWeightHandover} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Scale Weight (Kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={handoverWeight}
                    onChange={(e) => setHandoverWeight(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-white text-center font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Verified Pieces</label>
                  <input
                    type="number"
                    value={handoverPieces}
                    onChange={(e) => setHandoverPieces(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-white text-center font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>Garment & Scale Photo Evidence:</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    Cloudflare R2 Storage
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    disabled={isUploadingR2Photo}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleR2PhotoUpload(file);
                      }
                    }}
                    className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-600 file:text-white hover:file:bg-sky-500 cursor-pointer disabled:opacity-50"
                  />
                  <button
                    type="button"
                    disabled={isUploadingR2Photo}
                    onClick={handleQuickR2Proof}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-bold shrink-0 disabled:opacity-50"
                  >
                    Quick R2 Proof
                  </button>
                </div>

                {/* Upload In-Progress State */}
                {isUploadingR2Photo && (
                  <div className="p-2.5 rounded-xl bg-sky-950/60 border border-sky-800/80 flex items-center gap-2 text-sky-300 text-xs">
                    <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>{r2UploadMessage || 'Uploading photo to Cloudflare R2 storage...'}</span>
                  </div>
                )}

                {/* Attached Photo Preview & Remote Reference */}
                {handoverPhoto && !isUploadingR2Photo && (
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/40 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-emerald-500/50 relative shrink-0 bg-slate-900">
                        <img src={handoverPhoto} alt="R2 Intake Evidence" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                          <span>✓ Evidence uploaded to Cloudflare R2 storage</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono break-all line-clamp-1" title={handoverPhoto}>
                          Ref: {handoverPhoto}
                        </div>
                        <a
                          href={handoverPhoto}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block text-[10px] text-sky-400 hover:text-sky-300 underline font-medium"
                        >
                          View Full Image in New Tab ↗
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWeightModalOrder(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30"
                >
                  Confirm & Mark Picked-Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ASSIGN DROP DELIVERY RIDER */}
      {dropModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl bg-slate-800 border border-slate-700 p-6 space-y-5 shadow-2xl">
            <div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                Doorstep Drop Dispatch
              </span>
              <h3 className="text-lg font-black text-white mt-1">Assign Drop Delivery Rider</h3>
              <p className="text-xs text-slate-400">
                Assign rider for drop delivery of #{dropModalOrder.invoiceNo} to {dropModalOrder.customerName}.
              </p>
            </div>

            <form onSubmit={handleConfirmDropAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Select Drop Rider</label>
                <select
                  value={dropRiderName}
                  onChange={(e) => {
                    setDropRiderName(e.target.value);
                    setDropRiderPhone(e.target.value === 'Mahesh Rider' ? '+91 91234 56789' : '+91 98450 11223');
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white"
                >
                  <option value="Mahesh Rider">Mahesh Rider (+91 91234 56789) - Express Delivery Van</option>
                  <option value="Anand Kumar">Anand Kumar (+91 98450 11223) - Route 4 Dispatch</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Drop Slot Window</label>
                <select
                  value={dropSlotWindow}
                  onChange={(e) => setDropSlotWindow(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white"
                >
                  <option value="Morning (07:00 AM - 10:00 AM)">Morning (07:00 AM - 10:00 AM)</option>
                  <option value="Morning (10:00 AM - 01:00 PM)">☀️ Morning (10:00 AM - 01:00 PM)</option>
                  <option value="Evening (04:00 PM - 07:00 PM)">Evening (04:00 PM - 07:00 PM)</option>
                  <option value="Evening (07:00 PM - 10:00 PM)">Evening (07:00 PM - 10:00 PM)</option>
                </select>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                <div className="text-slate-400">Delivery Address:</div>
                <div className="text-slate-200 font-bold">
                  {dropModalOrder.pickupAddress ? `${dropModalOrder.pickupAddress.flatNo}, ${dropModalOrder.pickupAddress.society}, ${dropModalOrder.pickupAddress.city}` : 'Customer Doorstep'}
                </div>
                <div className="text-amber-400 text-[11px] pt-1 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span>Security PIN: Confidential in Customer App (Rider will collect at doorstep)</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDropModalOrder(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-md shadow-purple-600/30"
                >
                  Confirm Drop Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stage Date & Time Tracking History / Audit Trail Modal */}
      {viewTimelineOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-850 border border-slate-700 max-w-lg w-full rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-700/80 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-black text-sky-400">#{viewTimelineOrder.invoiceNo}</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {viewTimelineOrder.orderChannel || 'online'}
                  </span>
                </div>
                <h3 className="text-base font-black text-white mt-1">Stage Date & Time Tracking Audit Log</h3>
                <p className="text-xs text-slate-400">
                  Customer: <span className="font-bold text-slate-200">{viewTimelineOrder.customerName}</span> ({viewTimelineOrder.customerPhone})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewTimelineOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {/* Current Status & Last Updated Banner */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Floor Status</span>
                <span className="font-extrabold text-sky-400 uppercase">
                  ● {viewTimelineOrder.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Last Transitioned</span>
                <span className="font-mono text-slate-200 font-bold">
                  {formatDateTime(viewTimelineOrder.lastStageUpdatedAt || viewTimelineOrder.orderDate)}
                </span>
              </div>
            </div>

            {/* Chronological Event History */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Full Transition Audit Trail ({viewTimelineOrder.stageHistory?.length || 1} Events)
              </h4>

              {viewTimelineOrder.stageHistory && viewTimelineOrder.stageHistory.length > 0 ? (
                <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700">
                  {viewTimelineOrder.stageHistory.map((item, idx) => (
                    <div key={idx} className="relative group">
                      <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full bg-sky-500 ring-4 ring-slate-800 border-2 border-slate-900" />
                      <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white">
                              {item.label || item.stage.replace(/_/g, ' ')}
                            </span>
                            {item.actorRole && (
                              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-sky-400">
                                {item.actorRole}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-mono font-bold text-sky-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(item.timestamp)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center justify-between gap-2">
                          <span>Operator: <strong className="text-slate-300">{item.actorName || 'Operations Staff'}</strong></span>
                          {item.notes && <span className="text-[11px] text-slate-400 italic truncate">{item.notes}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
                  <span>Initial order registered on: {formatDateTime(viewTimelineOrder.orderDate)}</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setViewTimelineOrder(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rider Doorstep Delivery & Handover PIN Verification Modal */}
      {handoverModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-850 border border-slate-700 max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-700/80 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                  Doorstep Delivery Handover
                </span>
                <h3 className="text-base font-black text-white mt-1">
                  Verify Handover • #{handoverModalOrder.invoiceNo}
                </h3>
                <p className="text-xs text-slate-400">
                  Customer: <span className="text-white font-bold">{handoverModalOrder.customerName}</span> ({handoverModalOrder.customerPhone})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHandoverModalOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {/* Address */}
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Delivery Address:</span>
              <span className="text-slate-200 font-bold block mt-0.5">
                {handoverModalOrder.pickupAddress ? `${handoverModalOrder.pickupAddress.flatNo}, ${handoverModalOrder.pickupAddress.society}, ${handoverModalOrder.pickupAddress.city}` : 'Customer Doorstep'}
              </span>
            </div>

            {/* Payment Settlement Check */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Bill Amount:</span>
                <span className="font-mono text-base font-black text-white">
                  {formatCurrency(handoverModalOrder.grandTotal, settings.currency)}
                </span>
              </div>

              {handoverModalOrder.paymentStatus === 'paid' ? (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Payment already settled via UPI online</span>
                </div>
              ) : (
                <div className="space-y-2 pt-1 border-t border-slate-800">
                  <div className="text-[11px] font-bold text-amber-400">
                    Payment Due upon Handover:
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setHandoverPaymentMethod('upi')}
                      className={`p-2 rounded-xl font-bold border flex items-center justify-center gap-1.5 transition-all ${
                        handoverPaymentMethod === 'upi'
                          ? 'bg-purple-600 text-white border-purple-400 shadow'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Dynamic UPI QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setHandoverPaymentMethod('cash')}
                      className={`p-2 rounded-xl font-bold border flex items-center justify-center gap-1.5 transition-all ${
                        handoverPaymentMethod === 'cash'
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>Cash Collected</span>
                    </button>
                  </div>

                  {handoverPaymentMethod === 'upi' && (
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-2">
                      <span className="text-[10px] text-slate-400 block">
                        Present Dynamic UPI QR to customer:
                      </span>
                      <div className="w-24 h-24 bg-white p-1.5 rounded-xl mx-auto flex flex-col items-center justify-center">
                        <QrCode className="w-16 h-16 text-slate-900" />
                        <span className="font-mono text-[8px] font-black text-slate-900">
                          ₹{handoverModalOrder.grandTotal.toFixed(0)}
                        </span>
                      </div>
                      <p className="text-[10px] text-sky-400 font-mono">
                        UPI: {settings.storeUpiId || settings.upiId || 'dhobighat.store@icici'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* UPI Provider Confirmation Callback (PIN Not Required) */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/70 to-indigo-950/70 border border-purple-500/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-purple-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>UPI Provider Confirmation</span>
                </span>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/40">
                  ⚡ PIN Not Required
                </span>
              </div>
              <p className="text-[11px] text-purple-200/90 leading-relaxed">
                If the customer paid via UPI (GPay, PhonePe, Paytm, or Dynamic QR), confirming provider status will automatically close this order to <strong className="text-emerald-300">Delivered</strong>. No PIN is required!
              </p>
              <button
                type="button"
                onClick={() => {
                  setHandoverError('');
                  setHandoverSuccessMsg('');
                  const res = confirmUpiProviderPayment(
                    handoverModalOrder.id,
                    handoverUpiRef || `UPI/NPCI/${Date.now().toString().slice(-8)}`,
                    'ICICI / NPCI Gateway'
                  );
                  if (res.success) {
                    setHandoverSuccessMsg(res.message);
                    setTimeout(() => {
                      setHandoverModalOrder(null);
                    }, 900);
                  } else {
                    setHandoverError(res.message);
                  }
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Confirm UPI Payment (Delivered • No PIN Required)</span>
              </button>
            </div>

            <div className="flex items-center gap-3 my-1 text-slate-500 text-[10px] font-bold">
              <div className="flex-1 h-px bg-slate-800" />
              <span>OR ENTER CUSTOMER PIN (CASH / MANUAL)</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* Secret Customer PIN Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setHandoverError('');
                setHandoverSuccessMsg('');
                const res = verifyAndCompleteDelivery(
                  handoverModalOrder.id,
                  handoverInputPin,
                  handoverModalOrder.paymentStatus === 'paid' ? undefined : (handoverPaymentMethod === 'cash' ? 'cod_cash' : 'cod_upi'),
                  handoverUpiRef,
                  staff?.name
                );

                if (res.success) {
                  setHandoverSuccessMsg(res.message);
                  setTimeout(() => {
                    setHandoverModalOrder(null);
                  }, 800);
                } else {
                  setHandoverError(res.message);
                }
              }}
              className="space-y-3 pt-1"
            >
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Enter 4-Digit Customer PIN *
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  Ask customer: <strong className="text-amber-400">&quot;Please provide the 4-digit Handover PIN from your DhobiGhat App&quot;</strong>
                </p>

                <input
                  type="text"
                  maxLength={4}
                  required
                  placeholder="● ● ● ●"
                  value={handoverInputPin}
                  onChange={(e) => setHandoverInputPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 border border-slate-700 text-center text-2xl font-mono font-black text-white tracking-widest focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  autoFocus
                />
              </div>

              {handoverError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{handoverError}</span>
                </div>
              )}

              {handoverSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{handoverSuccessMsg}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setHandoverModalOrder(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={handoverInputPin.length < 4}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Handover & Deliver</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POS Machine Integration Configuration Modal */}
      {showPosConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-850 border border-slate-700 max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-700/80 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-base font-black text-white">POS Machine & Terminal Integration</h3>
                  <p className="text-xs text-slate-400">Configure EDC card swipe terminal & soundbox</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPosConfigModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowPosConfigModal(false);
                alert('POS Machine configuration saved successfully!');
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-bold mb-1">POS Machine Provider</label>
                <select
                  value={settings.posMachineConfig?.provider || 'pine_labs'}
                  onChange={(e) => updateSettings({
                    posMachineConfig: {
                      ...(settings.posMachineConfig || {
                        enabled: true,
                        terminalId: 'PL-A920-8491',
                        connectionType: 'lan_wifi',
                        ipAddress: '192.168.1.150:8080'
                      }),
                      provider: e.target.value as any
                    }
                  })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
                >
                  <option value="pine_labs">Pine Labs Plutus (Android A920 / Ingenico)</option>
                  <option value="paytm_pos">Paytm All-in-One Android POS</option>
                  <option value="mosambee">⚡ Mosambee MPOS Terminal</option>
                  <option value="razorpay_pos">Razorpay POS Smart Terminal</option>
                  <option value="ingenico_pax">PAX / Ingenico Network Terminal</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Connection Protocol</label>
                <select
                  value={settings.posMachineConfig?.connectionType || 'lan_wifi'}
                  onChange={(e) => updateSettings({
                    posMachineConfig: {
                      ...(settings.posMachineConfig || {
                        enabled: true,
                        provider: 'pine_labs',
                        terminalId: 'PL-A920-8491',
                      }),
                      connectionType: e.target.value as any
                    }
                  })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
                >
                  <option value="lan_wifi">LAN / Local WiFi IP Socket (Recommended)</option>
                  <option value="bluetooth">Bluetooth Serial (BT-EDC-POS)</option>
                  <option value="usb_serial">USB Serial Cable (COM3 / 115200 Baud)</option>
                  <option value="cloud_api">☁️ Cloud Terminal Push API</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Terminal ID (TID)</label>
                  <input
                    type="text"
                    value={settings.posMachineConfig?.terminalId || 'PL-A920-8491'}
                    onChange={(e) => updateSettings({
                      posMachineConfig: {
                        ...(settings.posMachineConfig || {
                          enabled: true,
                          provider: 'pine_labs',
                          connectionType: 'lan_wifi',
                        }),
                        terminalId: e.target.value
                      }
                    })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Terminal IP / Port</label>
                  <input
                    type="text"
                    value={settings.posMachineConfig?.ipAddress || '192.168.1.150:8080'}
                    onChange={(e) => updateSettings({
                      posMachineConfig: {
                        ...(settings.posMachineConfig || {
                          enabled: true,
                          provider: 'pine_labs',
                          connectionType: 'lan_wifi',
                          terminalId: 'PL-A920-8491'
                        }),
                        ipAddress: e.target.value
                      }
                    })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Store Counter UPI ID</label>
                <input
                  type="text"
                  value={settings.storeUpiId || 'dhobighat.store@icici'}
                  onChange={(e) => updateSettings({ storeUpiId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sky-400 font-mono font-bold"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <span className="font-bold text-slate-200 block">Integration Status:</span>
                <div>• Pine Labs Plutus Windows / Android Bridge: Active (Port 8080)</div>
                <div>• RuPay / Visa / Mastercard / Contactless NFC Tap: Enabled</div>
                <div>• Soundbox Instant Voice Confirmation: Active</div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPosConfigModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 font-bold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md shadow-purple-600/30"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STORE MANAGER CLEAR DISPUTE */}
      {clearDisputeOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl bg-slate-800 border border-slate-700 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-700/80 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                  Store Manager Dispute Desk
                </span>
                <h3 className="text-base font-black text-white mt-1">
                  Clear & Settle Dispute • #{clearDisputeOrder.invoiceNo}
                </h3>
                <p className="text-xs text-slate-400">
                  Customer: <span className="text-white font-bold">{clearDisputeOrder.customerName}</span> ({clearDisputeOrder.customerPhone})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setClearDisputeOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
              <div className="text-amber-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Issue Type: {clearDisputeOrder.dispute?.issueType?.replace(/_/g, ' ') || 'Dispute Claim'}</span>
              </div>
              <div className="text-slate-300 italic">
                &quot;{clearDisputeOrder.dispute?.description || 'Customer reported dissatisfaction with delivered order.'}&quot;
              </div>
              <div className="text-[10px] text-slate-400 pt-1">
                Order Value: <span className="font-mono text-white font-bold">₹{clearDisputeOrder.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmClearDispute} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Manager Resolution Decision</label>
                <select
                  value={disputeAction}
                  onChange={(e) => setDisputeAction(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-bold text-white"
                >
                  <option value="approved_refund">✅ Clear Dispute & Approve Refund / Wallet Credit</option>
                  <option value="rejected">✅ Clear Dispute as Resolved / No Fault Found</option>
                </select>
              </div>

              {disputeAction === 'approved_refund' && (
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Approved Settlement Amount (₹)</label>
                  <input
                    type="number"
                    value={disputeRefundAmt}
                    onChange={(e) => setDisputeRefundAmt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-bold text-white font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-bold mb-1">Store Manager Audit Notes</label>
                <textarea
                  value={disputeResolutionNotes}
                  onChange={(e) => setDisputeResolutionNotes(e.target.value)}
                  placeholder="Record manager resolution details (e.g. Inspected stain, dry-cleaned again, customer satisfied and accepted clothes)..."
                  required
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setClearDisputeOrder(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-md shadow-emerald-600/30"
                >
                  Clear Dispute & Settle Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REPORT DISPUTE ON DELIVERED ORDER */}
      {storeDisputeModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl bg-slate-800 border border-slate-700 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-700/80 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400">
                  Customer Claim Filing
                </span>
                <h3 className="text-base font-black text-white mt-1">
                  Report Dispute • #{storeDisputeModalOrder.invoiceNo}
                </h3>
                <p className="text-xs text-slate-400">
                  Customer: <span className="text-white font-bold">{storeDisputeModalOrder.customerName}</span> ({storeDisputeModalOrder.customerPhone})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStoreDisputeModalOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmStoreDispute} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Issue Category</label>
                <select
                  value={storeDisputeType}
                  onChange={(e) => setStoreDisputeType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-bold text-white"
                >
                  <option value="damage">⚠️ Fabric Tear / Damage</option>
                  <option value="stain_not_removed">🫧 Stain Not Removed / Bleed</option>
                  <option value="missing_item">Missing Garment / Item</option>
                  <option value="weight_mismatch">⚖️ Weight or Count Mismatch</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Complaint Description</label>
                <textarea
                  value={storeDisputeDesc}
                  onChange={(e) => setStoreDisputeDesc(e.target.value)}
                  placeholder="Detail the customer's complaint..."
                  required
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStoreDisputeModalOrder(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold shadow-md shadow-rose-600/30"
                >
                  Submit Dispute to Manager
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
