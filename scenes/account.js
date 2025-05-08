const { Scenes, Markup } = require('telegraf');
const User = require('../models/User');
const Order = require('../models/Order');
const { Op } = require('sequelize');

// Scene untuk informasi akun
const accountInfoScene = new Scenes.BaseScene('account-info');

accountInfoScene.enter(async (ctx) => {
  try {
    // Cek user
    const telegramId = ctx.from.id;
    let user = await User.findOne({ where: { telegramId } });
    
    if (!user) {
      user = await User.create({
        telegramId,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
        lastActivity: new Date(),
        registeredAt: new Date(),
        balance: 0
      });
    } else {
      // Update last activity
      user.lastActivity = new Date();
      await user.save();
    }
    
    // Hitung jumlah pesanan
    const orders = await Order.findAll({ 
      where: { 
        userId: user.id 
      }
    });
    
    const activeOrders = orders.filter(order => order.status === 'completed').length;
    const totalOrders = orders.length;
    
    // Ambil informasi kontak
    const contactDetails = user.contactDetails || {};
    const email = contactDetails.email || 'Belum diatur';
    const phoneNumber = contactDetails.phoneNumber || 'Belum diatur';
    
    // Format informasi akun
    const accountMessage = 
      `👤 *Informasi Akun Anda*\n\n` +
      `🆔 ID: ${user.telegramId}\n` +
      `👤 Nama: ${user.firstName || ''} ${user.lastName || ''}\n` +
      `🔤 Username: ${user.username ? '@' + user.username : 'Tidak ada'}\n` +
      `📧 Email: ${email}\n` +
      `📱 Telepon: ${phoneNumber}\n` +
      `💰 Saldo: Rp ${parseFloat(user.balance || 0).toLocaleString('id-ID')}\n` +
      `📊 Total Pesanan: ${totalOrders}\n` +
      `🟢 Layanan Aktif: ${activeOrders}\n` +
      `📅 Terdaftar: ${new Date(user.registeredAt).toLocaleDateString('id-ID')}\n` +
      `📅 Aktivitas Terakhir: ${new Date(user.lastActivity).toLocaleDateString('id-ID')}`;
    
    await ctx.reply(accountMessage, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('💰 Isi Saldo', 'topup_balance')],
        [Markup.button.callback('✏️ Ubah Email', 'edit_email')],
        [Markup.button.callback('✏️ Ubah No. Telepon', 'edit_phone')],
        [Markup.button.callback('🔙 Kembali ke Menu', 'main_menu')]
      ])
    });
  } catch (err) {
    console.error('Error pada accountInfoScene:', err);
    await ctx.reply('Maaf, terjadi kesalahan. Silakan coba lagi nanti.');
  }
});

// Handler untuk edit email
accountInfoScene.action('edit_email', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.scene.enter('account-edit-email');
});

// Handler untuk edit telepon
accountInfoScene.action('edit_phone', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.scene.enter('account-edit-phone');
});

// Handler untuk top up saldo
accountInfoScene.action('topup_balance', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.scene.enter('account-topup');
});

accountInfoScene.action('main_menu', async (ctx) => {
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

// Scene untuk edit email
const accountEditEmailScene = new Scenes.BaseScene('account-edit-email');

accountEditEmailScene.enter(async (ctx) => {
  await ctx.reply(
    '✉️ *Ubah Alamat Email*\n\n' +
    'Silakan kirimkan alamat email baru Anda:',
    { parse_mode: 'Markdown' }
  );
});

accountEditEmailScene.on('text', async (ctx) => {
  try {
    const email = ctx.message.text.trim();
    
    // Validasi email (sederhana)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await ctx.reply('Format email tidak valid. Silakan masukkan email yang valid:');
      return;
    }
    
    // Update email
    const telegramId = ctx.from.id;
    const user = await User.findOne({ where: { telegramId } });
    
    if (!user) {
      await ctx.reply('Terjadi kesalahan. User tidak ditemukan.');
      return ctx.scene.enter('account-info');
    }
    
    // Update contact info
    const contactDetails = user.contactDetails || {};
    user.contactDetails = {
      ...contactDetails,
      email
    };
    
    await user.save();
    
    await ctx.reply(
      '✅ Email berhasil diperbarui!\n\n' +
      `Email baru: ${email}`,
      Markup.inlineKeyboard([
        Markup.button.callback('🔙 Kembali ke Informasi Akun', 'back_to_account')
      ])
    );
  } catch (err) {
    console.error('Error pada accountEditEmailScene text:', err);
    await ctx.reply('Maaf, terjadi kesalahan. Silakan coba lagi nanti.');
    return ctx.scene.enter('account-info');
  }
});

accountEditEmailScene.action('back_to_account', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.enter('account-info');
});

// Scene untuk edit nomor telepon
const accountEditPhoneScene = new Scenes.BaseScene('account-edit-phone');

accountEditPhoneScene.enter(async (ctx) => {
  await ctx.reply(
    '📱 *Ubah Nomor Telepon*\n\n' +
    'Silakan kirimkan nomor telepon baru Anda:',
    { parse_mode: 'Markdown' }
  );
});

accountEditPhoneScene.on('text', async (ctx) => {
  try {
    const phoneNumber = ctx.message.text.trim();
    
    // Validasi phone number (sederhana)
    const phoneRegex = /^[0-9+\s-]{10,15}$/;
    if (!phoneRegex.test(phoneNumber)) {
      await ctx.reply('Format nomor telepon tidak valid. Silakan masukkan nomor telepon yang valid (10-15 digit):');
      return;
    }
    
    // Update phone number
    const telegramId = ctx.from.id;
    const user = await User.findOne({ where: { telegramId } });
    
    if (!user) {
      await ctx.reply('Terjadi kesalahan. User tidak ditemukan.');
      return ctx.scene.enter('account-info');
    }
    
    // Update contact info
    const contactDetails = user.contactDetails || {};
    user.contactDetails = {
      ...contactDetails,
      phoneNumber
    };
    
    await user.save();
    
    await ctx.reply(
      '✅ Nomor telepon berhasil diperbarui!\n\n' +
      `Nomor telepon baru: ${phoneNumber}`,
      Markup.inlineKeyboard([
        Markup.button.callback('🔙 Kembali ke Informasi Akun', 'back_to_account')
      ])
    );
  } catch (err) {
    console.error('Error pada accountEditPhoneScene text:', err);
    await ctx.reply('Maaf, terjadi kesalahan. Silakan coba lagi nanti.');
    return ctx.scene.enter('account-info');
  }
});

accountEditPhoneScene.action('back_to_account', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.enter('account-info');
});

// Scene untuk top up saldo
const accountTopupScene = new Scenes.BaseScene('account-topup');

accountTopupScene.enter(async (ctx) => {
  await ctx.reply(
    '💰 *Top Up Saldo*\n\n' +
    'Silakan pilih nominal top up:',
    { 
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('Rp 100.000', 'topup_100000')],
        [Markup.button.callback('Rp 250.000', 'topup_250000')],
        [Markup.button.callback('Rp 500.000', 'topup_500000')],
        [Markup.button.callback('Rp 1.000.000', 'topup_1000000')],
        [Markup.button.callback('Jumlah Lainnya', 'topup_custom')],
        [Markup.button.callback('🔙 Batal', 'back_to_account')]
      ])
    }
  );
});

// Handler untuk nominal topup yang sudah ditentukan
accountTopupScene.action(/topup_(\d+)/, async (ctx) => {
  try {
    const amount = parseInt(ctx.match[1]);
    ctx.session.topupAmount = amount;
    
    await ctx.answerCbQuery();
    await ctx.reply(
      `💰 *Top Up Saldo Rp ${amount.toLocaleString('id-ID')}*\n\n` +
      'Silakan transfer ke rekening berikut:\n\n' +
      'Bank: BCA\n' +
      'No. Rekening: 1234567890\n' +
      'Atas Nama: PT. Hosting Indonesia\n\n' +
      'Bank: Mandiri\n' +
      'No. Rekening: 0987654321\n' +
      'Atas Nama: PT. Hosting Indonesia\n\n' +
      'Setelah melakukan pembayaran, silakan kirim bukti transfer (foto/screenshot)',
      { parse_mode: 'Markdown' }
    );
    
    ctx.scene.enter('account-topup-confirm');
    
  } catch (err) {
    console.error('Error pada accountTopupScene action topup:', err);
    await ctx.answerCbQuery('Terjadi kesalahan. Silakan coba lagi.');
  }
});

// Handler untuk nominal topup custom
accountTopupScene.action('topup_custom', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(
    '💰 *Top Up Saldo - Nominal Kustom*\n\n' +
    'Silakan ketik jumlah yang ingin Anda top up (minimal Rp 50.000):',
    { parse_mode: 'Markdown' }
  );
});

// Handler untuk input nominal custom
accountTopupScene.on('text', async (ctx) => {
  try {
    // Parse input menjadi angka
    const input = ctx.message.text.trim().replace(/[^\d]/g, '');
    const amount = parseInt(input);
    
    if (isNaN(amount) || amount < 50000) {
      await ctx.reply('Nominal tidak valid. Minimal top up adalah Rp 50.000. Silakan masukkan jumlah yang valid:');
      return;
    }
    
    ctx.session.topupAmount = amount;
    
    await ctx.reply(
      `💰 *Top Up Saldo Rp ${amount.toLocaleString('id-ID')}*\n\n` +
      'Silakan transfer ke rekening berikut:\n\n' +
      'Bank: BCA\n' +
      'No. Rekening: 1234567890\n' +
      'Atas Nama: PT. Hosting Indonesia\n\n' +
      'Bank: Mandiri\n' +
      'No. Rekening: 0987654321\n' +
      'Atas Nama: PT. Hosting Indonesia\n\n' +
      'Setelah melakukan pembayaran, silakan kirim bukti transfer (foto/screenshot)',
      { parse_mode: 'Markdown' }
    );
    
    ctx.scene.enter('account-topup-confirm');
    
  } catch (err) {
    console.error('Error pada accountTopupScene text:', err);
    await ctx.reply('Maaf, terjadi kesalahan. Silakan coba lagi nanti.');
    return ctx.scene.enter('account-info');
  }
});

accountTopupScene.action('back_to_account', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.enter('account-info');
});

// Scene untuk konfirmasi top up
const accountTopupConfirmScene = new Scenes.BaseScene('account-topup-confirm');

accountTopupConfirmScene.enter(async (ctx) => {
  if (!ctx.session.topupAmount) {
    await ctx.reply('Terjadi kesalahan. Silakan coba lagi dari awal.');
    return ctx.scene.enter('account-info');
  }
});

// Handler untuk menerima bukti pembayaran (foto)
accountTopupConfirmScene.on('photo', async (ctx) => {
  try {
    if (!ctx.session.topupAmount) {
      await ctx.reply('Terjadi kesalahan. Silakan coba lagi dari awal.');
      return ctx.scene.enter('account-info');
    }
    
    const amount = ctx.session.topupAmount;
    
    // Dapatkan file ID dari foto terbesar (kualitas terbaik)
    const photo = ctx.message.photo;
    const fileId = photo[photo.length - 1].file_id;
    
    // Simpan bukti transfer di user data
    const telegramId = ctx.from.id;
    const user = await User.findOne({ where: { telegramId } });
    
    if (!user) {
      await ctx.reply('Terjadi kesalahan. User tidak ditemukan.');
      return ctx.scene.enter('account-info');
    }
    
    // Simpan informasi topup request di database (misalnya di model TopupRequest)
    // Untuk sementara, kita bisa menyimpannya sebagai notes di user
    const topupRequests = user.topupRequests || [];
    topupRequests.push({
      amount,
      fileId,
      status: 'pending',
      requestedAt: new Date()
    });
    
    user.topupRequests = topupRequests;
    await user.save();
    
    // Kirim notifikasi ke admin (dalam kasus nyata, bisa kirim ke admin channel)
    console.log(`[ADMIN] New topup request: User ${user.telegramId} (${user.username || user.firstName}) requested ${amount}`);
    
    await ctx.reply(
      '✅ *Bukti Pembayaran Diterima*\n\n' +
      `Terima kasih telah mengirimkan bukti pembayaran untuk top up saldo sebesar Rp ${amount.toLocaleString('id-ID')}.\n\n` +
      'Tim kami akan memverifikasi pembayaran Anda dan memproses top up saldo Anda sesegera mungkin. ' +
      'Anda akan mendapatkan notifikasi ketika saldo Anda sudah ditambahkan.',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.callback('🔙 Kembali ke Informasi Akun', 'back_to_account')
        ])
      }
    );
    
  } catch (err) {
    console.error('Error pada accountTopupConfirmScene photo:', err);
    await ctx.reply('Maaf, terjadi kesalahan. Silakan coba lagi nanti.');
    return ctx.scene.enter('account-info');
  }
});

// Handler untuk menerima bukti pembayaran (dokumen)
accountTopupConfirmScene.on('document', async (ctx) => {
  try {
    if (!ctx.session.topupAmount) {
      await ctx.reply('Terjadi kesalahan. Silakan coba lagi dari awal.');
      return ctx.scene.enter('account-info');
    }
    
    const amount = ctx.session.topupAmount;
    const fileId = ctx.message.document.file_id;
    
    // Simpan bukti transfer di user data
    const telegramId = ctx.from.id;
    const user = await User.findOne({ where: { telegramId } });
    
    if (!user) {
      await ctx.reply('Terjadi kesalahan. User tidak ditemukan.');
      return ctx.scene.enter('account-info');
    }
    
    // Simpan informasi topup request di database (misalnya di model TopupRequest)
    // Untuk sementara, kita bisa menyimpannya sebagai notes di user
    const topupRequests = user.topupRequests || [];
    topupRequests.push({
      amount,
      fileId,
      status: 'pending',
      requestedAt: new Date()
    });
    
    user.topupRequests = topupRequests;
    await user.save();
    
    // Kirim notifikasi ke admin (dalam kasus nyata, bisa kirim ke admin channel)
    console.log(`[ADMIN] New topup request: User ${user.telegramId} (${user.username || user.firstName}) requested ${amount} (document)`);
    
    await ctx.reply(
      '✅ *Bukti Pembayaran Diterima*\n\n' +
      `Terima kasih telah mengirimkan bukti pembayaran untuk top up saldo sebesar Rp ${amount.toLocaleString('id-ID')}.\n\n` +
      'Tim kami akan memverifikasi pembayaran Anda dan memproses top up saldo Anda sesegera mungkin. ' +
      'Anda akan mendapatkan notifikasi ketika saldo Anda sudah ditambahkan.',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.callback('🔙 Kembali ke Informasi Akun', 'back_to_account')
        ])
      }
    );
    
  } catch (err) {
    console.error('Error pada accountTopupConfirmScene document:', err);
    await ctx.reply('Maaf, terjadi kesalahan. Silakan coba lagi nanti.');
    return ctx.scene.enter('account-info');
  }
});

accountTopupConfirmScene.action('back_to_account', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.enter('account-info');
});

accountTopupConfirmScene.command('cancel', async (ctx) => {
  await ctx.reply('Proses top up dibatalkan.');
  return ctx.scene.enter('account-info');
});

module.exports = {
  accountStage: {
    scenes: [accountInfoScene, accountEditEmailScene, accountEditPhoneScene, accountTopupScene, accountTopupConfirmScene]
  }
};