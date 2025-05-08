// Settings controller
const { Setting } = require('../../models');

// Menampilkan semua pengaturan berdasarkan kategori
exports.showSettings = async (req, res) => {
  try {
    const category = req.query.category || null;
    const settings = await Setting.getSettingsByCategory(category);
    
    // Grup pengaturan berdasarkan kategori
    const groupedSettings = settings.reduce((groups, setting) => {
      const category = setting.category || 'general';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(setting);
      return groups;
    }, {});
    
    // Render halaman pengaturan
    res.render('settings/index', {
      title: 'Pengaturan Sistem',
      groupedSettings,
      currentCategory: category,
      categories: Object.keys(groupedSettings)
    });
  } catch (error) {
    console.error('Error menampilkan pengaturan:', error);
    req.flash('error_msg', 'Terjadi kesalahan saat mengambil pengaturan');
    res.redirect('/dashboard');
  }
};

// API endpoint untuk mendapatkan semua pengaturan
exports.apiGetSettings = async (req, res) => {
  try {
    const category = req.query.category || null;
    const settings = await Setting.getSettingsByCategory(category);
    
    // Jangan tampilkan nilai untuk tipe password kecuali secara eksplisit diminta
    const safeSettings = settings.map(setting => {
      const plainSetting = setting.get({ plain: true });
      if (plainSetting.type === 'password' && !req.query.includePasswords) {
        plainSetting.value = plainSetting.value ? '******' : '';
      }
      return plainSetting;
    });
    
    res.json({ success: true, settings: safeSettings });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengambil pengaturan' });
  }
};

// API endpoint untuk mendapatkan pengaturan berdasarkan key
exports.apiGetSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await Setting.findByPk(key);
    
    if (!setting) {
      return res.status(404).json({ success: false, message: 'Pengaturan tidak ditemukan' });
    }
    
    const plainSetting = setting.get({ plain: true });
    if (plainSetting.type === 'password' && !req.query.includePassword) {
      plainSetting.value = plainSetting.value ? '******' : '';
    }
    
    res.json({ success: true, setting: plainSetting });
  } catch (error) {
    console.error(`Error getting setting ${req.params.key}:`, error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengambil pengaturan' });
  }
};

// API endpoint untuk memperbarui pengaturan
exports.apiUpdateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, type, category, description, isPublic } = req.body;
    
    // Jika nilai tidak diubah untuk pengaturan tipe password, jangan update
    const currentSetting = await Setting.findByPk(key);
    if (currentSetting?.type === 'password' && value === '******') {
      return res.json({ 
        success: true, 
        setting: currentSetting,
        message: 'Nilai pengaturan tidak diubah' 
      });
    }
    
    const setting = await Setting.updateSetting(key, value, {
      type,
      category,
      description,
      isPublic
    });
    
    // Jika BOT_TOKEN diubah, restart bot
    if (key === 'BOT_TOKEN' && global.restartBot) {
      try {
        // Jalankan restart bot secara asinkron agar respons API tetap cepat
        setTimeout(() => {
          global.restartBot()
            .then(() => console.log('Bot berhasil direstart setelah perubahan BOT_TOKEN'))
            .catch(err => console.error('Gagal merestart bot:', err));
        }, 1000);
        
        console.log('Bot token diubah, bot akan direstart...');
      } catch (error) {
        console.error('Error saat mencoba merestart bot:', error);
      }
    }
    
    res.json({ 
      success: true, 
      setting,
      message: `Pengaturan "${key}" berhasil diperbarui${key === 'BOT_TOKEN' ? ' (Bot sedang direstart)' : ''}` 
    });
  } catch (error) {
    console.error(`Error updating setting ${req.params.key}:`, error);
    res.status(500).json({ 
      success: false, 
      message: `Terjadi kesalahan saat memperbarui pengaturan: ${error.message}` 
    });
  }
};

// API endpoint untuk membuat pengaturan baru
exports.apiCreateSetting = async (req, res) => {
  try {
    const { key, value, type = 'text', category = 'general', description = '', isPublic = false } = req.body;
    
    // Validasi input
    if (!key || key.trim() === '') {
      return res.status(400).json({ success: false, message: 'Key pengaturan wajib diisi' });
    }
    
    // Cek apakah key sudah ada
    const existingSetting = await Setting.findByPk(key);
    if (existingSetting) {
      return res.status(400).json({ success: false, message: 'Pengaturan dengan key ini sudah ada' });
    }
    
    const setting = await Setting.updateSetting(key, value, {
      type,
      category,
      description,
      isPublic
    });
    
    res.status(201).json({ 
      success: true, 
      setting,
      message: `Pengaturan "${key}" berhasil dibuat` 
    });
  } catch (error) {
    console.error('Error creating setting:', error);
    res.status(500).json({ 
      success: false, 
      message: `Terjadi kesalahan saat membuat pengaturan: ${error.message}` 
    });
  }
};

// API endpoint untuk menghapus pengaturan
exports.apiDeleteSetting = async (req, res) => {
  try {
    const { key } = req.params;
    
    const setting = await Setting.findByPk(key);
    if (!setting) {
      return res.status(404).json({ success: false, message: 'Pengaturan tidak ditemukan' });
    }
    
    await setting.destroy();
    
    res.json({ 
      success: true,
      message: `Pengaturan "${key}" berhasil dihapus` 
    });
  } catch (error) {
    console.error(`Error deleting setting ${req.params.key}:`, error);
    res.status(500).json({ 
      success: false, 
      message: `Terjadi kesalahan saat menghapus pengaturan: ${error.message}` 
    });
  }
};
