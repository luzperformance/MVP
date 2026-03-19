-- 007_doctor_permissions.sql
ALTER TABLE doctor ADD COLUMN can_access_records INTEGER DEFAULT 0;
ALTER TABLE doctor ADD COLUMN can_edit_agenda INTEGER DEFAULT 0;

-- Update the specific user and the root user (id=1)
UPDATE doctor SET can_access_records = 1, can_edit_agenda = 1 WHERE email = 'luzardi18@gmail.com' OR id = 1;
