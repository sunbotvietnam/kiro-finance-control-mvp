var APP_CONFIG = {
  APP_NAME: 'Kiro Finance Control',
  DISPLAY_NAME: 'Tài chính & Dòng tiền',
  SCHEMA_VERSION: '1.0.0',
  DEFAULT_TENANT_ID: 'KIRO_INTERNAL',
  DEFAULT_SHEET_ID: '1E-Dfa2k3XRRDJ8dC6PfEGzshZ37jTkA3bUVk1o9PtvE',
  PUBLIC_API_TOKEN: 'kiro-finance-mvp-2026',
  DEFAULT_CURRENCY: 'VND',
  TIMEZONE: 'Asia/Ho_Chi_Minh',
  OWNER_EMAILS: [],
  DEFAULT_USER_ROLE: 'FINANCE_CONTROLLER',
  CASH_WARNING_THRESHOLD: 5000000
};

var ENUMS = {
  DIRECTION: ['inflow', 'outflow', 'transfer'],
  SOURCE_SYSTEM: ['manual', 'bank_sms', 'bank_email', 'bank_statement', 'billing', 'approval_request', 'payment_order', 'document_center', 'transfer', 'import_excel', 'other'],
  TRANSACTION_STATUS: ['draft', 'confirmed', 'matched', 'reconciled', 'needs_review', 'cancelled', 'voided', 'archived'],
  MATCH_STATUS: ['unmatched', 'matched', 'partially_matched', 'not_required'],
  EVIDENCE_STATUS: ['chua_co', 'da_co', 'da_kiem_tra', 'can_bo_sung', 'khong_hop_le', 'khong_can'],
  TAX_REVIEW_STATUS: ['not_reviewed', 'pending', 'reviewed', 'needs_expert', 'not_applicable'],
  STAGING_STATUS: ['new', 'suggested', 'needs_review', 'confirmed', 'ignored', 'duplicate'],
  STAFF_TYPE: ['teacher', 'operation', 'finance', 'admin', 'sales', 'trainer', 'technician', 'contractor', 'partner_staff', 'other'],
  CORE_ROLES: ['SYSTEM_OWNER', 'SYSTEM_ADMIN', 'EXECUTIVE', 'FINANCE_CONTROLLER', 'FINANCE_STAFF', 'REGIONAL_MANAGER', 'SITE_MANAGER', 'OPERATION_STAFF', 'PARTNER_USER', 'VIEWER']
};

var SHEET_HEADERS = {
  SYSTEM_CONFIG: ['config_key', 'config_value', 'description', 'updated_at'],
  SEQUENCE_REGISTRY: ['sequence_key', 'prefix', 'period', 'last_number', 'padding', 'reset_rule', 'updated_at'],
  DM_CATEGORY: ['category_code', 'category_name', 'direction', 'cashflow_section', 'category_group', 'subcategory', 'is_operating', 'is_investment', 'is_internal_transfer', 'requires_invoice_default', 'requires_approval_default', 'requires_payment_order_default', 'default_tax_treatment', 'active_status', 'sort_order'],
  DM_ACCOUNT: ['account_id', 'account_name', 'account_type', 'bank_name', 'account_number_masked', 'branch', 'tenant_id', 'opening_balance', 'active_status'],
  DM_STAFF: ['staff_id', 'staff_name', 'staff_type', 'job_title', 'department', 'region_id', 'territory_id', 'site_ids', 'school_ids', 'email', 'phone', 'user_id', 'active_status', 'created_at', 'updated_at'],
  DM_SCHOOL: ['school_id', 'school_name', 'short_name', 'region_id', 'territory_id', 'tenant_id', 'address', 'tax_code', 'contact_name', 'contact_phone', 'active_status', 'created_at', 'updated_at'],
  DM_SITE: ['site_id', 'site_name', 'site_type', 'region_id', 'territory_id', 'tenant_id', 'address', 'manager_staff_id', 'linked_school_id', 'active_status', 'created_at', 'updated_at'],
  DM_VENDOR: ['vendor_id', 'vendor_name', 'vendor_type', 'tax_code', 'contact_name', 'phone', 'bank_account', 'active_status', 'created_at', 'updated_at'],
  DM_PARTNER: ['partner_id', 'partner_name', 'tenant_id', 'territory_id', 'contract_status', 'contact_name', 'phone', 'email', 'active_status', 'created_at', 'updated_at'],
  DM_COUNTERPARTY: ['counterparty_id', 'counterparty_name', 'counterparty_type', 'linked_school_id', 'linked_site_id', 'linked_staff_id', 'linked_vendor_id', 'linked_partner_id', 'region_id', 'territory_id', 'tenant_id', 'active_status'],
  DM_ALIAS_MAP: ['alias_id', 'alias_text', 'canonical_type', 'canonical_id', 'canonical_name', 'confidence', 'source_system', 'status', 'approved_by', 'approved_at', 'created_at'],
  TRANSACTIONS: ['transaction_id', 'transaction_date', 'period_month', 'tenant_id', 'region_id', 'territory_id', 'branch', 'direction', 'amount', 'currency', 'account_id', 'category_code', 'counterparty_id', 'counterparty_name_snapshot', 'school_id', 'site_id', 'staff_id', 'vendor_id', 'partner_id', 'approval_request_id', 'payment_order_id', 'document_id', 'description', 'source_system', 'source_id', 'external_ref', 'duplicate_hash', 'status', 'match_status', 'evidence_status', 'tax_review_status', 'created_by', 'created_at', 'updated_by', 'updated_at', 'cancelled_by', 'cancelled_at', 'cancel_reason'],
  IMPORT_STAGING: ['import_id', 'source_system', 'raw_text', 'raw_file_link', 'detected_date', 'detected_amount', 'detected_direction', 'detected_account', 'detected_counterparty_text', 'detected_description', 'suggested_category_code', 'suggested_counterparty_id', 'suggested_staff_id', 'suggested_source_id', 'confidence_score', 'duplicate_hash', 'review_status', 'reviewed_by', 'reviewed_at', 'created_at'],
  EVIDENCE: ['evidence_id', 'transaction_id', 'approval_request_id', 'payment_order_id', 'source_system', 'source_id', 'file_link', 'file_type', 'invoice_number', 'invoice_date', 'invoice_amount', 'supplier_tax_code', 'evidence_status', 'validated_by', 'validated_at', 'note'],
  TAX_FLAGS: ['tax_flag_id', 'transaction_id', 'approval_request_id', 'payment_order_id', 'invoice_status', 'payment_method', 'non_cash_required', 'payment_proof_status', 'vat_rate', 'vat_amount', 'vat_claimable_status', 'cit_deductible_status', 'tax_risk_level', 'tax_risk_reason', 'reviewed_by', 'reviewed_at'],
  CASH_PLANS: ['plan_id', 'expected_date', 'period_month', 'tenant_id', 'region_id', 'territory_id', 'direction', 'amount', 'category_code', 'counterparty_id', 'school_id', 'site_id', 'staff_id', 'approval_request_id', 'payment_order_id', 'source_system', 'source_id', 'confidence_level', 'scenario', 'status', 'owner_user_id', 'note', 'created_at', 'updated_at'],
  APPROVAL_REQUESTS: ['approval_request_id', 'request_date', 'requester_user_id', 'requester_staff_id', 'tenant_id', 'region_id', 'site_id', 'department', 'category_code', 'counterparty_id', 'amount_requested', 'purpose', 'description', 'expected_payment_date', 'priority', 'status', 'approved_by', 'approved_at', 'rejected_by', 'rejected_at', 'reject_reason', 'linked_budget_id', 'linked_cash_plan_id', 'created_at', 'updated_at'],
  APPROVAL_REQUEST_LINES: ['approval_request_line_id', 'approval_request_id', 'category_code', 'description', 'quantity', 'unit_price', 'amount', 'tax_hint', 'evidence_required', 'note'],
  PAYMENT_ORDERS: ['payment_order_id', 'approval_request_id', 'payment_order_date', 'payee_counterparty_id', 'payee_name_snapshot', 'amount_payable', 'amount_paid', 'payment_account_id', 'payment_method', 'expected_payment_date', 'actual_payment_date', 'status', 'transaction_id', 'evidence_status', 'created_by', 'approved_by', 'paid_by', 'created_at', 'updated_at', 'note'],
  PAYMENT_ORDER_LINES: ['payment_order_line_id', 'payment_order_id', 'approval_request_line_id', 'category_code', 'description', 'amount', 'tax_flag_id', 'evidence_id', 'note'],
  DOCUMENT_TEMPLATES: ['template_id', 'template_name', 'document_type', 'source_module', 'version', 'template_file_link', 'html_template', 'required_fields', 'active_status', 'created_at', 'updated_at'],
  DOCUMENTS: ['document_id', 'document_no', 'document_type', 'source_module', 'source_id', 'template_id', 'tenant_id', 'region_id', 'counterparty_id', 'amount', 'document_date', 'status', 'file_link', 'generated_by', 'generated_at', 'approved_by', 'approved_at', 'signed_status', 'note'],
  AUDIT_LOG: ['audit_id', 'timestamp', 'user_id', 'email', 'role_id', 'action', 'object_type', 'object_id', 'before_value', 'after_value', 'status', 'note', 'user_agent'],
  METRIC_CATALOG: ['metric_id', 'metric_name_vi', 'module', 'description', 'data_source', 'calculation_type', 'sensitivity_level', 'allowed_roles', 'scope_supported', 'status'],
  NOTIFICATION_RULES: ['rule_id', 'rule_name', 'metric_id', 'condition', 'threshold', 'frequency', 'target_roles', 'target_scope_type', 'target_regions', 'target_territories', 'channel', 'message_template', 'status', 'created_at', 'updated_at'],
  AUTH_USERS: ['user_id', 'email', 'display_name', 'role_id', 'scope_type', 'region_id', 'territory_id', 'site_id', 'staff_id', 'active_status', 'created_at', 'updated_at']
};

var SEED_DATA = {
  SYSTEM_CONFIG: [
    ['schema_version', APP_CONFIG.SCHEMA_VERSION, 'Phiên bản schema hiện tại', ''],
    ['tenant_id', APP_CONFIG.DEFAULT_TENANT_ID, 'Tenant mặc định cho Kiro nội bộ', ''],
    ['staff_portal_label', 'Cổng giáo viên', 'Tên hiển thị Sunbot cho staff_portal', '']
  ],
  DM_CATEGORY: [
    ['THUHD', 'Thu hợp đồng/dịch vụ', 'inflow', 'operating', 'Doanh thu', 'Thu hợp đồng', true, false, false, false, false, false, 'output_revenue', 'active', 10],
    ['THUNO', 'Thu nợ/công nợ', 'inflow', 'operating', 'Thu hồi', 'Thu nợ', true, false, false, false, false, false, 'receivable_collection', 'active', 20],
    ['UNGHD', 'Ứng hợp đồng', 'inflow', 'operating', 'Tạm thu', 'Ứng hợp đồng', true, false, false, false, false, false, 'advance_received', 'active', 30],
    ['THUKHAC', 'Thu khác', 'inflow', 'operating', 'Khác', 'Thu khác', true, false, false, false, false, false, 'other_income', 'active', 40],
    ['HOAHONG', 'Hoa hồng/chi ngoài', 'outflow', 'operating', 'Bán hàng', 'Hoa hồng', true, false, false, true, true, true, 'commission_review', 'active', 110],
    ['LUONG-BH', 'Lương và bảo hiểm', 'outflow', 'operating', 'Nhân sự', 'Lương/BH', true, false, false, false, true, true, 'payroll', 'active', 120],
    ['THUONG', 'Thưởng', 'outflow', 'operating', 'Nhân sự', 'Thưởng', true, false, false, false, true, true, 'payroll_bonus', 'active', 130],
    ['TAMUNG', 'Tạm ứng', 'outflow', 'operating', 'Tạm ứng', 'Tạm ứng nhân sự', true, false, false, false, true, true, 'advance_payment', 'active', 140],
    ['BAOHIEM', 'Bảo hiểm', 'outflow', 'operating', 'Nhân sự', 'Bảo hiểm', true, false, false, false, true, true, 'insurance', 'active', 150],
    ['THUE', 'Thuế/phí nhà nước', 'outflow', 'operating', 'Thuế', 'Thuế', true, false, false, false, true, true, 'tax_payment', 'active', 160],
    ['MUANGOAI', 'Mua ngoài/dịch vụ', 'outflow', 'operating', 'Vận hành', 'Mua ngoài', true, false, false, true, true, true, 'vendor_invoice_required', 'active', 170],
    ['PHAPLY', 'Pháp lý', 'outflow', 'operating', 'Vận hành', 'Pháp lý', true, false, false, true, true, true, 'legal_service', 'active', 180],
    ['VANTAI', 'Vận tải/di chuyển', 'outflow', 'operating', 'Vận hành', 'Vận tải', true, false, false, true, false, false, 'transport_review', 'active', 190],
    ['THUEMATBANG', 'Thuê mặt bằng', 'outflow', 'operating', 'Vận hành', 'Mặt bằng', true, false, false, true, true, true, 'rental_invoice', 'active', 200],
    ['MUATSTB', 'Mua tài sản/thiết bị', 'outflow', 'investment', 'Đầu tư', 'Tài sản thiết bị', false, true, false, true, true, true, 'asset_or_capex', 'active', 210],
    ['LUANCHUYEN', 'Luân chuyển nội bộ', 'transfer', 'internal', 'Nội bộ', 'Chuyển quỹ', false, false, true, false, false, false, 'not_applicable', 'active', 900],
    ['CHIKHAC', 'Chi khác', 'outflow', 'operating', 'Khác', 'Chi khác', true, false, false, true, false, false, 'needs_review', 'active', 990]
  ],
  DM_ACCOUNT: [
    ['CASH-HN', 'Tiền mặt Hà Nội', 'cash', '', '', 'HN', APP_CONFIG.DEFAULT_TENANT_ID, 0, 'active'],
    ['BIDV-001', 'BIDV vận hành', 'bank', 'BIDV', '****001', 'HN', APP_CONFIG.DEFAULT_TENANT_ID, 0, 'active'],
    ['VCB-001', 'Vietcombank vận hành', 'bank', 'Vietcombank', '****001', 'HN', APP_CONFIG.DEFAULT_TENANT_ID, 0, 'active'],
    ['MB-001', 'MB vận hành', 'bank', 'MB Bank', '****001', 'HN', APP_CONFIG.DEFAULT_TENANT_ID, 0, 'active']
  ],
  DM_STAFF: [
    ['STF-HN-HANH', 'Nguyễn Thị Hạnh', 'teacher', 'Giáo viên Sunbot', 'Teaching Ops', 'HN', '', '', '', '', '', '', 'active', '', ''],
    ['STF-HN-THU', 'Thu', 'operation', 'Leader vùng', 'Operations', 'HN', '', '', '', '', '', '', 'active', '', ''],
    ['STF-NA-DUNG', 'Dung', 'operation', 'Leader vùng', 'Operations', 'NA', '', '', '', '', '', '', 'active', '', '']
  ],
  DM_COUNTERPARTY: [
    ['CP-INTERNAL', 'Nội bộ Kiro', 'internal', '', '', '', '', '', '', '', APP_CONFIG.DEFAULT_TENANT_ID, 'active'],
    ['CP-BANK', 'Ngân hàng', 'bank', '', '', '', '', '', '', '', APP_CONFIG.DEFAULT_TENANT_ID, 'active']
  ],
  METRIC_CATALOG: [
    ['M_CASH_AVAILABLE', 'Tiền khả dụng', 'finance', 'Tổng tồn tiền theo tài khoản', 'TRANSACTIONS', 'sum_balance', 'confidential', 'SYSTEM_OWNER,EXECUTIVE,FINANCE_CONTROLLER,FINANCE_STAFF', 'company,region', 'active'],
    ['M_CASH_NET_MONTH', 'Dòng tiền thuần tháng', 'finance', 'Thu tháng trừ chi tháng, không gồm luân chuyển', 'TRANSACTIONS', 'sum_inflow_outflow', 'confidential', 'SYSTEM_OWNER,EXECUTIVE,FINANCE_CONTROLLER,FINANCE_STAFF,REGIONAL_MANAGER', 'company,region', 'active']
  ],
  NOTIFICATION_RULES: [
    ['RULE_LOW_CASH', 'Cảnh báo tiền khả dụng thấp', 'M_CASH_AVAILABLE', 'less_than', APP_CONFIG.CASH_WARNING_THRESHOLD, 'daily', 'EXECUTIVE,FINANCE_CONTROLLER', 'company', '', '', 'email', 'Tiền khả dụng đang dưới ngưỡng cấu hình.', 'active', '', '']
  ]
};
