var AuthService = (function () {
  var requestUser = null;

  function login(loginId, password) {
    SchemaService.ensureRequiredSheets();
    loginId = String(loginId || '').trim();
    password = String(password || '');
    if (!loginId || !password) throw new Error('Thiếu ID hoặc mật khẩu.');
    var user = findLoginUser(loginId);
    if (!user || user.active_status === 'inactive') throw new Error('ID hoặc mật khẩu không đúng.');
    if (!user.password_hash || !user.password_salt) throw new Error('Tài khoản chưa được cấu hình mật khẩu.');
    var expected = hashPassword(loginId, password, user.password_salt);
    if (expected !== user.password_hash) throw new Error('ID hoặc mật khẩu không đúng.');
    var expiresAt = Date.now() + 12 * 60 * 60 * 1000;
    var token = signToken({
      user_id: user.user_id,
      email: user.email,
      role_id: user.role_id,
      exp: expiresAt
    });
    DataService.updateRowByKey('AUTH_USERS', 'user_id', user.user_id, {
      last_login_at: DataService.nowIso(),
      updated_at: DataService.nowIso()
    });
    return {
      auth_token: token,
      expires_at: new Date(expiresAt).toISOString(),
      user: publicUser(user)
    };
  }

  function setRequestUserFromToken(token) {
    if (!token) {
      requestUser = null;
      return null;
    }
    var data = verifyToken(token);
    var user = DataService.findByKey('AUTH_USERS', 'user_id', data.user_id);
    if (!user || user.active_status === 'inactive') throw new Error('Phiên đăng nhập không hợp lệ.');
    requestUser = user;
    return user;
  }

  function getRequestUser() {
    return requestUser;
  }

  function findLoginUser(loginId) {
    var normalized = String(loginId || '').trim().toLowerCase();
    return DataService.readRows('AUTH_USERS').find(function (user) {
      return String(user.login_id || '').trim().toLowerCase() === normalized ||
        String(user.email || '').trim().toLowerCase() === normalized ||
        String(user.user_id || '').trim().toLowerCase() === normalized;
    }) || null;
  }

  function hashPassword(loginId, password, salt) {
    return sha256Hex([String(loginId || '').trim().toLowerCase(), password, salt, getSecret()].join('|'));
  }

  function signToken(payload) {
    var raw = Utilities.base64EncodeWebSafe(JSON.stringify(payload));
    var signature = DataService.generateHash([raw, getSecret()]);
    return raw + '.' + signature;
  }

  function verifyToken(token) {
    var parts = String(token || '').split('.');
    if (parts.length !== 2) throw new Error('Phiên đăng nhập không hợp lệ.');
    var expected = DataService.generateHash([parts[0], getSecret()]);
    if (expected !== parts[1]) throw new Error('Phiên đăng nhập không hợp lệ.');
    var data = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString());
    if (!data.exp || Number(data.exp) < Date.now()) throw new Error('Phiên đăng nhập đã hết hạn.');
    return data;
  }

  function getSecret() {
    return PropertiesService.getScriptProperties().getProperty('FINANCE_SESSION_SECRET') || APP_CONFIG.PUBLIC_API_TOKEN;
  }

  function sha256Hex(raw) {
    var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw);
    return bytes.map(function (b) {
      var v = (b < 0 ? b + 256 : b).toString(16);
      return v.length === 1 ? '0' + v : v;
    }).join('');
  }

  function publicUser(user) {
    return {
      user_id: user.user_id,
      email: user.email,
      display_name: user.display_name,
      role_id: user.role_id,
      scope_type: user.scope_type,
      region_id: user.region_id,
      territory_id: user.territory_id,
      site_id: user.site_id,
      staff_id: user.staff_id,
      must_change_password: user.must_change_password
    };
  }

  return {
    login: login,
    setRequestUserFromToken: setRequestUserFromToken,
    getRequestUser: getRequestUser,
    hashPassword: hashPassword,
    publicUser: publicUser
  };
})();
