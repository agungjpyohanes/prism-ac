const handleLogin = (e) => {
    e.preventDefault();
    const uClean = username.trim().toLowerCase();
    const pClean = password.trim();

    // 1. Akun Demo Default (Selalu Aktif)
    if (uClean === 'guest' && pClean === '123456') {
      onLoginSuccess({ USER: 'guest', ROLE: 'guest', ID: 'guest_01' });
      return;
    }

    // 2. Verifikasi ke Database Master User
    const found = (usersData || []).find((r) => {
      // Ambil username (dukung format Array maupun Object)
      const u = (Array.isArray(r) ? r[0] : (r.username || r.user || '')).toString().trim().toLowerCase();
      
      // Ambil password / password_hash
      const p = (Array.isArray(r) ? r[2] : (r.password_hash || r.password || '')).toString().trim();
      
      return u === uClean && p === pClean;
    });

    if (found) {
      const uName = Array.isArray(found) ? found[0] : (found.username || found.user);
      const uRole = Array.isArray(found) ? found[1] : (found.role || 'operator');
      const uId = Array.isArray(found) ? found[3] : (found.id || '1');

      onLoginSuccess({
        USER: uName,
        ROLE: String(uRole).toLowerCase(),
        ID: String(uId)
      });
    } else {
      onToast('Username atau password tidak cocok!', 'err');
    }
  };