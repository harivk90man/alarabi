-- Al Arabi Plastic Factory — Seed Data
-- Migration 002: Categories, Machines, Operators, Spare Parts

-- ============================================
-- CATEGORIES (14)
-- ============================================
INSERT INTO categories (name, prefix, description) VALUES
  ('Extruder', 'Ex', 'Blow film extruder machines'),
  ('Flexo Printer', 'FP', 'Flexographic printing machines'),
  ('Bag Cutting', 'CS', 'Bag making and cutting machines'),
  ('Roll Machine', 'RM', 'Roll sheet machines'),
  ('Chiller', 'CH', 'Water chiller units'),
  ('Air Compressor', 'AC', 'Screw air compressors'),
  ('Air Dryer', 'AD', 'Refrigerated air dryers'),
  ('Cooling Tower', 'CT', 'Cooling tower units'),
  ('Water Cooler', 'WC', 'Water air cooler units'),
  ('Mixer', 'MX', 'Material mixer machines'),
  ('AirHydra Press', 'AP', 'AirHydra press machines'),
  ('Punching Press', 'MP', 'Mechanical punching press machines'),
  ('Slitting', 'SM', 'Slitting machines'),
  ('Recycling', 'PR', 'Plastic recycling machines')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- MACHINES (130+)
-- ============================================

-- EXTRUDERS (33)
INSERT INTO machines (id, name, model, category_id, manufacturer) VALUES
  ('Ex01', 'Lung Meng Blow Film Extruder', 'LM65', (SELECT id FROM categories WHERE prefix='Ex'), 'Lung Meng'),
  ('Ex02', 'Italwork Blow Film Extruder', 'KE 55', (SELECT id FROM categories WHERE prefix='Ex'), 'Italwork S.A.S.'),
  ('Ex03', 'Ye I Machinery Blow Film Extruder', 'HSE 80', (SELECT id FROM categories WHERE prefix='Ex'), 'Ye I Machinery'),
  ('Ex04', 'Cherng Horng Blow Film Extruder', 'HPE 65 S', (SELECT id FROM categories WHERE prefix='Ex'), 'Cherng Horng'),
  ('Ex05', 'Lung Meng Blow Film Extruder', 'LM/AH65T', (SELECT id FROM categories WHERE prefix='Ex'), 'Lung Meng'),
  ('Ex06', 'Zam Zam Blow Film Extruder', 'THD 55', (SELECT id FROM categories WHERE prefix='Ex'), 'Zam Zam'),
  ('Ex07', 'Cherng Horng Blow Film Extruder (Converted)', 'HL 55 to 65', (SELECT id FROM categories WHERE prefix='Ex'), 'Cherng Horng'),
  ('Ex08', 'ItalWork Blow Film Extruder', 'KG 75', (SELECT id FROM categories WHERE prefix='Ex'), 'ItalWork'),
  ('Ex11', 'Cherng Horng Blow Film Extruder', 'HL 65S', (SELECT id FROM categories WHERE prefix='Ex'), 'Cherng Horng'),
  ('Ex12', 'Cherng Horng Blow Film Extruder', 'Mini 50 A', (SELECT id FROM categories WHERE prefix='Ex'), 'Cherng Horng'),
  ('Ex13', 'Cherng Horng Blow Film Extruder', 'Mini 50 A', (SELECT id FROM categories WHERE prefix='Ex'), 'Cherng Horng'),
  ('Ex14', 'Lung Meng PP Blow Film Extruder', 'IC 50 A LM AP 55', (SELECT id FROM categories WHERE prefix='Ex'), 'Lung Meng'),
  ('Ex15', 'Cherng Horng Blow Film Extruder', 'Mini 50 A', (SELECT id FROM categories WHERE prefix='Ex'), 'Cherng Horng'),
  ('Ex16', 'Cherng Horng Blow Film Extruder', 'Mini 50 A', (SELECT id FROM categories WHERE prefix='Ex'), 'Cherng Horng'),
  ('Ex17', 'TECOM Rotary Blow Film Extruder', 'MB50B.1100', (SELECT id FROM categories WHERE prefix='Ex'), 'TECOM SRL'),
  ('Ex18', 'QueenPlas Blow Film Extruder', 'QN 55 800', (SELECT id FROM categories WHERE prefix='Ex'), 'QueenPlas'),
  ('Ex19', 'QueenPlas Blow Film Extruder', 'QN 55 800', (SELECT id FROM categories WHERE prefix='Ex'), 'QueenPlas'),
  ('Ex20', 'Cherng Horng Blow Film Extruder', 'Mini 50 A', (SELECT id FROM categories WHERE prefix='Ex'), 'Cherng Horng'),
  ('Ex21', 'QueenPlas Blow Film Extruder', 'QN 55 800', (SELECT id FROM categories WHERE prefix='Ex'), 'QueenPlas'),
  ('Ex22', 'QueenPlas Blow Film Extruder', 'QN 55 800', (SELECT id FROM categories WHERE prefix='Ex'), 'QueenPlas'),
  ('Ex24', 'Cherng Horng Extruder + 2C Flexo', 'Mini 50 A', (SELECT id FROM categories WHERE prefix='Ex'), 'Cherng Horng'),
  ('Ex25', 'Cherng Horng Extruder + 2C Flexo', 'Mini 50 A', (SELECT id FROM categories WHERE prefix='Ex'), 'Cherng Horng'),
  ('Ex26', 'Cherng Horng Extruder + 4C Flexo', 'ABA 5555 SA', (SELECT id FROM categories WHERE prefix='Ex'), 'Cherng Horng'),
  ('Ex27', 'Cherng Horng Extruder + 4C Flexo', 'ABA 5555 SA (A/HL)', (SELECT id FROM categories WHERE prefix='Ex'), 'Cherng Horng'),
  ('Ex28', 'Cherng Horng Extruder + 4C Flexo', 'ABA 5555 SA', (SELECT id FROM categories WHERE prefix='Ex'), 'Cherng Horng'),
  ('Ex29', 'Cherng Horng Extruder + 4C Flexo', 'ABA 5555 SA (A/HL)', (SELECT id FROM categories WHERE prefix='Ex'), 'Cherng Horng'),
  ('Ex30', 'Cherng Horng Blow Film Extruder', 'ABA 6565A', (SELECT id FROM categories WHERE prefix='Ex'), 'Cherng Horng'),
  ('Ex31', 'Lung Meng Blow Film Extruder', 'LM-AH75T', (SELECT id FROM categories WHERE prefix='Ex'), 'Lung Meng'),
  ('Ex32', 'Cherng Horng Blow Film Extruder', 'Mini 50 A', (SELECT id FROM categories WHERE prefix='Ex'), 'Cherng Horng'),
  ('Ex33', 'Lung Meng Blow Film Extruder', 'LM-AH65SC', (SELECT id FROM categories WHERE prefix='Ex'), 'Lung Meng'),
  ('Ex34', 'Lung Meng Blow Film Extruder', 'LM/AH65T', (SELECT id FROM categories WHERE prefix='Ex'), 'Lung Meng'),
  ('Ex35', 'Lung Meng PP2 Blow Film Extruder', 'LM AP65', (SELECT id FROM categories WHERE prefix='Ex'), 'Lung Meng'),
  ('Ex36', 'Extruder 36 (Reserved)', 'TBD', (SELECT id FROM categories WHERE prefix='Ex'), 'TBD')
ON CONFLICT (id) DO NOTHING;

-- RECYCLING (1)
INSERT INTO machines (id, name, model, category_id, manufacturer) VALUES
  ('PR02', 'Ye I Machinery Recycling Machine', 'YDN-U-105G-1', (SELECT id FROM categories WHERE prefix='PR'), 'Ye I Machinery')
ON CONFLICT (id) DO NOTHING;

-- FLEXO PRINTERS (14)
INSERT INTO machines (id, name, model, category_id, manufacturer) VALUES
  ('FP01', 'Derthona 4-Color Flexo Printer', '60/70 Serie: 4AZ', (SELECT id FROM categories WHERE prefix='FP'), 'Derthona'),
  ('FP02', 'Italwork 6-Color Flexo Printer', '6AZ-MAT', (SELECT id FROM categories WHERE prefix='FP'), 'Italwork S.A.S.'),
  ('FP03', 'Cherng Horng 4-Color Flexo Printer', 'HJ-4001 XL', (SELECT id FROM categories WHERE prefix='FP'), 'Cherng Horng'),
  ('FP04', 'Flexo Printer 04 (Reserved)', 'TBD', (SELECT id FROM categories WHERE prefix='FP'), 'TBD'),
  ('FP05', 'Cherng Horng 4-Color Flexo Printer', 'CH-H5 4001M', (SELECT id FROM categories WHERE prefix='FP'), 'Cherng Horng'),
  ('FP06', 'Hemingstone 4-Color Flexo Printer', 'HM 1004FP-0D-AA', (SELECT id FROM categories WHERE prefix='FP'), 'Hemingstone'),
  ('FP07', 'Hemingstone 6-Color Flexo Printer', 'HM 1206FP-0D', (SELECT id FROM categories WHERE prefix='FP'), 'Hemingstone'),
  ('FP08', 'Hemingstone 4-Color Flexo Printer', 'HM-1004FP-2E-0R', (SELECT id FROM categories WHERE prefix='FP'), 'Hemingstone'),
  ('FP09', 'Hemingstone 4-Color Flexo Printer', 'HM-1004FP-2E-0R', (SELECT id FROM categories WHERE prefix='FP'), 'Hemingstone'),
  ('FP10', 'Cherng Horng 2-Color Flexo [inline Ex25]', 'CH-2004S (M)', (SELECT id FROM categories WHERE prefix='FP'), 'Cherng Horng'),
  ('FP11', 'Cherng Horng 2-Color Flexo [inline Ex24]', 'CH-2004S (M)', (SELECT id FROM categories WHERE prefix='FP'), 'Cherng Horng'),
  ('FP12', 'Cherng Horng 2-Color Flexo [inline Ex26]', 'CH-2004M', (SELECT id FROM categories WHERE prefix='FP'), 'Cherng Horng'),
  ('FP13', 'Cherng Horng 4-Color Flexo [inline Ex28]', 'CH-4004M', (SELECT id FROM categories WHERE prefix='FP'), 'Cherng Horng'),
  ('FP14', 'Cherng Horng 4-Color Flexo [inline Ex29]', 'HJ-2004M', (SELECT id FROM categories WHERE prefix='FP'), 'Cherng Horng')
ON CONFLICT (id) DO NOTHING;

-- BAG CUTTING MACHINES (32 per brief — actual list has 26 IDs)
INSERT INTO machines (id, name, model, category_id, manufacturer) VALUES
  ('CS02', 'ELBA Bag Making Machine', 'ES-1000M', (SELECT id FROM categories WHERE prefix='CS'), 'ELBA'),
  ('CS10', 'HYMAC Bag Making Machine', 'HSS34NAUSR', (SELECT id FROM categories WHERE prefix='CS'), 'Hong Yueng (HYMAC)'),
  ('CS12', 'HYMAC Bag Making Machine', 'HSS34NAUSR', (SELECT id FROM categories WHERE prefix='CS'), 'Hong Yueng (HYMAC)'),
  ('CS13', 'Lung Meng Bag Making Machine', 'ASTP-800C', (SELECT id FROM categories WHERE prefix='CS'), 'Lung Meng'),
  ('CS14', 'Bag Cutting 14 (Reserved)', 'TBD', (SELECT id FROM categories WHERE prefix='CS'), 'TBD'),
  ('CS15', 'Viara Bag Making Machine', 'PUPA', (SELECT id FROM categories WHERE prefix='CS'), 'Viara srl'),
  ('CS16', 'Viara Bag Making Machine', 'PUPA', (SELECT id FROM categories WHERE prefix='CS'), 'Viara srl'),
  ('CS17', 'Lung Meng Bag Making Machine', 'ASTP-800C', (SELECT id FROM categories WHERE prefix='CS'), 'Lung Meng'),
  ('CS18', 'Hemingstone Bag Making Machine', 'HM1000DT', (SELECT id FROM categories WHERE prefix='CS'), 'Hemingstone'),
  ('CS19', 'Hemingstone Bag Making Machine', 'HM810VL-SV', (SELECT id FROM categories WHERE prefix='CS'), 'Hemingstone'),
  ('CS21', 'Lung Meng Bag Making Machine', 'ASTP 1000C', (SELECT id FROM categories WHERE prefix='CS'), 'Lung Meng'),
  ('CS23', 'Mamata Bag Making Machine', 'VEGA 1200 SPLIT', (SELECT id FROM categories WHERE prefix='CS'), 'Mamata'),
  ('CS24', 'Lung Meng Bag Making Machine', 'ASTP1200C', (SELECT id FROM categories WHERE prefix='CS'), 'Lung Meng'),
  ('CS25', 'Lung Meng Bag Making Machine', 'ASTP-800', (SELECT id FROM categories WHERE prefix='CS'), 'Lung Meng'),
  ('CS26', 'Avita Cutting Bag Making Machine', 'AV-B-360 TP-ST2', (SELECT id FROM categories WHERE prefix='CS'), 'Avita'),
  ('CS27', 'Hemingstone Bag Making Machine', 'HM 810B-SV', (SELECT id FROM categories WHERE prefix='CS'), 'Hemingstone'),
  ('CS28', 'Hemingstone Bag Making Machine', 'HM-14000 VA SV', (SELECT id FROM categories WHERE prefix='CS'), 'Hemingstone'),
  ('CS29', 'Hemingstone Bag Making Machine', 'HM 1200FB', (SELECT id FROM categories WHERE prefix='CS'), 'Hemingstone'),
  ('CS30', 'Hemingstone Bag Making Machine', 'HM-800W+CK', (SELECT id FROM categories WHERE prefix='CS'), 'Hemingstone'),
  ('CS31', 'Cosmo Bag Making Machine', 'SA-28', (SELECT id FROM categories WHERE prefix='CS'), 'Cosmo'),
  ('CS32', 'Hemingstone Bag Making Machine', 'HM-1000FB', (SELECT id FROM categories WHERE prefix='CS'), 'Hemingstone'),
  ('CS33', 'ELBA Bag Making Machine', 'ESM100', (SELECT id FROM categories WHERE prefix='CS'), 'ELBA'),
  ('CS34', 'Hemingstone Bag Making Machine', 'HM-810SFP-SV', (SELECT id FROM categories WHERE prefix='CS'), 'Hemingstone'),
  ('CS35', 'Hemingstone Loop Handle Machine', 'HM 500JF', (SELECT id FROM categories WHERE prefix='CS'), 'Hemingstone'),
  ('CS36', 'Cosmo Bag Making Machine', 'SCB-800-L2', (SELECT id FROM categories WHERE prefix='CS'), 'Cosmo'),
  ('CS37', 'JIN CHANG Gloves Making Machine', 'JCGP 40', (SELECT id FROM categories WHERE prefix='CS'), 'JIN CHANG')
ON CONFLICT (id) DO NOTHING;

-- CHILLERS (4)
INSERT INTO machines (id, name, model, category_id, manufacturer) VALUES
  ('CH01', 'Water Chiller #1 (PP Chiller)', NULL, (SELECT id FROM categories WHERE prefix='CH'), NULL),
  ('CH02', 'Water Chiller #2 (PP Chiller)', NULL, (SELECT id FROM categories WHERE prefix='CH'), NULL),
  ('CH03', 'Euro Chiller (Air Cooler Ex17)', 'ABFPWH020', (SELECT id FROM categories WHERE prefix='CH'), 'Euro Chiller'),
  ('CH04', 'Water Chiller #4', 'FSC-20W', (SELECT id FROM categories WHERE prefix='CH'), NULL)
ON CONFLICT (id) DO NOTHING;

-- AIR COMPRESSORS (7)
INSERT INTO machines (id, name, model, category_id, manufacturer) VALUES
  ('AC05', 'ALUP Screw Air Compressor', 'SCK 26-08TR', (SELECT id FROM categories WHERE prefix='AC'), 'ALUP'),
  ('AC06', 'Aydin Trafo Screw Air Compressor', 'AVT-37', (SELECT id FROM categories WHERE prefix='AC'), 'Aydin Trafo'),
  ('AC07', 'Aydin Trafo Screw Air Compressor', 'AVT-37', (SELECT id FROM categories WHERE prefix='AC'), 'Aydin Trafo'),
  ('AC08', 'Aydin Trafo Screw Air Compressor', 'AVT-37', (SELECT id FROM categories WHERE prefix='AC'), 'Aydin Trafo'),
  ('AC09', 'Aydin Trafo Screw Air Compressor', 'AVT-37', (SELECT id FROM categories WHERE prefix='AC'), 'Aydin Trafo'),
  ('AC10', 'Aydin Trafo Screw Air Compressor (Direct Drive)', 'ATV-A-30', (SELECT id FROM categories WHERE prefix='AC'), 'Aydin Trafo'),
  ('AC11', 'Aydin Trafo Screw Air Compressor (Direct Drive)', 'ATV-A-30', (SELECT id FROM categories WHERE prefix='AC'), 'Aydin Trafo')
ON CONFLICT (id) DO NOTHING;

-- AIR DRYERS (4)
INSERT INTO machines (id, name, model, category_id, manufacturer) VALUES
  ('AD01', 'Ingersoll Rand Ref. Air Dryer', 'D240IN-A', (SELECT id FROM categories WHERE prefix='AD'), 'Ingersoll Rand'),
  ('AD02', 'Ingersoll Rand Ref. Air Dryer', 'D260IN-A', (SELECT id FROM categories WHERE prefix='AD'), 'Ingersoll Rand'),
  ('AD03', 'Ingersoll Rand Ref. Air Dryer', 'D260IN-A', (SELECT id FROM categories WHERE prefix='AD'), 'Ingersoll Rand'),
  ('AD04', 'Aydin Trafo Air Dryer', 'TMP-HKP 2220', (SELECT id FROM categories WHERE prefix='AD'), 'Aydin Trafo')
ON CONFLICT (id) DO NOTHING;

-- ROLL SHEET MACHINES (6)
INSERT INTO machines (id, name, model, category_id, manufacturer) VALUES
  ('RM01', 'Zam Zam Roll Sheet Machine', 'FTAHI 40x60', (SELECT id FROM categories WHERE prefix='RM'), 'Zam Zam'),
  ('RM03', 'Lung Meng Roll Sheet Machine', 'TX 800', (SELECT id FROM categories WHERE prefix='RM'), 'Lung Meng'),
  ('RM04', 'Hemingstone Roll Sheet Machine', 'HM 1000MR+C2', (SELECT id FROM categories WHERE prefix='RM'), 'Hemingstone'),
  ('RM05', 'Lung Meng Roll Sheet Machine', 'TAA-1500BD', (SELECT id FROM categories WHERE prefix='RM'), 'Lung Meng'),
  ('RM06', 'Cosmo Roll Sheet Machine', 'SBCR-800-OB+J', (SELECT id FROM categories WHERE prefix='RM'), 'Cosmo'),
  ('RM07', 'Cosmo Roll Sheet Machine', 'SMNR/CR-1000+DS+L', (SELECT id FROM categories WHERE prefix='RM'), 'Cosmo')
ON CONFLICT (id) DO NOTHING;

-- SLITTING MACHINES (2)
INSERT INTO machines (id, name, model, category_id, manufacturer) VALUES
  ('SM01', 'Slitting Machine 800mm', '800mm', (SELECT id FROM categories WHERE prefix='SM'), NULL),
  ('SM02', 'Slitting Machine 1400mm', '1400mm', (SELECT id FROM categories WHERE prefix='SM'), NULL)
ON CONFLICT (id) DO NOTHING;

-- COOLING TOWERS (3)
INSERT INTO machines (id, name, model, category_id, manufacturer) VALUES
  ('CT01', 'Cooling Tower (Extruders/Chillers)', 'LBC-125', (SELECT id FROM categories WHERE prefix='CT'), NULL),
  ('CT02', 'Cooling Tower (Plastic Recycling)', 'LBC-125', (SELECT id FROM categories WHERE prefix='CT'), NULL),
  ('CT03', 'Cooling Tower 3', NULL, (SELECT id FROM categories WHERE prefix='CT'), NULL)
ON CONFLICT (id) DO NOTHING;

-- WATER AIR COOLERS (10)
INSERT INTO machines (id, name, model, category_id, manufacturer) VALUES
  ('WC01', 'Water Air Cooler #1', NULL, (SELECT id FROM categories WHERE prefix='WC'), NULL),
  ('WC02', 'Water Air Cooler #2', NULL, (SELECT id FROM categories WHERE prefix='WC'), NULL),
  ('WC03', 'Water Air Cooler #3', NULL, (SELECT id FROM categories WHERE prefix='WC'), NULL),
  ('WC04', 'Water Air Cooler #4', NULL, (SELECT id FROM categories WHERE prefix='WC'), NULL),
  ('WC05', 'Water Air Cooler #5', NULL, (SELECT id FROM categories WHERE prefix='WC'), NULL),
  ('WC06', 'Water Air Cooler #6', NULL, (SELECT id FROM categories WHERE prefix='WC'), NULL),
  ('WC07', 'Water Air Cooler #7', NULL, (SELECT id FROM categories WHERE prefix='WC'), NULL),
  ('WC08', 'Water Air Cooler #8', NULL, (SELECT id FROM categories WHERE prefix='WC'), NULL),
  ('WC09', 'Water Air Cooler #9', NULL, (SELECT id FROM categories WHERE prefix='WC'), NULL),
  ('WC10', 'Water Air Cooler #10', NULL, (SELECT id FROM categories WHERE prefix='WC'), NULL)
ON CONFLICT (id) DO NOTHING;

-- MATERIAL MIXERS (11)
INSERT INTO machines (id, name, model, category_id, manufacturer) VALUES
  ('MX01', 'Material Mixer #1', NULL, (SELECT id FROM categories WHERE prefix='MX'), NULL),
  ('MX02', 'Material Mixer #2', NULL, (SELECT id FROM categories WHERE prefix='MX'), NULL),
  ('MX03', 'Material Mixer #3', NULL, (SELECT id FROM categories WHERE prefix='MX'), NULL),
  ('MX04', 'Material Mixer #4', NULL, (SELECT id FROM categories WHERE prefix='MX'), NULL),
  ('MX05', 'Material Mixer #5', NULL, (SELECT id FROM categories WHERE prefix='MX'), NULL),
  ('MX06', 'Material Mixer #6', NULL, (SELECT id FROM categories WHERE prefix='MX'), NULL),
  ('MX07', 'Material Mixer #7', 'LSH-500-500KG', (SELECT id FROM categories WHERE prefix='MX'), NULL),
  ('MX08', 'Material Mixer #8', 'LSH-500-500KG', (SELECT id FROM categories WHERE prefix='MX'), NULL),
  ('MX09', 'Material Mixer #9', 'LSH-500-500KG', (SELECT id FROM categories WHERE prefix='MX'), NULL),
  ('MX10', 'Material Mixer #10', NULL, (SELECT id FROM categories WHERE prefix='MX'), NULL),
  ('MX11', 'Material Mixer #11', 'LSH-500-500KG', (SELECT id FROM categories WHERE prefix='MX'), NULL)
ON CONFLICT (id) DO NOTHING;

-- AIRHYDRA PRESS (4)
INSERT INTO machines (id, name, model, category_id, manufacturer) VALUES
  ('AP01', 'Hemingstone AirHydra Press', '5-C-SC-55', (SELECT id FROM categories WHERE prefix='AP'), 'Hemingstone'),
  ('AP02', 'Hemingstone AirHydra Press', '5-C-SC-55', (SELECT id FROM categories WHERE prefix='AP'), 'Hemingstone'),
  ('AP03', 'Hemingstone AirHydra Press', 'A005-AP-A1-1', (SELECT id FROM categories WHERE prefix='AP'), 'Hemingstone'),
  ('AP04', 'Hemingstone AirHydra Press', '5-C-SC-55', (SELECT id FROM categories WHERE prefix='AP'), 'Hemingstone')
ON CONFLICT (id) DO NOTHING;

-- MECHANICAL PUNCHING PRESS (10)
INSERT INTO machines (id, name, model, category_id, manufacturer) VALUES
  ('MP01', 'ELBA Mechanical Punching Press', '8 ton', (SELECT id FROM categories WHERE prefix='MP'), 'ELBA S.p.a.'),
  ('MP02', 'CGM/FUSTEL Mechanical Punching Press', '10D-Plast/74', (SELECT id FROM categories WHERE prefix='MP'), 'CGM/FUSTEL'),
  ('MP03', 'CGM/FUSTEL Mechanical Punching Press', 'Plast/74', (SELECT id FROM categories WHERE prefix='MP'), 'CGM/FUSTEL'),
  ('MP04', 'CGM/FUSTEL Mechanical Punching Press', 'Plast/74', (SELECT id FROM categories WHERE prefix='MP'), 'CGM/FUSTEL'),
  ('MP05', 'CGM/FUSTEL Mechanical Punching Press', 'Plast/74', (SELECT id FROM categories WHERE prefix='MP'), 'CGM/FUSTEL'),
  ('MP06', 'CGM/FUSTEL Mechanical Punching Press', 'Plast/74', (SELECT id FROM categories WHERE prefix='MP'), 'CGM/FUSTEL'),
  ('MP07', 'CGM/FUSTEL Mechanical Punching Press', 'Plast/74', (SELECT id FROM categories WHERE prefix='MP'), 'CGM/FUSTEL'),
  ('MP08', 'CGM/FUSTEL Mechanical Punching Press', 'Plast/74', (SELECT id FROM categories WHERE prefix='MP'), 'CGM/FUSTEL'),
  ('MP09', 'CGM/FUSTEL Mechanical Punching Press', 'Plast/74', (SELECT id FROM categories WHERE prefix='MP'), 'CGM/FUSTEL'),
  ('MP10', 'CGM/FUSTEL Mechanical Punching Press', 'Plast/74', (SELECT id FROM categories WHERE prefix='MP'), 'CGM/FUSTEL')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- OPERATORS (109)
-- ============================================
INSERT INTO operators (id, name, role) VALUES
  ('109', 'OPERATOR 109', 'operator'),
  ('29', 'HARIBABU', 'operator'),
  ('75', 'UMAPAD', 'operator'),
  ('91', 'SANJEEVA', 'operator'),
  ('103', 'REFIQUL', 'operator'),
  ('120', 'FAYZUL HAQ', 'operator'),
  ('129', 'V. FAZULMUSLAND', 'operator'),
  ('131', 'VISHNU', 'operator'),
  ('138', 'HABIB', 'operator'),
  ('155', 'SUNIMAL', 'operator'),
  ('164', 'AHMED ALI', 'operator'),
  ('172', 'TAHA', 'operator'),
  ('177', 'SAMAD', 'operator'),
  ('182', 'UMMER', 'operator'),
  ('185', 'ALI EZZAT', 'operator'),
  ('201', 'PUGAZANTHI', 'operator'),
  ('203', 'VISWANATHAN', 'admin'),
  ('205', 'WINROY', 'operator'),
  ('220', 'MOH HASSAN', 'operator'),
  ('224', 'M.NOURELDIN', 'operator'),
  ('225', 'SELVEN', 'operator'),
  ('228', 'SUJITH', 'operator'),
  ('229', 'SRENVAS', 'operator'),
  ('231', 'ABU BAKER', 'operator'),
  ('328', 'KARTHIK', 'operator'),
  ('354', 'NUWAN', 'operator'),
  ('357', 'GANESH YAEV', 'operator'),
  ('361', 'DANTY', 'operator'),
  ('362', 'JEFREN', 'operator'),
  ('374', 'MANI KUMAR', 'operator'),
  ('381', 'RANUKA', 'operator'),
  ('432', 'KAMRAN', 'operator'),
  ('435', 'JAMIL', 'operator'),
  ('440', 'DHARMENDRA', 'operator'),
  ('450', 'MAHMOOD', 'operator'),
  ('451', 'MASOUD', 'operator'),
  ('452', 'RABIAH', 'operator'),
  ('459', 'KHALED', 'operator'),
  ('462', 'AHMED', 'operator'),
  ('477', 'AHMED HAMED', 'operator'),
  ('478', 'RAJITH', 'operator'),
  ('479', 'ASHNUL', 'operator'),
  ('480', 'DAYAN', 'operator'),
  ('481', 'AMEER', 'operator'),
  ('482', 'KABIR', 'operator'),
  ('483', 'SANDEEP', 'operator'),
  ('484', 'ANSARI', 'operator'),
  ('486', 'MAH FATHI', 'operator'),
  ('487', 'AHMED FAWZY', 'operator'),
  ('495', 'ROMEL', 'operator'),
  ('499', 'ALAN', 'operator'),
  ('501', 'LASANTHA', 'operator'),
  ('502', 'ERIC', 'operator'),
  ('520', 'OMER ALI', 'operator'),
  ('521', 'GAD ESSA', 'operator'),
  ('522', 'FERNANDO', 'operator'),
  ('524', 'ANTONIO', 'operator'),
  ('531', 'SHERWIN', 'operator'),
  ('540', 'ANGELO', 'operator'),
  ('555', 'MD. JAKARIA', 'operator'),
  ('563', 'SHIHABUDIN', 'operator'),
  ('568', 'MADO', 'operator'),
  ('574', 'EMAD', 'operator'),
  ('581', 'EKHLAKH KHAN', 'operator'),
  ('591', 'MUJEEB', 'operator'),
  ('592', 'FURKAN', 'operator'),
  ('593', 'ABU BAKER', 'operator'),
  ('594', 'SHADAB', 'operator'),
  ('595', 'PARVEZ ALI', 'operator'),
  ('597', 'TAHER', 'operator'),
  ('598', 'ARIF', 'operator'),
  ('599', 'AFTAB', 'operator'),
  ('606', 'MD.AKHTAR', 'operator'),
  ('607', 'FLELCIANO', 'operator'),
  ('613', 'NABIL', 'operator'),
  ('617', 'MOH ASIM', 'operator'),
  ('618', 'SHAHBAZ AHMED', 'operator'),
  ('621', 'ALAN', 'operator'),
  ('627', 'MAHOOD ALI', 'operator'),
  ('628', 'V.V YAGHRI', 'operator'),
  ('629', 'KANISHKA', 'operator'),
  ('630', 'BRINDRESH', 'operator'),
  ('631', 'PRIYANTHA', 'operator'),
  ('633', 'WAEL', 'operator'),
  ('634', 'BADAWI', 'operator'),
  ('638', 'MOHSEN', 'operator'),
  ('641', 'GEMY', 'operator'),
  ('642', 'AASEELA', 'operator'),
  ('644', 'INDUNIL', 'operator'),
  ('645', 'THARAKA', 'operator'),
  ('646', 'JULIUS', 'operator'),
  ('649', 'ESMAIL', 'operator'),
  ('651', 'ADEL', 'operator'),
  ('654', 'FABIL', 'operator'),
  ('655', 'WADENA', 'operator'),
  ('657', 'SRIKANTHAN', 'operator'),
  ('658', 'SHANTHA KUMAR', 'operator'),
  ('664', 'REYNALDO', 'operator'),
  ('665', 'MARCELO', 'operator'),
  ('672', 'NEERAJ', 'operator'),
  ('682', 'BARKHA', 'operator'),
  ('683', 'THANGADUR', 'operator'),
  ('687', 'TRESTO', 'operator'),
  ('688', 'HARMON', 'operator'),
  ('689', 'BRAYAN', 'operator'),
  ('690', 'REMEGIO', 'operator'),
  ('692', 'RENATO', 'operator'),
  ('693', 'JUNIL', 'operator'),
  ('901', 'SAMIRULSK', 'operator'),
  ('902', 'ABDULALIM', 'operator')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SPARE PARTS (15)
-- ============================================
INSERT INTO spare_parts (part_number, name, category, quantity, min_quantity, unit_cost, location) VALUES
  ('SP001', 'Heating Element', 'Electrical', 24, 5, 45.00, 'Shelf A1'),
  ('SP002', 'Drive Belt V-Type', 'Mechanical', 38, 10, 12.00, 'Shelf B2'),
  ('SP003', 'Bearing 6205-2RS', 'Mechanical', 50, 15, 8.00, 'Shelf B3'),
  ('SP004', 'Fuse 30A', 'Electrical', 100, 20, 2.00, 'Shelf A2'),
  ('SP005', 'Contactor 40A', 'Electrical', 12, 3, 35.00, 'Shelf A3'),
  ('SP006', 'Thermocouple K-Type', 'Sensor', 18, 5, 25.00, 'Shelf C1'),
  ('SP007', 'Pneumatic Cylinder', 'Pneumatic', 8, 2, 120.00, 'Shelf D1'),
  ('SP008', 'Solenoid Valve', 'Pneumatic', 15, 4, 65.00, 'Shelf D2'),
  ('SP009', 'Ink Cartridge (Flexo)', 'Consumable', 30, 8, 85.00, 'Shelf E1'),
  ('SP010', 'Sealing Blade', 'Mechanical', 22, 6, 55.00, 'Shelf B4'),
  ('SP011', 'Motor Capacitor 50μF', 'Electrical', 10, 3, 18.00, 'Shelf A4'),
  ('SP012', 'Oil Filter', 'Mechanical', 20, 5, 15.00, 'Shelf B5'),
  ('SP013', 'Proximity Sensor', 'Sensor', 14, 4, 30.00, 'Shelf C2'),
  ('SP014', 'Gear Coupling', 'Mechanical', 6, 2, 95.00, 'Shelf B6'),
  ('SP015', 'Cooling Fan 220V', 'Electrical', 16, 4, 22.00, 'Shelf A5')
ON CONFLICT (part_number) DO NOTHING;
