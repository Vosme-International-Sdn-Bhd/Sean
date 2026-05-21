import 'dart:async';
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Vosme Salon POS',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xffa855f7), // Orchid purple
        scaffoldBackgroundColor: const Color(0xff09090b), // Slate zinc 950
        cardColor: const Color(0xff18181b), // Slate zinc 900
        dividerColor: const Color(0xff27272a), // Slate zinc 800
        colorScheme: const ColorScheme.dark(
          primary: Color(0xffa855f7),
          secondary: Color(0xff22c55e), // Success emerald
          surface: Color(0xff18181b),
          error: Color(0xffef4444),
        ),
        textTheme: const TextTheme(
          titleLarge: TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.bold, color: Colors.white),
          bodyLarge: TextStyle(fontFamily: 'Outfit', color: Colors.white70),
          bodyMedium: TextStyle(fontFamily: 'Outfit', color: Colors.white60),
        ),
      ),
      home: const MainSimulatorScreen(),
    );
  }
}

// Models
class CartItem {
  final String id;
  final String name;
  double price;
  int quantity;
  final String type;
  final String? barcode;

  CartItem({
    required this.id,
    required this.name,
    required this.price,
    required this.quantity,
    required this.type,
    this.barcode,
  });
}

class Member {
  final String id;
  final String name;
  final String tier;
  final double discount;
  final int points;

  Member({
    required this.id,
    required this.name,
    required this.tier,
    required this.discount,
    required this.points,
  });
}

class Booking {
  final String id;
  final String customerName;
  final String phone;
  final String service;
  final String stylist;
  final String date;
  final String time;
  String status;

  Booking({
    required this.id,
    required this.customerName,
    required this.phone,
    required this.service,
    required this.stylist,
    required this.date,
    required this.time,
    required this.status,
  });
}

class Shop {
  final String id;
  final String name;
  final String location;
  String tin;
  String brn;
  String msic;
  bool invoiceEnabled;

  Shop({
    required this.id,
    required this.name,
    required this.location,
    required this.tin,
    required this.brn,
    required this.msic,
    required this.invoiceEnabled,
  });
}

class MainSimulatorScreen extends StatefulWidget {
  const MainSimulatorScreen({super.key});

  @override
  State<MainSimulatorScreen> createState() => _MainSimulatorScreenState();
}

class _MainSimulatorScreenState extends State<MainSimulatorScreen> {
  // Navigation
  int _activeTabIndex = 0; // 0: POS, 1: Admin, 2: Bookings
  bool _isOnline = true;
  int _syncQueue = 0;
  bool _isSyncing = false;
  String _selectedShopId = 'shop-1';

  // Dynamic Datastores
  final List<Shop> _shops = [
    Shop(id: 'shop-1', name: 'Kuala Lumpur HQ (KLCC)', location: 'Level 2, Suria KLCC, Kuala Lumpur', tin: 'SG1029384750', brn: '202101039485', msic: '96020', invoiceEnabled: true),
    Shop(id: 'shop-2', name: 'Penang Gurney Salon', location: 'Lot G-18, Gurney Plaza, George Town', tin: 'SG1029384751', brn: '202201948576', msic: '96020', invoiceEnabled: true),
    Shop(id: 'shop-3', name: 'JB MidValley Boutique', location: 'Level 1, Southkey MidValley, Johor Bahru', tin: 'SG1029384752', brn: '202302837465', msic: '96020', invoiceEnabled: false),
  ];

  final List<Member> _members = [
    Member(id: 'm-1', name: 'John Doe', tier: 'Gold', discount: 0.05, points: 350),
    Member(id: 'm-2', name: 'Jane Smith', tier: 'Platinum', discount: 0.10, points: 820),
    Member(id: 'm-3', name: 'Alvin Lim', tier: 'None', discount: 0.0, points: 45),
  ];
  Member? _selectedMember;

  // Custom RBAC Settings Database
  final Map<String, Map<String, bool>> _rbacMatrix = {
    'Owner': {'openDrawer': true, 'modifyPrices': true, 'stackedDiscounts': true, 'taxSettings': true, 'voidTx': true},
    'Shop Manager': {'openDrawer': true, 'modifyPrices': true, 'stackedDiscounts': true, 'taxSettings': false, 'voidTx': true},
    'Senior Stylist': {'openDrawer': false, 'modifyPrices': false, 'stackedDiscounts': true, 'taxSettings': false, 'voidTx': false},
    'Junior Stylist': {'openDrawer': false, 'modifyPrices': false, 'stackedDiscounts': false, 'taxSettings': false, 'voidTx': false},
    'Cashier': {'openDrawer': true, 'modifyPrices': false, 'stackedDiscounts': false, 'taxSettings': false, 'voidTx': false},
  };
  String _loggedInRole = 'Cashier';

  // Check Role Permission helper
  bool _hasPermission(String permission) {
    return _rbacMatrix[_loggedInRole]?[permission] ?? false;
  }

  // Catalog items
  final List<Map<String, dynamic>> _catalog = [
    {'id': 'cat-1', 'name': 'Signature Haircut & Style', 'price': 95.0, 'type': 'service', 'image': '💇‍♂️'},
    {'id': 'cat-2', 'name': 'Balayage Color & Therapy', 'price': 380.0, 'type': 'service', 'image': '🎨'},
    {'id': 'cat-3', 'name': 'Scalp & Hair Root Treatment', 'price': 180.0, 'type': 'service', 'image': '💆'},
    {'id': 'cat-4', 'name': 'Organic Keratin Shampoo 500ml', 'price': 85.0, 'type': 'product', 'image': '🧴', 'barcode': '931848'},
    {'id': 'cat-5', 'name': 'Argan Oil Leave-in Serum 100ml', 'price': 120.0, 'type': 'product', 'image': '💧', 'barcode': '742918'},
    {'id': 'cat-6', 'name': 'Matte Clay Strong Hold 80g', 'price': 45.0, 'type': 'product', 'image': '🪨', 'barcode': '481903'},
    {'id': 'cat-7', 'name': 'Signature Combo (Cut + Scalp)', 'price': 230.0, 'type': 'combo', 'image': '✨'},
    {'id': 'cat-8', 'name': 'BOGO Duo Set Shampoo + Conditioner', 'price': 135.0, 'type': 'combo', 'image': '🎁'},
  ];

  // Active Cart State
  final List<CartItem> _cart = [];
  int _manualDiscount = 0; // in %
  String? _customPriceEditingId;
  final TextEditingController _scanController = TextEditingController();

  // Cash drawer logs audit trail
  final List<Map<String, String>> _drawerLogs = [
    {'time': '10:00:24', 'trigger': 'Shift Opened (Cashier Sarah)', 'status': 'Success'}
  ];

  // Active bookings list
  final List<Booking> _bookings = [
    Booking(id: 'b-101', customerName: 'Derrick Tan', phone: '+60123456789', service: 'Signature Haircut & Style', stylist: 'Master Stylist Alex', date: '2026-05-22', time: '11:00 AM', status: 'Confirmed'),
    Booking(id: 'b-102', customerName: 'Samantha Yong', phone: '+60198877665', service: 'Balayage Color & Therapy', stylist: 'Senior Colorist Chloe', date: '2026-05-22', time: '02:30 PM', status: 'Confirmed'),
  ];

  // Completed payments log
  final List<Map<String, dynamic>> _salesHistory = [
    {'id': 'TX-2026052101', 'shop': 'Kuala Lumpur HQ (KLCC)', 'subtotal': 95.0, 'discount': 4.75, 'tax': 7.22, 'total': 97.47, 'method': 'Cash', 'status': 'Synced', 'time': '14:23'},
    {'id': 'TX-2026052102', 'shop': 'Kuala Lumpur HQ (KLCC)', 'subtotal': 380.0, 'discount': 38.00, 'tax': 27.36, 'total': 369.36, 'method': 'Fiuu DuitNow QR', 'status': 'Synced', 'time': '15:10'},
  ];

  Map<String, dynamic>? _lastInvoice;

  // Custom controller helper toast
  void _showSnackBar(String msg, {bool isError = false, bool isSuccess = false}) {
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
              isError ? Icons.warning_amber_rounded : isSuccess ? Icons.check_circle_outline : Icons.info_outline,
              color: isError ? Colors.redAccent : isSuccess ? Colors.greenAccent : Colors.purpleAccent,
            ),
            const SizedBox(width: 12),
            Expanded(child: Text(msg, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600))),
          ],
        ),
        backgroundColor: const Color(0xff18181b),
        duration: const Duration(seconds: 3),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        margin: const EdgeInsets.all(12),
      ),
    );
  }

  // Barcode input simulator action
  void _simulateBarcodeScan(String barcode) {
    final matched = _catalog.firstWhere((c) => c['barcode'] == barcode, orElse: () => {});
    if (matched.isNotEmpty) {
      _addToCart(matched);
      _showSnackBar('【扫码器输入】 自动添加商品: ${matched['name']}', isSuccess: true);
    } else {
      _showSnackBar('【扫码器错误】 未知的条码: $barcode', isError: true);
    }
  }

  // Trigger sync queue back to online
  void _toggleNetworkState() {
    setState(() {
      _isOnline = !_isOnline;
    });

    if (_isOnline && _syncQueue > 0 && !_isSyncing) {
      setState(() {
        _isSyncing = true;
      });
      _showSnackBar('Network back online. Synchronizing local databases...', isSuccess: true);
      
      Timer(const Duration(seconds: 2), () {
        setState(() {
          for (var tx in _salesHistory) {
            if (tx['status'] == 'Pending Sync') {
              tx['status'] = 'Synced';
            }
          }
          _syncQueue = 0;
          _isSyncing = false;
        });
        _showSnackBar('All offline transactions synchronized to Supabase cloud successfully!', isSuccess: true);
      });
    } else {
      _showSnackBar(_isOnline ? 'POS connected to cloud database.' : 'POS Offline. Transactions will write locally to SQLite.', isError: !_isOnline);
    }
  }

  // POS operations logic
  void _addToCart(Map<String, dynamic> item) {
    setState(() {
      final existingIndex = _cart.indexWhere((c) => c.id == item['id']);
      if (existingIndex >= 0) {
        _cart[existingIndex].quantity += 1;
      } else {
        _cart.add(CartItem(
          id: item['id'],
          name: item['name'],
          price: item['price'],
          quantity: 1,
          type: item['type'],
          barcode: item['barcode'],
        ));
      }
    });
  }

  void _updateQuantity(String id, bool increment) {
    setState(() {
      final index = _cart.indexWhere((c) => c.id == id);
      if (index >= 0) {
        if (increment) {
          _cart[index].quantity += 1;
        } else {
          _cart[index].quantity -= 1;
          if (_cart[index].quantity <= 0) {
            _cart.removeAt(index);
          }
        }
      }
    });
  }

  void _removeFromCart(String id) {
    if (!_hasPermission('voidTx')) {
      _showSnackBar('【权限受限】 当前角色 $_loggedInRole 无权废弃/删减销售单项！', isError: true);
      return;
    }
    setState(() {
      _cart.removeWhere((c) => c.id == id);
    });
    _showSnackBar('Item removed from receipt.');
  }

  void _clearCart() {
    if (!_hasPermission('voidTx')) {
      _showSnackBar('【权限受限】 收银员 Sarah 无权作废整笔收据订单！', isError: true);
      return;
    }
    setState(() {
      _cart.clear();
      _manualDiscount = 0;
      _selectedMember = null;
    });
    _showSnackBar('Transaction cancelled.');
  }

  void _openCashDrawer(String source) {
    if (!_hasPermission('openDrawer')) {
      _showSnackBar('【权限受限】 当前角色 $_loggedInRole 无权开启钱箱！', isError: true);
      return;
    }
    final now = DateTime.now().toLocal().toString().split(' ')[1].split('.')[0];
    setState(() {
      _drawerLogs.insert(0, {'time': now, 'trigger': source, 'status': 'Success'});
    });
    _showSnackBar('【钱箱指令发送】: 24V RJ11 脉冲端口已激活，钱箱已弹出！', isSuccess: true);
  }

  // Computations
  double _getSubtotal() {
    return _cart.fold(0.0, (sum, c) => sum + (c.price * c.quantity));
  }

  Map<String, double> _getCalculatedDiscounts() {
    double sub = _getSubtotal();
    double memberDisc = _selectedMember != null ? sub * _selectedMember!.discount : 0.0;
    
    double packageDisc = 0.0;
    for (var c in _cart) {
      if (c.type == 'combo') {
        packageDisc += c.price * 0.15 * c.quantity; // 15% combo bundle discount
      }
    }

    double manualDisc = (sub - memberDisc - packageDisc) * (_manualDiscount / 100.0);
    double total = memberDisc + packageDisc + manualDisc;

    return {
      'member': memberDisc,
      'package': packageDisc,
      'manual': manualDisc,
      'total': total,
    };
  }

  // Checkout Finish Cash Action
  void _checkoutCash() {
    if (_cart.isEmpty) return;

    double sub = _getSubtotal();
    var discs = _getCalculatedDiscounts();
    double totalAfterDiscs = sub - discs['total']!;
    double sst = totalAfterDiscs * 0.08;
    double payable = totalAfterDiscs + sst;

    final txId = 'TX-${DateTime.now().millisecondsSinceEpoch.toString().substring(5)}';
    final activeShop = _shops.firstWhere((s) => s.id == _selectedShopId);

    final newTx = {
      'id': txId,
      'shop': activeShop.name,
      'subtotal': sub,
      'discount': discs['total'],
      'tax': sst,
      'total': payable,
      'method': 'Cash',
      'status': _isOnline ? 'Synced' : 'Pending Sync',
      'time': DateTime.now().toLocal().toString().split(' ')[1].substring(0, 5),
      'items': _cart.map((c) => {'name': c.name, 'price': c.price, 'qty': c.quantity}).toList(),
      'uuid': activeShop.invoiceEnabled && _isOnline ? 'LHDN-UUID-993848-100293-2026' : null,
      'shopDetails': activeShop,
      'memberName': _selectedMember?.name ?? 'Walk-in Guest',
    };

    setState(() {
      _salesHistory.insert(0, newTx);
      if (!_isOnline) {
        _syncQueue += 1;
      }
      _lastInvoice = newTx;
      _cart.clear();
      _selectedMember = null;
      _manualDiscount = 0;
    });

    if (_hasPermission('openDrawer')) {
      final now = DateTime.now().toLocal().toString().split(' ')[1].split('.')[0];
      setState(() {
        _drawerLogs.insert(0, {'time': now, 'trigger': 'Cash Checkout Approval ($txId)', 'status': 'Success'});
      });
    }

    _showReceiptDialog(newTx);
  }

  void _checkoutFiuuQR() {
    if (_cart.isEmpty) return;

    double sub = _getSubtotal();
    var discs = _getCalculatedDiscounts();
    double totalAfterDiscs = sub - discs['total']!;
    double sst = totalAfterDiscs * 0.08;
    double payable = totalAfterDiscs + sst;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        bool processing = false;
        return StatefulBuilder(
          builder: (context, setModalState) {
            return AlertDialog(
              backgroundColor: const Color(0xff18181b),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: const Text('Fiuu DuitNow QR 结账', style: TextStyle(fontWeight: FontWeight.bold), textAlign: TextAlign.center),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('请使用 DuitNow 或电子钱包扫描此二维码付款', style: TextStyle(fontSize: 12, color: Colors.white60)),
                  const SizedBox(height: 16),
                  Container(
                    width: 160,
                    height: 160,
                    color: Colors.white,
                    padding: const EdgeInsets.all(8),
                    child: Center(
                      child: Container(
                        decoration: BoxDecoration(
                          color: const Color(0xff09090b),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Center(child: Icon(Icons.qr_code_2, size: 100, color: Colors.purpleAccent)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text('应付总额: RM ${payable.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.purpleAccent)),
                  const SizedBox(height: 16),
                  if (processing) ...[
                    const CircularProgressIndicator(),
                    const SizedBox(height: 8),
                    const Text('正在验证 Webhook 回调签名...', style: TextStyle(fontSize: 11, color: Colors.white60)),
                  ] else ...[
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.purple,
                        foregroundColor: Colors.white,
                      ),
                      onPressed: () {
                        setModalState(() {
                          processing = true;
                        });
                        Timer(const Duration(seconds: 2), () {
                          Navigator.pop(context); // Close QR dialog

                          final txId = 'TX-${DateTime.now().millisecondsSinceEpoch.toString().substring(5)}';
                          final activeShop = _shops.firstWhere((s) => s.id == _selectedShopId);

                          final newTx = {
                            'id': txId,
                            'shop': activeShop.name,
                            'subtotal': sub,
                            'discount': discs['total'],
                            'tax': sst,
                            'total': payable,
                            'method': 'Fiuu DuitNow QR',
                            'status': _isOnline ? 'Synced' : 'Pending Sync',
                            'time': DateTime.now().toLocal().toString().split(' ')[1].substring(0, 5),
                            'items': _cart.map((c) => {'name': c.name, 'price': c.price, 'qty': c.quantity}).toList(),
                            'uuid': activeShop.invoiceEnabled && _isOnline ? 'LHDN-UUID-993848-100293-2026' : null,
                            'shopDetails': activeShop,
                            'memberName': _selectedMember?.name ?? 'Walk-in Guest',
                          };

                          setState(() {
                            _salesHistory.insert(0, newTx);
                            if (!_isOnline) {
                              _syncQueue += 1;
                            }
                            _lastInvoice = newTx;
                            _cart.clear();
                            _selectedMember = null;
                            _manualDiscount = 0;
                          });

                          _showSnackBar('Fiuu DuitNow QR 支付成功 (Webhook 已核准)', isSuccess: true);
                          _showReceiptDialog(newTx);
                        });
                      },
                      child: const Text('模拟客户扫描并付款'),
                    ),
                  ],
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('取消返回', style: TextStyle(color: Colors.white54)),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  // Mono receipt dialog
  void _showReceiptDialog(Map<String, dynamic> tx) {
    showDialog(
      context: context,
      builder: (context) {
        final Shop shop = tx['shopDetails'];
        final List<dynamic> items = tx['items'];
        return AlertDialog(
          backgroundColor: const Color(0xff18181b),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('打印小票收据 (LHDN 电子发票)', style: TextStyle(fontWeight: FontWeight.bold)),
          content: SingleChildScrollView(
            child: Container(
              width: 320,
              color: Colors.white,
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Text(
                      'VOSME INTERNATIONAL SDN BHD\n${shop.location}\nBRN: ${shop.brn}\nTIN: ${shop.tin}\nMSIC: ${shop.msic}',
                      style: const TextStyle(color: Colors.black, fontSize: 10, fontFamily: 'monospace'),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const Text('--------------------------------', style: TextStyle(color: Colors.black, fontFamily: 'monospace')),
                  Text(
                    'Invoice: ${tx['id']}\nDate/Time: 2026-05-21 ${tx['time']}\nCashier: Sarah (Cashier)\nCustomer: ${tx['memberName']}',
                    style: const TextStyle(color: Colors.black, fontSize: 10, fontFamily: 'monospace'),
                  ),
                  const Text('--------------------------------', style: TextStyle(color: Colors.black, fontFamily: 'monospace')),
                  ...items.map((i) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 2.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('${i['qty']}x ${i['name'].toString().length > 15 ? i['name'].toString().substring(0, 12) + "..." : i['name']}', style: const TextStyle(color: Colors.black, fontSize: 10, fontFamily: 'monospace')),
                            Text('RM ${(i['price'] * i['qty']).toStringAsFixed(2)}', style: const TextStyle(color: Colors.black, fontSize: 10, fontFamily: 'monospace')),
                          ],
                        ),
                      )),
                  const Text('--------------------------------', style: TextStyle(color: Colors.black, fontFamily: 'monospace')),
                  Align(
                    alignment: Alignment.centerRight,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('Subtotal: RM ${tx['subtotal'].toStringAsFixed(2)}', style: const TextStyle(color: Colors.black, fontSize: 10, fontFamily: 'monospace')),
                        if (tx['discount'] > 0.0)
                          Text('Discount: -RM ${tx['discount'].toStringAsFixed(2)}', style: const TextStyle(color: Colors.red, fontSize: 10, fontFamily: 'monospace', fontWeight: FontWeight.bold)),
                        Text('8% SST: RM ${tx['tax'].toStringAsFixed(2)}', style: const TextStyle(color: Colors.black, fontSize: 10, fontFamily: 'monospace')),
                        const SizedBox(height: 4),
                        Text('TOTAL PAID: RM ${tx['total'].toStringAsFixed(2)}', style: const TextStyle(color: Colors.black, fontSize: 11, fontFamily: 'monospace', fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                  if (tx['uuid'] != null) ...[
                    const Text('--------------------------------', style: TextStyle(color: Colors.black, fontFamily: 'monospace')),
                    Center(
                      child: Column(
                        children: [
                          const Text(
                            'MALAYSIA LHDN e-INVOICE VALIDATED\nUUID: LHDN-UUID-993848-100293-2026',
                            style: TextStyle(color: Colors.black, fontSize: 9, fontFamily: 'monospace', fontWeight: FontWeight.bold),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 6),
                          Container(width: 140, height: 25, color: Colors.black87),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('完成并开始下一单'),
            ),
          ],
        );
      },
    );
  }

  // Form states for Bookings
  final TextEditingController _bookNameCtrl = TextEditingController();
  final TextEditingController _bookPhoneCtrl = TextEditingController();
  String _bookService = 'Signature Haircut & Style';
  String _bookStylist = 'Master Stylist Alex';
  String _bookTime = '10:00 AM';
  String _bookDate = '2026-05-22';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.spa, color: Colors.purpleAccent),
            const SizedBox(width: 8),
            const Text('VOSME Salon POS', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        backgroundColor: const Color(0xff18181b),
        actions: [
          // Device Online Sync Indicator
          Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: Chip(
              label: Text(_isOnline ? 'Online (Synced)' : 'Offline (Local)', style: const TextStyle(fontSize: 11)),
              avatar: Icon(_isOnline ? Icons.wifi : Icons.wifi_off, size: 14, color: _isOnline ? Colors.green : Colors.red),
              backgroundColor: const Color(0xff09090b),
              deleteIcon: const Icon(Icons.sync, size: 12),
              onDeleted: _toggleNetworkState,
            ),
          ),
          if (_syncQueue > 0)
            Padding(
              padding: const EdgeInsets.only(right: 8.0),
              child: CircleAvatar(
                radius: 12,
                backgroundColor: Colors.amber,
                child: Text('$_syncQueue', style: const TextStyle(fontSize: 11, color: Colors.black, fontWeight: FontWeight.bold)),
              ),
            ),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _activeTabIndex,
        onTap: (index) {
          setState(() {
            _activeTabIndex = index;
          });
        },
        backgroundColor: const Color(0xff18181b),
        selectedItemColor: Colors.purpleAccent,
        unselectedItemColor: Colors.white54,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.shopping_bag), label: 'POS 平板收银'),
          BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: '商家管理后台'),
          BottomNavigationBarItem(icon: Icon(Icons.calendar_today), label: '预约排班系统'),
        ],
      ),
      body: _buildSelectedWorkspace(),
    );
  }

  Widget _buildSelectedWorkspace() {
    switch (_activeTabIndex) {
      case 0:
        return _buildPosWorkspace();
      case 1:
        return _buildAdminWorkspace();
      case 2:
        return _buildBookingsWorkspace();
      default:
        return _buildPosWorkspace();
    }
  }

  // WORKSPACE 1: Responsive Tablet POS Register
  Widget _buildPosWorkspace() {
    double sub = _getSubtotal();
    var discs = _getCalculatedDiscounts();
    double sst = (sub - discs['total']!) * 0.08;
    double payable = (sub - discs['total']!) + sst;

    return Row(
      children: [
        // Left Column: Catalog selection
        Expanded(
          flex: 3,
          child: Container(
            decoration: const BoxDecoration(
              border: Border(right: BorderSide(color: Color(0xff27272a))),
            ),
            child: Column(
              children: [
                // Top control bar
                Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _shops.firstWhere((s) => s.id == _selectedShopId).name,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      Row(
                        children: [
                          const Icon(Icons.login, size: 14, color: Colors.white54),
                          const SizedBox(width: 6),
                          DropdownButton<String>(
                            value: _loggedInRole,
                            dropdownColor: const Color(0xff18181b),
                            onChanged: (String? val) {
                              if (val != null) {
                                setState(() {
                                  _loggedInRole = val;
                                });
                                _showSnackBar('当前登录角色切换为: $val', isSuccess: true);
                              }
                            },
                            items: const [
                              DropdownMenuItem(value: 'Owner', child: Text('Tiffany (Owner)', style: TextStyle(fontSize: 12))),
                              DropdownMenuItem(value: 'Shop Manager', child: Text('Alex (Manager)', style: TextStyle(fontSize: 12))),
                              DropdownMenuItem(value: 'Senior Stylist', child: Text('Marcus (Senior)', style: TextStyle(fontSize: 12))),
                              DropdownMenuItem(value: 'Junior Stylist', child: Text('Kevin (Junior)', style: TextStyle(fontSize: 12))),
                              DropdownMenuItem(value: 'Cashier', child: Text('Sarah (Cashier)', style: TextStyle(fontSize: 12))),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                // Scan gun simulation input
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12.0),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _scanController,
                          decoration: const InputDecoration(
                            hintText: '手动输入条码或模拟红外扫码器扫描...',
                            hintStyle: TextStyle(fontSize: 11, color: Colors.white30),
                            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            border: OutlineInputBorder(),
                          ),
                          style: const TextStyle(fontSize: 11),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xff27272a)),
                        onPressed: () {
                          if (_scanController.text.isNotEmpty) {
                            _simulateBarcodeScan(_scanController.text.trim());
                            _scanController.clear();
                          }
                        },
                        child: const Text('扫码确认', style: TextStyle(fontSize: 11)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                // Fast Quick Barcode Sim presets
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12.0),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        const Text('快捷条形码:  ', style: TextStyle(fontSize: 10, color: Colors.purpleAccent, fontWeight: FontWeight.bold)),
                        ActionChip(
                          label: const Text('洗发水 #931848', style: TextStyle(fontSize: 10)),
                          onPressed: () => _simulateBarcodeScan('931848'),
                        ),
                        const SizedBox(width: 6),
                        ActionChip(
                          label: const Text('精华液 #742918', style: TextStyle(fontSize: 10)),
                          onPressed: () => _simulateBarcodeScan('742918'),
                        ),
                        const SizedBox(width: 6),
                        ActionChip(
                          label: const Text('定型发泥 #481903', style: TextStyle(fontSize: 10)),
                          onPressed: () => _simulateBarcodeScan('481903'),
                        ),
                      ],
                    ),
                  ),
                ),
                const Divider(),
                // Catalog Grid
                Expanded(
                  child: GridView.builder(
                    padding: const EdgeInsets.all(12),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      crossAxisSpacing: 10,
                      mainAxisSpacing: 10,
                      childAspectRatio: 0.85,
                    ),
                    itemCount: _catalog.length,
                    itemBuilder: (context, index) {
                      final item = _catalog[index];
                      return InkWell(
                        onTap: () => _addToCart(item),
                        child: Card(
                          color: const Color(0xff18181b),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                            side: const BorderSide(color: Color(0xff27272a)),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(8.0),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(item['image'], style: const TextStyle(fontSize: 22)),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: Colors.purple.withOpacity(0.15),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(item['type'], style: const TextStyle(fontSize: 8, color: Colors.purpleAccent, fontWeight: FontWeight.bold)),
                                    ),
                                  ],
                                ),
                                Text(item['name'], style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold), maxLines: 2, overflow: TextOverflow.ellipsis),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text('RM ${item['price']}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.purpleAccent)),
                                    const CircleAvatar(radius: 8, backgroundColor: Colors.purple, child: Icon(Icons.add, size: 10, color: Colors.white)),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),

        // Right Column: Receipt cart builder
        Expanded(
          flex: 2,
          child: Column(
            children: [
              // Client Select Banner
              Container(
                color: const Color(0xff18181b),
                padding: const EdgeInsets.all(12.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('会员个人档案绑定', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white54)),
                        if (_selectedMember != null)
                          Text('${_selectedMember!.tier} 会员 (减 ${(staticDiscountPercent(_selectedMember!.tier))})', style: const TextStyle(fontSize: 9, color: Colors.greenAccent)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      dropdownColor: const Color(0xff18181b),
                      decoration: const InputDecoration(
                        isDense: true,
                        contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                        border: OutlineInputBorder(),
                      ),
                      value: _selectedMember?.id,
                      hint: const Text('-- 选择进店会员 (Walk-in) --', style: TextStyle(fontSize: 11)),
                      onChanged: (String? val) {
                        setState(() {
                          if (val == null || val.isEmpty) {
                            _selectedMember = null;
                          } else {
                            _selectedMember = _members.firstWhere((m) => m.id == val);
                            _showSnackBar('已链接会员: ${_selectedMember!.name} (当前累计积分: ${_selectedMember!.points} PTS)');
                          }
                        });
                      },
                      items: [
                        const DropdownMenuItem(value: '', child: Text('-- 散客散单 (No Member) --', style: TextStyle(fontSize: 11))),
                        ..._members.map((m) => DropdownMenuItem(value: m.id, child: Text('${m.name} [${m.tier} 会员]', style: const TextStyle(fontSize: 11)))),
                      ],
                    ),
                  ],
                ),
              ),

              // Cart itemization list
              Expanded(
                child: _cart.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            Icon(Icons.content_paste_search, size: 36, color: Colors.white24),
                            SizedBox(height: 8),
                            Text('购物车目前是空的', style: TextStyle(fontSize: 11, color: Colors.white30)),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: _cart.length,
                        itemBuilder: (context, index) {
                          final item = _cart[index];
                          return Card(
                            color: const Color(0xff09090b),
                            margin: const EdgeInsets.only(bottom: 8),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                              side: const BorderSide(color: Color(0xff27272a)),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 10.0, vertical: 8.0),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(item.name, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                        const SizedBox(height: 4),
                                        Row(
                                          children: [
                                            if (_customPriceEditingId == item.id)
                                              SizedBox(
                                                width: 60,
                                                height: 24,
                                                child: TextField(
                                                  keyboardType: TextInputType.number,
                                                  style: const TextStyle(fontSize: 11),
                                                  decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 4)),
                                                  onSubmitted: (val) {
                                                    setState(() {
                                                      if (_hasPermission('modifyPrices')) {
                                                        item.price = double.tryParse(val) ?? item.price;
                                                        _showSnackBar('修改单价成功: RM ${item.price}');
                                                      } else {
                                                        _showSnackBar('【权限受限】 当前角色 $_loggedInRole 无权改单价！', isError: true);
                                                      }
                                                      _customPriceEditingId = null;
                                                    });
                                                  },
                                                ),
                                              )
                                            else
                                              InkWell(
                                                onTap: () {
                                                  setState(() {
                                                    _customPriceEditingId = item.id;
                                                  });
                                                },
                                                child: Text('RM ${item.price.toStringAsFixed(2)}', style: const TextStyle(fontSize: 11, color: Colors.purpleAccent, decoration: TextDecoration.underline)),
                                              ),
                                            const SizedBox(width: 8),
                                            Text('x${item.quantity}', style: const TextStyle(fontSize: 10, color: Colors.white54)),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  // Quantity adjusts
                                  Row(
                                    children: [
                                      IconButton(
                                        icon: const Icon(Icons.remove_circle_outline, size: 16),
                                        onPressed: () => _updateQuantity(item.id, false),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.add_circle_outline, size: 16),
                                        onPressed: () => _updateQuantity(item.id, true),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.delete_outline, size: 16, color: Colors.red),
                                        onPressed: () => _removeFromCart(item.id),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ),

              // Receipt Calculation & checkout bottom sheet
              Container(
                decoration: const BoxDecoration(
                  color: Color(0xff18181b),
                  border: Border(top: BorderSide(color: Color(0xff27272a))),
                ),
                padding: const EdgeInsets.all(12),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('原小计', style: TextStyle(fontSize: 11, color: Colors.white60)),
                        Text('RM ${sub.toStringAsFixed(2)}', style: const TextStyle(fontSize: 11)),
                      ],
                    ),
                    if (discs['total']! > 0) ...[
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('多重叠打折减免', style: TextStyle(fontSize: 11, color: Colors.purpleAccent)),
                          Text('- RM ${discs['total']!.toStringAsFixed(2)}', style: const TextStyle(fontSize: 11, color: Colors.redAccent)),
                        ],
                      ),
                    ],
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('SST 8% 服务税 (马来西亚)', style: TextStyle(fontSize: 11, color: Colors.white60)),
                        Text('RM ${sst.toStringAsFixed(2)}', style: const TextStyle(fontSize: 11)),
                      ],
                    ),
                    const Divider(),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('应付净额', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        Text('RM ${payable.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: Colors.purple),
                              foregroundColor: Colors.purpleAccent,
                            ),
                            icon: const Icon(Icons.percent, size: 14),
                            label: Text(_manualDiscount > 0 ? '打折中 $_manualDiscount%' : '加手动打折', style: const TextStyle(fontSize: 11)),
                            onPressed: () {
                              if (!_hasPermission('stackedDiscounts')) {
                                _showSnackBar('【权限受限】 当前角色 $_loggedInRole 无权给整单手动打折！', isError: true);
                                return;
                              }
                              setState(() {
                                _manualDiscount = _manualDiscount == 10 ? 0 : 10;
                              });
                              _showSnackBar(_manualDiscount > 0 ? '已添加手动 10% 额外叠扣折扣。' : '取消手动折扣。');
                            },
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton.icon(
                            style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.white24)),
                            icon: const Icon(Icons.monetization_on, size: 14, color: Colors.amberAccent),
                            label: const Text('强制开钱箱', style: TextStyle(fontSize: 11)),
                            onPressed: () => _openCashDrawer('手动按键触发'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.purple, foregroundColor: Colors.white),
                            icon: const Icon(Icons.qr_code, size: 14),
                            label: const Text('Fiuu QR 付款', style: TextStyle(fontSize: 11)),
                            onPressed: _cart.isEmpty ? null : _checkoutFiuuQR,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                            icon: const Icon(Icons.money, size: 14),
                            label: const Text('现金付款结账', style: TextStyle(fontSize: 11)),
                            onPressed: _cart.isEmpty ? null : _checkoutCash,
                          ),
                        ),
                      ],
                    ),
                    if (_cart.isNotEmpty)
                      TextButton(
                        onPressed: _clearCart,
                        child: const Text('作废整笔收单', style: TextStyle(color: Colors.red, fontSize: 10)),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String staticDiscountPercent(String tier) {
    if (tier == 'Gold') return '5%';
    if (tier == 'Platinum') return '10%';
    return '0%';
  }

  // WORKSPACE 2: Web Admin panel settings
  Widget _buildAdminWorkspace() {
    double totalRevenue = _salesHistory.fold(0.0, (sum, val) => sum + val['total']);
    final currentShop = _shops.firstWhere((s) => s.id == _selectedShopId);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Stat summary Row
          Row(
            children: [
              Expanded(
                child: Card(
                  color: const Color(0xff18181b),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('多门店累计营业额', style: TextStyle(color: Colors.white30, fontSize: 11)),
                        const SizedBox(height: 6),
                        Text('RM ${totalRevenue.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
                      ],
                    ),
                  ),
                ),
              ),
              Expanded(
                child: Card(
                  color: const Color(0xff18181b),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('LHDN MyInvois 状态', style: TextStyle(color: Colors.white30, fontSize: 11)),
                        const SizedBox(height: 6),
                        Row(
                          children: const [
                            Icon(Icons.check_circle_outline, color: Colors.green, size: 16),
                            SizedBox(width: 6),
                            Text('API 网关已安全链接', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.greenAccent)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Custom RBAC matrix checkbox matrix config
          Card(
            color: const Color(0xff18181b),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: const [
                      Icon(Icons.shield, color: Colors.purpleAccent),
                      SizedBox(width: 8),
                      Text('多角色权限矩阵设置 (Custom RBAC Matrix)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  const Text('超级管理员在此配置前台员工是否有权限执行相应敏感操作，规则将在 POS 平板中即时生效。', style: TextStyle(fontSize: 10, color: Colors.white30)),
                  const SizedBox(height: 12),
                  ..._rbacMatrix.keys.map((role) {
                    return ExpansionTile(
                      title: Text(role, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.purpleAccent)),
                      dense: true,
                      children: _rbacMatrix[role]!.keys.map((perm) {
                        return CheckboxListTile(
                          title: Text(getPermissionLabel(perm), style: const TextStyle(fontSize: 11)),
                          value: _rbacMatrix[role]![perm],
                          onChanged: (bool? val) {
                            if (val != null) {
                              setState(() {
                                _rbacMatrix[role]![perm] = val;
                              });
                              _showSnackBar('修改 $role 权限规则: [${getPermissionLabel(perm)}] = $val', isSuccess: true);
                            }
                          },
                        );
                      }).toList(),
                    );
                  }).toList(),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // LHDN setup
          Card(
            color: const Color(0xff18181b),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: const [
                      Icon(Icons.business, color: Colors.cyanAccent),
                      SizedBox(width: 8),
                      Text('马来西亚 LHDN 电子发票资质配置', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    dropdownColor: const Color(0xff18181b),
                    value: _selectedShopId,
                    onChanged: (val) {
                      if (val != null) {
                        setState(() {
                          _selectedShopId = val;
                        });
                      }
                    },
                    decoration: const InputDecoration(labelText: '选择当前配置门店', labelStyle: TextStyle(fontSize: 11)),
                    items: _shops.map((s) => DropdownMenuItem(value: s.id, child: Text(s.name, style: const TextStyle(fontSize: 11)))).toList(),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          initialValue: currentShop.tin,
                          decoration: const InputDecoration(labelText: 'TIN 税号', labelStyle: TextStyle(fontSize: 11)),
                          style: const TextStyle(fontSize: 11),
                          onChanged: (val) => currentShop.tin = val,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextFormField(
                          initialValue: currentShop.brn,
                          decoration: const InputDecoration(labelText: 'BRN 营业执照号', labelStyle: TextStyle(fontSize: 11)),
                          style: const TextStyle(fontSize: 11),
                          onChanged: (val) => currentShop.brn = val,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          initialValue: currentShop.msic,
                          decoration: const InputDecoration(labelText: 'MSIC 马来西亚行业编码', labelStyle: TextStyle(fontSize: 11)),
                          style: const TextStyle(fontSize: 11),
                          onChanged: (val) => currentShop.msic = val,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('开启 LHDN 校验', style: TextStyle(fontSize: 10, color: Colors.white54)),
                          Switch(
                            value: currentShop.invoiceEnabled,
                            onChanged: (val) {
                              setState(() {
                                currentShop.invoiceEnabled = val;
                              });
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xff27272a)),
                      onPressed: () {
                        _showSnackBar('正在连接 LHDN 测试网关...', isSuccess: false);
                        Timer(const Duration(seconds: 1), () {
                          _showSnackBar('LHDN (HTTP 200) 握手成功！电子发票验证资质配置已同步。', isSuccess: true);
                        });
                      },
                      child: const Text('测试 LHDN 连接 (Handshake API)', style: TextStyle(fontSize: 11)),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Drawer opening logs
          Card(
            color: const Color(0xff18181b),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('钱箱手动/自动开启审计日志', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 8),
                  Container(
                    height: 120,
                    decoration: BoxDecoration(
                      border: Border.all(color: const Color(0xff27272a)),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: ListView.builder(
                      itemCount: _drawerLogs.length,
                      itemBuilder: (context, idx) {
                        final log = _drawerLogs[idx];
                        return ListTile(
                          dense: true,
                          title: Text('[${log['time']}] - ${log['trigger']}', style: const TextStyle(fontSize: 10, fontFamily: 'monospace')),
                          trailing: const Chip(
                            label: Text('Success', style: TextStyle(fontSize: 8)),
                            backgroundColor: Colors.green,
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String getPermissionLabel(String perm) {
    if (perm == 'openDrawer') return '手动强制开锁钱箱 (Open Drawer)';
    if (perm == 'modifyPrices') return '手动修改商品服务单价 (Override Price)';
    if (perm == 'stackedDiscounts') return '应用手动百分比折扣 (Apply Discounts)';
    if (perm == 'taxSettings') return '配置 LHDN 电子发票密钥 (Tax Settings)';
    if (perm == 'voidTx') return '作废删单/整单撤销 (Void Orders)';
    return perm;
  }

  // WORKSPACE 3: Dynamic scheduler WhatsApp flow bookings
  Widget _buildBookingsWorkspace() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // WhatsApp scheduling flow conflict
          Card(
            color: const Color(0xff18181b),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: const [
                      Icon(Icons.calendar_month, color: Colors.green),
                      SizedBox(width: 8),
                      Text('模拟顾客 WhatsApp 消息自助预约 (Meta Webhook)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  const Text('模拟 Meta WhatsApp Cloud API 回调。输入客户信息直接推送预约数据，当所选的发型师在同一时间段已排满时，系统会自动报错并拦截以防日程冲突。', style: TextStyle(fontSize: 10, color: Colors.white30)),
                  const SizedBox(height: 16),
                  
                  DropdownButtonFormField<String>(
                    dropdownColor: const Color(0xff18181b),
                    value: _bookService,
                    onChanged: (val) {
                      if (val != null) {
                        setState(() {
                          _bookService = val;
                        });
                      }
                    },
                    decoration: const InputDecoration(labelText: '选择美发美容疗程', labelStyle: TextStyle(fontSize: 11)),
                    items: const [
                      DropdownMenuItem(value: 'Signature Haircut & Style', child: Text('Signature Haircut & Style (RM 95)', style: TextStyle(fontSize: 11))),
                      DropdownMenuItem(value: 'Balayage Color & Therapy', child: Text('Balayage Color & Therapy (RM 380)', style: TextStyle(fontSize: 11))),
                      DropdownMenuItem(value: 'Scalp & Hair Root Treatment', child: Text('Scalp & Hair Root Treatment (RM 180)', style: TextStyle(fontSize: 11))),
                    ],
                  ),
                  const SizedBox(height: 8),

                  DropdownButtonFormField<String>(
                    dropdownColor: const Color(0xff18181b),
                    value: _bookStylist,
                    onChanged: (val) {
                      if (val != null) {
                        setState(() {
                          _bookStylist = val;
                        });
                      }
                    },
                    decoration: const InputDecoration(labelText: '选择指定发型设计师', labelStyle: TextStyle(fontSize: 11)),
                    items: const [
                      DropdownMenuItem(value: 'Master Stylist Alex', child: Text('Alex (Master Cut)', style: TextStyle(fontSize: 11))),
                      DropdownMenuItem(value: 'Senior Colorist Chloe', child: Text('Chloe (Color Specialist)', style: TextStyle(fontSize: 11))),
                      DropdownMenuItem(value: 'Junior Barber Kevin', child: Text('Kevin (Standard Cut)', style: TextStyle(fontSize: 11))),
                    ],
                  ),
                  const SizedBox(height: 8),

                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          dropdownColor: const Color(0xff18181b),
                          value: _bookTime,
                          onChanged: (val) {
                            if (val != null) {
                              setState(() {
                                _bookTime = val;
                              });
                            }
                          },
                          decoration: const InputDecoration(labelText: '选择预约具体时间段', labelStyle: TextStyle(fontSize: 11)),
                          items: const [
                            DropdownMenuItem(value: '09:00 AM', child: Text('09:00 AM', style: TextStyle(fontSize: 11))),
                            DropdownMenuItem(value: '10:00 AM', child: Text('10:00 AM', style: TextStyle(fontSize: 11))),
                            DropdownMenuItem(value: '11:00 AM', child: Text('11:00 AM', style: TextStyle(fontSize: 11))),
                            DropdownMenuItem(value: '01:00 PM', child: Text('01:00 PM', style: TextStyle(fontSize: 11))),
                            DropdownMenuItem(value: '02:30 PM', child: Text('02:30 PM', style: TextStyle(fontSize: 11))),
                            DropdownMenuItem(value: '04:00 PM', child: Text('04:00 PM', style: TextStyle(fontSize: 11))),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextFormField(
                          initialValue: _bookDate,
                          decoration: const InputDecoration(labelText: '预约日期', labelStyle: TextStyle(fontSize: 11)),
                          style: const TextStyle(fontSize: 11),
                          onChanged: (val) => _bookDate = val,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _bookNameCtrl,
                          decoration: const InputDecoration(hintText: '客户全名 (如 Alvin Lim)', hintStyle: TextStyle(fontSize: 11)),
                          style: const TextStyle(fontSize: 11),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextFormField(
                          controller: _bookPhoneCtrl,
                          decoration: const InputDecoration(hintText: '联系电话 (如 +60123456)', hintStyle: TextStyle(fontSize: 11)),
                          style: const TextStyle(fontSize: 11),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Display conflict warning
                  if (_bookings.any((b) => b.date == _bookDate && b.time == _bookTime && b.stylist == _bookStylist))
                    Container(
                      padding: const EdgeInsets.all(8),
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: Colors.red.withOpacity(0.15),
                        border: Border.all(color: Colors.red),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        children: const [
                          Icon(Icons.warning, color: Colors.red, size: 14),
                          SizedBox(width: 8),
                          Expanded(child: Text('【日程排班冲突】 该发型师在此日期该时间段已排满预约！', style: TextStyle(fontSize: 10, color: Colors.redAccent, fontWeight: FontWeight.bold))),
                        ],
                      ),
                    ),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.purple),
                      onPressed: _bookings.any((b) => b.date == _bookDate && b.time == _bookTime && b.stylist == _bookStylist)
                          ? null
                          : () {
                              if (_bookNameCtrl.text.isEmpty || _bookPhoneCtrl.text.isEmpty) {
                                _showSnackBar('请填入预约客户姓名和电话！', isError: true);
                                return;
                              }

                              final bk = Booking(
                                id: 'BK-${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}',
                                customerName: _bookNameCtrl.text.trim(),
                                phone: _bookPhoneCtrl.text.trim(),
                                service: _bookService,
                                stylist: _bookStylist,
                                date: _bookDate,
                                time: _bookTime,
                                status: 'Pending',
                              );

                              setState(() {
                                _bookings.add(bk);
                              });
                              _showSnackBar('【WhatsApp API 接收】 收到预订消息推送，加入本地同步通道...', isSuccess: false);

                              Timer(const Duration(milliseconds: 1500), () {
                                setState(() {
                                  bk.status = 'Confirmed';
                                });
                                _showSnackBar('【同步存盘完成】 顾客 ${_bookNameCtrl.text} 的预约已自动审核并排入日程！', isSuccess: true);
                                _bookNameCtrl.clear();
                                _bookPhoneCtrl.clear();
                              });
                            },
                      child: const Text('发送 WhatsApp 预约 Webhook 消息'),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Booking calendar live stream list
          const Text('实时预约排班看板 (Live Stylist Schedules)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(height: 8),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _bookings.length,
            itemBuilder: (context, idx) {
              final b = _bookings[idx];
              return Card(
                color: const Color(0xff18181b),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                child: ListTile(
                  dense: true,
                  title: Text(b.customerName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  subtitle: Text('手机: ${b.phone}\n疗程: ${b.service}\n美发师: ${b.stylist}', style: const TextStyle(fontSize: 10, color: Colors.white54)),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Chip(
                        label: Text(b.status, style: const TextStyle(fontSize: 8, color: Colors.white, fontWeight: FontWeight.bold)),
                        backgroundColor: b.status == 'Confirmed' ? Colors.green : Colors.amber,
                        padding: EdgeInsets.zero,
                      ),
                      const SizedBox(height: 2),
                      Text('${b.date} / ${b.time}', style: const TextStyle(fontSize: 8, color: Colors.purpleAccent, fontFamily: 'monospace')),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
