const { Scenes, Markup } = require('telegraf');
const WebHostingPackage = require('../models/WebHostingPackage');
const User = require('../models/User');
const Order = require('../models/Order');

// Scene untuk menampilkan daftar paket Web Hosting
const webhostingListScene = new Scenes.BaseScene('webhosting-list');

webhostingListScene.enter(async (ctx) => {
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
    
    // Ambil paket Web Hosting yang tersedia
    const webhostingPackages = await WebHostingPackage.find({ isAvailable: true }).sort('sortOrder');
    
    if (webhostingPackages.length === 0) {
      return ctx.reply('Maaf, saat ini tidak ada paket Web Hosting yang tersedia. Silakan coba lagi nanti atau hubungi admin kami.');
    }
    
    await ctx.reply(
      '🌐 *Daftar Paket Web Hosting*\n\n' +
      'Silakan pilih paket Web Hosting yang sesuai dengan kebutuhan Anda:',
      { parse_mode: 'Markdown' }
    );
    
    // Tampilkan setiap paket dengan tombol detail
    for (const pkg of webhostingPackages) {
      const discountText = pkg.discount && new Date(pkg.discount.validUntil) > new Date() 
        ? `🔥 Diskon ${pkg.discount.percentage}% hingga ${new Date(pkg.discount.validUntil).toLocaleDateString('id-ID')}!` 
        : '';
      
      const message = 
        `*${pkg.name}*\n` +
        `${pkg.description || ''}\n\n` +
        `💾 Storage: ${pkg.specifications.storage.size} GB ${pkg.specifications.storage.type}\n` +
        `🌐 Bandwidth: ${pkg.specifications.bandwidth.unlimited ? 'Unlimited' : pkg.specifications.bandwidth.limit + ' GB'}\n` +
        `🌍 Domain: ${pkg.specifications.domains.included} domain\n` +
        `📊 Database: ${pkg.specifications.databases.unlimited ? 'Unlimited MySQL' : pkg.specifications.databases.mysql + ' MySQL'}\n` +
        `📧 Email: ${pkg.specifications.emailAccounts.unlimited ? 'Unlimited email accounts' : pkg.specifications.emailAccounts.count + ' email accounts'}\n\n` +
        `💰 Harga: Rp ${pkg.pricing.monthly.toLocaleString('id-ID')}/bulan\n` +
        (discountText ? `${discountText}\n` : '');
      
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.callback('🛒 Pesan Sekarang', `order_webhosting_${pkg._id}`),
          Markup.button.callback('ℹ️ Detail Lebih Lanjut', `webhosting_detail_${pkg._id}`)
        ])
      });
    }
    
    await ctx.reply(
      'Gunakan tombol di bawah untuk melihat paket lain atau kembali ke menu utama:',
      Markup.inlineKeyboard([
        Markup.button.callback('💻 VPS/RDP', 'show_vps'),
        Markup.button.callback('🎮 Game Hosting', 'show_gamehosting'),
        Markup.button.callback('🏠 Menu Utama', 'main_menu')
      ])
    );
    
  } catch (err) {
    console.error('Error pada webhostingListScene:', err);
    await ctx.reply('Maaf, terjadi kesalahan. Silakan coba lagi nanti.');
  }
});

// Handler untuk action buttons
webhostingListScene.action(/order_webhosting_(.+)/, async (ctx) => {
  try {
    const packageId = ctx.match[1];
    ctx.session.selectedPackage = { id: packageId, type: 'WebHosting' };
    await ctx.answerCbQuery();
    return ctx.scene.enter('webhosting-order');
  } catch (err) {
    console.error('Error pada action order_webhosting:', err);
    await ctx.answerCbQuery('Terjadi kesalahan. Silakan coba lagi.');
  }
});

webhostingListScene.action(/webhosting_detail_(.+)/, async (ctx) => {
  try {
    const packageId = ctx.match[1];
    const webhostingPackage = await WebHostingPackage.findById(packageId);
    
    if (!webhostingPackage) {
      await ctx.answerCbQuery('Paket tidak ditemukan');
      return;
    }
    
    // Format fitur-fitur
    let featuresText = '✨ *Fitur-fitur*:\n';
    
    if (webhostingPackage.features.cpanel) {
      featuresText += '- cPanel Control Panel\n';
    }
    
    if (webhostingPackage.features.ssl && webhostingPackage.features.ssl.included) {
      featuresText += `- SSL ${webhostingPackage.features.ssl.type || 'Certificate'}\n`;
    }
    
    if (webhostingPackage.features.backups && webhostingPackage.features.backups.included) {
      featuresText += `- Backup ${webhostingPackage.features.backups.frequency || 'Regular'}\n`;
    }
    
    if (webhostingPackage.features.wordpress) {
      if (webhostingPackage.features.wordpress.oneClick) {
        featuresText += '- WordPress One-Click Install\n';
      }
      
      if (webhostingPackage.features.wordpress.staging) {
        featuresText += '- WordPress Staging\n';
      }
    }
    
    // Format harga dengan diskon jika ada
    let pricingText = `💰 *Harga*:\n- Bulanan: Rp ${webhostingPackage.pricing.monthly.toLocaleString('id-ID')}\n`;
    
    if (webhostingPackage.pricing.quarterly) {
      pricingText += `- 3 Bulan: Rp ${webhostingPackage.pricing.quarterly.toLocaleString('id-ID')}\n`;
    }
    
    if (webhostingPackage.pricing.yearly) {
      pricingText += `- Tahunan: Rp ${webhostingPackage.pricing.yearly.toLocaleString('id-ID')}\n`;
    }
    
    if (webhostingPackage.pricing.setup > 0) {
      pricingText += `- Biaya Setup: Rp ${webhostingPackage.pricing.setup.toLocaleString('id-ID')}\n`;
    }
    
    // Tambahkan informasi diskon jika ada
    if (webhostingPackage.discount && new Date(webhostingPackage.discount.validUntil) > new Date()) {
      pricingText += `\n🔥 *Diskon ${webhostingPackage.discount.percentage}%* hingga ${new Date(webhostingPackage.discount.validUntil).toLocaleDateString('id-ID')}!\n`;
    }
    
    const detailMessage = 
      `🌐 *Detail Paket Web Hosting: ${webhostingPackage.name}*\n\n` +
      `${webhostingPackage.description || ''}\n\n` +
      `💾 *Spesifikasi*:\n` +
      `- Storage: ${webhostingPackage.specifications.storage.size} GB ${webhostingPackage.specifications.storage.type}\n` +
      `- Bandwidth: ${webhostingPackage.specifications.bandwidth.unlimited ? 'Unlimited' : webhostingPackage.specifications.bandwidth.limit + ' GB'}\n` +
      `- Domain: ${webhostingPackage.specifications.domains.included} domain termasuk\n` +
      `  (Domain tambahan: Rp ${webhostingPackage.specifications.domains.addon ? webhostingPackage.specifications.domains.addon.toLocaleString('id-ID') : '0'}/domain)\n` +
      `- Database: ${webhostingPackage.specifications.databases.unlimited ? 'Unlimited MySQL' : webhostingPackage.specifications.databases.mysql + ' MySQL databases'}\n` +
      `- Email: ${webhostingPackage.specifications.emailAccounts.unlimited ? 'Unlimited email accounts' : webhostingPackage.specifications.emailAccounts.count + ' email accounts'}\n\n` +
      `${featuresText}\n` +
      `${pricingText}\n` +
      `Cocok untuk: ${
        webhostingPackage.category === 'Basic' ? 'Blog pribadi, website portofolio, atau website sederhana' : 
        webhostingPackage.category === 'Premium' ? 'Website bisnis kecil dengan traffic sedang' :
        webhostingPackage.category === 'Business' ? 'E-commerce dan website bisnis dengan traffic tinggi' :
        'Website enterprise dan aplikasi web kompleks'
      }`;
    
    await ctx.answerCbQuery();
    await ctx.reply(detailMessage, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        Markup.button.callback('🛒 Pesan Sekarang', `order_webhosting_${packageId}`),
        Markup.button.callback('◀️ Kembali', 'back_to_webhosting_list')
      ])
    });
  } catch (err) {
    console.error('Error pada action webhosting_detail:', err);
    await ctx.answerCbQuery('Terjadi kesalahan. Silakan coba lagi.');
  }
});

webhostingListScene.action('back_to_webhosting_list', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.enter('webhosting-list');
});

webhostingListScene.action('show_vps', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.enter('vps-list');
});

webhostingListScene.action('show_gamehosting', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.enter('gamehosting-list');
});

webhostingListScene.action('main_menu', async (ctx) => {
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

// Scene untuk proses pemesanan Web Hosting
const webhostingOrderScene = new Scenes.BaseScene('webhosting-order');

webhostingOrderScene.enter(async (ctx) => {
  try {
    if (!ctx.session.selectedPackage || !ctx.session.selectedPackage.id) {
      await ctx.reply('Maaf, terjadi kesalahan. Silakan pilih paket lagi.');
      return ctx.scene.enter('webhosting-list');
    }
    
    const packageId = ctx.session.selectedPackage.id;
    const webhostingPackage = await WebHostingPackage.findById(packageId);
    
    if (!webhostingPackage) {
      await ctx.reply('Maaf, paket yang Anda pilih tidak tersedia.');
      return ctx.scene.enter('webhosting-list');
    }
    
    // Simpan data paket di session
    ctx.session.packageData = {
      id: webhostingPackage._id,
      name: webhostingPackage.name,
      type: 'WebHosting',
      model: 'WebHostingPackage',
      pricing: webhostingPackage.pricing,
      discount: webhostingPackage.discount
    };
    
    await ctx.reply(
      `Anda akan memesan: *${webhostingPackage.name}*\n\n` +
      `Silakan pilih periode langganan:`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('Bulanan - Rp ' + webhostingPackage.pricing.monthly.toLocaleString('id-ID'), 'billing_monthly')],
          webhostingPackage.pricing.quarterly ? [Markup.button.callback('3 Bulan - Rp ' + webhostingPackage.pricing.quarterly.toLocaleString('id-ID'), 'billing_quarterly')] : [],
          webhostingPackage.pricing.yearly ? [Markup.button.callback('Tahunan - Rp ' + webhostingPackage.pricing.yearly.toLocaleString('id-ID'), 'billing_yearly')] : [],
          [Markup.button.callback('❌ Batalkan', 'cancel_order')]
        ].filter(row => row.length > 0)) // Filter empty rows
      }
    );
  } catch (err) {
    console.error('Error pada webhostingOrderScene enter:', err);
    await ctx.reply('Maaf, terjadi kesalahan. Silakan coba lagi nanti.');
    return ctx.scene.enter('webhosting-list');
  }
});

webhostingOrderScene.action(/billing_(.+)/, async (ctx) => {
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
    await ctx.reply('Silakan masukkan nama domain yang akan digunakan (contoh: mywebsite.com):');
    ctx.wizard.next();
  } catch (err) {
    console.error('Error pada billing action:', err);
    await ctx.answerCbQuery('Terjadi kesalahan. Silakan coba lagi.');
  }
});

webhostingOrderScene.action('cancel_order', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Pemesanan dibatalkan.');
  return ctx.scene.enter('webhosting-list');
});

webhostingOrderScene.on('text', async (ctx) => {
  // Simpan domain
  const domainName = ctx.message.text.trim().toLowerCase();
  
  // Validasi format domain (sederhana)
  const domainRegex = /^([a-z0-9]([-a-z0-9]*[a-z0-9])?\.)+[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;
  if (!domainRegex.test(domainName)) {
    await ctx.reply('Format domain tidak valid. Silakan masukkan nama domain yang valid (contoh: mywebsite.com):');
    return;
  }
  
  ctx.session.domainName = domainName;
  
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

webhostingOrderScene.action(/payment_(.+)/, async (ctx) => {
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
      orderType: 'WebHosting',
      packageId: ctx.session.packageData.id,
      packageModel: ctx.session.packageData.model,
      domainName: ctx.session.domainName,
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
      `Layanan: ${ctx.session.packageData.name}\n` +
      `Domain: ${ctx.session.domainName}\n` +
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
    return ctx.scene.enter('webhosting-list');
  }
});

module.exports = {
  webhostingStage: {
    scenes: [webhostingListScene, webhostingOrderScene]
  }
};