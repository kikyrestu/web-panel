const { Scenes, Markup } = require('telegraf');
const GameHostingPackage = require('../models/GameHostingPackage');
const User = require('../models/User');
const Order = require('../models/Order');

// Scene untuk menampilkan daftar paket Game Hosting
const gamehostingListScene = new Scenes.BaseScene('gamehosting-list');

gamehostingListScene.enter(async (ctx) => {
  try {
    // Cek dan daftarkan pengguna jika belum terdaftar
    const telegramId = ctx.from.id;
    let user = await User.findOne({ telegramId });
    
    if (!user) {
      user = new User({
        telegramId,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
        lastActivity: new Date()
      });
      await user.save();
    } else {
      // Update last activity
      user.lastActivity = new Date();
      await user.save();
    }
    
    // Ambil paket Game Hosting yang tersedia
    const gamehostingPackages = await GameHostingPackage.find({ isAvailable: true }).sort('sortOrder');
    
    if (gamehostingPackages.length === 0) {
      return ctx.reply('Maaf, saat ini tidak ada paket Game Hosting yang tersedia. Silakan coba lagi nanti atau hubungi admin kami.');
    }
    
    await ctx.reply(
      '🎮 *Daftar Paket Game Server Hosting*\n\n' +
      'Silakan pilih paket Game Server Hosting yang sesuai dengan kebutuhan Anda:',
      { parse_mode: 'Markdown' }
    );
    
    // Tampilkan setiap paket dengan tombol detail
    for (const pkg of gamehostingPackages) {
      const discountText = pkg.discount && new Date(pkg.discount.validUntil) > new Date() 
        ? `🔥 Diskon ${pkg.discount.percentage}% hingga ${new Date(pkg.discount.validUntil).toLocaleDateString('id-ID')}!` 
        : '';
      
      const message = 
        `*${pkg.name}* - ${pkg.gameType}\n` +
        `${pkg.description || ''}\n\n` +
        `💻 CPU: ${pkg.specifications.cpu.cores} Cores (${pkg.specifications.cpu.description})\n` +
        `🧠 RAM: ${pkg.specifications.ram.size} GB\n` +
        `💾 Storage: ${pkg.specifications.storage.size} GB ${pkg.specifications.storage.type}\n` +
        `👥 Slots: ${pkg.specifications.slots.unlimited ? 'Unlimited' : pkg.specifications.slots.count + ' players'}\n\n` +
        `💰 Harga: Rp ${pkg.pricing.monthly.toLocaleString('id-ID')}/bulan\n` +
        (discountText ? `${discountText}\n` : '');
      
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.callback('🛒 Pesan Sekarang', `order_gamehosting_${pkg._id}`),
          Markup.button.callback('ℹ️ Detail Lebih Lanjut', `gamehosting_detail_${pkg._id}`)
        ])
      });
    }
    
    await ctx.reply(
      'Gunakan tombol di bawah untuk melihat paket lain atau kembali ke menu utama:',
      Markup.inlineKeyboard([
        Markup.button.callback('💻 VPS/RDP', 'show_vps'),
        Markup.button.callback('🌐 Web Hosting', 'show_webhosting'),
        Markup.button.callback('🏠 Menu Utama', 'main_menu')
      ])
    );
    
  } catch (err) {
    console.error('Error pada gamehostingListScene:', err);
    await ctx.reply('Maaf, terjadi kesalahan. Silakan coba lagi nanti.');
  }
});

// Handler untuk action buttons
gamehostingListScene.action(/order_gamehosting_(.+)/, async (ctx) => {
  try {
    const packageId = ctx.match[1];
    ctx.session.selectedPackage = { id: packageId, type: 'GameHosting' };
    await ctx.answerCbQuery();
    return ctx.scene.enter('gamehosting-order');
  } catch (err) {
    console.error('Error pada action order_gamehosting:', err);
    await ctx.answerCbQuery('Terjadi kesalahan. Silakan coba lagi.');
  }
});

gamehostingListScene.action(/gamehosting_detail_(.+)/, async (ctx) => {
  try {
    const packageId = ctx.match[1];
    const gamehostingPackage = await GameHostingPackage.findById(packageId);
    
    if (!gamehostingPackage) {
      await ctx.answerCbQuery('Paket tidak ditemukan');
      return;
    }
    
    // Format fitur-fitur
    let featuresText = '✨ *Fitur-fitur*:\n';
    
    if (gamehostingPackage.features.ddosProtection) {
      featuresText += '- DDoS Protection\n';
    }
    
    if (gamehostingPackage.features.backup && gamehostingPackage.features.backup.included) {
      featuresText += `- Backup ${gamehostingPackage.features.backup.frequency || 'Regular'}\n`;
    }
    
    if (gamehostingPackage.features.modSupport) {
      featuresText += '- Mod Support\n';
    }
    
    if (gamehostingPackage.features.controlPanel) {
      featuresText += `- ${gamehostingPackage.features.controlPanel} Control Panel\n`;
    }
    
    if (gamehostingPackage.features.customDomain) {
      featuresText += '- Custom Domain\n';
    }
    
    if (gamehostingPackage.features.instantSetup) {
      featuresText += '- Instant Setup\n';
    }
    
    // Format lokasi server jika ada
    const locationText = gamehostingPackage.location && gamehostingPackage.location.length > 0
      ? `🌍 *Lokasi Server*: ${gamehostingPackage.location.join(', ')}\n\n`
      : '';
    
    // Format harga dengan diskon jika ada
    let pricingText = `💰 *Harga*:\n- Bulanan: Rp ${gamehostingPackage.pricing.monthly.toLocaleString('id-ID')}\n`;
    
    if (gamehostingPackage.pricing.quarterly) {
      pricingText += `- 3 Bulan: Rp ${gamehostingPackage.pricing.quarterly.toLocaleString('id-ID')}\n`;
    }
    
    if (gamehostingPackage.pricing.yearly) {
      pricingText += `- Tahunan: Rp ${gamehostingPackage.pricing.yearly.toLocaleString('id-ID')}\n`;
    }
    
    if (gamehostingPackage.pricing.setup > 0) {
      pricingText += `- Biaya Setup: Rp ${gamehostingPackage.pricing.setup.toLocaleString('id-ID')}\n`;
    }
    
    // Tambahkan informasi diskon jika ada
    if (gamehostingPackage.discount && new Date(gamehostingPackage.discount.validUntil) > new Date()) {
      pricingText += `\n🔥 *Diskon ${gamehostingPackage.discount.percentage}%* hingga ${new Date(gamehostingPackage.discount.validUntil).toLocaleDateString('id-ID')}!\n`;
    }
    
    const detailMessage = 
      `🎮 *Detail Paket Game Hosting: ${gamehostingPackage.name}*\n\n` +
      `Game: ${gamehostingPackage.gameType}\n` +
      `${gamehostingPackage.description || ''}\n\n` +
      `💻 *Spesifikasi*:\n` +
      `- CPU: ${gamehostingPackage.specifications.cpu.cores} Cores (${gamehostingPackage.specifications.cpu.description})\n` +
      `- RAM: ${gamehostingPackage.specifications.ram.size} GB\n` +
      `- Storage: ${gamehostingPackage.specifications.storage.size} GB ${gamehostingPackage.specifications.storage.type}\n` +
      `- Player Slots: ${gamehostingPackage.specifications.slots.unlimited ? 'Unlimited' : gamehostingPackage.specifications.slots.count + ' players'}\n\n` +
      `${locationText}` +
      `${featuresText}\n` +
      `${pricingText}\n` +
      `Cocok untuk: ${gamehostingPackage.gameType} server dengan ${gamehostingPackage.specifications.slots.unlimited ? 'jumlah pemain tidak terbatas' : 'hingga ' + gamehostingPackage.specifications.slots.count + ' pemain'}`;
    
    await ctx.answerCbQuery();
    await ctx.reply(detailMessage, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        Markup.button.callback('🛒 Pesan Sekarang', `order_gamehosting_${packageId}`),
        Markup.button.callback('◀️ Kembali', 'back_to_gamehosting_list')
      ])
    });
  } catch (err) {
    console.error('Error pada action gamehosting_detail:', err);
    await ctx.answerCbQuery('Terjadi kesalahan. Silakan coba lagi.');
  }
});

gamehostingListScene.action('back_to_gamehosting_list', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.enter('gamehosting-list');
});

gamehostingListScene.action('show_vps', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.enter('vps-list');
});

gamehostingListScene.action('show_webhosting', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.enter('webhosting-list');
});

gamehostingListScene.action('main_menu', async (ctx) => {
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

// Scene untuk proses pemesanan Game Hosting
const gamehostingOrderScene = new Scenes.BaseScene('gamehosting-order');

gamehostingOrderScene.enter(async (ctx) => {
  try {
    if (!ctx.session.selectedPackage || !ctx.session.selectedPackage.id) {
      await ctx.reply('Maaf, terjadi kesalahan. Silakan pilih paket lagi.');
      return ctx.scene.enter('gamehosting-list');
    }
    
    const packageId = ctx.session.selectedPackage.id;
    const gamehostingPackage = await GameHostingPackage.findById(packageId);
    
    if (!gamehostingPackage) {
      await ctx.reply('Maaf, paket yang Anda pilih tidak tersedia.');
      return ctx.scene.enter('gamehosting-list');
    }
    
    // Simpan data paket di session
    ctx.session.packageData = {
      id: gamehostingPackage._id,
      name: gamehostingPackage.name,
      type: 'GameHosting',
      gameType: gamehostingPackage.gameType,
      model: 'GameHostingPackage',
      pricing: gamehostingPackage.pricing,
      discount: gamehostingPackage.discount
    };
    
    await ctx.reply(
      `Anda akan memesan: *${gamehostingPackage.name}* (${gamehostingPackage.gameType})\n\n` +
      `Silakan pilih periode langganan:`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('Bulanan - Rp ' + gamehostingPackage.pricing.monthly.toLocaleString('id-ID'), 'billing_monthly')],
          gamehostingPackage.pricing.quarterly ? [Markup.button.callback('3 Bulan - Rp ' + gamehostingPackage.pricing.quarterly.toLocaleString('id-ID'), 'billing_quarterly')] : [],
          gamehostingPackage.pricing.yearly ? [Markup.button.callback('Tahunan - Rp ' + gamehostingPackage.pricing.yearly.toLocaleString('id-ID'), 'billing_yearly')] : [],
          [Markup.button.callback('❌ Batalkan', 'cancel_order')]
        ].filter(row => row.length > 0)) // Filter empty rows
      }
    );
  } catch (err) {
    console.error('Error pada gamehostingOrderScene enter:', err);
    await ctx.reply('Maaf, terjadi kesalahan. Silakan coba lagi nanti.');
    return ctx.scene.enter('gamehosting-list');
  }
});

gamehostingOrderScene.action(/billing_(.+)/, async (ctx) => {
  try {
    const billingCycle = ctx.match[1]; // monthly, quarterly, yearly
    ctx.session.billingCycle = billingCycle;
    
    let amount;
    switch (billingCycle) {
      case 'monthly':
        amount = ctx.session.packageData.pricing.monthly;
        break;
      case 'quarterly':
        amount = ctx.session.packageData.pricing.quarterly;
        break;
      case 'yearly':
        amount = ctx.session.packageData.pricing.yearly;
        break;
    }
    
    // Hitung diskon jika ada
    if (ctx.session.packageData.discount && 
        new Date(ctx.session.packageData.discount.validUntil) > new Date()) {
      const discountAmount = amount * (ctx.session.packageData.discount.percentage / 100);
      amount = amount - discountAmount;
    }
    
    ctx.session.amount = amount;
    
    await ctx.answerCbQuery();
    await ctx.reply(`Silakan berikan nama untuk server ${ctx.session.packageData.gameType} Anda:`);
    ctx.wizard.next();
  } catch (err) {
    console.error('Error pada billing action:', err);
    await ctx.answerCbQuery('Terjadi kesalahan. Silakan coba lagi.');
  }
});

gamehostingOrderScene.action('cancel_order', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Pemesanan dibatalkan.');
  return ctx.scene.enter('gamehosting-list');
});

gamehostingOrderScene.on('text', async (ctx) => {
  // Simpan nama server
  ctx.session.serverName = ctx.message.text.trim();
  
  // Langsung ke metode pembayaran
  await ctx.reply(
    'Silakan pilih metode pembayaran:',
    Markup.inlineKeyboard([
      [Markup.button.callback('Transfer Bank', 'payment_bank_transfer')],
      [Markup.button.callback('E-Wallet (OVO/GoPay/DANA)', 'payment_e-wallet')],
      [Markup.button.callback('Kartu Kredit/Debit', 'payment_credit_card')],
      [Markup.button.callback('Saldo Akun', 'payment_balance')]
    ])
  );
});

gamehostingOrderScene.action(/payment_(.+)/, async (ctx) => {
  try {
    const paymentMethod = ctx.match[1];
    ctx.session.paymentMethod = paymentMethod;
    
    await ctx.answerCbQuery();
    
    // Cari atau buat user
    const telegramId = ctx.from.id;
    let user = await User.findOne({ telegramId });
    
    if (!user) {
      user = new User({
        telegramId,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name
      });
      await user.save();
    }
    
    // Buat order baru
    const newOrder = new Order({
      user: user._id,
      orderType: 'GameHosting',
      packageId: ctx.session.packageData.id,
      packageModel: ctx.session.packageData.model,
      serviceName: ctx.session.serverName,
      billingCycle: ctx.session.billingCycle,
      amount: ctx.session.amount,
      paymentMethod: paymentMethod,
      status: 'pending',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 jam dari sekarang
    });
    
    await newOrder.save();
    
    // Kirim instruksi pembayaran
    let paymentInstructions = '';
    
    switch (paymentMethod) {
      case 'bank_transfer':
        paymentInstructions = 
          '🏦 *Instruksi Transfer Bank*\n\n' +
          'Bank: BCA\n' +
          'No. Rekening: 1234567890\n' +
          'Atas Nama: PT. Hosting Indonesia\n\n' +
          'Bank: Mandiri\n' +
          'No. Rekening: 0987654321\n' +
          'Atas Nama: PT. Hosting Indonesia\n\n';
        break;
      case 'e-wallet':
        paymentInstructions = 
          '📱 *Instruksi E-Wallet*\n\n' +
          'DANA: 081234567890\n' +
          'GoPay: 081234567890\n' +
          'OVO: 081234567890\n\n';
        break;
      case 'credit_card':
        paymentInstructions = 
          '💳 *Instruksi Kartu Kredit/Debit*\n\n' +
          'Anda akan diarahkan ke halaman pembayaran kami.\n' +
          'Silakan ikuti tautan berikut: https://payment.example.com/' + newOrder._id + '\n\n';
        break;
      case 'balance':
        if (user.balance >= ctx.session.amount) {
          // Potong saldo
          user.balance -= ctx.session.amount;
          await user.save();
          
          // Update order status
          newOrder.status = 'processing';
          newOrder.paymentDetails = {
            paidAmount: ctx.session.amount,
            paidAt: new Date()
          };
          await newOrder.save();
          
          paymentInstructions = 
            '💰 *Pembayaran Berhasil*\n\n' +
            'Pembayaran telah berhasil menggunakan saldo akun.\n' +
            'Saldo tersisa: Rp ' + user.balance.toLocaleString('id-ID') + '\n\n' +
            'Tim kami akan memproses pesanan Anda segera.\n\n';
        } else {
          paymentInstructions = 
            '❌ *Saldo Tidak Mencukupi*\n\n' +
            'Maaf, saldo akun Anda tidak mencukupi untuk melakukan pembayaran ini.\n' +
            'Silakan isi saldo terlebih dahulu atau pilih metode pembayaran lain.\n\n';
        }
        break;
    }
    
    await ctx.reply(
      `🎉 *Pesanan Berhasil Dibuat*\n\n` +
      `ID Pesanan: #${newOrder._id}\n` +
      `Layanan: ${ctx.session.packageData.name} (${ctx.session.packageData.gameType})\n` +
      `Nama Server: ${ctx.session.serverName}\n` +
      `Periode: ${ctx.session.billingCycle === 'monthly' ? 'Bulanan' : ctx.session.billingCycle === 'quarterly' ? '3 Bulan' : 'Tahunan'}\n` +
      `Total Pembayaran: Rp ${ctx.session.amount.toLocaleString('id-ID')}\n` +
      `Batas Waktu Pembayaran: ${newOrder.dueDate.toLocaleString('id-ID')}\n\n` +
      `${paymentInstructions}\n` +
      `Setelah melakukan pembayaran, silakan konfirmasi dengan mengirimkan bukti pembayaran melalui perintah /confirm_payment`,
      {
        parse_mode: 'Markdown'
      }
    );
    
    await ctx.reply(
      'Terima kasih telah memesan layanan kami. Untuk melihat status pesanan Anda, gunakan perintah /order.',
      Markup.inlineKeyboard([
        Markup.button.callback('🏠 Kembali ke Menu Utama', 'main_menu')
      ])
    );
    
    return ctx.scene.leave();
    
  } catch (err) {
    console.error('Error pada payment action:', err);
    await ctx.answerCbQuery('Terjadi kesalahan. Silakan coba lagi.');
    await ctx.reply('Maaf, terjadi kesalahan saat memproses pembayaran. Silakan coba lagi nanti.');
    return ctx.scene.enter('gamehosting-list');
  }
});

module.exports = {
  gamehostingStage: {
    scenes: [gamehostingListScene, gamehostingOrderScene]
  }
};