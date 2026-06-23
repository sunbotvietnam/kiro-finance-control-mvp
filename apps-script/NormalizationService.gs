var NormalizationService = (function () {
  var SCHOOL_MAP = [
    ['HN-MD', 'Mai Dịch', 'Mai Dịch', 'HN', ['mai dich']],
    ['HN-QM', 'Quỳnh Mai', 'Quỳnh Mai', 'HN', ['quynh mai', 'mn qm']],
    ['HN-MNB', 'Mầm non B', 'Mầm non B', 'HN', ['mn b', 'mam non b']],
    ['HN-TA', 'Tràng An', 'Tràng An', 'HN', ['trang an']],
    ['HN-UN', 'Uy Nỗ', 'Uy Nỗ', 'HN', ['uy no']],
    ['HN-HMN', 'Hạt Mầm Nhỏ', 'Hạt Mầm Nhỏ', 'HN', ['hat mam nho']],
    ['HN-HL', 'Hoa Linh', 'Hoa Linh', 'HN', ['hoa linh']],
    ['HN-HV', 'Hà Vỹ', 'Hà Vỹ', 'HN', ['ha vy', 'ha vi']],
    ['HN-MV', 'Mầm Việt', 'Mầm Việt', 'HN', ['mam viet']],
    ['HN-NB', 'Nhật Bản', 'Nhật Bản', 'HN', ['nhat ban']],
    ['HN-SH', 'Sen Hồng', 'Sen Hồng', 'HN', ['sen hong']],
    ['NA-HHT', 'Hà Huy Tập', 'Hà Huy Tập', 'NA', ['ha huy tap']],
    ['NA-VL', 'Việt Lào', 'Việt Lào', 'NA', ['viet lao']],
    ['NA-QT', 'Quang Trung', 'Quang Trung', 'NA', ['quang trung']],
    ['NA-HD2', 'Hưng Dũng 2', 'Hưng Dũng 2', 'NA', ['hung dung 2', 'hung dung']],
    ['NA-DL', 'Đô Lương', 'Đô Lương', 'NA', ['do luong']],
    ['NA-YS', 'Yên Sơn', 'Yên Sơn', 'NA', ['yen son']],
    ['NA-BM', 'Bình Minh', 'Bình Minh', 'NA', ['binh minh']],
    ['NA-KSCT', 'Kidssmile Cửa Tiền', 'Kidssmile Cửa Tiền', 'NA', ['kidssmile cua tien', 'cua tien']],
    ['NA-TT', 'Thiên Thần', 'Thiên Thần', 'NA', ['thien than']],
    ['NA-HH', 'Hoa Hồng', 'Hoa Hồng', 'NA', ['hoa hong']],
    ['NA-HAD', 'Hoa Ánh Dương', 'Hoa Ánh Dương', 'NA', ['hoa anh duong']],
    ['NA-DV', 'Đông Vĩnh', 'Đông Vĩnh', 'NA', ['dong vinh']]
  ];

  var STAFF_MAP = [
    ['STF-HN-TUONGVAN', 'Nguyễn Tường Vân', 'executive', 'HN', ['tuong van', 'ceo tuong van']],
    ['STF-HN-TRIHIEN', 'Nguyễn Trí Hiển', 'management', 'HN', ['tri hien', 'nguyen tri hien']],
    ['STF-HN-HOANGNHUNG', 'Hoàng Nhung', 'operation', 'HN', ['hoang nhung']],
    ['STF-HN-NGUYENTHAO', 'Nguyễn Thảo', 'operation', 'HN', ['nguyen thao', 'nguyen thao']],
    ['STF-HN-CAMTU', 'Nguyễn Cẩm Tú', 'operation', 'HN', ['cam tu', 'nguyen cam tu']],
    ['STF-HN-PHUONGANH', 'Trần Phương Anh', 'operation', 'HN', ['phuong anh', 'tran phuong anh']],
    ['STF-HN-PHANHANH', 'Phan Thu Hạnh', 'operation', 'HN', ['phan hanh', 'phan thu hanh']],
    ['STF-HN-MINHHANG', 'Đỗ Thị Minh Hằng', 'operation', 'HN', ['minh hang', 'do hang', 'do thi minh hang']],
    ['STF-HN-TRANPHUONGTHAO', 'Trần Phương Thảo', 'operation', 'HN', ['tran phuong thao']],
    ['STF-HN-VUPHUONGTHAO', 'Vũ Thị Phương Thảo', 'operation', 'HN', ['vu thao', 'vu thi phuong thao']],
    ['STF-HN-THUTRANG', 'Thu Trang', 'operation', 'HN', ['thu trang']],
    ['STF-HN-HUONGLE', 'Hương Lệ', 'operation', 'HN', ['huong le']],
    ['STF-HN-MINHTHU', 'Nguyễn Thị Minh Thu', 'operation', 'HN', ['minh thu', 'nguyen thi minh thu']],
    ['STF-HN-DUONGHUNG', 'Dương Văn Hùng', 'operation', 'HN', ['duong hung', 'duong van hung']],
    ['STF-HN-NGUYENPHUONG', 'Nguyễn Thị Phương', 'operation', 'HN', ['nguyen phuong', 'nguyen thi phuong']],
    ['STF-NA-LEDUNG', 'Lê Thị Dung', 'operation', 'NA', ['le dung', 'le thi dung']],
    ['STF-NA-NGUYENDANH', 'Nguyễn Thị Danh', 'operation', 'NA', ['nguyen danh', 'nguyen thi danh']],
    ['STF-NA-TRANHANG', 'Trần Thị Hằng', 'operation', 'NA', ['tran hang', 'tran thi hang']],
    ['STF-NA-MONGDUONG', 'Mông Văn Dương', 'operation', 'NA', ['mong van duong', 'mong duong']],
    ['STF-NA-TRINHLY', 'Trịnh Thị Lý', 'operation', 'NA', ['trinh ly', 'trinh thi ly']],
    ['STF-NA-VOAN', 'Võ Thị An', 'operation', 'NA', ['vo an', 'vo thi an']],
    ['STF-NA-THAILAN', 'Thái Thị Lan', 'operation', 'NA', ['thai thi lan', 'thai lan']],
    ['STF-NA-THUYEN', 'Trương Thị Thuyên', 'operation', 'NA', ['truong thi thuyen', 'thuyen']],
    ['STF-NA-DAUPHUONG', 'Đậu Thị Lan Phương', 'operation', 'NA', ['dau lan phuong', 'dau thi lan phuong', 'dau phuong']],
    ['STF-NA-TRAMY', 'Phạm Lý Trà My', 'operation', 'NA', ['tra my', 'pham ly tra my']],
    ['STF-NA-THAILY', 'Thái Ly', 'operation', 'NA', ['thai ly']]
  ];

  function normalizeLegacyTransactions() {
    PermissionService.assertPermission('system.manage_master_data');
    var aliasIndex = existingAliasIndex();
    seedSchools(aliasIndex);
    seedStaff(aliasIndex);
    var sheet = DataService.getSheet('TRANSACTIONS');
    var headers = DataService.getHeaders('TRANSACTIONS');
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return {
        updated_transactions: 0,
        school_hits: 0,
        staff_hits: 0,
        skipped_transactions: 0,
        schools_seeded: SCHOOL_MAP.length,
        staff_seeded: STAFF_MAP.length
      };
    }
    var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    var indexes = indexHeaders(headers);
    var updated = 0;
    var schoolHits = 0;
    var staffHits = 0;
    var skipped = 0;
    var userEmail = PermissionService.getCurrentUser().email;
    var now = DataService.nowIso();
    values.forEach(function (row) {
      if (!row.some(function (cell) { return cell !== ''; })) return;
      var tx = rowToObject(headers, row);
      var changed = false;
      var school = findSchool(tx);
      var staff = findStaff(tx);
      if (school && !tx.school_id) {
        setCell(row, indexes, 'school_id', school[0]);
        if (!tx.counterparty_id) setCell(row, indexes, 'counterparty_id', school[0]);
        schoolHits += 1;
        changed = true;
      }
      if (staff && !tx.staff_id && ['LUONG-BH', 'THUONG', 'PHUCLOI', 'VANTAI', 'TAMUNG', 'HOANTAMUNG'].indexOf(tx.category_code) !== -1) {
        setCell(row, indexes, 'staff_id', staff[0]);
        if (!tx.counterparty_id) setCell(row, indexes, 'counterparty_id', staff[0]);
        staffHits += 1;
        changed = true;
      }
      if (changed) {
        setCell(row, indexes, 'updated_by', userEmail);
        setCell(row, indexes, 'updated_at', now);
        updated += 1;
      } else {
        skipped += 1;
      }
    });
    if (updated) sheet.getRange(2, 1, values.length, headers.length).setValues(values);
    return {
      updated_transactions: updated,
      school_hits: schoolHits,
      staff_hits: staffHits,
      skipped_transactions: skipped,
      schools_seeded: SCHOOL_MAP.length,
      staff_seeded: STAFF_MAP.length
    };
  }

  function seedSchools(aliasIndex) {
    SCHOOL_MAP.forEach(function (row) {
      var id = row[0];
      if (!DataService.findByKey('DM_SCHOOL', 'school_id', id)) {
        DataService.appendRow('DM_SCHOOL', {
          school_id: id,
          school_name: row[1],
          short_name: row[2],
          region_id: row[3],
          territory_id: '',
          tenant_id: APP_CONFIG.DEFAULT_TENANT_ID,
          address: '',
          tax_code: '',
          contact_name: '',
          contact_phone: '',
          active_status: 'active',
          created_at: DataService.nowIso(),
          updated_at: DataService.nowIso()
        });
      }
      upsertCounterparty(id, row[1], 'school', id, '', row[3]);
      seedAliases(id, row[1], 'school', row[4], aliasIndex);
    });
  }

  function seedStaff(aliasIndex) {
    STAFF_MAP.forEach(function (row) {
      var id = row[0];
      if (!DataService.findByKey('DM_STAFF', 'staff_id', id)) {
        DataService.appendRow('DM_STAFF', {
          staff_id: id,
          staff_name: row[1],
          staff_type: row[2],
          job_title: '',
          department: row[2] === 'executive' ? 'Management' : 'Operations',
          region_id: row[3],
          territory_id: '',
          site_ids: '',
          school_ids: '',
          email: '',
          phone: '',
          user_id: '',
          active_status: 'active',
          created_at: DataService.nowIso(),
          updated_at: DataService.nowIso()
        });
      }
      upsertCounterparty(id, row[1], 'staff', '', id, row[3]);
      seedAliases(id, row[1], 'staff', row[4], aliasIndex);
    });
  }

  function upsertCounterparty(id, name, type, schoolId, staffId, regionId) {
    if (DataService.findByKey('DM_COUNTERPARTY', 'counterparty_id', id)) return;
    DataService.appendRow('DM_COUNTERPARTY', {
      counterparty_id: id,
      counterparty_name: name,
      counterparty_type: type,
      linked_school_id: schoolId || '',
      linked_site_id: '',
      linked_staff_id: staffId || '',
      linked_vendor_id: '',
      linked_partner_id: '',
      region_id: regionId || '',
      territory_id: '',
      tenant_id: APP_CONFIG.DEFAULT_TENANT_ID,
      active_status: 'active'
    });
  }

  function seedAliases(canonicalId, canonicalName, type, aliases, existing) {
    (aliases || []).concat([canonicalName]).forEach(function (alias) {
      var key = DataService.normalizeText(alias) + '|' + canonicalId;
      if (existing.indexOf(key) !== -1) return;
      DataService.appendRow('DM_ALIAS_MAP', {
        alias_id: 'ALIAS-' + canonicalId + '-' + DataService.generateHash([alias]).slice(0, 6),
        alias_text: alias,
        canonical_type: type,
        canonical_id: canonicalId,
        canonical_name: canonicalName,
        confidence: 0.95,
        source_system: 'legacy_normalization',
        status: 'approved',
        approved_by: PermissionService.getCurrentUser().email,
        approved_at: DataService.nowIso(),
        created_at: DataService.nowIso()
      });
      existing.push(key);
    });
  }

  function existingAliasIndex() {
    return DataService.readRows('DM_ALIAS_MAP').map(function (row) {
      return DataService.normalizeText(row.alias_text) + '|' + row.canonical_id;
    });
  }

  function findSchool(tx) {
    var text = normalizedLookupText(tx);
    return SCHOOL_MAP.find(function (row) {
      return row[4].some(function (alias) {
        return text.indexOf(DataService.normalizeText(alias)) !== -1;
      });
    }) || null;
  }

  function findStaff(tx) {
    var text = normalizedLookupText(tx);
    return STAFF_MAP.find(function (row) {
      return row[4].some(function (alias) {
        return text.indexOf(DataService.normalizeText(alias)) !== -1;
      });
    }) || null;
  }

  function normalizedLookupText(tx) {
    return DataService.normalizeText([
      tx.counterparty_name_snapshot,
      tx.description,
      tx.external_ref
    ].join(' '));
  }

  function indexHeaders(headers) {
    var map = {};
    headers.forEach(function (header, i) {
      map[header] = i;
    });
    return map;
  }

  function rowToObject(headers, row) {
    var obj = {};
    headers.forEach(function (header, i) {
      obj[header] = row[i];
    });
    return obj;
  }

  function setCell(row, indexes, header, value) {
    if (indexes[header] === undefined) return;
    row[indexes[header]] = value;
  }

  return {
    normalizeLegacyTransactions: normalizeLegacyTransactions
  };
})();
