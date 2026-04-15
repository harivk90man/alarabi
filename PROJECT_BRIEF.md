# Al Arabi Plastic Factory — Maintenance Tracker MVP

## PROJECT BRIEF FOR CLAUDE CODE

**Company:** Al Arabi Plastic Factory (المصنع العربي للبلاستيك)
**Location:** Sabhan Industrial, Block 8, St 105, Bldg 170, Kuwait
**Website:** arabiplastic.com
**Logo URL:** https://img1.wsimg.com/isteam/ip/c1812088-d5b4-4d7c-b39c-afa691bded3c/White%404x.png
**Parent:** AlKhudairi Group | Est. 1983
**Phone:** +965 2439 0000 | **Email:** info@arabiplastic.com

---

## 1. WHAT TO BUILD

A full-stack maintenance tracking and downtime management system for a plastic factory with 130+ machines and 109 operators. The supervisor (Viswanathan, ID: 203) needs full visibility into machine health, breakdowns, spare parts, and operator performance.

### Tech Stack
- **Frontend:** Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- **Backend/DB:** Supabase (PostgreSQL + Auth + Row Level Security + Realtime)
- **Deployment:** Vercel (web) + GitHub repo
- **Mobile:** React Native (Expo) or PWA (Progressive Web App) — PWA recommended for MVP since the web app can be installed on phones directly
- **Auth:** Supabase Auth with email/password (employee ID as username)

### Brand Colors
- Primary Green: #0d7a3e (header, buttons, accents)
- Header Background: #0d3320 (deep forest green)
- Success: #16a34a
- Error: #dc2626
- Warning: #b45309
- Info: #1d4ed8
- Background: #fafaf8 (warm off-white)
- Surface: #ffffff
- Text: #1a1a18
- Font: IBM Plex Sans + IBM Plex Mono (for IDs/timestamps)

---

## 2. DATABASE SCHEMA (Supabase PostgreSQL)

### Table: categories
```sql
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  prefix TEXT NOT NULL UNIQUE, -- Ex, FP, CS, etc.
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: machines
```sql
CREATE TABLE machines (
  id TEXT PRIMARY KEY, -- Ex01, FP03, CS12, etc.
  name TEXT NOT NULL,
  model TEXT,
  category_id UUID REFERENCES categories(id),
  manufacturer TEXT,
  status TEXT DEFAULT 'Running' CHECK (status IN ('Running', 'Down', 'Maintenance', 'Minor Issue')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: operators
```sql
CREATE TABLE operators (
  id TEXT PRIMARY KEY, -- Badge number: 29, 203, 482, etc.
  name TEXT NOT NULL,
  role TEXT DEFAULT 'operator' CHECK (role IN ('operator', 'admin', 'technician')),
  email TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: issues
```sql
CREATE TABLE issues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_number TEXT NOT NULL UNIQUE, -- ISS-0001, ISS-0002, auto-generated
  machine_id TEXT REFERENCES machines(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('breakdown', 'minor', 'preventive')),
  description TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    CASE WHEN end_time IS NOT NULL
      THEN EXTRACT(EPOCH FROM (end_time - start_time)) / 60
      ELSE NULL
    END
  ) STORED,
  downtime BOOLEAN DEFAULT false, -- true for breakdowns
  reported_by TEXT REFERENCES operators(id),
  assigned_to TEXT REFERENCES operators(id),
  resolution TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: spare_parts
```sql
CREATE TABLE spare_parts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  part_number TEXT NOT NULL UNIQUE, -- SP001, SP002, etc.
  name TEXT NOT NULL,
  category TEXT, -- Electrical, Mechanical, Pneumatic, Sensor, Consumable
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 0,
  unit_cost DECIMAL(10,2) DEFAULT 0,
  location TEXT, -- Storage location in factory
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: issue_parts (junction table)
```sql
CREATE TABLE issue_parts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  part_id UUID REFERENCES spare_parts(id),
  quantity_used INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: audit_log
```sql
CREATE TABLE audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id TEXT REFERENCES operators(id),
  action TEXT NOT NULL, -- ISSUE_CREATED, ISSUE_RESOLVED, PART_USED, MACHINE_STATUS_CHANGED, etc.
  entity_type TEXT, -- issue, machine, spare_part, operator
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Auto-update machine status trigger
```sql
CREATE OR REPLACE FUNCTION update_machine_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update machine status based on open issues
  UPDATE machines SET status = (
    CASE
      WHEN EXISTS (SELECT 1 FROM issues WHERE machine_id = NEW.machine_id AND status = 'open' AND type = 'breakdown') THEN 'Down'
      WHEN EXISTS (SELECT 1 FROM issues WHERE machine_id = NEW.machine_id AND status = 'open' AND type = 'preventive') THEN 'Maintenance'
      WHEN EXISTS (SELECT 1 FROM issues WHERE machine_id = NEW.machine_id AND status = 'open' AND type = 'minor') THEN 'Minor Issue'
      ELSE 'Running'
    END
  ), updated_at = now()
  WHERE id = NEW.machine_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_machine_status
AFTER INSERT OR UPDATE ON issues
FOR EACH ROW EXECUTE FUNCTION update_machine_status();
```

### Auto-deduct spare parts trigger
```sql
CREATE OR REPLACE FUNCTION deduct_spare_parts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE spare_parts
  SET quantity = GREATEST(0, quantity - NEW.quantity_used),
      updated_at = now()
  WHERE id = NEW.part_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deduct_parts
AFTER INSERT ON issue_parts
FOR EACH ROW EXECUTE FUNCTION deduct_spare_parts();
```

### Auto-generate issue number
```sql
CREATE OR REPLACE FUNCTION generate_issue_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(issue_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num FROM issues;
  NEW.issue_number := 'ISS-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_issue_number
BEFORE INSERT ON issues
FOR EACH ROW EXECUTE FUNCTION generate_issue_number();
```

### Row Level Security (RLS)
```sql
-- Admins see everything, operators see their own issues
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access" ON issues
  FOR ALL USING (
    EXISTS (SELECT 1 FROM operators WHERE id = auth.jwt()->>'sub' AND role = 'admin')
  );

CREATE POLICY "Operators view own issues" ON issues
  FOR SELECT USING (
    reported_by = auth.jwt()->>'sub' OR assigned_to = auth.jwt()->>'sub'
  );

CREATE POLICY "Operators create issues" ON issues
  FOR INSERT WITH CHECK (
    reported_by = auth.jwt()->>'sub'
  );
```

---

## 3. SEED DATA — ALL MACHINES (130+)

### Categories to seed first:
```
Extruder | Ex
Flexo Printer | FP
Bag Cutting | CS
Roll Machine | RM
Chiller | CH
Air Compressor | AC
Air Dryer | AD
Cooling Tower | CT
Water Cooler | WC
Mixer | MX
AirHydra Press | AP
Punching Press | MP
Slitting | SM
Recycling | PR
```

### Complete Machine List:

#### EXTRUDERS (33 machines)
| ID | Name | Model | Manufacturer |
|-----|------|-------|-------------|
| Ex01 | Lung Meng Blow Film Extruder | LM65 | Lung Meng |
| Ex02 | Italwork Blow Film Extruder | KE 55 | Italwork S.A.S. |
| Ex03 | Ye I Machinery Blow Film Extruder | HSE 80 | Ye I Machinery |
| Ex04 | Cherng Horng Blow Film Extruder | HPE 65 S | Cherng Horng |
| Ex05 | Lung Meng Blow Film Extruder | LM/AH65T | Lung Meng |
| Ex06 | Zam Zam Blow Film Extruder | THD 55 | Zam Zam |
| Ex07 | Cherng Horng Blow Film Extruder (Converted) | HL 55 → 65 | Cherng Horng |
| Ex08 | ItalWork Blow Film Extruder | KG 75 | ItalWork |
| Ex11 | Cherng Horng Blow Film Extruder | HL 65S | Cherng Horng |
| Ex12 | Cherng Horng Blow Film Extruder | Mini 50 A | Cherng Horng |
| Ex13 | Cherng Horng Blow Film Extruder | Mini 50 A | Cherng Horng |
| Ex14 | Lung Meng PP Blow Film Extruder | IC 50 A LM AP 55 | Lung Meng |
| Ex15 | Cherng Horng Blow Film Extruder | Mini 50 A | Cherng Horng |
| Ex16 | Cherng Horng Blow Film Extruder | Mini 50 A | Cherng Horng |
| Ex17 | TECOM Rotary Blow Film Extruder | MB50B.1100 | TECOM SRL |
| Ex18 | QueenPlas Blow Film Extruder | QN 55 800 | QueenPlas |
| Ex19 | QueenPlas Blow Film Extruder | QN 55 800 | QueenPlas |
| Ex20 | Cherng Horng Blow Film Extruder | Mini 50 A | Cherng Horng |
| Ex21 | QueenPlas Blow Film Extruder | QN 55 800 | QueenPlas |
| Ex22 | QueenPlas Blow Film Extruder | QN 55 800 | QueenPlas |
| Ex24 | Cherng Horng Extruder + 2C Flexo | Mini 50 A | Cherng Horng |
| Ex25 | Cherng Horng Extruder + 2C Flexo | Mini 50 A | Cherng Horng |
| Ex26 | Cherng Horng Extruder + 4C Flexo | ABA 5555 SA | Cherng Horng |
| Ex27 | Cherng Horng Extruder + 4C Flexo | ABA 5555 SA (A/HL) | Cherng Horng |
| Ex28 | Cherng Horng Extruder + 4C Flexo | ABA 5555 SA | Cherng Horng |
| Ex29 | Cherng Horng Extruder + 4C Flexo | ABA 5555 SA (A/HL) | Cherng Horng |
| Ex30 | Cherng Horng Blow Film Extruder | ABA 6565A | Cherng Horng |
| Ex31 | Lung Meng Blow Film Extruder | LM-AH75T | Lung Meng |
| Ex32 | Cherng Horng Blow Film Extruder | Mini 50 A | Cherng Horng |
| Ex33 | Lung Meng Blow Film Extruder | LM-AH65SC | Lung Meng |
| Ex34 | Lung Meng Blow Film Extruder | LM/AH65T | Lung Meng |
| Ex35 | Lung Meng PP2 Blow Film Extruder | LM AP65 | Lung Meng |
| Ex36 | Extruder 36 (Reserved) | TBD | TBD |

#### RECYCLING (1 machine)
| ID | Name | Model | Manufacturer |
|-----|------|-------|-------------|
| PR02 | Ye I Machinery Recycling Machine | YDN-U-105G-1 | Ye I Machinery |

#### FLEXO PRINTERS (14 machines)
| ID | Name | Model | Manufacturer |
|-----|------|-------|-------------|
| FP01 | Derthona 4-Color Flexo Printer | 60/70 Serie: 4AZ | Derthona |
| FP02 | Italwork 6-Color Flexo Printer | 6AZ-MAT | Italwork S.A.S. |
| FP03 | Cherng Horng 4-Color Flexo Printer | HJ-4001 XL | Cherng Horng |
| FP04 | Flexo Printer 04 (Reserved) | TBD | TBD |
| FP05 | Cherng Horng 4-Color Flexo Printer | CH-H5 4001M (FKFS 40"x4) | Cherng Horng |
| FP06 | Hemingstone 4-Color Flexo Printer | HM 1004FP-0D-AA | Hemingstone |
| FP07 | Hemingstone 6-Color Flexo Printer | HM 1206FP-0D | Hemingstone |
| FP08 | Hemingstone 4-Color Flexo Printer | HM-1004FP-2E-0R | Hemingstone |
| FP09 | Hemingstone 4-Color Flexo Printer | HM-1004FP-2E-0R | Hemingstone |
| FP10 | Cherng Horng 2-Color Flexo [inline Ex25] | CH-2004S (M) | Cherng Horng |
| FP11 | Cherng Horng 2-Color Flexo [inline Ex24] | CH-2004S (M) | Cherng Horng |
| FP12 | Cherng Horng 2-Color Flexo [inline Ex26] | CH-2004M | Cherng Horng |
| FP13 | Cherng Horng 4-Color Flexo [inline Ex28] | CH-4004M | Cherng Horng |
| FP14 | Cherng Horng 4-Color Flexo [inline Ex29] | HJ-2004M | Cherng Horng |

#### BAG CUTTING MACHINES (32 machines)
| ID | Name | Model | Manufacturer |
|-----|------|-------|-------------|
| CS02 | ELBA Bag Making Machine | ES-1000M | ELBA |
| CS10 | HYMAC Bag Making Machine | HSS34NAUSR | Hong Yueng (HYMAC) |
| CS12 | HYMAC Bag Making Machine | HSS34NAUSR | Hong Yueng (HYMAC) |
| CS13 | Lung Meng Bag Making Machine | ASTP-800C | Lung Meng |
| CS14 | Bag Cutting 14 (Reserved) | TBD | TBD |
| CS15 | Viara Bag Making Machine | PUPA | Viara srl |
| CS16 | Viara Bag Making Machine | PUPA | Viara srl |
| CS17 | Lung Meng Bag Making Machine | ASTP-800C | Lung Meng |
| CS18 | Hemingstone Bag Making Machine | HM1000DT | Hemingstone |
| CS19 | Hemingstone Bag Making Machine | HM810VL-SV | Hemingstone |
| CS21 | Lung Meng Bag Making Machine | ASTP 1000C | Lung Meng |
| CS23 | Mamata Bag Making Machine | VEGA 1200 SPLIT | Mamata |
| CS24 | Lung Meng Bag Making Machine | ASTP1200C | Lung Meng |
| CS25 | Lung Meng Bag Making Machine | ASTP-800 | Lung Meng |
| CS26 | Avita Cutting Bag Making Machine | AV-B-360 TP-ST2 | Avita |
| CS27 | Hemingstone Bag Making Machine | HM 810B-SV | Hemingstone |
| CS28 | Hemingstone Bag Making Machine | HM-14000 VA SV | Hemingstone |
| CS29 | Hemingstone Bag Making Machine | HM 1200FB | Hemingstone |
| CS30 | Hemingstone Bag Making Machine | HM-800W+CK | Hemingstone |
| CS31 | Cosmo Bag Making Machine | SA-28 | Cosmo |
| CS32 | Hemingstone Bag Making Machine | HM-1000FB | Hemingstone |
| CS33 | ELBA Bag Making Machine | ESM100 | ELBA |
| CS34 | Hemingstone Bag Making Machine | HM-810SFP-SV | Hemingstone |
| CS35 | Hemingstone Loop Handle Machine | HM 500JF | Hemingstone |
| CS36 | Cosmo Bag Making Machine | SCB-800-L2 | Cosmo |
| CS37 | JIN CHANG Gloves Making Machine | JCGP 40 | JIN CHANG |

#### CHILLERS (4 machines)
| ID | Name | Model | Manufacturer |
|-----|------|-------|-------------|
| CH01 | Water Chiller #1 (PP Chiller) | — | — |
| CH02 | Water Chiller #2 (PP Chiller) | — | — |
| CH03 | Euro Chiller (Air Cooler Ex17) | ABFPWH020 | Euro Chiller |
| CH04 | Water Chiller #4 | FSC-20W | — |

#### AIR COMPRESSORS (7 machines)
| ID | Name | Model | Manufacturer |
|-----|------|-------|-------------|
| AC05 | ALUP Screw Air Compressor | SCK 26-08TR | ALUP |
| AC06 | Aydin Trafo Screw Air Compressor | AVT-37 | Aydin Trafo |
| AC07 | Aydin Trafo Screw Air Compressor | AVT-37 | Aydin Trafo |
| AC08 | Aydin Trafo Screw Air Compressor | AVT-37 | Aydin Trafo |
| AC09 | Aydin Trafo Screw Air Compressor | AVT-37 | Aydin Trafo |
| AC10 | Aydin Trafo Screw Air Compressor (Direct Drive) | ATV-A-30 | Aydin Trafo |
| AC11 | Aydin Trafo Screw Air Compressor (Direct Drive) | ATV-A-30 | Aydin Trafo |

#### AIR DRYERS (4 machines)
| ID | Name | Model | Manufacturer |
|-----|------|-------|-------------|
| AD01 | Ingersoll Rand Ref. Air Dryer | D240IN-A | Ingersoll Rand |
| AD02 | Ingersoll Rand Ref. Air Dryer | D260IN-A | Ingersoll Rand |
| AD03 | Ingersoll Rand Ref. Air Dryer | D260IN-A | Ingersoll Rand |
| AD04 | Aydin Trafo Air Dryer | TMP-HKP 2220 | Aydin Trafo |

#### ROLL SHEET MACHINES (6 machines)
| ID | Name | Model | Manufacturer |
|-----|------|-------|-------------|
| RM01 | Zam Zam Roll Sheet Machine | FTAHI 40*60 | Zam Zam |
| RM03 | Lung Meng Roll Sheet Machine | TX 800 | Lung Meng |
| RM04 | Hemingstone Roll Sheet Machine | HM 1000MR+C2 | Hemingstone |
| RM05 | Lung Meng Roll Sheet Machine | TAA-1500BD | Lung Meng |
| RM06 | Cosmo Roll Sheet Machine | SBCR-800-OB+J | Cosmo |
| RM07 | Cosmo Roll Sheet Machine | SMNR/CR-1000+DS+L | Cosmo |

#### SLITTING MACHINES (2 machines)
| ID | Name | Model | Manufacturer |
|-----|------|-------|-------------|
| SM01 | Slitting Machine 800mm | 800mm | — |
| SM02 | Slitting Machine 1400mm | 1400mm | — |

#### COOLING TOWERS (3 machines)
| ID | Name | Model | Manufacturer |
|-----|------|-------|-------------|
| CT01 | Cooling Tower (Extruders/Chillers) | LBC-125 | — |
| CT02 | Cooling Tower (Plastic Recycling) | LBC-125 | — |
| CT03 | Cooling Tower 3 | — | — |

#### WATER AIR COOLERS (10 machines)
| ID | Name | Model | Manufacturer |
|-----|------|-------|-------------|
| WC01–WC10 | Water Air Cooler #1 through #10 | — | — |

#### MATERIAL MIXERS (11 machines)
| ID | Name | Model | Manufacturer |
|-----|------|-------|-------------|
| MX01–MX06 | Material Mixer #1 through #6 | — | — |
| MX07 | Material Mixer #7 | LSH-500-500KG | — |
| MX08 | Material Mixer #8 | LSH-500-500KG | — |
| MX09 | Material Mixer #9 | LSH-500-500KG | — |
| MX10 | Material Mixer #10 | — | — |
| MX11 | Material Mixer #11 | LSH-500-500KG | — |

#### AIRHYDRA PRESS (4 machines)
| ID | Name | Model | Manufacturer |
|-----|------|-------|-------------|
| AP01 | Hemingstone AirHydra Press | 5-C-SC-55 | Hemingstone |
| AP02 | Hemingstone AirHydra Press | 5-C-SC-55 | Hemingstone |
| AP03 | Hemingstone AirHydra Press | A005-AP-A1-1 | Hemingstone |
| AP04 | Hemingstone AirHydra Press | 5-C-SC-55 | Hemingstone |

#### MECHANICAL PUNCHING PRESS (10 machines)
| ID | Name | Model | Manufacturer |
|-----|------|-------|-------------|
| MP01 | ELBA Mechanical Punching Press | 8 ton | ELBA S.p.a. |
| MP02 | CGM/FUSTEL Mechanical Punching Press | 10D-Plast/74 | CGM/FUSTEL |
| MP03–MP10 | CGM/FUSTEL Mechanical Punching Press | Plast/74 | CGM/FUSTEL |

---

## 4. ALL OPERATORS (109)

| ID | Name | Role |
|----|------|------|
| 109 | OPERATOR 109 | operator |
| 29 | HARIBABU | operator |
| 75 | UMAPAD | operator |
| 91 | SANJEEVA | operator |
| 103 | REFIQUL | operator |
| 120 | FAYZUL HAQ | operator |
| 129 | V. FAZULMUSLAND | operator |
| 131 | VISHNU | operator |
| 138 | HABIB | operator |
| 155 | SUNIMAL | operator |
| 164 | AHMED ALI | operator |
| 172 | TAHA | operator |
| 177 | SAMAD | operator |
| 182 | UMMER | operator |
| 185 | ALI EZZAT | operator |
| 201 | PUGAZANTHI | operator |
| **203** | **VISWANATHAN** | **admin** |
| 205 | WINROY | operator |
| 220 | MOH HASSAN | operator |
| 224 | M.NOURELDIN | operator |
| 225 | SELVEN | operator |
| 228 | SUJITH | operator |
| 229 | SRENVAS | operator |
| 231 | ABU BAKER | operator |
| 328 | KARTHIK | operator |
| 354 | NUWAN | operator |
| 357 | GANESH YAEV | operator |
| 361 | DANTY | operator |
| 362 | JEFREN | operator |
| 374 | MANI KUMAR | operator |
| 381 | RANUKA | operator |
| 432 | KAMRAN | operator |
| 435 | JAMIL | operator |
| 440 | DHARMENDRA | operator |
| 450 | MAHMOOD | operator |
| 451 | MASOUD | operator |
| 452 | RABIAH | operator |
| 459 | KHALED | operator |
| 462 | AHMED | operator |
| 477 | AHMED HAMED | operator |
| 478 | RAJITH | operator |
| 479 | ASHNUL | operator |
| 480 | DAYAN | operator |
| 481 | AMEER | operator |
| 482 | KABIR | operator |
| 483 | SANDEEP | operator |
| 484 | ANSARI | operator |
| 486 | MAH FATHI | operator |
| 487 | AHMED FAWZY | operator |
| 495 | ROMEL | operator |
| 499 | ALAN | operator |
| 501 | LASANTHA | operator |
| 502 | ERIC | operator |
| 520 | OMER ALI | operator |
| 521 | GAD ESSA | operator |
| 522 | FERNANDO | operator |
| 524 | ANTONIO | operator |
| 531 | SHERWIN | operator |
| 540 | ANGELO | operator |
| 555 | MD. JAKARIA | operator |
| 563 | SHIHABUDIN | operator |
| 568 | MADO | operator |
| 574 | EMAD | operator |
| 581 | EKHLAKH KHAN | operator |
| 591 | MUJEEB | operator |
| 592 | FURKAN | operator |
| 593 | ABU BAKER | operator |
| 594 | SHADAB | operator |
| 595 | PARVEZ ALI | operator |
| 597 | TAHER | operator |
| 598 | ARIF | operator |
| 599 | AFTAB | operator |
| 606 | MD.AKHTAR | operator |
| 607 | FLELCIANO | operator |
| 613 | NABIL | operator |
| 617 | MOH ASIM | operator |
| 618 | SHAHBAZ AHMED | operator |
| 621 | ALAN | operator |
| 627 | MAHOOD ALI | operator |
| 628 | V.V YAGHRI | operator |
| 629 | KANISHKA | operator |
| 630 | BRINDRESH | operator |
| 631 | PRIYANTHA | operator |
| 633 | WAEL | operator |
| 634 | BADAWI | operator |
| 638 | MOHSEN | operator |
| 641 | GEMY | operator |
| 642 | AASEELA | operator |
| 644 | INDUNIL | operator |
| 645 | THARAKA | operator |
| 646 | JULIUS | operator |
| 649 | ESMAIL | operator |
| 651 | ADEL | operator |
| 654 | FABIL | operator |
| 655 | WADENA | operator |
| 657 | SRIKANTHAN | operator |
| 658 | SHANTHA KUMAR | operator |
| 664 | REYNALDO | operator |
| 665 | MARCELO | operator |
| 672 | NEERAJ | operator |
| 901 | SAMIRULSK | operator |
| 902 | ABDULALIM | operator |
| 693 | JUNIL | operator |
| 688 | HARMON | operator |
| 689 | BRAYAN | operator |
| 690 | REMEGIO | operator |
| 692 | RENATO | operator |
| 687 | TRESTO | operator |
| 683 | THANGADUR | operator |
| 682 | BARKHA | operator |

---

## 5. STARTER SPARE PARTS

| Part # | Name | Category | Initial Qty | Min Qty | Unit Cost |
|--------|------|----------|------------|---------|-----------|
| SP001 | Heating Element | Electrical | 24 | 5 | $45 |
| SP002 | Drive Belt V-Type | Mechanical | 38 | 10 | $12 |
| SP003 | Bearing 6205-2RS | Mechanical | 50 | 15 | $8 |
| SP004 | Fuse 30A | Electrical | 100 | 20 | $2 |
| SP005 | Contactor 40A | Electrical | 12 | 3 | $35 |
| SP006 | Thermocouple K-Type | Sensor | 18 | 5 | $25 |
| SP007 | Pneumatic Cylinder | Pneumatic | 8 | 2 | $120 |
| SP008 | Solenoid Valve | Pneumatic | 15 | 4 | $65 |
| SP009 | Ink Cartridge (Flexo) | Consumable | 30 | 8 | $85 |
| SP010 | Sealing Blade | Mechanical | 22 | 6 | $55 |
| SP011 | Motor Capacitor 50μF | Electrical | 10 | 3 | $18 |
| SP012 | Oil Filter | Mechanical | 20 | 5 | $15 |
| SP013 | Proximity Sensor | Sensor | 14 | 4 | $30 |
| SP014 | Gear Coupling | Mechanical | 6 | 2 | $95 |
| SP015 | Cooling Fan 220V | Electrical | 16 | 4 | $22 |

---

## 6. UI SCREENS

### Admin Screens (Viswanathan — ID 203)
1. **Login** — Employee ID input, company branding
2. **Dashboard** — KPI cards (running/down/maintenance/minor), category health bars, open issues list, low stock alerts
3. **Machines** — Searchable table with category filter, click to see detail panel with issue history
4. **Issues** — All issues with status filter (open/in_progress/resolved), create new, resolve existing
5. **Spare Parts** — Inventory table with stock status (OK/LOW/CRITICAL), add new parts, usage history
6. **Reports** — Period selector (daily/weekly/monthly/quarterly/yearly), machine downtime ranking, operator performance, issue type distribution, spare parts usage
7. **Operators** — Searchable grid, resolved/open counts per operator
8. **Audit Log** — Chronological action history

### Operator Screens
1. **Login** — Same login screen
2. **Dashboard** — Personal KPI view
3. **My Issues** — Assigned + reported issues, ability to resolve
4. **Machines** — Read-only machine list, can log new issues

### Mobile (PWA or React Native)
- Same screens, responsive layout
- Quick issue logging with camera for photos (future)
- Push notifications for assigned issues (future)

---

## 7. API ENDPOINTS (Supabase auto-generates REST, but for reference)

```
Auth:
POST   /auth/login                    — Login with employee ID
POST   /auth/logout                   — Logout

Machines:
GET    /machines                      — List all (with filters: category, status)
GET    /machines/:id                  — Machine detail with issue history
PATCH  /machines/:id                  — Update machine (admin only)
POST   /machines                      — Add machine (admin only)

Issues:
GET    /issues                        — List all (filters: status, type, machine_id, date range)
GET    /issues/:id                    — Issue detail
POST   /issues                        — Create issue
PATCH  /issues/:id                    — Update issue (resolve, assign, etc.)
GET    /issues/my                     — Current user's issues

Spare Parts:
GET    /spare-parts                   — List inventory
POST   /spare-parts                   — Add part (admin only)
PATCH  /spare-parts/:id              — Update qty/details (admin only)

Reports:
GET    /reports/downtime              — Machine downtime report (period filter)
GET    /reports/operator-performance  — Operator stats (period filter)
GET    /reports/spare-parts-usage     — Parts usage report (period filter)
GET    /reports/summary               — Dashboard KPIs

Operators:
GET    /operators                     — List all
POST   /operators                     — Add operator (admin only)
PATCH  /operators/:id                — Update operator (admin only)

Audit:
GET    /audit-log                     — List audit entries (admin only)
```

---

## 8. DEPLOYMENT STEPS

### Step 1: GitHub Repo
- Create repo: `alarabi-maintenance-tracker`
- Push all code

### Step 2: Supabase Setup
- Create project on Supabase
- Run all SQL migrations (tables, triggers, RLS)
- Run seed data (machines, operators, spare parts)
- Get project URL and anon key

### Step 3: Vercel Deployment
- Connect GitHub repo to Vercel
- Set environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Deploy

### Step 4: PWA / Mobile
- Add PWA manifest.json and service worker to Next.js
- This makes the web app installable on phones
- Add to home screen = acts like native app

---

## 9. FOLDER STRUCTURE

```
alarabi-maintenance-tracker/
├── app/
│   ├── layout.tsx                 — Root layout with header/footer
│   ├── page.tsx                   — Login page
│   ├── dashboard/
│   │   └── page.tsx               — Main dashboard
│   ├── machines/
│   │   ├── page.tsx               — Machine list
│   │   └── [id]/page.tsx          — Machine detail
│   ├── issues/
│   │   ├── page.tsx               — All issues
│   │   ├── new/page.tsx           — Create issue form
│   │   └── [id]/page.tsx          — Issue detail
│   ├── spares/
│   │   └── page.tsx               — Spare parts inventory
│   ├── reports/
│   │   └── page.tsx               — Reports & analytics
│   ├── operators/
│   │   └── page.tsx               — Operator list
│   └── audit/
│       └── page.tsx               — Audit log
├── components/
│   ├── ui/                        — shadcn/ui components
│   ├── layout/
│   │   ├── Header.tsx             — Company branded header
│   │   ├── Sidebar.tsx            — Navigation sidebar
│   │   └── Footer.tsx             — Company branded footer
│   ├── dashboard/
│   │   ├── KpiCards.tsx
│   │   ├── CategoryHealth.tsx
│   │   └── OpenIssues.tsx
│   ├── machines/
│   │   ├── MachineTable.tsx
│   │   └── MachineDetail.tsx
│   ├── issues/
│   │   ├── IssueCard.tsx
│   │   ├── IssueForm.tsx
│   │   └── ResolveDialog.tsx
│   └── reports/
│       ├── DowntimeChart.tsx
│       └── OperatorPerformance.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts              — Supabase client init
│   │   ├── auth.ts                — Auth helpers
│   │   └── queries.ts             — Database queries
│   ├── types.ts                   — TypeScript types
│   └── utils.ts                   — Utility functions
├── supabase/
│   ├── migrations/
│   │   ├── 001_create_tables.sql
│   │   ├── 002_create_triggers.sql
│   │   ├── 003_create_rls.sql
│   │   └── 004_seed_data.sql
│   └── config.toml
├── public/
│   ├── manifest.json              — PWA manifest
│   ├── sw.js                      — Service worker
│   └── icons/                     — App icons
├── .env.local                     — Supabase keys (gitignored)
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 10. IMPORTANT BUSINESS RULES

1. **Multiple issues per machine allowed** — a machine can have overlapping breakdown + minor issues
2. **Machine status auto-derived** — from open issues (breakdown=Down, preventive=Maintenance, minor=Minor Issue, none=Running)
3. **Spare parts auto-deduct** — when issue is created with parts, inventory decreases automatically
4. **Every action audit logged** — issue create/resolve, part used, machine status change
5. **Downtime auto-calculated** — end_time minus start_time, stored as duration_minutes
6. **Issue numbers auto-generated** — ISS-0001, ISS-0002, sequential
7. **Operators cannot see other operators' issues** — only admin sees all (RLS enforced)
8. **Admin (ID: 203) has full access** — all screens, all data, export capability

---

## 11. FUTURE EXPANSION (design for but don't build yet)

- IoT machine integration (sensor data ingestion)
- Auto fault detection (ML on historical patterns)
- Photo attachments on issues
- Push notifications for operators
- Shift management (morning/evening/night)
- Production output tracking per machine
- Maintenance scheduling calendar
- QR code scanning for machine identification
- Multi-language support (English + Arabic)
- Export reports to Excel/PDF

---

## 12. CLAUDE CODE INSTRUCTIONS

Open Claude Code in terminal and give it this file as context:

```bash
claude
> Read the file PROJECT_BRIEF.md and build the complete application. 
> Use my existing Supabase project, my GitHub repo, and deploy to Vercel.
> Start with database migrations, then build the Next.js frontend.
```

You'll need to provide Claude Code with:
1. Your Supabase project URL and anon key
2. Your GitHub repo URL
3. Your Vercel account connection

Claude Code will handle the rest — creating files, running migrations, pushing to Git, and deploying.
