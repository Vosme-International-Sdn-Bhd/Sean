import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  ShoppingBag,
  Calendar,
  Wifi,
  WifiOff,
  Database,
  Sparkles,
  Scissors,
  QrCode,
  Coins,
  Settings,
  ShieldCheck,
  MapPin,
  Plus,
  Minus,
  Trash2,
  Percent,
  Check,
  Send,
  AlertTriangle,
  LogIn,
  Clock,
  Info
} from 'lucide-react'
import './App.css'

// Types & Interfaces
interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  type: 'service' | 'product' | 'combo'
  barcode?: string
}

interface Member {
  id: string
  name: string
  tier: 'None' | 'Gold' | 'Platinum'
  discount: number
  points: number
}

interface Booking {
  id: string
  customerName: string
  phone: string
  service: string
  stylist: string
  date: string
  time: string
  status: 'Confirmed' | 'Completed' | 'Pending'
}

interface Shop {
  id: string
  name: string
  location: string
  tin: string
  brn: string
  msic: string
  invoiceEnabled: boolean
}

function App() {
  // Navigation & General System State
  const [currentTab, setCurrentTab] = useState<'pos' | 'admin' | 'booking'>('pos')
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [syncQueue, setSyncQueue] = useState<number>(0)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [selectedShopId, setSelectedShopId] = useState<string>('shop-1')
  
  // Custom Toast Warning State
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'error' | 'success' | 'info'>('info')

  const triggerToast = (msg: string, type: 'error' | 'success' | 'info' = 'info') => {
    setToastMessage(msg)
    setToastType(type)
    setTimeout(() => setToastMessage(null), 4000)
  }

  // --- Dynamic Databases ---
  // 1. Shop database
  const [shops, setShops] = useState<Shop[]>([
    { id: 'shop-1', name: 'Kuala Lumpur HQ (KLCC)', location: 'Level 2, Suria KLCC, Kuala Lumpur', tin: 'SG1029384750', brn: '202101039485', msic: '96020', invoiceEnabled: true },
    { id: 'shop-2', name: 'Penang Gurney Salon', location: 'Lot G-18, Gurney Plaza, George Town', tin: 'SG1029384751', brn: '202201948576', msic: '96020', invoiceEnabled: true },
    { id: 'shop-3', name: 'JB MidValley Boutique', location: 'Level 1, Southkey MidValley, Johor Bahru', tin: 'SG1029384752', brn: '202302837465', msic: '96020', invoiceEnabled: false }
  ])

  // 2. Members database
  const members: Member[] = [
    { id: 'm-1', name: 'John Doe', tier: 'Gold', discount: 0.05, points: 350 },
    { id: 'm-2', name: 'Jane Smith', tier: 'Platinum', discount: 0.10, points: 820 },
    { id: 'm-3', name: 'Alvin Lim', tier: 'None', discount: 0, points: 45 }
  ]
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  // 3. Custom RBAC Settings Database
  const [rbacMatrix, setRbacMatrix] = useState({
    Owner: { openDrawer: true, modifyPrices: true, stackedDiscounts: true, taxSettings: true, employeeAccess: true, voidTx: true },
    'Shop Manager': { openDrawer: true, modifyPrices: true, stackedDiscounts: true, taxSettings: false, employeeAccess: true, voidTx: true },
    'Senior Stylist': { openDrawer: false, modifyPrices: false, stackedDiscounts: true, taxSettings: false, employeeAccess: false, voidTx: false },
    'Junior Stylist': { openDrawer: false, modifyPrices: false, stackedDiscounts: false, taxSettings: false, employeeAccess: false, voidTx: false },
    Cashier: { openDrawer: true, modifyPrices: false, stackedDiscounts: false, taxSettings: false, employeeAccess: false, voidTx: false }
  })
  
  // Current logged in user on Tablet POS
  const [loggedInRole, setLoggedInRole] = useState<'Owner' | 'Shop Manager' | 'Senior Stylist' | 'Junior Stylist' | 'Cashier'>('Cashier')

  // Check role permission
  const hasPermission = (permission: keyof typeof rbacMatrix['Owner']) => {
    return rbacMatrix[loggedInRole][permission]
  }

  // 4. Products & Catalog
  const catalog = [
    { id: 'cat-1', name: 'Signature Haircut & Style', price: 95, type: 'service' as const, category: 'Services', image: '💇‍♂️' },
    { id: 'cat-2', name: 'Balayage Color & Therapy', price: 380, type: 'service' as const, category: 'Services', image: '🎨' },
    { id: 'cat-3', name: 'Scalp & Hair Root Treatment', price: 180, type: 'service' as const, category: 'Services', image: '💆' },
    { id: 'cat-4', name: 'Organic Keratin Shampoo 500ml', price: 85, type: 'product' as const, category: 'Products', image: '🧴', barcode: '931848' },
    { id: 'cat-5', name: 'Argan Oil Leave-in Serum 100ml', price: 120, type: 'product' as const, category: 'Products', image: '💧', barcode: '742918' },
    { id: 'cat-6', name: 'Matte Clay Strong Hold 80g', price: 45, type: 'product' as const, category: 'Products', image: '🪨', barcode: '481903' },
    { id: 'cat-7', name: 'Signature Combo (Cut + Scalp)', price: 230, type: 'combo' as const, category: 'Combos', image: '✨' },
    { id: 'cat-8', name: 'BOGO Duo Set Shampoo + Conditioner', price: 135, type: 'combo' as const, category: 'Combos', image: '🎁' }
  ]

  // 5. Active Cart state
  const [cart, setCart] = useState<CartItem[]>([])
  const [manualDiscount, setManualDiscount] = useState<number>(0) // in %
  const [customPriceEditingId, setCustomPriceEditingId] = useState<string | null>(null)
  
  // 6. Cash drawer activity log
  const [drawerLog, setDrawerLog] = useState<{ time: string; trigger: string; status: string }[]>([
    { time: '10:00:24', trigger: 'Shift Opened (Cashier Tiffany)', status: 'Success' }
  ])

  // 7. Bookings database
  const [bookings, setBookings] = useState<Booking[]>([
    { id: 'b-101', customerName: 'Derrick Tan', phone: '+60123456789', service: 'Signature Haircut & Style', stylist: 'Master Stylist Alex', date: '2026-05-22', time: '11:00 AM', status: 'Confirmed' },
    { id: 'b-102', customerName: 'Samantha Yong', phone: '+60198877665', service: 'Balayage Color & Therapy', stylist: 'Senior Colorist Chloe', date: '2026-05-22', time: '02:30 PM', status: 'Confirmed' }
  ])

  // 8. Order Sales History (for Analytics)
  const [salesHistory, setSalesHistory] = useState<{ id: string; shop: string; subtotal: number; discount: number; tax: number; total: number; method: string; status: string; time: string }[]>([
    { id: 'TX-2026052101', shop: 'Kuala Lumpur HQ (KLCC)', subtotal: 95, discount: 4.75, tax: 7.22, total: 97.47, method: 'Cash', status: 'Synced', time: '14:23' },
    { id: 'TX-2026052102', shop: 'Kuala Lumpur HQ (KLCC)', subtotal: 380, discount: 38.00, tax: 27.36, total: 369.36, method: 'Fiuu DuitNow QR', status: 'Synced', time: '15:10' }
  ])

  // Sync animation handler
  useEffect(() => {
    if (isOnline && syncQueue > 0 && !isSyncing) {
      setIsSyncing(true)
      const timer = setTimeout(() => {
        setSalesHistory(prev => 
          prev.map(tx => tx.status === 'Pending Sync' ? { ...tx, status: 'Synced' } : tx)
        )
        setSyncQueue(0)
        setIsSyncing(false)
        triggerToast('All offline transactions synchronized to Supabase Cloud!', 'success')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, syncQueue])

  // --- POS Actions ---
  const handleAddToCart = (item: typeof catalog[0]) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1, type: item.type, barcode: item.barcode }]
    })
  }

  const handleUpdateQuantity = (itemId: string, increment: boolean) => {
    setCart(prev => prev.map(i => {
      if (i.id === itemId) {
        const newQty = increment ? i.quantity + 1 : i.quantity - 1
        return newQty > 0 ? { ...i, quantity: newQty } : i
      }
      return i
    }).filter(i => i.quantity > 0))
  }

  const handleRemoveFromCart = (itemId: string) => {
    if (!hasPermission('voidTx')) {
      triggerToast(`【权限受限】 只有 Owner 或 Manager 角色才能从订单中废弃或删减项目。`, 'error')
      return
    }
    setCart(prev => prev.filter(i => i.id !== itemId))
    triggerToast('Item removed from receipt.', 'info')
  }

  const handleClearCart = () => {
    if (!hasPermission('voidTx')) {
      triggerToast(`【权限受限】 收银员 Tiffany 无权废弃整笔订单。`, 'error')
      return
    }
    setCart([])
    setManualDiscount(0)
    setSelectedMember(null)
    triggerToast('Transaction receipt cancelled.', 'info')
  }

  const handleEditPrice = (itemId: string, newPrice: number) => {
    if (!hasPermission('modifyPrices')) {
      triggerToast(`【权限受限】 当前角色 ${loggedInRole} 无权手动改动销售单价！`, 'error')
      return
    }
    setCart(prev => prev.map(i => i.id === itemId ? { ...i, price: newPrice } : i))
    setCustomPriceEditingId(null)
    triggerToast('Price overridden successfully.', 'success')
  }

  const handleApplyManualDiscount = (percent: number) => {
    if (!hasPermission('stackedDiscounts')) {
      triggerToast(`【权限受限】 角色 ${loggedInRole} 无权手动配置百分比折扣！`, 'error')
      return
    }
    setManualDiscount(percent)
    triggerToast(`Applied custom ${percent}% manual discount.`, 'success')
  }

  // Open Cash Drawer Direct Command emulation
  const handleOpenCashDrawer = (triggerSource: string) => {
    if (!hasPermission('openDrawer')) {
      triggerToast(`【权限受限】 当前角色 ${loggedInRole} 无权手动开启钱箱！`, 'error')
      return
    }
    const now = new Date().toTimeString().split(' ')[0]
    setDrawerLog(prev => [{ time: now, trigger: triggerSource, status: 'Success' }, ...prev])
    triggerToast('【钱箱指令发送】: 24V RJ11 脉冲端口已激活，钱箱已弹出！', 'success')
  }

  // Simulated Barcode Scanning
  const handleSimulateScan = (barcode: string) => {
    const matched = catalog.find(c => c.barcode === barcode)
    if (matched) {
      handleAddToCart(matched)
      triggerToast(`【扫码器输入】 识别条码 #${barcode}: ${matched.name} 已塞入购物车。`, 'success')
    } else {
      triggerToast(`【扫码器错误】 未知的商品条码: ${barcode}`, 'error')
    }
  }

  // Calculated Pricing Values
  const getSubtotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  
  const getDiscounts = () => {
    const sub = getSubtotal()
    // 1. Member discount
    const memberPct = selectedMember ? selectedMember.discount : 0
    const memberDiscountVal = sub * memberPct
    
    // 2. Package / Combo discount: If BOGO or combo are present
    let packageDiscountVal = 0
    cart.forEach(item => {
      if (item.type === 'combo') {
        packageDiscountVal += item.price * 0.15 * item.quantity // Simulated BOGO bundle 15% discount
      }
    })

    // 3. Manual discount
    const manualDiscountVal = (sub - memberDiscountVal - packageDiscountVal) * (manualDiscount / 100)

    return {
      memberDiscount: memberDiscountVal,
      packageDiscount: packageDiscountVal,
      manualDiscount: manualDiscountVal,
      total: memberDiscountVal + packageDiscountVal + manualDiscountVal
    }
  }

  const calculatedDiscounts = getDiscounts()
  const subtotalAfterDiscounts = Math.max(0, getSubtotal() - calculatedDiscounts.total)
  const isSelectedShopInvoiceEnabled = shops.find(s => s.id === selectedShopId)?.invoiceEnabled || false
  const sstTax = subtotalAfterDiscounts * 0.08 // Malaysia SST 8%
  const totalPayable = subtotalAfterDiscounts + sstTax

  // Checkout Popups State
  const [checkoutModal, setCheckoutModal] = useState<'none' | 'duitnow' | 'cash' | 'success'>('none')
  const [simulatedFiuuStatus, setSimulatedFiuuStatus] = useState<'pending' | 'processing' | 'success'>('pending')
  const [lastPrintedInvoice, setLastPrintedInvoice] = useState<any>(null)

  const handleCashPayment = () => {
    if (cart.length === 0) return
    
    // Register the sale
    const currentShop = shops.find(s => s.id === selectedShopId)
    const newTxId = `TX-${Date.now().toString().slice(-8)}`
    const newTx = {
      id: newTxId,
      shop: currentShop?.name || 'Unknown',
      subtotal: getSubtotal(),
      discount: calculatedDiscounts.total,
      tax: sstTax,
      total: totalPayable,
      method: 'Cash',
      status: isOnline ? 'Synced' : 'Pending Sync',
      time: new Date().toTimeString().slice(0, 5)
    }

    setSalesHistory(prev => [newTx, ...prev])
    if (!isOnline) {
      setSyncQueue(prev => prev + 1)
    }

    setLastPrintedInvoice({
      ...newTx,
      shopDetails: currentShop,
      member: selectedMember,
      items: [...cart],
      uuid: isSelectedShopInvoiceEnabled && isOnline ? 'LHDN-UUID-993848-100293-2026' : null
    })

    // Auto open drawer on cash checkout
    if (hasPermission('openDrawer')) {
      const now = new Date().toTimeString().split(' ')[0]
      setDrawerLog(prev => [{ time: now, trigger: `Cash Payment Checkout (${newTxId})`, status: 'Success' }, ...prev])
    }

    setCart([])
    setManualDiscount(0)
    setSelectedMember(null)
    setCheckoutModal('success')
  }

  const triggerFiuuCheckout = () => {
    if (cart.length === 0) return
    setCheckoutModal('duitnow')
    setSimulatedFiuuStatus('pending')
  }

  const handleSimulateFiuuWebhookCallback = () => {
    setSimulatedFiuuStatus('processing')
    setTimeout(() => {
      setSimulatedFiuuStatus('success')
      const currentShop = shops.find(s => s.id === selectedShopId)
      const newTxId = `TX-${Date.now().toString().slice(-8)}`
      const newTx = {
        id: newTxId,
        shop: currentShop?.name || 'Unknown',
        subtotal: getSubtotal(),
        discount: calculatedDiscounts.total,
        tax: sstTax,
        total: totalPayable,
        method: 'Fiuu DuitNow QR',
        status: isOnline ? 'Synced' : 'Pending Sync',
        time: new Date().toTimeString().slice(0, 5)
      }

      setSalesHistory(prev => [newTx, ...prev])
      if (!isOnline) {
        setSyncQueue(prev => prev + 1)
      }

      setLastPrintedInvoice({
        ...newTx,
        shopDetails: currentShop,
        member: selectedMember,
        items: [...cart],
        uuid: isSelectedShopInvoiceEnabled && isOnline ? 'LHDN-UUID-993848-100293-2026' : null
      })

      // Open cash drawer implicitly if config allowed
      if (hasPermission('openDrawer')) {
        const now = new Date().toTimeString().split(' ')[0]
        setDrawerLog(prev => [{ time: now, trigger: `Fiuu QR Webhook Success (${newTxId})`, status: 'Success' }, ...prev])
      }

      setCart([])
      setManualDiscount(0)
      setSelectedMember(null)
      setTimeout(() => {
        setCheckoutModal('success')
      }, 1000)
    }, 1500)
  }

  // --- Booking Portal State & Actions ---
  const [bookingService, setBookingService] = useState<string>('Signature Haircut & Style')
  const [bookingStylist, setBookingStylist] = useState<string>('Master Stylist Alex')
  const [bookingDate, setBookingDate] = useState<string>('2026-05-22')
  const [bookingTime, setBookingTime] = useState<string>('10:00 AM')
  const [bookingName, setBookingName] = useState<string>('')
  const [bookingPhone, setBookingPhone] = useState<string>('')
  
  // Custom blocked times computation
  const isTimeSlotBlocked = (time: string, date: string, stylist: string) => {
    // Check conflicts in the current bookings database
    return bookings.some(b => b.date === date && b.time === time && b.stylist === stylist)
  }

  const handleSimulateWhatsAppBooking = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingName || !bookingPhone) {
      triggerToast('Please fill in booking name and phone number!', 'error')
      return
    }

    if (isTimeSlotBlocked(bookingTime, bookingDate, bookingStylist)) {
      triggerToast('This time slot is blocked due to an active stylist schedule conflict!', 'error')
      return
    }

    const newBooking: Booking = {
      id: `BK-${Date.now().toString().slice(-4)}`,
      customerName: bookingName,
      phone: bookingPhone,
      service: bookingService,
      stylist: bookingStylist,
      date: bookingDate,
      time: bookingTime,
      status: 'Pending'
    }

    // Insert to local database
    setBookings(prev => [...prev, newBooking])
    triggerToast(`【Meta WhatsApp Webhook 已触发】 正在推送预约 JSON payload 至 POS 端后台同步系统...`, 'info')

    // Simulate real-time sync after 1.5 seconds
    setTimeout(() => {
      setBookings(prev => prev.map(b => b.id === newBooking.id ? { ...b, status: 'Confirmed' } : b))
      triggerToast(`【预约同步完成】 ${bookingName} 的预约已通过 API 同步存盘，成功加入排班！`, 'success')
      
      // Clear forms
      setBookingName('')
      setBookingPhone('')
    }, 1800)
  }

  // --- Web Admin Settings Panel Actions ---
  const handleUpdateShopCredentials = (shopId: string, field: 'tin' | 'brn' | 'msic', value: string) => {
    setShops(prev => prev.map(s => s.id === shopId ? { ...s, [field]: value } : s))
    triggerToast('LHDN tax settings saved securely via AES-256 local database.', 'success')
  }

  const handleToggleShopInvoice = (shopId: string) => {
    setShops(prev => prev.map(s => s.id === shopId ? { ...s, invoiceEnabled: !s.invoiceEnabled } : s))
    triggerToast('Malaysia e-Invoice state changed successfully.', 'info')
  }

  const handleRbacCheckboxChange = (role: string, permission: string) => {
    setRbacMatrix(prev => {
      const roleKey = role as keyof typeof rbacMatrix
      const permKey = permission as keyof typeof rbacMatrix['Owner']
      return {
        ...prev,
        [roleKey]: {
          ...prev[roleKey],
          [permKey]: !prev[roleKey][permKey]
        }
      }
    })
    triggerToast(`Custom RBAC matrix rules for "${role}" modified!`, 'success')
  }

  const handleTestLhdnConnection = () => {
    triggerToast('Contacting LHDN Sandbox Gateway (https://api.myinvois.hasil.gov.my)...', 'info')
    setTimeout(() => {
      triggerToast('LHDN Gateway Handshake SECURE (HTTP 200) - Client Certificate Valid!', 'success')
    }, 1200)
  }

  return (
    <div className="sim-app">
      {/* 1. Simulator Top Bar Controller */}
      <header className="sim-control-bar">
        <div className="sim-brand">
          <Sparkles className="icon-pulse" style={{ color: 'hsl(var(--primary))' }} />
          <span>VOSME Salon POS Simulator</span>
        </div>

        {/* View Selection Toggle */}
        <nav className="sim-nav">
          <button
            className={`sim-nav-btn ${currentTab === 'pos' ? 'active' : ''}`}
            onClick={() => setCurrentTab('pos')}
          >
            <ShoppingBag size={15} />
            <span>10" Tablet POS</span>
          </button>
          <button
            className={`sim-nav-btn ${currentTab === 'admin' ? 'active' : ''}`}
            onClick={() => setCurrentTab('admin')}
          >
            <LayoutDashboard size={15} />
            <span>Web Admin Panel</span>
          </button>
          <button
            className={`sim-nav-btn ${currentTab === 'booking' ? 'active' : ''}`}
            onClick={() => setCurrentTab('booking')}
          >
            <Calendar size={15} />
            <span>Booking Portal</span>
          </button>
        </nav>

        {/* Device Status & Sync Controller */}
        <div className="sim-status">
          <div className="sim-status-pill">
            <Database size={13} style={{ color: 'hsl(var(--primary-hover))' }} />
            <span>Sync Queue: </span>
            <strong style={{ color: syncQueue > 0 ? 'hsl(var(--warning))' : 'hsl(var(--success))' }}>
              {isSyncing ? 'Syncing...' : syncQueue}
            </strong>
          </div>

          <button
            className={`sim-status-pill ${isOnline ? 'border-success' : 'border-danger'}`}
            style={{ background: 'transparent', cursor: 'pointer', display: 'flex', gap: '8px' }}
            onClick={() => {
              setIsOnline(!isOnline)
              triggerToast(
                isOnline 
                  ? 'POS offline. Direct local SQLite transactions will enqueue.' 
                  : 'POS network connection re-established! Synchronizing pending queue...',
                isOnline ? 'info' : 'success'
              )
            }}
          >
            {isOnline ? (
              <>
                <Wifi size={13} style={{ color: 'hsl(var(--success))' }} />
                <span className="sim-status-dot online"></span>
                <span>Online (Cloud Sync)</span>
              </>
            ) : (
              <>
                <WifiOff size={13} style={{ color: 'hsl(var(--danger))' }} />
                <span className="sim-status-dot offline"></span>
                <span>Offline-First (Local)</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Unified Warning / Toast Overlay */}
      {toastMessage && (
        <div 
          className={`toast-glass card-glass ${toastType === 'error' ? 'border-danger' : toastType === 'success' ? 'border-success' : 'border-info'}`}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 20px',
            animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            maxWidth: '450px'
          }}
        >
          {toastType === 'error' && <AlertTriangle size={18} style={{ color: 'hsl(var(--danger))' }} />}
          {toastType === 'success' && <Check size={18} style={{ color: 'hsl(var(--success))' }} />}
          {toastType === 'info' && <Info size={18} style={{ color: 'hsl(var(--info))' }} />}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', opacity: 0.7 }}>
              {toastType === 'error' ? '权限/系统警告' : toastType === 'success' ? '成功反馈' : '系统日志'}
            </div>
            <p style={{ fontSize: '0.9rem', marginTop: '2px', lineHeight: 1.4 }}>{toastMessage}</p>
          </div>
        </div>
      )}

      {/* 2. Primary Workspace Panel */}
      <main className="sim-workspace">
        
        {/* --- TAB 1: 10" TABLET POS SIMULATOR --- */}
        {currentTab === 'pos' && (
          <div className="tablet-shell">
            <div className="tablet-bezel">
              <div className="tablet-camera"></div>
              <div className="tablet-screen">
                
                {/* POS Left Panel: Catalog & Staff Shift */}
                <div style={{ flex: 1.7, display: 'flex', flexDirection: 'column', borderRight: '1px solid hsl(var(--border))', overflow: 'hidden' }}>
                  
                  {/* Register Header */}
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-card) / 0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                        {shops.find(s => s.id === selectedShopId)?.name || 'Select a Shop'}
                      </h2>
                      <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                        10" Register POS Terminal #001
                      </p>
                    </div>

                    {/* Role Switcher Matrix Demonstration */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <LogIn size={14} style={{ color: 'hsl(var(--text-muted))' }} />
                      <select 
                        value={loggedInRole} 
                        onChange={(e) => {
                          setLoggedInRole(e.target.value as any)
                          triggerToast(`Employee role shifted to "${e.target.value}". Dynamic permissions matrix updated.`, 'info')
                        }}
                        className="input-glass"
                        style={{ padding: '4px 10px', fontSize: '0.8rem', width: 'auto', background: 'hsl(var(--bg-card))' }}
                      >
                        <option value="Owner">Tiffany (Owner)</option>
                        <option value="Shop Manager">Alex (Shop Manager)</option>
                        <option value="Senior Stylist">Marcus (Senior Stylist)</option>
                        <option value="Junior Stylist">Kevin (Junior Stylist)</option>
                        <option value="Cashier">Sarah (Cashier)</option>
                      </select>
                    </div>
                  </div>

                  {/* Predefined Quick Barcode Scan Simulation */}
                  <div style={{ padding: '10px 20px', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-card) / 0.15)', display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'hsl(var(--primary-hover))', whiteSpace: 'nowrap' }}>
                      Scan Gun Sim:
                    </span>
                    <button onClick={() => handleSimulateScan('931848')} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                      Scan Shampoo (#931848)
                    </button>
                    <button onClick={() => handleSimulateScan('742918')} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                      Scan Serum (#742918)
                    </button>
                    <button onClick={() => handleSimulateScan('481903')} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                      Scan Wax (#481903)
                    </button>
                  </div>

                  {/* Service & Product Catalog */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                      {catalog.map(item => (
                        <div 
                          key={item.id} 
                          className="card-glass"
                          onClick={() => handleAddToCart(item)}
                          style={{
                            padding: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            height: '140px',
                            cursor: 'pointer',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '1.6rem' }}>{item.image}</span>
                            <span 
                              style={{ 
                                fontSize: '0.65rem', 
                                fontWeight: 700, 
                                textTransform: 'uppercase', 
                                padding: '2px 6px', 
                                borderRadius: '4px',
                                background: item.type === 'service' ? 'hsl(var(--primary) / 0.15)' : item.type === 'product' ? 'hsl(var(--info) / 0.15)' : 'hsl(var(--warning) / 0.15)',
                                color: item.type === 'service' ? 'hsl(var(--primary-hover))' : item.type === 'product' ? 'hsl(var(--info))' : 'hsl(var(--warning))'
                              }}
                            >
                              {item.type}
                            </span>
                          </div>
                          <div style={{ marginTop: '8px' }}>
                            <h3 style={{ fontSize: '0.8rem', lineHeight: 1.2, height: '2.4em', overflow: 'hidden', fontWeight: 600 }}>{item.name}</h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'hsl(var(--primary-hover))' }}>RM {item.price.toFixed(2)}</span>
                              <button style={{ background: 'hsl(var(--primary))', border: 'none', width: '18px', height: '18px', borderRadius: '50%', color: '#fff', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* POS Right Panel: Receipt Register */}
                <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'hsl(var(--bg-card) / 0.2)' }}>
                  
                  {/* Client / Member Info Binder */}
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-card) / 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>
                        Customer Member Profile
                      </span>
                      {selectedMember && (
                        <span style={{ fontSize: '0.7rem', background: 'hsl(var(--success) / 0.15)', color: 'hsl(var(--success))', padding: '2px 8px', borderRadius: '99px', fontWeight: 600 }}>
                          {selectedMember.tier} Tier ({(selectedMember.discount * 100)}% Discount)
                        </span>
                      )}
                    </div>
                    <select
                      className="input-glass"
                      style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                      value={selectedMember ? selectedMember.id : ''}
                      onChange={(e) => {
                        const mId = e.target.value
                        if (!mId) {
                          setSelectedMember(null)
                        } else {
                          const matched = members.find(m => m.id === mId)
                          if (matched) {
                            setSelectedMember(matched)
                            triggerToast(`Client ${matched.name} linked. Dynamic tier points: ${matched.points} PTS.`, 'info')
                          }
                        }
                      }}
                    >
                      <option value="">-- Walk-in Customer (No Member) --</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} [{m.tier} Member] - Points: {m.points}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Active Receipt Itemization */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                    {cart.length === 0 ? (
                      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
                        <Scissors size={32} style={{ marginBottom: '12px' }} />
                        <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>Shopping cart is empty.</p>
                        <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Click service catalog to build checkout.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {cart.map(item => (
                          <div 
                            key={item.id} 
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              padding: '10px 12px', 
                              background: 'hsl(var(--bg-card) / 0.5)', 
                              border: '1px solid hsl(var(--border))', 
                              borderRadius: 'var(--radius-sm)'
                            }}
                          >
                            <div style={{ flex: 1, marginRight: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.name}</h4>
                                {item.barcode && (
                                  <span style={{ fontSize: '0.65rem', background: 'hsl(var(--border))', padding: '1px 4px', borderRadius: '3px', color: 'hsl(var(--text-muted))' }}>
                                    #{item.barcode}
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                {customPriceEditingId === item.id ? (
                                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>RM</span>
                                    <input 
                                      type="number"
                                      defaultValue={item.price}
                                      onBlur={(e) => handleEditPrice(item.id, parseFloat(e.target.value) || 0)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleEditPrice(item.id, parseFloat((e.target as HTMLInputElement).value) || 0)
                                        }
                                      }}
                                      className="input-glass"
                                      style={{ width: '60px', padding: '2px 4px', fontSize: '0.75rem' }}
                                      autoFocus
                                    />
                                  </div>
                                ) : (
                                  <span 
                                    onClick={() => setCustomPriceEditingId(item.id)}
                                    style={{ fontSize: '0.8rem', color: 'hsl(var(--primary-hover))', cursor: 'pointer', textDecoration: 'underline dotted' }}
                                    title="Click to override price"
                                  >
                                    RM {item.price.toFixed(2)}
                                  </span>
                                )}
                                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>each</span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {/* Quantity selectors */}
                              <div style={{ display: 'flex', alignItems: 'center', background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))', borderRadius: '6px', padding: '2px' }}>
                                <button onClick={() => handleUpdateQuantity(item.id, false)} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--text-main))', padding: '2px 6px', cursor: 'pointer' }}>
                                  <Minus size={11} />
                                </button>
                                <span style={{ fontSize: '0.8rem', padding: '0 6px', minWidth: '16px', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                                <button onClick={() => handleUpdateQuantity(item.id, true)} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--text-main))', padding: '2px 6px', cursor: 'pointer' }}>
                                  <Plus size={11} />
                                </button>
                              </div>

                              <button 
                                onClick={() => handleRemoveFromCart(item.id)} 
                                style={{ background: 'transparent', border: 'none', color: 'hsl(var(--danger))', cursor: 'pointer', padding: '4px' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Summary Stacked Discount Matrix Calculations & LHDN State */}
                  <div style={{ padding: '16px 20px', borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-card) / 0.5)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'hsl(var(--text-muted))' }}>Catalog Subtotal</span>
                        <span>RM {getSubtotal().toFixed(2)}</span>
                      </div>
                      
                      {/* Stacked Discount Itemization Row */}
                      {calculatedDiscounts.total > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'hsl(var(--primary-glow))', padding: '6px 10px', borderRadius: '6px', margin: '4px 0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'hsl(var(--primary-hover))' }}>
                            <span>Total Stacked Discounts</span>
                            <span>- RM {calculatedDiscounts.total.toFixed(2)}</span>
                          </div>
                          {calculatedDiscounts.memberDiscount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'hsl(var(--text-main))', opacity: 0.8 }}>
                              <span>• Member Tier ({selectedMember?.tier})</span>
                              <span>- RM {calculatedDiscounts.memberDiscount.toFixed(2)}</span>
                            </div>
                          )}
                          {calculatedDiscounts.packageDiscount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'hsl(var(--text-main))', opacity: 0.8 }}>
                              <span>• Bundle Package Promo</span>
                              <span>- RM {calculatedDiscounts.packageDiscount.toFixed(2)}</span>
                            </div>
                          )}
                          {calculatedDiscounts.manualDiscount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'hsl(var(--text-main))', opacity: 0.8 }}>
                              <span>• Manual Staff Discount ({manualDiscount}%)</span>
                              <span>- RM {calculatedDiscounts.manualDiscount.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'hsl(var(--text-muted))' }}>Malaysia SST (8%)</span>
                        <span>RM {sstTax.toFixed(2)}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700, borderTop: '1px dashed hsl(var(--border))', paddingTop: '8px', marginTop: '4px', color: '#fff' }}>
                        <span>TOTAL PAYABLE</span>
                        <span>RM {totalPayable.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Operational POS Action buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                      <button 
                        onClick={() => {
                          if (!hasPermission('stackedDiscounts')) {
                            triggerToast(`【权限受限】 当前角色 ${loggedInRole} 无权操作手动打折！`, 'error')
                            return
                          }
                          const activeManual = manualDiscount === 10 ? 0 : 10
                          handleApplyManualDiscount(activeManual)
                        }}
                        className="btn-secondary" 
                        style={{ fontSize: '0.75rem', padding: '8px 10px', background: manualDiscount > 0 ? 'hsl(var(--primary-glow))' : 'hsl(var(--bg-card))', borderColor: manualDiscount > 0 ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}
                      >
                        <Percent size={13} style={{ marginRight: '4px' }} />
                        {manualDiscount > 0 ? `Disc: ${manualDiscount}%` : 'Manual Disc'}
                      </button>

                      <button 
                        onClick={() => handleOpenCashDrawer('Manual Trigger (POS Button)')}
                        className="btn-secondary" 
                        style={{ fontSize: '0.75rem', padding: '8px 10px' }}
                      >
                        <Coins size={13} style={{ marginRight: '4px' }} />
                        Open Drawer
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                      <button 
                        onClick={triggerFiuuCheckout}
                        disabled={cart.length === 0}
                        className="btn-primary pulse-primary" 
                        style={{ fontSize: '0.85rem', padding: '10px 14px' }}
                      >
                        <QrCode size={14} style={{ marginRight: '4px' }} />
                        Fiuu DuitNow QR
                      </button>
                      <button 
                        onClick={handleCashPayment}
                        disabled={cart.length === 0}
                        className="btn-secondary" 
                        style={{ fontSize: '0.85rem', padding: '10px 14px', background: 'hsl(var(--success-glow))', border: '1px solid hsl(var(--success))', color: 'hsl(var(--success))' }}
                      >
                        <Coins size={14} style={{ marginRight: '4px' }} />
                        Cash Drawer
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'center', marginTop: '10px' }}>
                      <button 
                        onClick={handleClearCart} 
                        style={{ background: 'transparent', border: 'none', color: 'hsl(var(--danger))', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Cancel Receipt Order
                      </button>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          </div>
        )}


        {/* --- TAB 2: WEB ADMIN DASHBOARD PANEL --- */}
        {currentTab === 'admin' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '30px' }}>
            
            {/* Top Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div className="card-glass">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>Aggregate Revenue</span>
                  <Coins size={18} style={{ color: 'hsl(var(--success))' }} />
                </div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: '#fff' }}>
                  RM {salesHistory.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '6px' }}>
                  Total of {salesHistory.length} finalized ticket transactions
                </div>
              </div>

              <div className="card-glass">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>Active Bookings Today</span>
                  <Calendar size={18} style={{ color: 'hsl(var(--primary))' }} />
                </div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: '#fff' }}>
                  {bookings.filter(b => b.status === 'Confirmed').length}
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '6px' }}>
                  WhatsApp Meta Flow scheduler active
                </div>
              </div>

              <div className="card-glass">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>Active Shops</span>
                  <MapPin size={18} style={{ color: 'hsl(var(--info))' }} />
                </div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: '#fff' }}>
                  {shops.length} Branches
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '6px' }}>
                  Multi-shop state management synced
                </div>
              </div>

              <div className="card-glass">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>LHDN Integration status</span>
                  <ShieldCheck size={18} style={{ color: 'hsl(var(--success))' }} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '12px', color: 'hsl(var(--success))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={16} /> MyInvois ACTIVE
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '6px' }}>
                  e-Invoicing automatic XML generation
                </div>
              </div>
            </div>

            {/* Split panels for Settings & Configuration */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '30px' }}>
              
              {/* Custom RBAC matrix Settings panel */}
              <div className="card-glass" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ borderBottom: '1px solid hsl(var(--border))', paddingBottom: '16px', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck style={{ color: 'hsl(var(--primary))' }} />
                    Custom RBAC Role & Permission Matrix Settings
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
                    Fine-tune granular authorization configurations. Changes will update POS register capability in real-time.
                  </p>
                </div>

                <div className="perm-matrix" style={{ flex: 1 }}>
                  {Object.keys(rbacMatrix).map(role => (
                    <div key={role} className="perm-cat-card" style={{ marginBottom: '12px' }}>
                      <div className="perm-cat-title">{role}</div>
                      
                      <div className="perm-row">
                        <input
                          type="checkbox"
                          className="perm-checkbox"
                          checked={rbacMatrix[role as keyof typeof rbacMatrix].openDrawer}
                          onChange={() => handleRbacCheckboxChange(role, 'openDrawer')}
                          id={`perm-${role}-drawer`}
                        />
                        <label htmlFor={`perm-${role}-drawer`}>Open Cash Drawer</label>
                      </div>

                      <div className="perm-row">
                        <input
                          type="checkbox"
                          className="perm-checkbox"
                          checked={rbacMatrix[role as keyof typeof rbacMatrix].modifyPrices}
                          onChange={() => handleRbacCheckboxChange(role, 'modifyPrices')}
                          id={`perm-${role}-prices`}
                        />
                        <label htmlFor={`perm-${role}-prices`}>Override Service Prices</label>
                      </div>

                      <div className="perm-row">
                        <input
                          type="checkbox"
                          className="perm-checkbox"
                          checked={rbacMatrix[role as keyof typeof rbacMatrix].stackedDiscounts}
                          onChange={() => handleRbacCheckboxChange(role, 'stackedDiscounts')}
                          id={`perm-${role}-discounts`}
                        />
                        <label htmlFor={`perm-${role}-discounts`}>Apply Manual Discounts</label>
                      </div>

                      <div className="perm-row">
                        <input
                          type="checkbox"
                          className="perm-checkbox"
                          checked={rbacMatrix[role as keyof typeof rbacMatrix].voidTx}
                          onChange={() => handleRbacCheckboxChange(role, 'voidTx')}
                          id={`perm-${role}-void`}
                        />
                        <label htmlFor={`perm-${role}-void`}>Void receipt items</label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Multi-Shop e-Invoice and LHDN Panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                
                <div className="card-glass">
                  <div style={{ borderBottom: '1px solid hsl(var(--border))', paddingBottom: '16px', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Settings style={{ color: 'hsl(var(--info))' }} />
                      Malaysia LHDN MyInvois e-Invoice API Setup
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
                      Register corporate tax profile parameters to achieve automated compliance standard.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>
                        ACTIVE TARGET SHOP BRANCH
                      </label>
                      <select 
                        value={selectedShopId} 
                        onChange={(e) => setSelectedShopId(e.target.value)}
                        className="input-glass"
                      >
                        {shops.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>
                          TAX IDENTIFICATION (TIN)
                        </label>
                        <input
                          type="text"
                          className="input-glass"
                          value={shops.find(s => s.id === selectedShopId)?.tin || ''}
                          onChange={(e) => handleUpdateShopCredentials(selectedShopId, 'tin', e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>
                          REGISTRATION (BRN)
                        </label>
                        <input
                          type="text"
                          className="input-glass"
                          value={shops.find(s => s.id === selectedShopId)?.brn || ''}
                          onChange={(e) => handleUpdateShopCredentials(selectedShopId, 'brn', e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', alignItems: 'center' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>
                          MALAYSIA MSIC CODE
                        </label>
                        <input
                          type="text"
                          className="input-glass"
                          value={shops.find(s => s.id === selectedShopId)?.msic || ''}
                          onChange={(e) => handleUpdateShopCredentials(selectedShopId, 'msic', e.target.value)}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '8px' }}>
                          ENABLE E-INVOICE
                        </span>
                        <label className="switch">
                          <input 
                            type="checkbox"
                            checked={shops.find(s => s.id === selectedShopId)?.invoiceEnabled || false}
                            onChange={() => handleToggleShopInvoice(selectedShopId)}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                    </div>

                    <button 
                      onClick={handleTestLhdnConnection} 
                      className="btn-secondary" 
                      style={{ marginTop: '8px', fontSize: '0.8rem', padding: '10px' }}
                    >
                      Test LHDN Webhook Connection
                    </button>
                  </div>
                </div>

                {/* Cash Drawer Opening Logs & System Activities */}
                <div className="card-glass">
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Coins style={{ color: 'hsl(var(--warning))' }} />
                    24V Cash Drawer Opening Log (Audit trail)
                  </h3>
                  <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid hsl(var(--border))', borderRadius: '6px', background: 'hsl(var(--bg-main) / 0.4)' }}>
                    {drawerLog.map((log, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          padding: '8px 12px', 
                          borderBottom: idx === drawerLog.length - 1 ? 'none' : '1px solid hsl(var(--border))',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.75rem'
                        }}
                      >
                        <div>
                          <span style={{ color: 'hsl(var(--text-muted))' }}>[{log.time}]</span>{' '}
                          <strong style={{ color: '#fff' }}>{log.trigger}</strong>
                        </div>
                        <span style={{ background: 'hsl(var(--success-glow))', color: 'hsl(var(--success))', padding: '1px 6px', borderRadius: '4px', fontWeight: 600, fontSize: '0.65rem' }}>
                          {log.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* Sales Transaction Log Database table */}
            <div className="card-glass" style={{ marginTop: '30px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>Real-time Sales Synced Transactions</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))', color: 'hsl(var(--text-muted))' }}>
                    <th style={{ padding: '10px' }}>TX ID</th>
                    <th style={{ padding: '10px' }}>Branch</th>
                    <th style={{ padding: '10px' }}>Method</th>
                    <th style={{ padding: '10px' }}>Subtotal</th>
                    <th style={{ padding: '10px' }}>Discount</th>
                    <th style={{ padding: '10px' }}>Tax (8% SST)</th>
                    <th style={{ padding: '10px' }}>Total Paid</th>
                    <th style={{ padding: '10px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {salesHistory.map(tx => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid hsl(var(--border))', color: 'hsl(var(--text-main))' }}>
                      <td style={{ padding: '10px', fontWeight: 600 }}>{tx.id}</td>
                      <td style={{ padding: '10px' }}>{tx.shop}</td>
                      <td style={{ padding: '10px' }}>{tx.method}</td>
                      <td style={{ padding: '10px' }}>RM {tx.subtotal.toFixed(2)}</td>
                      <td style={{ padding: '10px', color: 'hsl(var(--danger))' }}>-RM {tx.discount.toFixed(2)}</td>
                      <td style={{ padding: '10px' }}>RM {tx.tax.toFixed(2)}</td>
                      <td style={{ padding: '10px', fontWeight: 700, color: 'hsl(var(--primary-hover))' }}>RM {tx.total.toFixed(2)}</td>
                      <td style={{ padding: '10px' }}>
                        <span 
                          className="pulse-success"
                          style={{ 
                            fontSize: '0.7rem', 
                            padding: '2px 8px', 
                            borderRadius: '99px', 
                            fontWeight: 600,
                            background: tx.status === 'Synced' ? 'hsl(var(--success) / 0.15)' : 'hsl(var(--warning) / 0.15)',
                            color: tx.status === 'Synced' ? 'hsl(var(--success))' : 'hsl(var(--warning))'
                          }}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}


        {/* --- TAB 3: CUSTOMER BOOKING PORTAL --- */}
        {currentTab === 'booking' && (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle at center, #1b132a 0%, #0c0813 100%)', padding: '40px', overflowY: 'auto' }}>
            
            <div style={{ width: '100%', maxWidth: '850px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
              
              {/* Form client-facing scheduler */}
              <div className="card-glass" style={{ border: '1px solid hsl(var(--primary) / 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Scissors style={{ color: 'hsl(var(--primary))' }} />
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>
                    Vosme Salon Client Reservation
                  </h2>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginBottom: '20px' }}>
                  Book your VIP style therapy directly. Confirmed slots block live stylist calendars globally.
                </p>

                <form onSubmit={handleSimulateWhatsAppBooking} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>
                      SELECT BEAUTY SERVICE
                    </label>
                    <select 
                      className="input-glass" 
                      value={bookingService} 
                      onChange={(e) => setBookingService(e.target.value)}
                    >
                      <option value="Signature Haircut & Style">Signature Haircut & Style (RM 95)</option>
                      <option value="Balayage Color & Therapy">Balayage Color & Therapy (RM 380)</option>
                      <option value="Scalp & Hair Root Treatment">Scalp & Hair Root Treatment (RM 180)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>
                      SELECT DESIGN STYLIST
                    </label>
                    <select 
                      className="input-glass" 
                      value={bookingStylist} 
                      onChange={(e) => setBookingStylist(e.target.value)}
                    >
                      <option value="Master Stylist Alex">Master Stylist Alex (Expert Cut)</option>
                      <option value="Senior Colorist Chloe">Senior Colorist Chloe (Color Specialist)</option>
                      <option value="Junior Barber Kevin">Junior Barber Kevin (Standard)</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>
                        DATE
                      </label>
                      <input 
                        type="date" 
                        className="input-glass" 
                        value={bookingDate} 
                        onChange={(e) => setBookingDate(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>
                        SELECT AVAILABLE TIME
                      </label>
                      <select 
                        className="input-glass" 
                        value={bookingTime} 
                        onChange={(e) => setBookingTime(e.target.value)}
                      >
                        <option value="09:00 AM">09:00 AM</option>
                        <option value="10:00 AM">10:00 AM</option>
                        <option value="11:00 AM">11:00 AM</option>
                        <option value="01:00 PM">01:00 PM</option>
                        <option value="02:30 PM">02:30 PM</option>
                        <option value="04:00 PM">04:00 PM</option>
                      </select>
                    </div>
                  </div>

                  {/* Visual conflict feedback message */}
                  {isTimeSlotBlocked(bookingTime, bookingDate, bookingStylist) && (
                    <div style={{ display: 'flex', gap: '8px', background: 'hsl(var(--danger-glow))', border: '1px solid hsl(var(--danger))', borderRadius: '6px', padding: '8px 12px', color: 'hsl(var(--danger))', fontSize: '0.75rem', alignItems: 'center' }}>
                      <AlertTriangle size={16} />
                      <span><strong>Blocked Conflict!</strong> Selected stylist already booked at this hour on {bookingDate}.</span>
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '14px', marginTop: '6px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '12px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>
                          YOUR FULL NAME
                        </label>
                        <input 
                          type="text" 
                          placeholder="e.g. Alvin Lim" 
                          className="input-glass" 
                          value={bookingName} 
                          onChange={(e) => setBookingName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>
                          MOBILE NUMBER
                        </label>
                        <input 
                          type="text" 
                          placeholder="e.g. +6012345678" 
                          className="input-glass" 
                          value={bookingPhone} 
                          onChange={(e) => setBookingPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="btn-primary" 
                      style={{ width: '100%', padding: '12px' }}
                      disabled={isTimeSlotBlocked(bookingTime, bookingDate, bookingStylist)}
                    >
                      <Send size={15} />
                      <span>Simulate WhatsApp Booking Webhook</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Simulated Live Stylist Schedule Calendar block */}
              <div className="card-glass" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock style={{ color: 'hsl(var(--primary-hover))' }} />
                  Live Salon Booking Stream
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginBottom: '16px' }}>
                  Simulated metadata webhook bookings en route to DB.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto' }}>
                  {bookings.map(b => (
                    <div 
                      key={b.id} 
                      style={{ 
                        padding: '12px', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: 'var(--radius-sm)', 
                        background: 'hsl(var(--bg-main) / 0.5)',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{b.customerName}</h4>
                          <p style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>{b.phone}</p>
                        </div>
                        <span 
                          style={{ 
                            fontSize: '0.65rem', 
                            fontWeight: 700, 
                            padding: '2px 8px', 
                            borderRadius: '99px',
                            background: b.status === 'Confirmed' ? 'hsl(var(--success) / 0.15)' : 'hsl(var(--warning) / 0.15)',
                            color: b.status === 'Confirmed' ? 'hsl(var(--success))' : 'hsl(var(--warning))'
                          }}
                        >
                          {b.status}
                        </span>
                      </div>

                      <div style={{ borderTop: '1px dashed hsl(var(--border))', marginTop: '8px', paddingTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.75rem' }}>
                        <div>
                          <strong style={{ color: 'hsl(var(--primary-hover))' }}>Stylist:</strong> {b.stylist.replace('Master Stylist ', '').replace('Senior Colorist ', '')}
                        </div>
                        <div>
                          <strong style={{ color: 'hsl(var(--info))' }}>Slot:</strong> {b.time} ({b.date})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* --- CHECKOUT DOCKABLE MODALS --- */}
      
      {/* 1. DuitNow QR Fiuu Webhook Modal */}
      {checkoutModal === 'duitnow' && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
        >
          <div className="card-glass border-primary" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '30px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
              Fiuu Gateway Checkout
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginBottom: '20px' }}>
              Dynamic DuitNow QR code generated securely.
            </p>

            {/* Generated QR Graphics */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div 
                style={{ 
                  width: '180px', 
                  height: '180px', 
                  background: '#fff', 
                  padding: '12px', 
                  borderRadius: '12px', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0 0 20px hsl(var(--primary) / 0.3)'
                }}
              >
                {/* Simulated dynamic QR lines */}
                <div style={{ width: '100%', height: '100%', background: 'repeating-linear-gradient(45deg, #1b132a, #1b132a 10px, #fff 10px, #fff 20px)', borderRadius: '6px', opacity: 0.85 }}></div>
              </div>
            </div>

            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'hsl(var(--primary-hover))', marginBottom: '6px' }}>
              Payable: RM {totalPayable.toFixed(2)}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginBottom: '24px' }}>
              Merchant Reference: {Date.now().toString().slice(-8)}
            </p>

            {/* Webhook Callback simulation triggers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {simulatedFiuuStatus === 'pending' && (
                <button 
                  onClick={handleSimulateFiuuWebhookCallback} 
                  className="btn-primary" 
                  style={{ width: '100%' }}
                >
                  Simulate Bank Webhook Callback (TNG / FPX)
                </button>
              )}
              {simulatedFiuuStatus === 'processing' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px' }}>
                  <div className="sim-status-dot online pulse-success" style={{ width: '12px', height: '12px', marginBottom: '8px' }}></div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Webhook signature validated. Finalizing transactional log...</span>
                </div>
              )}
              {simulatedFiuuStatus === 'success' && (
                <div style={{ color: 'hsl(var(--success))', fontSize: '0.9rem', fontWeight: 700, padding: '10px' }}>
                  ✓ Webhook verified. Transaction Paid!
                </div>
              )}

              <button 
                onClick={() => setCheckoutModal('none')} 
                className="btn-secondary" 
                style={{ width: '100%' }}
              >
                Back to register
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Success and Printed compliance Receipt Receipt Modal */}
      {checkoutModal === 'success' && lastPrintedInvoice && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
        >
          <div className="card-glass border-success" style={{ width: '100%', maxWidth: '420px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ textAlign: 'center', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '16px', marginBottom: '16px' }}>
              <div 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  background: 'hsl(var(--success-glow))', 
                  color: 'hsl(var(--success))', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 12px auto' 
                }}
              >
                <Check size={20} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>Transaction Approved & Saved</h3>
              <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                Compliance ESC/POS Receipt printed.
              </p>
            </div>

            {/* Scrollable Receipt Emulation */}
            <div 
              style={{ 
                flex: 1, 
                maxHeight: '340px', 
                overflowY: 'auto', 
                background: '#fff', 
                color: '#000', 
                fontFamily: 'monospace', 
                fontSize: '0.75rem', 
                padding: '16px', 
                borderRadius: '8px', 
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)',
                lineHeight: 1.4
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <strong style={{ fontSize: '0.9rem' }}>VOSME INTERNATIONAL SDN BHD</strong><br />
                {lastPrintedInvoice.shopDetails?.location}<br />
                BRN: {lastPrintedInvoice.shopDetails?.brn}<br />
                TIN: {lastPrintedInvoice.shopDetails?.tin}<br />
                MSIC: {lastPrintedInvoice.shopDetails?.msic}<br />
                --------------------------------
              </div>

              <div>
                <strong>Invoice:</strong> {lastPrintedInvoice.id}<br />
                <strong>Date/Time:</strong> 2026-05-21 {lastPrintedInvoice.time}<br />
                <strong>Cashier:</strong> Sarah (Cashier)<br />
                <strong>Customer:</strong> {lastPrintedInvoice.member ? lastPrintedInvoice.member.name : 'Walk-in Guest'}<br />
                --------------------------------
              </div>

              <div style={{ margin: '8px 0' }}>
                {lastPrintedInvoice.items.map((item: any) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                    <span>{item.quantity}x {item.name.slice(0, 18)}...</span>
                    <span>RM {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                --------------------------------
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-end', fontWeight: 'bold' }}>
                <div>Subtotal: RM {lastPrintedInvoice.subtotal.toFixed(2)}</div>
                {lastPrintedInvoice.discount > 0 && (
                  <div style={{ color: '#d9383a' }}>Discount: -RM {lastPrintedInvoice.discount.toFixed(2)}</div>
                )}
                <div>8% SST: RM {lastPrintedInvoice.tax.toFixed(2)}</div>
                <div style={{ fontSize: '0.85rem', borderTop: '1px solid #000', paddingTop: '4px', marginTop: '2px' }}>
                  TOTAL PAID: RM {lastPrintedInvoice.total.toFixed(2)}
                </div>
              </div>

              {lastPrintedInvoice.uuid && (
                <div style={{ borderTop: '1px dashed #000', marginTop: '12px', paddingTop: '10px', fontSize: '0.65rem', textAlign: 'center' }}>
                  <strong>MALAYSIA LHDN e-INVOICE VALIDATED</strong><br />
                  UUID: {lastPrintedInvoice.uuid}<br />
                  <span style={{ color: 'blue', textDecoration: 'underline' }}>Verify via myinvois.hasil.gov.my</span>
                  
                  {/* Small simulation barcode */}
                  <div style={{ margin: '8px auto 0 auto', width: '120px', height: '30px', background: '#000', opacity: 0.8 }}></div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setCheckoutModal('none')} 
              className="btn-primary" 
              style={{ width: '100%', marginTop: '16px' }}
            >
              Start New Ticket Order
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default App
