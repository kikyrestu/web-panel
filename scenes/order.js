const { Scenes, Markup } = require('telegraf');
const Order = require('../models/Order');
const User = require('../models/User');
const mongoose = require('mongoose');

// Scene untuk menampilkan daftar pesanan
const orderListScene = new Scenes.BaseScene('order-list');

orderListScene.enter(async (ctx) => {
  try {
    // Cek user
    const telegramId = ctx.from.id;
    const user = await User.findOne({ telegramId });
    
    if (!user) {
      await ctx.reply('Anda belum terdaftar. Silakan gunakan salah satu layanan kami untuk mendaftar.');
      return ctx.scene.leave();
    }
    
    // Update last activity
    user.lastActivity = new Date();
    await user.save();
    
    // Ambil pesanan user
    const orders = await Order.find({ user: user._id }).sort('-createdAt').limit(10);
    
    if (orders.length === 0) {
      await ctx.reply(
        '📋 *Daftar Pesanan*\n\n' +
        'Anda belum memiliki pesanan. Silakan pesan layanan terlebih dahulu.',
        { 
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            Markup.button.callback('💻 VPS/RDP', 'show_vps'),
            Markup.button.callback('🌐 Web Hosting', 'show_webhosting'),
            Markup.button.callback('🎮 Game Hosting', 'show_gamehosting')
          ])
        }
      );
      return;
    }
    
    await ctx.reply(
      '📋 *Daftar Pesanan Anda*\n\n' +
      'Berikut adalah 10 pesanan terakhir Anda:',
      { parse_mode: 'Markdown' }
    );
    
    // Menampilkan setiap pesanan
    for (const order of orders) {
      // Tentukan emoji status
      let statusEmoji = '';
      switch (order.status) {
        case 'pending':
          statusEmoji = '⌛';
          break;
        case 'processing':
          statusEmoji = '⚙️';
          break;
        case 'completed':
          statusEmoji = '✅';
          break;
        case 'cancelled':
          statusEmoji = '❌';
          break;
        case 'failed':
          statusEmoji = '❗';
          break;
        case 'expired':
          statusEmoji = '⏰';
          break;
        default:
          statusEmoji = '❓';
      }
      
      // Format nama layanan
      const serviceName = order.serviceName || order.domainName || 'Unnamed service';
      
      // Format tanggal
      const orderDate = order.createdAt.toLocaleDateString('id-ID');
      
      // Format deskripsi pesanan
      let orderDescription = '';
      switch (order.orderType) {
        case 'VPS':
          orderDescription = `VPS/RDP: ${serviceName}`;
          break;
        case 'WebHosting':
          orderDescription = `Web Hosting: ${serviceName}`;
          break;
        case 'GameHosting':
          orderDescription = `Game Hosting: ${serviceName}`;
          break;
      }
      
      // Format status
      let statusText = '';
      switch (order.status) {
        case 'pending':
          statusText = 'Menunggu Pembayaran';
          break;
        case 'processing':
          statusText = 'Sedang Diproses';
          break;
        case 'completed':
          statusText = 'Aktif';
          break;
        case 'cancelled':
          statusText = 'Dibatalkan';
          break;
        case 'failed':
          statusText = 'Gagal';
          break;
        case 'expired':
          statusText = 'Kadaluarsa';
          break;
        default:
          statusText = order.status;
      }
      
      const message = 
        `📌 *Pesanan #${order._id.toString().slice(-6).toUpperCase()}*\n` +
        `${orderDescription}\n` +
        `${statusEmoji} Status: ${statusText}\n` +
        `💰 Total: Rp ${order.amount.toLocaleString('id-ID')}\n` +
        `📅 Tanggal: ${orderDate}\n`;
      
      // Tombol yang berbeda berdasarkan status pesanan
      let buttons = [];
      
      if (order.status === 'pending') {
        buttons = [
          Markup.button.callback('💳 Konfirmasi Pembayaran', `confirm_payment_${order._id}`),
          Markup.button.callback('❌ Batalkan', `cancel_order_${order._id}`)
        ];
      } else if (order.status === 'completed' && order.orderType === 'VPS') {
        buttons = [
          Markup.button.callback('🔄 Restart Server', `restart_server_${order._id}`),
          Markup.button.callback('🔑 Reset Password', `reset_password_${order._id}`),
          Markup.button.callback('📋 Detail', `order_detail_${order._id}`)
        ];
      } else if (order.status === 'completed' && order.orderType === 'WebHosting') {
        buttons = [
          Markup.button.callback('🌐 cPanel', `cpanel_${order._id}`),
          Markup.button.callback('📋 Detail', `order_detail_${order._id}`)
        ];
      } else if (order.status === 'completed' && order.orderType === 'GameHosting') {
        buttons = [
          Markup.button.callback('🎮 Control Panel', `game_panel_${order._id}`),
          Markup.button.callback('📋 Detail', `order_detail_${order._id}`)
        ];
      } else {
        buttons = [
          Markup.button.callback('📋 Detail', `order_detail_${order._id}`)
        ];
      }
      
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
      });
    }
    
    await ctx.reply(
      'Gunakan tombol di bawah untuk kembali ke menu utama:',
      Markup.inlineKeyboard([
        Markup.button.callback('🏠 Menu Utama', 'main_menu')
      ])
    );
    
  } catch (err) {
    console.error('Error pada orderListScene:', err);
    await ctx.reply('Maaf, terjadi kesalahan. Silakan coba lagi nanti.');
  }
});

// Handler untuk action confirmasi pembayaran
orderListScene.action(/confirm_payment_(.+)/, async (ctx) => {
  try {
    const orderId = ctx.match[1];
    ctx.session.currentOrderId = orderId;
    await ctx.answerCbQuery();
    return ctx.scene.enter('order-payment-confirm');
  } catch (err) {
    console.error('Error pada action confirm_payment:', err);
    await ctx.answerCbQuery('Terjadi kesalahan. Silakan coba lagi.');
  }
});

// Handler untuk action batalkan pesanan
orderListScene.action(/cancel_order_(.+)/, async (ctx) => {
  try {
    const orderId = ctx.match[1];
    
    // Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      await ctx.answerCbQuery('ID pesanan tidak valid');
      return;
    }
    
    // Update status pesanan
    const order = await Order.findById(orderId);
    
    if (!order) {
      await ctx.answerCbQuery('Pesanan tidak ditemukan');
      return;
    }
    
    // Hanya bisa membatalkan pesanan dengan status pending
    if (order.status !== 'pending') {
      await ctx.answerCbQuery('Hanya pesanan dengan status "Menunggu Pembayaran" yang dapat dibatalkan');
      return;
    }
    
    order.status = 'cancelled';
    order.notes = (order.notes || '') + '\nDibatalkan oleh pengguna pada ' + new Date().toLocaleString('id-ID');
    await order.save();
    
    await ctx.answerCbQuery('Pesanan berhasil dibatalkan');
    await ctx.reply('Pesanan Anda telah berhasil dibatalkan.');
    
    // Refresh daftar pesanan
    return ctx.scene.enter('order-list');
    
  } catch (err) {
    console.error('Error pada action cancel_order:', err);
    await ctx.answerCbQuery('Terjadi kesalahan. Silakan coba lagi.');
  }
});

// Handler untuk action detail pesanan
orderListScene.action(/order_detail_(.+)/, async (ctx) => {
  try {
    const orderId = ctx.match[1];
    
    // Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      await ctx.answerCbQuery('ID pesanan tidak valid');
      return;
    }
    
    // Ambil detail pesanan
    const order = await Order.findById(orderId).populate('user');
    
    if (!order) {
      await ctx.answerCbQuery('Pesanan tidak ditemukan');
      return;
    }
    
    await ctx.answerCbQuery();
    
    // Format tanggal
    const orderDate = order.createdAt.toLocaleDateString('id-ID') + ' ' + order.createdAt.toLocaleTimeString('id-ID');
    const dueDate = order.dueDate ? order.dueDate.toLocaleDateString('id-ID') + ' ' + order.dueDate.toLocaleTimeString('id-ID') : 'N/A';
    const startDate = order.startDate ? order.startDate.toLocaleDateString('id-ID') : 'N/A';
    const endDate = order.endDate ? order.endDate.toLocaleDateString('id-ID') : 'N/A';
    
    // Format status
    let statusText = '';
    switch (order.status) {
      case 'pending':
        statusText = 'Menunggu Pembayaran';
        break;
      case 'processing':
        statusText = 'Sedang Diproses';
        break;
      case 'completed':
        statusText = 'Aktif';
        break;
      case 'cancelled':
        statusText = 'Dibatalkan';
        break;
      case 'failed':
        statusText = 'Gagal';
        break;
      case 'expired':
        statusText = 'Kadaluarsa';
        break;
      default:
        statusText = order.status;
    }
    
    // Format metode pembayaran
    let paymentMethodText = '';
    switch (order.paymentMethod) {
      case 'bank_transfer':
        paymentMethodText = 'Transfer Bank';
        break;
      case 'e-wallet':
        paymentMethodText = 'E-Wallet (OVO/GoPay/DANA)';
        break;
      case 'credit_card':
        paymentMethodText = 'Kartu Kredit/Debit';
        break;
      case 'balance':
        paymentMethodText = 'Saldo Akun';
        break;
      default:
        paymentMethodText = order.paymentMethod;
    }
    
    // Format detail server jika ada
    let serverDetails = '';
    if (order.serverDetails && order.status === 'completed') {
      serverDetails = '\n📡 *Detail Server*:';
      
      if (order.serverDetails.hostname) {
        serverDetails += `\nHostname: ${order.serverDetails.hostname}`;
      }
      
      if (order.serverDetails.ipAddress) {
        serverDetails += `\nIP Address: ${order.serverDetails.ipAddress}`;
      }
      
      if (order.serverDetails.username) {
        serverDetails += `\nUsername: ${order.serverDetails.username}`;
      }
      
      if (order.serverDetails.password) {
        serverDetails += `\nPassword: ${order.serverDetails.password}`;
      }
      
      if (order.serverDetails.controlPanel && order.serverDetails.controlPanel.url) {
        serverDetails += `\n\nControl Panel URL: ${order.serverDetails.controlPanel.url}`;
        
        if (order.serverDetails.controlPanel.username) {
          serverDetails += `\nControl Panel Username: ${order.serverDetails.controlPanel.username}`;
        }
        
        if (order.serverDetails.controlPanel.password) {
          serverDetails += `\nControl Panel Password: ${order.serverDetails.controlPanel.password}`;
        }
      }
    }
    
    // Format detail pembayaran jika ada
    let paymentDetails = '';
    if (order.paymentDetails) {
      paymentDetails = '\n💳 *Detail Pembayaran*:';
      
      if (order.paymentDetails.transactionId) {
        paymentDetails += `\nID Transaksi: ${order.paymentDetails.transactionId}`;
      }
      
      if (order.paymentDetails.paidAmount) {
        paymentDetails += `\nJumlah: Rp ${order.paymentDetails.paidAmount.toLocaleString('id-ID')}`;
      }
      
      if (order.paymentDetails.paidAt) {
        paymentDetails += `\nTanggal: ${order.paymentDetails.paidAt.toLocaleDateString('id-ID')} ${order.paymentDetails.paidAt.toLocaleTimeString('id-ID')}`;
      }
    }
    
    // Format pesan detail pesanan
    const detailMessage = 
      `📋 *Detail Pesanan #${order._id.toString().slice(-6).toUpperCase()}*\n\n` +
      `🔹 Tipe: ${order.orderType}\n` +
      `🔹 Layanan: ${order.serviceName || order.domainName || 'N/A'}\n` +
      `🔹 Status: ${statusText}\n` +
      `🔹 Tanggal Pemesanan: ${orderDate}\n` +
      `🔹 Batas Pembayaran: ${dueDate}\n` +
      `🔹 Periode Langganan: ${order.billingCycle === 'monthly' ? 'Bulanan' : order.billingCycle === 'quarterly' ? '3 Bulan' : 'Tahunan'}\n` +
      `🔹 Tanggal Mulai: ${startDate}\n` +
      `🔹 Tanggal Berakhir: ${endDate}\n` +
      `🔹 Total: Rp ${order.amount.toLocaleString('id-ID')}\n` +
      `🔹 Metode Pembayaran: ${paymentMethodText}\n` +
      `${paymentDetails}` +
      `${serverDetails}`;
    
    await ctx.reply(detailMessage, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        Markup.button.callback('◀️ Kembali ke Daftar Pesanan', 'back_to_order_list')
      ])
    });
  } catch (err) {
    console.error('Error pada action order_detail:', err);
    await ctx.answerCbQuery('Terjadi kesalahan. Silakan coba lagi.');
  }
});

// Handler untuk action lainnya
orderListScene.action('back_to_order_list', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.enter('order-list');
});

orderListScene.action('show_vps', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.enter('vps-list');
});

orderListScene.action('show_webhosting', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.enter('webhosting-list');
});

orderListScene.action('show_gamehosting', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.enter('gamehosting-list');
});

orderListScene.action('main_menu', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(
    `Selamat datang di HostingBot! 🚀\n\nSaya adalah bot yang akan membantu Anda membeli layanan hosting:\n\n` +
    `- VPS/RDP 💻\n` +
    `- Web Hosting 🌐\n` +
    `- Game Server Hosting 🎮\n\n` +
    `Silakan pilih layanan yang Anda butuhkan dengan perintah berikut:\n\n` +
    `/vps - Lihat paket VPS/RDP\n` +
    `/webhosting - Lihat paket Web Hosting\n` +
    `/gamehosting - Lihat paket Game Server Hosting\n` +
    `/order - Lihat pesanan Anda\n` +
    `/account - Kelola akun Anda`
  );
  return ctx.scene.leave();
});

// Scene untuk konfirmasi pembayaran
const orderPaymentConfirmScene = new Scenes.BaseScene('order-payment-confirm');

orderPaymentConfirmScene.enter(async (ctx) => {
  try {
    const orderId = ctx.session.currentOrderId;
    
    if (!orderId) {
      await ctx.reply('Terjadi kesalahan. Silakan coba lagi dari awal.');
      return ctx.scene.enter('order-list');
    }
    
    // Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      await ctx.reply('ID pesanan tidak valid');
      return ctx.scene.enter('order-list');
    }
    
    // Ambil detail pesanan
    const order = await Order.findById(orderId);
    
    if (!order) {
      await ctx.reply('Pesanan tidak ditemukan');
      return ctx.scene.enter('order-list');
    }
    
    // Hanya bisa konfirmasi pembayaran dengan status pending
    if (order.status !== 'pending') {
      await ctx.reply('Hanya pesanan dengan status "Menunggu Pembayaran" yang dapat dikonfirmasi pembayarannya');
      return ctx.scene.enter('order-list');
    }
    
    await ctx.reply(
      `💳 *Konfirmasi Pembayaran*\n\n` +
      `ID Pesanan: #${order._id.toString().slice(-6).toUpperCase()}\n` +
      `Total: Rp ${order.amount.toLocaleString('id-ID')}\n\n` +
      `Silakan kirimkan bukti pembayaran (screenshot/foto) untuk kami verifikasi:`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('Error pada orderPaymentConfirmScene enter:', err);
    await ctx.reply('Maaf, terjadi kesalahan. Silakan coba lagi nanti.');
    return ctx.scene.enter('order-list');
  }
});

// Handler untuk menerima bukti pembayaran (foto)
orderPaymentConfirmScene.on('photo', async (ctx) => {
  try {
    const orderId = ctx.session.currentOrderId;
    
    // Dapatkan file ID dari foto terbesar (kualitas terbaik)
    const photo = ctx.message.photo;
    const fileId = photo[photo.length - 1].file_id;
    
    // Update order dengan bukti pembayaran
    const order = await Order.findById(orderId);
    
    if (!order) {
      await ctx.reply('Pesanan tidak ditemukan');
      return ctx.scene.enter('order-list');
    }
    
    order.status = 'processing'; // Update status menjadi processing
    order.paymentDetails = {
      ...order.paymentDetails,
      paymentProof: fileId,
      paidAt: new Date()
    };
    order.notes = (order.notes || '') + '\nBukti pembayaran dikirim pada ' + new Date().toLocaleString('id-ID');
    
    await order.save();
    
    await ctx.reply(
      `✅ *Bukti Pembayaran Diterima*\n\n` +
      `Terima kasih telah mengirimkan bukti pembayaran untuk pesanan #${order._id.toString().slice(-6).toUpperCase()}.\n\n` +
      `Tim kami akan memverifikasi pembayaran Anda dan memproses pesanan sesegera mungkin. Anda akan mendapatkan notifikasi ketika layanan Anda sudah aktif.`,
      { parse_mode: 'Markdown' }
    );
    
    // Kembali ke daftar pesanan
    return ctx.scene.enter('order-list');
  } catch (err) {
    console.error('Error pada orderPaymentConfirmScene photo:', err);
    await ctx.reply('Maaf, terjadi kesalahan. Silakan coba lagi nanti.');
    return ctx.scene.enter('order-list');
  }
});

// Handler untuk menerima bukti pembayaran (dokumen)
orderPaymentConfirmScene.on('document', async (ctx) => {
  try {
    const orderId = ctx.session.currentOrderId;
    const fileId = ctx.message.document.file_id;
    
    // Update order dengan bukti pembayaran
    const order = await Order.findById(orderId);
    
    if (!order) {
      await ctx.reply('Pesanan tidak ditemukan');
      return ctx.scene.enter('order-list');
    }
    
    order.status = 'processing'; // Update status menjadi processing
    order.paymentDetails = {
      ...order.paymentDetails,
      paymentProof: fileId,
      paidAt: new Date()
    };
    order.notes = (order.notes || '') + '\nBukti pembayaran (dokumen) dikirim pada ' + new Date().toLocaleString('id-ID');
    
    await order.save();
    
    await ctx.reply(
      `✅ *Bukti Pembayaran Diterima*\n\n` +
      `Terima kasih telah mengirimkan bukti pembayaran untuk pesanan #${order._id.toString().slice(-6).toUpperCase()}.\n\n` +
      `Tim kami akan memverifikasi pembayaran Anda dan memproses pesanan sesegera mungkin. Anda akan mendapatkan notifikasi ketika layanan Anda sudah aktif.`,
      { parse_mode: 'Markdown' }
    );
    
    // Kembali ke daftar pesanan
    return ctx.scene.enter('order-list');
  } catch (err) {
    console.error('Error pada orderPaymentConfirmScene document:', err);
    await ctx.reply('Maaf, terjadi kesalahan. Silakan coba lagi nanti.');
    return ctx.scene.enter('order-list');
  }
});

orderPaymentConfirmScene.action('back_to_order_list', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.enter('order-list');
});

orderPaymentConfirmScene.command('cancel', async (ctx) => {
  await ctx.reply('Konfirmasi pembayaran dibatalkan.');
  return ctx.scene.enter('order-list');
});

module.exports = {
  orderStage: {
    scenes: [orderListScene, orderPaymentConfirmScene]
  }
};