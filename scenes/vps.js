const { Scenes, Markup } = require('telegraf');
const VpsPackage = require('../models/VpsPackage');
const User = require('../models/User');
const Order = require('../models/Order');

// Scene untuk menampilkan daftar paket VPS
const vpsListScene = new Scenes.BaseScene('vps-list');

vpsListScene.enter(async (ctx) => {
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
    
    // Ambil paket VPS yang tersedia
    const vpsPackages = await VpsPackage.find({ isAvailable: true }).sort('sortOrder');
    
    if (vpsPackages.length === 0) {
      return ctx.reply('Maaf, saat ini tidak ada paket VPS yang tersedia. Silakan coba lagi nanti atau hubungi admin kami.');
    }
    
    await ctx.reply(
      '🖥️ *Daftar Paket VPS/RDP*\n\n' +
      'Silakan pilih paket VPS/RDP yang sesuai dengan kebutuhan Anda:',
      { parse_mode: 'Markdown' }
    );
    
    // Tampilkan setiap paket dengan tombol detail
    for (const pkg of vpsPackages) {
      const discountText = pkg.discount && new Date(pkg.discount.validUntil) > new Date() 
        ? `🔥 Diskon ${pkg.discount.percentage}% hingga ${new Date(pkg.discount.validUntil).toLocaleDateString('id-ID')}!` 
        : '';
      
      const message = 
        `*${pkg.name}*\n` +
        `${pkg.description || ''}\n\n` +
        `💻 CPU: ${pkg.specifications.cpu.cores} Cores (${pkg.specifications.cpu.description})\n` +
        `🧠 RAM: ${pkg.specifications.ram.size} GB\n` +
        `💾 Storage: ${pkg.specifications.storage.size} GB ${pkg.specifications.storage.type}\n` +
        `🌐 Bandwidth: ${pkg.specifications.bandwidth.unlimited ? 'Unlimited' : pkg.specifications.bandwidth.limit + ' GB'}\n\n` +
        `💰 Harga: Rp ${pkg.pricing.monthly.toLocaleString('id-ID')}/bulan\n` +
        (discountText ? `${discountText}\n` : '');
      
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.callback('🛒 Pesan Sekarang', `order_vps_${pkg._id}`),
          Markup.button.callback('ℹ️ Detail Lebih Lanjut', `vps_detail_${pkg._id}`)
        ])
      });
    }
    
    await ctx.reply(
      'Gunakan tombol di bawah untuk melihat paket lain atau kembali ke menu utama:',
      Markup.inlineKeyboard([
        Markup.button.callback('🌐 Web Hosting', 'show_webhosting'),
        Markup.button.callback('🎮 Game Hosting', 'show_gamehosting'),
        Markup.button.callback('🏠 Menu Utama', 'main_menu')
      ])
    );
    
  } catch (err) {
    console.error('Error pada vpsListScene:', err);
    await ctx.reply('Maaf, terjadi kesalahan. Silakan coba lagi nanti.');
  }
});

// Handler untuk action buttons
vpsListScene.action(/order_vps_(.+)/, async (ctx) => {
  try {
    const packageId = ctx.match[1];
    ctx.session.selectedPackage = { id: packageId, type: 'VPS' };
    await ctx.answerCbQuery();
    return ctx.scene.enter('vps-order');
  } catch (err) {
    console.error('Error pada action order_vps:', err);
    await ctx.answerCbQuery('Terjadi kesalahan. Silakan coba lagi.');
  }
});

vpsListScene.action(/vps_detail_(.+)/, async (ctx) => {
  try {
    const packageId = ctx.match[1];
    const vpsPackage = await VpsPackage.findById(packageId);
    
    if (!vpsPackage) {
      await ctx.answerCbQuery('Paket tidak ditemukan');
      return;
    }
    
    // Format lokasi server jika ada
    const locationText = vpsPackage.location && vpsPackage.location.length > 0
      ? `🌍 *Lokasi Server*: ${vpsPackage.location.join(', ')}\n\n`
      : '';
      
    // Format OS yang tersedia
    const osText = vpsPackage.specifications.os && vpsPackage.specifications.os.length > 0
      ? `💿 *OS yang Tersedia*:\n${vpsPackage.specifications.os.map(os => `- ${os.name} ${os.version}`).join('\n')}\n\n`
      : '';
      
    // Format fitur tambahan
    const featuresText = vpsPackage.features && vpsPackage.features.length > 0
      ? `✨ *Fitur Tambahan*:\n${vpsPackage.features.map(feature => `- ${feature}`).join('\n')}\n\n`
      : '';
    
    // Format harga dengan diskon jika ada
    let pricingText = `💰 *Harga*:\n- Bulanan: Rp ${vpsPackage.pricing.monthly.toLocaleString('id-ID')}\n`;
    
    if (vpsPackage.pricing.quarterly) {
      pricingText += `- 3 Bulan: Rp ${vpsPackage.pricing.quarterly.toLocaleString('id-ID')}\n`;
    }
    
    if (vpsPackage.pricing.yearly) {
      pricingText += `- Tahunan: Rp ${vpsPackage.pricing.yearly.toLocaleString('id-ID')}\n`;
    }
    
    if (vpsPackage.pricing.setup > 0) {
      pricingText += `- Biaya Setup: Rp ${vpsPackage.pricing.setup.toLocaleString('id-ID')}\n`;
    }
    
    // Tambahkan informasi diskon jika ada
    if (vpsPackage.discount && new Date(vpsPackage.discount.validUntil) > new Date()) {
      pricingText += `\n🔥 *Diskon ${vpsPackage.discount.percentage}%* hingga ${new Date(vpsPackage.discount.validUntil).toLocaleDateString('id-ID')}!\n`;
    }
    
    const detailMessage = 
      `🖥️ *Detail Paket VPS: ${vpsPackage.name}*\n\n` +
      `${vpsPackage.description || ''}\n\n` +
      `💻 *Spesifikasi*:\n` +
      `- CPU: ${vpsPackage.specifications.cpu.cores} Cores (${vpsPackage.specifications.cpu.description})\n` +
      `- RAM: ${vpsPackage.specifications.ram.size} GB\n` +
      `- Storage: ${vpsPackage.specifications.storage.size} GB ${vpsPackage.specifications.storage.type}\n` +
      `- Bandwidth: ${vpsPackage.specifications.bandwidth.unlimited ? 'Unlimited' : vpsPackage.specifications.bandwidth.limit + ' GB'}\n\n` +
      `${osText}` +
      `${locationText}` +
      `${featuresText}` +
      `${pricingText}\n` +
      `Cocok untuk: ${vpsPackage.category === 'VPS' ? 'Hosting aplikasi, database, atau project development' : 
         vpsPackage.category === 'RDP' ? 'Remote desktop, aplikasi Windows' : 'Aplikasi cloud-native dan scalable'}`;
    
    await ctx.answerCbQuery();
    await ctx.reply(detailMessage, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        Markup.button.callback('🛒 Pesan Sekarang', `order_vps_${packageId}`),
        Markup.button.callback('◀️ Kembali', 'back_to_vps_list')
      ])
    });
  } catch (err) {
    console.error('Error pada action vps_detail:', err);
    await ctx.answerCbQuery('Terjadi kesalahan. Silakan coba lagi.');
  }
});

vpsListScene.action('back_to_vps_list', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.enter('vps-list');
});

vpsListScene.action('show_webhosting', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.enter('webhosting-list');
});

vpsListScene.action('show_gamehosting', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.enter('gamehosting-list');
});

vpsListScene.action('main_menu', async (ctx) => {
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

// Scene untuk proses pemesanan VPS
const vpsOrderScene = new Scenes.BaseScene('vps-order');

vpsOrderScene.enter(async (ctx) => {
  try {
    if (!ctx.session.selectedPackage || !ctx.session.selectedPackage.id) {
      await ctx.reply('Maaf, terjadi kesalahan. Silakan pilih paket lagi.');
      return ctx.scene.enter('vps-list');
    }
    
    const packageId = ctx.session.selectedPackage.id;
    const vpsPackage = await VpsPackage.findById(packageId);
    
    if (!vpsPackage) {
      await ctx.reply('Maaf, paket yang Anda pilih tidak tersedia.');
      return ctx.scene.enter('vps-list');
    }
    
    // Simpan data paket di session
    ctx.session.packageData = {
      id: vpsPackage._id,
      name: vpsPackage.name,
      type: 'VPS',
      model: 'VpsPackage',
      pricing: vpsPackage.pricing,
      discount: vpsPackage.discount
    };
    
    await ctx.reply(
      `Anda akan memesan: *${vpsPackage.name}*\n\n` +
      `Silakan pilih periode langganan:`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('Bulanan - Rp ' + vpsPackage.pricing.monthly.toLocaleString('id-ID'), 'billing_monthly')],
          vpsPackage.pricing.quarterly ? [Markup.button.callback('3 Bulan - Rp ' + vpsPackage.pricing.quarterly.toLocaleString('id-ID'), 'billing_quarterly')] : [],
          vpsPackage.pricing.yearly ? [Markup.button.callback('Tahunan - Rp ' + vpsPackage.pricing.yearly.toLocaleString('id-ID'), 'billing_yearly')] : [],
          [Markup.button.callback('❌ Batalkan', 'cancel_order')]
        ].filter(row => row.length > 0)) // Filter empty rows
      }
    );
  } catch (err) {
    console.error('Error pada vpsOrderScene enter:', err);
    await ctx.reply('Maaf, terjadi kesalahan. Silakan coba lagi nanti.');
    return ctx.scene.enter('vps-list');
  }
});

vpsOrderScene.action(/billing_(.+)/, async (ctx) => {
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
    await ctx.reply('Silakan berikan nama untuk server Anda (contoh: myserver):');
    ctx.wizard.next();
  } catch (err) {
    console.error('Error pada billing action:', err);
    await ctx.answerCbQuery('Terjadi kesalahan. Silakan coba lagi.');
  }
});

vpsOrderScene.action('cancel_order', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Pemesanan dibatalkan.');
  return ctx.scene.enter('vps-list');
});

vpsOrderScene.on('text', async (ctx) => {
  // Simpan nama server
  ctx.session.serverName = ctx.message.text;
  
  // Pilih OS untuk server
  const vpsPackage = await VpsPackage.findById(ctx.session.packageData.id);
  
  if (vpsPackage.specifications.os && vpsPackage.specifications.os.length > 0) {
    const osButtons = vpsPackage.specifications.os.map(os => 
      Markup.button.callback(`${os.name} ${os.version}`, `os_${os.name}_${os.version}`)
    );
    
    await ctx.reply(
      'Silakan pilih sistem operasi:',
      Markup.inlineKeyboard([...osButtons], { columns: 1 })
    );
  } else {
    // Jika tidak ada OS yang tersedia, langsung ke metode pembayaran
    await ctx.reply(
      'Silakan pilih metode pembayaran:',
      Markup.inlineKeyboard([
        [Markup.button.callback('Transfer Bank', 'payment_bank_transfer')],
        [Markup.button.callback('E-Wallet (OVO/GoPay/DANA)', 'payment_e-wallet')],
        [Markup.button.callback('Kartu Kredit/Debit', 'payment_credit_card')],
        [Markup.button.callback('Saldo Akun', 'payment_balance')]
      ])
    );
  }
});

vpsOrderScene.action(/os_(.+)_(.+)/, async (ctx) => {
  // Simpan pilihan OS
  const osName = ctx.match[1];
  const osVersion = ctx.match[2];
  ctx.session.selectedOs = { name: osName, version: osVersion };
  
  await ctx.answerCbQuery();
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

vpsOrderScene.action(/payment_(.+)/, async (ctx) => {
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
      orderType: 'VPS',
      packageId: ctx.session.packageData.id,
      packageModel: ctx.session.packageData.model,
      serviceName: ctx.session.serverName,
      billingCycle: ctx.session.billingCycle,
      amount: ctx.session.amount,
      paymentMethod: paymentMethod,
      status: 'pending',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 jam dari sekarang
    });
    
    // Jika ada OS yang dipilih
    if (ctx.session.selectedOs) {
      newOrder.serverDetails = {
        hostname: ctx.session.serverName
      };
    }
    
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
      `Layanan: ${ctx.session.packageData.name}\n` +
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
    return ctx.scene.enter('vps-list');
  }
});

module.exports = {
  vpsStage: {
    scenes: [vpsListScene, vpsOrderScene]
  }
};