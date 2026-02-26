-- ================================
-- ROOTS CLINIC — STAFF + FULL MOCK DATA
-- ================================
-- UUID MAP:
--   admin        e93b7898-8d4b-43c4-ac1e-1505452c9bef  (existing)
--   dr.ahmed     3436ac40-7b28-4c32-893e-133356de93cd  General Dentistry
--   dr.nour      c9376a7e-6efd-4ef2-8ba4-ad2206fafbf9  Orthodontics
--   dr.omar      67698224-8b33-4532-8880-a86f4e0d9a40  Pediatric Dentistry
--   dr.yasmin    80a09a35-a980-4724-b5d2-d45649934488  Endodontics
--   dr.kareem    88c5a929-536d-4a75-bec9-9ab778b2620e  Oral & Maxillofacial Surgery
--   dr.laila     811325b3-2e7c-435a-96fb-2eb2264037d7  Cosmetic Dentistry
--   reception    2f47a3f0-802b-457e-a83f-e4466d025d3b
--   finance      ed1ac66e-f095-4165-bd47-d2bc650f8dd6
-- ================================


-- ================================
-- 1. STAFF ROWS
-- ================================

INSERT INTO staff (id, username, full_name, role, phone, is_active) VALUES
  ('e93b7898-8d4b-43c4-ac1e-1505452c9bef', 'admin',         'Admin',              'admin',         NULL,           TRUE),
  ('3436ac40-7b28-4c32-893e-133356de93cd', 'dr.ahmed',      'Dr. Ahmed Hassan',   'doctor',        '+201001111001', TRUE),
  ('c9376a7e-6efd-4ef2-8ba4-ad2206fafbf9', 'dr.nour',       'Dr. Nour El-Sayed',  'doctor',        '+201001111002', TRUE),
  ('67698224-8b33-4532-8880-a86f4e0d9a40', 'dr.omar',       'Dr. Omar Khalil',    'doctor',        '+201001111003', TRUE),
  ('80a09a35-a980-4724-b5d2-d45649934488', 'dr.yasmin',     'Dr. Yasmin Mostafa', 'doctor',        '+201001111004', TRUE),
  ('88c5a929-536d-4a75-bec9-9ab778b2620e', 'dr.kareem',     'Dr. Kareem Adel',    'doctor',        '+201001111005', TRUE),
  ('811325b3-2e7c-435a-96fb-2eb2264037d7', 'dr.laila',      'Dr. Laila Ibrahim',  'doctor',        '+201001111006', TRUE),
  ('2f47a3f0-802b-457e-a83f-e4466d025d3b', 'reception',     'Sara Mahmoud',       'receptionist',  '+201001111007', TRUE),
  ('ed1ac66e-f095-4165-bd47-d2bc650f8dd6', 'finance',       'Tarek Nasser',       'finance',       '+201001111008', TRUE);


-- ================================
-- 2. SPECIALTIES
-- ================================

INSERT INTO specialties (id, arabic_name, english_name) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'طب الأسنان العام',        'General Dentistry'),
  ('a1000000-0000-0000-0000-000000000002', 'تقويم الأسنان',            'Orthodontics'),
  ('a1000000-0000-0000-0000-000000000003', 'طب أسنان الأطفال',         'Pediatric Dentistry'),
  ('a1000000-0000-0000-0000-000000000004', 'علاج جذور الأسنان',        'Endodontics'),
  ('a1000000-0000-0000-0000-000000000005', 'جراحة الفم والفكين',       'Oral & Maxillofacial Surgery'),
  ('a1000000-0000-0000-0000-000000000006', 'طب اللثة',                 'Periodontology'),
  ('a1000000-0000-0000-0000-000000000007', 'طب الأسنان التجميلي',      'Cosmetic Dentistry');


-- ================================
-- 3. DOCTORS
-- ================================

INSERT INTO doctors (id, staff_id, specialty_id, consultation_fee, years_experience, rating, review_count, status, bio) VALUES
  ('b1000000-0000-0000-0000-000000000001', '3436ac40-7b28-4c32-893e-133356de93cd', 'a1000000-0000-0000-0000-000000000001', 200.00, 10, 4.8, 120, 'available', 'Experienced general dentist with a focus on preventive care.'),
  ('b1000000-0000-0000-0000-000000000002', 'c9376a7e-6efd-4ef2-8ba4-ad2206fafbf9', 'a1000000-0000-0000-0000-000000000002', 350.00, 8,  4.9, 95,  'available', 'Specialist in braces and clear aligners for all ages.'),
  ('b1000000-0000-0000-0000-000000000003', '67698224-8b33-4532-8880-a86f4e0d9a40', 'a1000000-0000-0000-0000-000000000003', 180.00, 6,  4.7, 80,  'available', 'Gentle and caring pediatric dentist loved by kids.'),
  ('b1000000-0000-0000-0000-000000000004', '80a09a35-a980-4724-b5d2-d45649934488', 'a1000000-0000-0000-0000-000000000004', 300.00, 12, 4.9, 140, 'available', 'Expert in root canal therapy with a painless approach.'),
  ('b1000000-0000-0000-0000-000000000005', '88c5a929-536d-4a75-bec9-9ab778b2620e', 'a1000000-0000-0000-0000-000000000005', 500.00, 15, 4.8, 60,  'available', 'Senior oral surgeon specializing in implants and extractions.'),
  ('b1000000-0000-0000-0000-000000000006', '811325b3-2e7c-435a-96fb-2eb2264037d7', 'a1000000-0000-0000-0000-000000000007', 400.00, 9,  4.6, 75,  'available', 'Cosmetic dentist specializing in veneers and whitening.');


-- ================================
-- 4. DOCTOR SCHEDULES
-- ================================

INSERT INTO doctor_schedules (id, doctor_id, day_of_week, start_time, end_time, is_active) VALUES
  -- Dr. Ahmed (General) — Sun to Thu
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 0, '09:00', '17:00', TRUE),
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 1, '09:00', '17:00', TRUE),
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 2, '09:00', '17:00', TRUE),
  ('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001', 3, '09:00', '17:00', TRUE),
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001', 4, '09:00', '14:00', TRUE),
  -- Dr. Nour (Ortho) — Mon, Wed, Thu
  ('c1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000002', 1, '10:00', '18:00', TRUE),
  ('c1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000002', 3, '10:00', '18:00', TRUE),
  ('c1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000002', 4, '10:00', '14:00', TRUE),
  -- Dr. Omar (Pediatric) — Sun, Tue, Thu
  ('c1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000003', 0, '08:00', '15:00', TRUE),
  ('c1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000003', 2, '08:00', '15:00', TRUE),
  ('c1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000003', 4, '08:00', '15:00', TRUE),
  -- Dr. Yasmin (Endo) — Mon to Thu
  ('c1000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000004', 1, '09:00', '17:00', TRUE),
  ('c1000000-0000-0000-0000-000000000013', 'b1000000-0000-0000-0000-000000000004', 2, '09:00', '17:00', TRUE),
  ('c1000000-0000-0000-0000-000000000014', 'b1000000-0000-0000-0000-000000000004', 3, '09:00', '17:00', TRUE),
  ('c1000000-0000-0000-0000-000000000015', 'b1000000-0000-0000-0000-000000000004', 4, '09:00', '17:00', TRUE),
  -- Dr. Kareem (Surgery) — Sun, Wed
  ('c1000000-0000-0000-0000-000000000016', 'b1000000-0000-0000-0000-000000000005', 0, '10:00', '16:00', TRUE),
  ('c1000000-0000-0000-0000-000000000017', 'b1000000-0000-0000-0000-000000000005', 3, '10:00', '16:00', TRUE),
  -- Dr. Laila (Cosmetic) — Tue, Thu, Sat
  ('c1000000-0000-0000-0000-000000000018', 'b1000000-0000-0000-0000-000000000006', 2, '11:00', '19:00', TRUE),
  ('c1000000-0000-0000-0000-000000000019', 'b1000000-0000-0000-0000-000000000006', 4, '11:00', '19:00', TRUE),
  ('c1000000-0000-0000-0000-000000000020', 'b1000000-0000-0000-0000-000000000006', 6, '10:00', '15:00', TRUE);


-- ================================
-- 5. PATIENTS
-- ================================

INSERT INTO patients (id, patient_code, full_name, phone, email, dob, gender, address, emergency_contact_name, emergency_contact_phone, insurance_provider, insurance_number, notes, is_active) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'PAT-0001', 'Ahmed Hassan',   '+201001234567', 'ahmed.hassan@email.com',  '1985-03-12', 'male',   '12 Tahrir St, Cairo',   'Sara Hassan',    '+201001234560', 'MedNet',  'MN-10001', NULL,                     TRUE),
  ('d1000000-0000-0000-0000-000000000002', 'PAT-0002', 'Nour El-Sayed',  '+201112345678', 'nour.elsayed@email.com',  '1992-07-22', 'female', '5 Nile Corniche, Giza', 'Karim El-Sayed', '+201112345670', 'Allianz', 'AL-20002', 'Allergic to penicillin', TRUE),
  ('d1000000-0000-0000-0000-000000000003', 'PAT-0003', 'Omar Khalil',    '+201223456789', 'omar.khalil@email.com',   '1978-11-05', 'male',   '88 Ramses Ave, Cairo',  'Hana Khalil',    '+201223456780', NULL,      NULL,       NULL,                     TRUE),
  ('d1000000-0000-0000-0000-000000000004', 'PAT-0004', 'Yasmin Mostafa', '+201334567890', 'yasmin.m@email.com',      '2000-01-30', 'female', '3 Gesr El Suez, Cairo', 'Mostafa Ali',    '+201334567891', 'AXA',     'AX-30003', NULL,                     TRUE),
  ('d1000000-0000-0000-0000-000000000005', 'PAT-0005', 'Kareem Adel',    '+201445678901', 'kareem.adel@email.com',   '1995-09-17', 'male',   '21 Mohandeseen, Giza',  'Dina Adel',      '+201445678900', 'MedNet',  'MN-10005', NULL,                     TRUE),
  ('d1000000-0000-0000-0000-000000000006', 'PAT-0006', 'Laila Ibrahim',  '+201556789012', 'laila.i@email.com',       '1988-04-03', 'female', '7 Dokki St, Giza',      'Tarek Ibrahim',  '+201556789010', NULL,      NULL,       'Diabetic patient',       TRUE),
  ('d1000000-0000-0000-0000-000000000007', 'PAT-0007', 'Mahmoud Samir',  '+201667890123', NULL,                      '1970-06-25', 'male',   '44 Heliopolis, Cairo',  'Rania Samir',    '+201667890120', 'Allianz', 'AL-20007', NULL,                     TRUE),
  ('d1000000-0000-0000-0000-000000000008', 'PAT-0008', 'Rana Fathy',     '+201778901234', 'rana.fathy@email.com',    '2010-12-10', 'female', '9 Maadi, Cairo',        'Fathy Nasser',   '+201778901230', NULL,      NULL,       'Child patient - age 14', TRUE),
  ('d1000000-0000-0000-0000-000000000009', 'PAT-0009', 'Tarek Mansour',  '+201889012345', 'tarek.m@email.com',       '1965-08-19', 'male',   '55 Nasr City, Cairo',   'Heba Mansour',   '+201889012340', 'AXA',     'AX-30009', 'High blood pressure',    TRUE),
  ('d1000000-0000-0000-0000-000000000010', 'PAT-0010', 'Heba Nasser',    '+201990123456', 'heba.n@email.com',        '1998-02-14', 'female', '17 Zamalek, Cairo',     'Nasser Fouad',   '+201990123450', 'MedNet',  'MN-10010', NULL,                     TRUE),
  ('d1000000-0000-0000-0000-000000000011', 'PAT-0011', 'Amr Fouad',      '+201001122334', 'amr.fouad@email.com',     '1983-05-28', 'male',   '30 Shubra, Cairo',      'Mona Fouad',     '+201001122330', NULL,      NULL,       NULL,                     TRUE),
  ('d1000000-0000-0000-0000-000000000012', 'PAT-0012', 'Mona Gamal',     '+201112233445', 'mona.gamal@email.com',    '1975-10-07', 'female', '62 Agouza, Giza',       'Gamal Sobhi',    '+201112233440', 'Allianz', 'AL-20012', NULL,                     TRUE);


-- ================================
-- 6. PATIENT ALERTS
-- ================================

INSERT INTO patient_alerts (id, patient_id, alert_type, description, severity) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002', 'allergy',    'Penicillin allergy — avoid amoxicillin',         'high'),
  ('e1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000006', 'condition',  'Type 2 Diabetes — monitor healing post-op',      'high'),
  ('e1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000009', 'condition',  'Hypertension — check BP before procedures',      'medium'),
  ('e1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000003', 'medication', 'On blood thinners — risk of prolonged bleeding', 'high'),
  ('e1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000007', 'allergy',    'Latex allergy — use non-latex gloves',           'medium');


-- ================================
-- 7. PATIENT VITALS
-- (recorded_by = receptionist)
-- ================================

INSERT INTO patient_vitals (id, patient_id, recorded_by, blood_pressure, heart_rate, temperature, weight, notes) VALUES
  ('e0000001-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', '2f47a3f0-802b-457e-a83f-e4466d025d3b', '120/80', 72, 36.6, 78.0, NULL),
  ('e0000001-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', '2f47a3f0-802b-457e-a83f-e4466d025d3b', '115/75', 68, 36.8, 62.0, 'Patient reported mild anxiety'),
  ('e0000001-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000006', '2f47a3f0-802b-457e-a83f-e4466d025d3b', '138/88', 80, 37.0, 85.0, 'BP slightly elevated — diabetic patient'),
  ('e0000001-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000009', '2f47a3f0-802b-457e-a83f-e4466d025d3b', '145/92', 85, 36.9, 90.0, 'BP high — informed doctor'),
  ('e0000001-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000004', '2f47a3f0-802b-457e-a83f-e4466d025d3b', '118/76', 70, 36.5, 58.0, NULL);


-- ================================
-- 8. APPOINTMENTS
-- (booked_by = receptionist)
-- ================================

INSERT INTO appointments (id, patient_id, doctor_id, booked_by, appointment_date, duration_mins, procedure_type, status, priority, notes, arrived_at, completed_at) VALUES
  -- Past completed
  ('a2000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', '2f47a3f0-802b-457e-a83f-e4466d025d3b', NOW() - INTERVAL '30 days', 30, 'Checkup',              'completed', 'normal', NULL,                   NOW() - INTERVAL '30 days' + INTERVAL '5 min',   NOW() - INTERVAL '30 days' + INTERVAL '35 min'),
  ('a2000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004', '2f47a3f0-802b-457e-a83f-e4466d025d3b', NOW() - INTERVAL '20 days', 60, 'Root Canal',           'completed', 'normal', 'Tooth #36',            NOW() - INTERVAL '20 days' + INTERVAL '10 min',  NOW() - INTERVAL '20 days' + INTERVAL '70 min'),
  ('a2000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', '2f47a3f0-802b-457e-a83f-e4466d025d3b', NOW() - INTERVAL '15 days', 30, 'Filling',              'completed', 'normal', NULL,                   NOW() - INTERVAL '15 days' + INTERVAL '3 min',   NOW() - INTERVAL '15 days' + INTERVAL '35 min'),
  ('a2000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000003', '2f47a3f0-802b-457e-a83f-e4466d025d3b', NOW() - INTERVAL '10 days', 45, 'Pediatric Cleaning',   'completed', 'normal', 'First visit',          NOW() - INTERVAL '10 days' + INTERVAL '5 min',   NOW() - INTERVAL '10 days' + INTERVAL '50 min'),
  ('a2000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000001', '2f47a3f0-802b-457e-a83f-e4466d025d3b', NOW() - INTERVAL '5 days',  30, 'Scaling',              'completed', 'normal', NULL,                   NOW() - INTERVAL '5 days'  + INTERVAL '2 min',   NOW() - INTERVAL '5 days'  + INTERVAL '35 min'),
  ('a2000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000001', '2f47a3f0-802b-457e-a83f-e4466d025d3b', NOW() - INTERVAL '3 days',  90, 'Implant Consultation', 'completed', 'normal', NULL,                   NOW() - INTERVAL '3 days'  + INTERVAL '8 min',   NOW() - INTERVAL '3 days'  + INTERVAL '100 min'),
  -- No show / cancelled
  ('a2000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000002', '2f47a3f0-802b-457e-a83f-e4466d025d3b', NOW() - INTERVAL '7 days',  45, 'Braces Consultation',  'no_show',   'normal', NULL,                   NULL, NULL),
  ('a2000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000006', '2f47a3f0-802b-457e-a83f-e4466d025d3b', NOW() - INTERVAL '2 days',  30, 'Veneer Consultation',  'cancelled', 'normal', 'Patient rescheduled',  NULL, NULL),
  -- Today
  ('a2000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001', '2f47a3f0-802b-457e-a83f-e4466d025d3b', CURRENT_DATE + INTERVAL '9 hours',  30, 'Checkup',             'confirmed', 'normal', NULL,                   NULL, NULL),
  ('a2000000-0000-0000-0000-000000000010', 'd1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000004', '2f47a3f0-802b-457e-a83f-e4466d025d3b', CURRENT_DATE + INTERVAL '10 hours', 60, 'Root Canal',          'arrived',   'urgent', 'Severe pain reported', CURRENT_DATE + INTERVAL '9 hours' + INTERVAL '55 min', NULL),
  ('a2000000-0000-0000-0000-000000000011', 'd1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000001', '2f47a3f0-802b-457e-a83f-e4466d025d3b', CURRENT_DATE + INTERVAL '11 hours', 30, 'Scaling',             'in_chair',  'normal', NULL,                   CURRENT_DATE + INTERVAL '10 hours' + INTERVAL '50 min', NULL),
  ('a2000000-0000-0000-0000-000000000012', 'd1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000002', '2f47a3f0-802b-457e-a83f-e4466d025d3b', CURRENT_DATE + INTERVAL '13 hours', 45, 'Braces Adjustment',   'pending',   'normal', NULL,                   NULL, NULL),
  ('a2000000-0000-0000-0000-000000000013', 'd1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004', '2f47a3f0-802b-457e-a83f-e4466d025d3b', CURRENT_DATE + INTERVAL '14 hours', 60, 'Root Canal Follow-up','pending',   'normal', NULL,                   NULL, NULL),
  -- Future
  ('a2000000-0000-0000-0000-000000000014', 'd1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000006', '2f47a3f0-802b-457e-a83f-e4466d025d3b', NOW() + INTERVAL '3 days',  60, 'Veneer Fitting',       'confirmed', 'normal', NULL,                   NULL, NULL),
  ('a2000000-0000-0000-0000-000000000015', 'd1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000002', '2f47a3f0-802b-457e-a83f-e4466d025d3b', NOW() + INTERVAL '5 days',  45, 'Braces Review',        'pending',   'normal', NULL,                   NULL, NULL),
  ('a2000000-0000-0000-0000-000000000016', 'd1000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000006', '2f47a3f0-802b-457e-a83f-e4466d025d3b', NOW() + INTERVAL '6 days',  60, 'Veneer Consultation',  'confirmed', 'normal', 'Rescheduled',          NULL, NULL),
  ('a2000000-0000-0000-0000-000000000017', 'd1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000005', '2f47a3f0-802b-457e-a83f-e4466d025d3b', NOW() + INTERVAL '10 days', 90, 'Implant Surgery',      'pending',   'normal', NULL,                   NULL, NULL);


-- ================================
-- 9. VISIT RECORDS
-- ================================

INSERT INTO visit_records (id, appointment_id, patient_id, doctor_id, diagnosis, procedure_done, procedure_notes, prescription, follow_up_date) VALUES
  ('a3000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Mild gingivitis',         'Scaling & polishing',    'Plaque buildup on lower anteriors',       'Chlorhexidine mouthwash 0.12% twice daily',       (CURRENT_DATE + INTERVAL '90 days')),
  ('a3000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004', 'Irreversible pulpitis',   'Root Canal Therapy #36', 'Three canals instrumented and obturated', 'Amoxicillin 500mg x5 days, Ibuprofen 400mg PRN',  (CURRENT_DATE + INTERVAL '7 days')),
  ('a3000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'Secondary caries #46',    'Composite filling',      'Class II MOD restoration completed',      NULL,                                              NULL),
  ('a3000000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000003', 'Healthy dentition',       'Prophylaxis',            'Good oral hygiene for age 14',            'Fluoride varnish applied',                        NULL),
  ('a3000000-0000-0000-0000-000000000005', 'a2000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000001', 'Chronic periodontitis',   'Full mouth debridement', 'Heavy calculus removed, OHI given',       'Chlorhexidine gel 1% — apply twice daily',        (CURRENT_DATE + INTERVAL '30 days')),
  ('a3000000-0000-0000-0000-000000000006', 'a2000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000001', 'Edentulous lower ridge',  'Implant consultation',   'CBCT ordered for bone assessment',        NULL,                                              (CURRENT_DATE + INTERVAL '14 days'));


-- ================================
-- 10. RADIOLOGY ASSETS
-- (uploaded_by = admin)
-- ================================

INSERT INTO radiology_assets (id, patient_id, visit_id, uploaded_by, image_type, image_url, notes) VALUES
  ('a4000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002', 'a3000000-0000-0000-0000-000000000002', 'e93b7898-8d4b-43c4-ac1e-1505452c9bef', 'periapical', 'https://storage.rootsclinic.com/xray/periapical_d2_pre.jpg',  'Pre-treatment periapical #36'),
  ('a4000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', 'a3000000-0000-0000-0000-000000000002', 'e93b7898-8d4b-43c4-ac1e-1505452c9bef', 'periapical', 'https://storage.rootsclinic.com/xray/periapical_d2_post.jpg', 'Post-obturation periapical #36'),
  ('a4000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000009', 'a3000000-0000-0000-0000-000000000006', 'e93b7898-8d4b-43c4-ac1e-1505452c9bef', 'panoramic',  'https://storage.rootsclinic.com/xray/panoramic_d9.jpg',       'Full panoramic for implant planning'),
  ('a4000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000001', 'e93b7898-8d4b-43c4-ac1e-1505452c9bef', 'bitewing',   'https://storage.rootsclinic.com/xray/bitewing_d1.jpg',        'Bitewing for caries screening'),
  ('a4000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000003', 'e93b7898-8d4b-43c4-ac1e-1505452c9bef', 'periapical', 'https://storage.rootsclinic.com/xray/periapical_d3.jpg',      'Periapical #46 showing secondary caries');


-- ================================
-- 11. INVENTORY ITEMS
-- ================================

INSERT INTO inventory_items (id, name, sku, category, description, unit, current_stock, reorder_level, unit_price, supplier, status) VALUES
  ('a5000000-0000-0000-0000-000000000001', 'Lidocaine 2% Carpules',          'SKU-ANE-001', 'anesthesia',  'Local anesthetic carpules 1.8ml',           'box',  45, 20, 85.00,   'MediPharm Egypt',  'in_stock'),
  ('a5000000-0000-0000-0000-000000000002', 'Dental Needles (Short)',          'SKU-ANE-002', 'anesthesia',  '30G short dental needles',                  'box',  30, 15, 45.00,   'MediPharm Egypt',  'in_stock'),
  ('a5000000-0000-0000-0000-000000000003', 'Composite Resin A2',             'SKU-RES-001', 'restorative', 'Nanohybrid composite A2 shade 4g',          'unit', 12, 10, 220.00,  'DentaSupply Co.',  'in_stock'),
  ('a5000000-0000-0000-0000-000000000004', 'Composite Resin A3',             'SKU-RES-002', 'restorative', 'Nanohybrid composite A3 shade 4g',          'unit', 8,  10, 220.00,  'DentaSupply Co.',  'low_stock'),
  ('a5000000-0000-0000-0000-000000000005', 'Dental Bonding Agent',           'SKU-RES-003', 'restorative', 'Universal bonding agent 5ml',               'unit', 6,  5,  180.00,  'DentaSupply Co.',  'in_stock'),
  ('a5000000-0000-0000-0000-000000000006', 'Gutta Percha Points #30',        'SKU-END-001', 'endodontics', 'Standardized gutta percha #30',             'box',  20, 10, 55.00,   'EndoCare Ltd.',    'in_stock'),
  ('a5000000-0000-0000-0000-000000000007', 'Rotary NiTi Files (Assorted)',   'SKU-END-002', 'endodontics', 'Single use rotary files set',               'pack', 3,  5,  650.00,  'EndoCare Ltd.',    'critical'),
  ('a5000000-0000-0000-0000-000000000008', 'X-Ray Films Periapical (Size 2)','SKU-RAD-001', 'radiology',   'Periapical films size 2 — box of 150',      'box',  5,  3,  320.00,  'RadioDent Egypt',  'in_stock'),
  ('a5000000-0000-0000-0000-000000000009', 'Lead Apron',                     'SKU-RAD-002', 'radiology',   'Adult lead apron 0.25mm Pb',                'unit', 4,  2,  1200.00, 'RadioDent Egypt',  'in_stock'),
  ('a5000000-0000-0000-0000-000000000010', 'Disposable Gloves Nitrile (M)',  'SKU-GEN-001', 'general',     'Latex-free nitrile gloves medium — 100pcs', 'box',  18, 10, 95.00,   'MedSupply Egypt',  'in_stock'),
  ('a5000000-0000-0000-0000-000000000011', 'Surgical Masks Type IIR',        'SKU-GEN-002', 'general',     'Type IIR surgical masks — 50pcs',           'box',  22, 10, 60.00,   'MedSupply Egypt',  'in_stock'),
  ('a5000000-0000-0000-0000-000000000012', 'Saliva Ejectors',                'SKU-GEN-003', 'general',     'Disposable saliva ejectors — 100pcs',       'box',  0,  5,  35.00,   'MedSupply Egypt',  'out_of_stock'),
  ('a5000000-0000-0000-0000-000000000013', 'Chlorhexidine Mouthwash 0.12%', 'SKU-GEN-004', 'general',     '300ml bottle',                              'unit', 14, 8,  75.00,   'PharmaCare Egypt', 'in_stock'),
  ('a5000000-0000-0000-0000-000000000014', 'Articulating Paper',             'SKU-GEN-005', 'general',     'Blue/Red 200 strips per box',               'box',  9,  5,  40.00,   'DentaSupply Co.',  'in_stock');


-- ================================
-- 12. INVENTORY MOVEMENTS
-- (moved_by = admin or finance)
-- ================================

INSERT INTO inventory_movements (id, item_id, moved_by, movement_type, quantity, notes) VALUES
  ('a6000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', 'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', 'purchase',  50,  'Monthly restock'),
  ('a6000000-0000-0000-0000-000000000002', 'a5000000-0000-0000-0000-000000000001', 'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', 'usage',     -5,  'Used in 5 procedures'),
  ('a6000000-0000-0000-0000-000000000003', 'a5000000-0000-0000-0000-000000000003', 'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', 'purchase',  15,  'Initial stock'),
  ('a6000000-0000-0000-0000-000000000004', 'a5000000-0000-0000-0000-000000000003', 'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', 'usage',     -3,  'Used for 3 composite restorations'),
  ('a6000000-0000-0000-0000-000000000005', 'a5000000-0000-0000-0000-000000000007', 'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', 'usage',     -2,  'Used in 2 root canal sessions'),
  ('a6000000-0000-0000-0000-000000000006', 'a5000000-0000-0000-0000-000000000012', 'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', 'purchase',  10,  'Emergency restock'),
  ('a6000000-0000-0000-0000-000000000007', 'a5000000-0000-0000-0000-000000000012', 'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', 'usage',     -10, 'Stock fully depleted'),
  ('a6000000-0000-0000-0000-000000000008', 'a5000000-0000-0000-0000-000000000010', 'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', 'purchase',  20,  'Bulk purchase'),
  ('a6000000-0000-0000-0000-000000000009', 'a5000000-0000-0000-0000-000000000004', 'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', 'usage',     -2,  'Composite restorations'),
  ('a6000000-0000-0000-0000-000000000010', 'a5000000-0000-0000-0000-000000000006', 'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', 'usage',     -4,  'Root canal procedures');


-- ================================
-- 13. INVOICES
-- (created_by = finance)
-- ================================

INSERT INTO invoices (id, invoice_number, patient_id, visit_id, created_by, subtotal, discount, tax, total, amount_paid, status, due_date, notes) VALUES
  ('b2000000-0000-0000-0000-000000000001', 'INV-2025-0001', 'd1000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000001', 'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', 300.00,  0.00,   0.00, 300.00,  300.00, 'paid',    CURRENT_DATE - INTERVAL '20 days', NULL),
  ('b2000000-0000-0000-0000-000000000002', 'INV-2025-0002', 'd1000000-0000-0000-0000-000000000002', 'a3000000-0000-0000-0000-000000000002', 'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', 1200.00, 100.00, 0.00, 1100.00, 600.00, 'partial', CURRENT_DATE + INTERVAL '10 days', 'Insurance covering partial amount'),
  ('b2000000-0000-0000-0000-000000000003', 'INV-2025-0003', 'd1000000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000003', 'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', 400.00,  0.00,   0.00, 400.00,  400.00, 'paid',    CURRENT_DATE - INTERVAL '12 days', NULL),
  ('b2000000-0000-0000-0000-000000000004', 'INV-2025-0004', 'd1000000-0000-0000-0000-000000000008', 'a3000000-0000-0000-0000-000000000004', 'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', 200.00,  20.00,  0.00, 180.00,  180.00, 'paid',    CURRENT_DATE - INTERVAL '8 days',  '10% child discount applied'),
  ('b2000000-0000-0000-0000-000000000005', 'INV-2025-0005', 'd1000000-0000-0000-0000-000000000006', 'a3000000-0000-0000-0000-000000000005', 'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', 650.00,  0.00,   0.00, 650.00,  0.00,   'pending', CURRENT_DATE + INTERVAL '15 days', NULL),
  ('b2000000-0000-0000-0000-000000000006', 'INV-2025-0006', 'd1000000-0000-0000-0000-000000000009', 'a3000000-0000-0000-0000-000000000006', 'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', 500.00,  0.00,   0.00, 500.00,  0.00,   'overdue', CURRENT_DATE - INTERVAL '5 days',  'Overdue — follow up needed'),
  ('b2000000-0000-0000-0000-000000000007', 'INV-2025-0007', 'd1000000-0000-0000-0000-000000000005', NULL,                                    'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', 900.00,  0.00,   0.00, 900.00,  900.00, 'paid',    CURRENT_DATE - INTERVAL '2 days',  NULL),
  ('b2000000-0000-0000-0000-000000000008', 'INV-2025-0008', 'd1000000-0000-0000-0000-000000000007', NULL,                                    'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', 1500.00, 150.00, 0.00, 1350.00, 675.00, 'partial', CURRENT_DATE + INTERVAL '30 days', 'Implant plan — installments');


-- ================================
-- 14. INVOICE ITEMS
-- ================================

INSERT INTO invoice_items (id, invoice_id, doctor_id, service_name, quantity, unit_price, discount_pct, total) VALUES
  ('b3000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Scaling & Polishing',          1, 300.00,  0,  300.00),
  ('b3000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004', 'Root Canal Therapy',           1, 1000.00, 0,  1000.00),
  ('b3000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004', 'Temporary Crown',              1, 200.00,  0,  200.00),
  ('b3000000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'Composite Filling (Class II)', 1, 400.00,  0,  400.00),
  ('b3000000-0000-0000-0000-000000000005', 'b2000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000003', 'Pediatric Cleaning',           1, 200.00,  10, 180.00),
  ('b3000000-0000-0000-0000-000000000006', 'b2000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001', 'Full Mouth Debridement',       1, 450.00,  0,  450.00),
  ('b3000000-0000-0000-0000-000000000007', 'b2000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001', 'OHI Session',                  1, 200.00,  0,  200.00),
  ('b3000000-0000-0000-0000-000000000008', 'b2000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000001', 'Implant Consultation',         1, 200.00,  0,  200.00),
  ('b3000000-0000-0000-0000-000000000009', 'b2000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000001', 'CBCT Scan',                    1, 300.00,  0,  300.00),
  ('b3000000-0000-0000-0000-000000000010', 'b2000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000004', 'Root Canal Therapy',           1, 900.00,  0,  900.00),
  ('b3000000-0000-0000-0000-000000000011', 'b2000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000005', 'Implant Fixture (Single)',     1, 1000.00, 10, 900.00),
  ('b3000000-0000-0000-0000-000000000012', 'b2000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000005', 'Implant Crown',                1, 600.00,  10, 540.00),
  ('b3000000-0000-0000-0000-000000000013', 'b2000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000005', 'Bone Graft',                   1, 250.00,  0,  250.00);


-- ================================
-- 15. PAYMENTS
-- (received_by = finance)
-- ================================

INSERT INTO payments (id, payment_ref, invoice_id, patient_id, received_by, amount, method, status, transaction_ref, notes) VALUES
  ('b4000000-0000-0000-0000-000000000001', 'PAY-2025-0001', 'b2000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', 300.00,  'cash',          'completed', NULL,           NULL),
  ('b4000000-0000-0000-0000-000000000002', 'PAY-2025-0002', 'b2000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', 'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', 600.00,  'insurance',     'completed', 'INS-ALZ-5502', 'Allianz partial payment'),
  ('b4000000-0000-0000-0000-000000000003', 'PAY-2025-0003', 'b2000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000003', 'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', 400.00,  'card',          'completed', 'CARD-9923',    NULL),
  ('b4000000-0000-0000-0000-000000000004', 'PAY-2025-0004', 'b2000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000008', 'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', 180.00,  'cash',          'completed', NULL,           NULL),
  ('b4000000-0000-0000-0000-000000000005', 'PAY-2025-0005', 'b2000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000005', 'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', 900.00,  'card',          'completed', 'CARD-4471',    NULL),
  ('b4000000-0000-0000-0000-000000000006', 'PAY-2025-0006', 'b2000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000007', 'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', 675.00,  'bank_transfer', 'completed', 'TRF-2025-881', 'First installment');


-- ================================
-- 16. INSURANCE CLAIMS
-- ================================

INSERT INTO insurance_claims (id, invoice_id, patient_id, provider, policy_number, claimed_amount, approved_amount, status, submitted_at, resolved_at, notes) VALUES
  ('b5000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', 'Allianz', 'AL-20002', 600.00, 600.00, 'approved', NOW() - INTERVAL '18 days', NOW() - INTERVAL '12 days', 'Full claim approved for RCT'),
  ('b5000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000006', 'MedNet',  NULL,       650.00, 0.00,   'pending',  NOW() - INTERVAL '3 days',  NULL,                       'Awaiting approval for debridement'),
  ('b5000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000009', 'AXA',     'AX-30009', 500.00, 300.00, 'partial',  NOW() - INTERVAL '6 days',  NOW() - INTERVAL '1 day',   'Partial approval — CBCT not covered'),
  ('b5000000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000007', 'Allianz', 'AL-20007', 700.00, 0.00,   'submitted',NOW() - INTERVAL '1 day',   NULL,                       'Submitted for implant coverage review');


-- ================================
-- 17. EXPENSES
-- (added_by = finance)
-- ================================

INSERT INTO expenses (id, title, description, category, department, amount, status, added_by, expense_date) VALUES
  ('b6000000-0000-0000-0000-000000000001', 'Clinic Rent — February 2025',      'Monthly rent for main clinic unit',          'fixed',     'admin',        8000.00, 'paid',    'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', '2025-02-01'),
  ('b6000000-0000-0000-0000-000000000002', 'Staff Salaries — February 2025',   'Full payroll for all staff',                 'personnel', 'admin',        35000.00,'paid',    'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', '2025-02-28'),
  ('b6000000-0000-0000-0000-000000000003', 'Dental Supplies Restock',          'NiTi files, composites, bonding agents',     'inventory', 'general care', 4200.00, 'paid',    'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', '2025-02-10'),
  ('b6000000-0000-0000-0000-000000000004', 'X-Ray Machine Maintenance',        'Annual maintenance contract',                'service',   'radiology',    2500.00, 'paid',    'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', '2025-01-15'),
  ('b6000000-0000-0000-0000-000000000005', 'Electricity Bill — January 2025',  NULL,                                         'utility',   'admin',        1200.00, 'paid',    'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', '2025-01-31'),
  ('b6000000-0000-0000-0000-000000000006', 'Autoclave Sterilization Pouches',  'Box of 200 self-sealing pouches',            'inventory', 'general care', 350.00,  'paid',    'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', '2025-02-05'),
  ('b6000000-0000-0000-0000-000000000007', 'Clinic Rent — March 2025',         'Monthly rent for main clinic unit',          'fixed',     'admin',        8000.00, 'pending', 'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', '2025-03-01'),
  ('b6000000-0000-0000-0000-000000000008', 'Internet & Phone — February 2025', 'Monthly telecom bill',                       'utility',   'admin',        450.00,  'paid',    'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', '2025-02-28'),
  ('b6000000-0000-0000-0000-000000000009', 'Clinic Software Subscription',     'Monthly SaaS fee for management system',     'service',   'admin',        600.00,  'paid',    'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', '2025-02-01'),
  ('b6000000-0000-0000-0000-000000000010', 'PPE Supplies (Gloves & Masks)',     'Bulk purchase of gloves and surgical masks', 'inventory', 'general care', 780.00,  'paid',    'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', '2025-02-18'),
  ('b6000000-0000-0000-0000-000000000011', 'Waiting Room Furniture Repair',    'Sofa reupholstery',                          'other',     'admin',        900.00,  'pending', 'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', '2025-02-25'),
  ('b6000000-0000-0000-0000-000000000012', 'Water Dispenser Rental — Q1 2025', 'Quarterly rental for water dispenser unit',  'utility',   'admin',        300.00,  'paid',    'ed1ac66e-f095-4165-bd47-d2bc650f8dd6', '2025-01-01');

-- ================================
-- DONE
-- ================================
