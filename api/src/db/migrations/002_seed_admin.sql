DELETE FROM users WHERE email = 'admin@piwisuite.cl';
DELETE FROM access_requests WHERE email = 'admin@piwisuite.cl';
INSERT INTO users (id, email, password_hash, display_name, role) VALUES ('admin-00000000-0000-0000-0000-000000000001', 'admin@piwisuite.cl', '$2a$10$Nig62A2eWXkh1CLAbmfWIel9Xi70wgFpv39oSbUzLSbIIv6vD95DW', 'Super Admin', 'admin');
INSERT INTO access_requests (id, user_id, email, status, requested_at) VALUES ('ar-admin-00000000-0000-0000-000000000001', 'admin-00000000-0000-0000-0000-000000000001', 'admin@piwisuite.cl', 'approved', datetime('now'));