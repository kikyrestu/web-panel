require('dotenv').config();
const { Telegraf, Scenes, session, Markup } = require('telegraf');
const { sequelize } = require('./db');
const settingsService = require('./services/settings');
const { syncModels } = require('./models'); // Import fungsi syncModels dari models/index.js

// Import scenes
const { vpsStage } = require('./scenes/vps');
const { webhostingStage } = require('./scenes/webhosting');
const { gamehostingStage } = require('./scenes/gamehosting');
const { orderStage } = require('./scenes/order');
const { accountStage } = require('./scenes/account');

// Fungsi untuk menginisialisasi dan menjalankan bot
async function startBot() {
  try {
    // Sinkronisasi model dengan database terlebih dahulu
    console.log('Menyinkronkan model database...');
    await syncModels();
    console.log('Model database berhasil disinkronkan');
    
    // Inisialisasi pengaturan dari env ke database
    await settingsService.initSettings();
    
    // Ambil BOT_TOKEN dari database
    const botToken = await settingsService.getSetting('BOT_TOKEN', process.env.BOT_TOKEN);
    
    if (!botToken) {
      console.error('BOT_TOKEN tidak ditemukan di pengaturan atau .env');
      process.exit(1);
    }
    
    // Inisialisasi bot
    const bot = new Telegraf(botToken);
    
    // Middleware untuk session
    bot.use(session());
    
    // Gabungkan semua scenes
    const stage = new Scenes.Stage([
      ...vpsStage.scenes,
      ...webhostingStage.scenes,
      ...gamehostingStage.scenes,
      ...orderStage.scenes,
      ...accountStage.scenes
    ]);
    
    // Gunakan stage middleware
    bot.use(stage.middleware());

    // Command handler untuk mendapatkan ID Telegram (untuk setup admin)
    bot.command('getmyid', (ctx) => {
      ctx.reply(`ID Telegram Anda adalah: ${ctx.from.id}\nUsername: @${ctx.from.username || 'tidak ada'}\n\nSimpan ID ini di pengaturan admin sebagai ADMIN_ID`);
    });

    // Command handler untuk mulai bot
    bot.start(async (ctx) => {
      // Ambil nama situs dari pengaturan
      const siteName = await settingsService.getSetting('SITE_NAME', 'HostingBot');
      
      await ctx.reply(
        `Selamat datang di ${siteName}! 🚀\n\nSaya adalah bot yang akan membantu Anda membeli layanan hosting:\n\n` +
        `- VPS/RDP 💻\n` +
        `- Web Hosting 🌐\n` +
        `- Game Server Hosting 🎮\n\n` +
        `Silakan pilih layanan yang Anda butuhkan dengan perintah berikut:\n\n` +
        `/vps - Lihat paket VPS/RDP\n` +
        `/webhosting - Lihat paket Web Hosting\n` +
        `/gamehosting - Lihat paket Game Server Hosting\n` +
        `/order - Lihat pesanan Anda\n` +
        `/account - Kelola akun Anda`,
        Markup.keyboard([
          ['💻 VPS/RDP', '🌐 Web Hosting', '🎮 Game Hosting'],
          ['📋 Pesanan Saya', '👤 Akun Saya', '❓ Bantuan']
        ]).resize()
      );
    });

    // Command handler untuk help
    bot.help(async (ctx) => {
      const siteName = await settingsService.getSetting('SITE_NAME', 'HostingBot');
      // Ambil username admin dari pengaturan
      const adminUsername = await settingsService.getSetting('ADMIN_USERNAME', 'admin');
      
      await ctx.reply(
        `🔍 *BANTUAN*\n\n` +
        `Berikut adalah perintah-perintah yang dapat Anda gunakan:\n\n` +
        `• /start - Mulai bot dan lihat menu utama\n` +
        `• /vps - Lihat dan pesan paket VPS/RDP\n` +
        `• /webhosting - Lihat dan pesan paket Web Hosting\n` +
        `• /gamehosting - Lihat dan pesan paket Game Server Hosting\n` +
        `• /order - Lihat pesanan Anda\n` +
        `• /account - Kelola akun Anda\n` +
        `• /help - Tampilkan bantuan ini\n\n` +
        `Jika Anda membutuhkan bantuan lebih lanjut, silakan hubungi admin kami di @${adminUsername}`,
        { parse_mode: 'Markdown' }
      );
    });

    // Command handler untuk layanan VPS/RDP
    bot.command('vps', (ctx) => ctx.scene.enter('vps-list'));
    bot.hears('💻 VPS/RDP', (ctx) => ctx.scene.enter('vps-list'));
    
    // Command handler untuk layanan Web Hosting
    bot.command('webhosting', (ctx) => ctx.scene.enter('webhosting-list'));
    bot.hears('🌐 Web Hosting', (ctx) => ctx.scene.enter('webhosting-list'));
    
    // Command handler untuk layanan Game Hosting
    bot.command('gamehosting', (ctx) => ctx.scene.enter('gamehosting-list'));
    bot.hears('🎮 Game Hosting', (ctx) => ctx.scene.enter('gamehosting-list'));
    
    // Command handler untuk melihat pesanan
    bot.command('order', (ctx) => ctx.scene.enter('order-list'));
    bot.hears('📋 Pesanan Saya', (ctx) => ctx.scene.enter('order-list'));
    
    // Command handler untuk manajemen akun
    bot.command('account', (ctx) => ctx.scene.enter('account-info'));
    bot.hears('👤 Akun Saya', (ctx) => ctx.scene.enter('account-info'));
    
    // Command handler untuk konfirmasi pembayaran
    bot.command('confirm_payment', (ctx) => {
      ctx.reply(
        '💳 *Konfirmasi Pembayaran*\n\n' +
        'Untuk mengonfirmasi pembayaran, silakan gunakan perintah /order terlebih dahulu, kemudian pilih pesanan yang ingin Anda konfirmasi pembayarannya.',
        { parse_mode: 'Markdown' }
      );
    });
    
    // Hears handler untuk bantuan
    bot.hears('❓ Bantuan', async (ctx) => {
      const siteName = await settingsService.getSetting('SITE_NAME', 'HostingBot');
      const adminUsername = await settingsService.getSetting('ADMIN_USERNAME', 'admin');
      
      await ctx.reply(
        `🔍 *BANTUAN*\n\n` +
        `Berikut adalah perintah-perintah yang dapat Anda gunakan:\n\n` +
        `• /start - Mulai bot dan lihat menu utama\n` +
        `• /vps - Lihat dan pesan paket VPS/RDP\n` +
        `• /webhosting - Lihat dan pesan paket Web Hosting\n` +
        `• /gamehosting - Lihat dan pesan paket Game Server Hosting\n` +
        `• /order - Lihat pesanan Anda\n` +
        `• /account - Kelola akun Anda\n` +
        `• /help - Tampilkan bantuan ini\n\n` +
        `Jika Anda membutuhkan bantuan lebih lanjut, silakan hubungi admin kami di @${adminUsername}`,
        { parse_mode: 'Markdown' }
      );
    });
    
    // Handler untuk pesan yang tidak dikenali
    bot.on('text', (ctx) => {
      ctx.reply(
        'Maaf, saya tidak mengerti perintah tersebut. Gunakan /help untuk melihat daftar perintah yang tersedia.'
      );
    });
    
    // Error handler
    bot.catch((err, ctx) => {
      console.error(`Error untuk ${ctx.updateType}:`, err);
      ctx.reply('Terjadi kesalahan. Silakan coba lagi nanti atau hubungi admin kami.');
    });
    
    // Jalankan bot
    await bot.launch();
    console.log('Bot berhasil dijalankan!');
    console.log('Gunakan perintah /getmyid untuk mendapatkan ID Telegram Anda');
    
    // Log info tambahan
    const now = new Date();
    console.log(`Waktu mulai: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`);
    console.log(`Node environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Tambahkan fungsi untuk restart bot (akan digunakan saat pengaturan BOT_TOKEN diubah)
    global.restartBot = async () => {
      try {
        console.log('Restarting bot...');
        await bot.stop('SIGTERM');
        settingsService.clearCache(); // Clear cache untuk memastikan pengaturan terbaru diambil
        startBot();
      } catch (error) {
        console.error('Error restarting bot:', error);
      }
    };
    
    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
    
  } catch (error) {
    console.error('Gagal menjalankan bot:', error);
  }
}

// Jalankan bot
startBot();