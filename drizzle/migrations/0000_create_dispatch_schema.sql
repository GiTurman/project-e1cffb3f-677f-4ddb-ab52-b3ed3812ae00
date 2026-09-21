-- ENUMS
CREATE TYPE public.app_role AS ENUM ('dispatcher','technician','manager');
CREATE TYPE public.service_type AS ENUM ('avaria','gegmiuri','inspeqcia','chamokideba');
CREATE TYPE public.call_priority AS ENUM ('kritikuli','maghali','sashualo','dabali');
CREATE TYPE public.call_status AS ENUM ('akhali','mighebuli','gzashi','mimdinare','shesrulebuli','dakhuruli','gaukmebuli');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  email text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id
    AND role IN ('dispatcher','manager'))
$$;

-- OBJECTS (contracted buildings / elevators)
CREATE TABLE public.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  elevator_code text NOT NULL,
  serial_number text,
  manufacturer text,
  client_name text,
  client_phone text,
  under_contract boolean NOT NULL DEFAULT true,
  maintenance_interval_months integer NOT NULL DEFAULT 1,
  last_maintenance_date date,
  next_due_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.objects TO authenticated;
GRANT ALL ON public.objects TO service_role;
ALTER TABLE public.objects ENABLE ROW LEVEL SECURITY;

-- SERVICE CALLS
CREATE TABLE public.service_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_no serial UNIQUE,
  object_id uuid REFERENCES public.objects(id) ON DELETE SET NULL,
  site_name text NOT NULL,
  address text NOT NULL,
  elevator_code text,
  serial_number text,
  service_type public.service_type NOT NULL,
  priority public.call_priority NOT NULL DEFAULT 'sashualo',
  status public.call_status NOT NULL DEFAULT 'akhali',
  description text,
  client_name text,
  client_phone text,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  scheduled_at timestamptz,
  received_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  completed_at timestamptz,
  closed_at timestamptz,
  sla_due_at timestamptz,
  resolution text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_calls TO authenticated;
GRANT ALL ON public.service_calls TO service_role;
ALTER TABLE public.service_calls ENABLE ROW LEVEL SECURITY;

-- CALL NOTES
CREATE TABLE public.call_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES public.service_calls(id) ON DELETE CASCADE,
  author_id uuid,
  author_name text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_notes TO authenticated;
GRANT ALL ON public.call_notes TO service_role;
ALTER TABLE public.call_notes ENABLE ROW LEVEL SECURITY;

-- STATUS HISTORY
CREATE TABLE public.call_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES public.service_calls(id) ON DELETE CASCADE,
  status public.call_status NOT NULL,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now(),
  note text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_status_history TO authenticated;
GRANT ALL ON public.call_status_history TO service_role;
ALTER TABLE public.call_status_history ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "manager deletes profiles" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'manager'));

CREATE POLICY "roles readable" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "manager manages roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'manager')) WITH CHECK (public.has_role(auth.uid(),'manager'));

CREATE POLICY "objects readable" ON public.objects FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff manage objects" ON public.objects FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "calls readable" ON public.service_calls FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR assigned_to = auth.uid());
CREATE POLICY "staff insert calls" ON public.service_calls FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff or assignee update calls" ON public.service_calls FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()) OR assigned_to = auth.uid())
  WITH CHECK (public.is_staff(auth.uid()) OR assigned_to = auth.uid());
CREATE POLICY "manager deletes calls" ON public.service_calls FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'manager'));

CREATE POLICY "notes readable" ON public.call_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "notes insert" ON public.call_notes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "history readable" ON public.call_status_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "history insert" ON public.call_status_history FOR INSERT TO authenticated WITH CHECK (true);

-- BUSINESS RULES
CREATE OR REPLACE FUNCTION public.apply_call_rules()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE hrs integer;
BEGIN
  IF NEW.service_type = 'chamokideba' THEN
    NEW.priority := 'kritikuli';
  END IF;
  hrs := CASE NEW.priority WHEN 'kritikuli' THEN 1 WHEN 'maghali' THEN 4 WHEN 'sashualo' THEN 24 ELSE 72 END;
  NEW.sla_due_at := COALESCE(NEW.received_at, now()) + (hrs || ' hours')::interval;
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at := now();
    IF NEW.status <> OLD.status THEN
      IF NEW.status IN ('mighebuli','gzashi','mimdinare') AND NEW.responded_at IS NULL THEN
        NEW.responded_at := now();
      END IF;
      IF NEW.status = 'shesrulebuli' AND NEW.completed_at IS NULL THEN NEW.completed_at := now(); END IF;
      IF NEW.status = 'dakhuruli' AND NEW.closed_at IS NULL THEN NEW.closed_at := now(); END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_call_rules BEFORE INSERT OR UPDATE ON public.service_calls
FOR EACH ROW EXECUTE FUNCTION public.apply_call_rules();

CREATE OR REPLACE FUNCTION public.log_call_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.status <> OLD.status THEN
    INSERT INTO public.call_status_history (call_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_call_history AFTER INSERT OR UPDATE ON public.service_calls
FOR EACH ROW EXECUTE FUNCTION public.log_call_status();

-- PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'dispatcher'))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SEED DATA
INSERT INTO public.profiles (id, full_name, email, phone) VALUES
  ('11111111-1111-4111-8111-111111111111','გიორგი ბერიძე','giorgi.beridze@lifti.ge','+995 599 10 20 30'),
  ('22222222-2222-4222-8222-222222222222','ლევან ქავთარაძე','levan.kavtaradze@lifti.ge','+995 599 40 50 60'),
  ('33333333-3333-4333-8333-333333333333','ნიკა მაისურაძე','nika.maisuradze@lifti.ge','+995 599 70 80 90');

INSERT INTO public.user_roles (user_id, role) VALUES
  ('11111111-1111-4111-8111-111111111111','technician'),
  ('22222222-2222-4222-8222-222222222222','technician'),
  ('33333333-3333-4333-8333-333333333333','technician');

INSERT INTO public.objects (id, name, address, elevator_code, serial_number, manufacturer, client_name, client_phone, maintenance_interval_months, last_maintenance_date, next_due_date) VALUES
  ('aaaaaaa1-0000-4000-8000-000000000001','ბიზნეს ცენტრი „ვერე“','თბილისი, ვაჟა-ფშაველას 71','LFT-001','OT-2019-4412','Otis','შპს ვერე მენეჯმენტი','+995 322 11 22 33',1,'2026-08-05','2026-09-05'),
  ('aaaaaaa1-0000-4000-8000-000000000002','საცხოვრებელი კომპლექსი „დიდუბე პლაზა“','თბილისი, ცოტნე დადიანის 12','LFT-002','KN-2020-8830','Kone','ამხანაგობა დიდუბე','+995 322 44 55 66',1,'2026-07-20','2026-08-20'),
  ('aaaaaaa1-0000-4000-8000-000000000003','სასტუმრო „ოლდ თბილისი“','თბილისი, კოტე აფხაზის 44','LFT-003','SC-2018-1177','Schindler','შპს ოლდ თბილისი','+995 322 77 88 99',3,'2026-06-15','2026-09-15'),
  ('aaaaaaa1-0000-4000-8000-000000000004','სავაჭრო ცენტრი „საბურთალო მოლი“','თბილისი, პეკინის 24','ESC-004','TK-2021-5522','ThyssenKrupp','შპს მოლ ჯგუფი','+995 322 90 10 11',1,'2026-09-01','2026-10-01'),
  ('aaaaaaa1-0000-4000-8000-000000000005','საავადმყოფო „მედალფა“','თბილისი, გურამიშვილის 8','LFT-005','MP-2017-3391','Mitsubishi','სს მედალფა','+995 322 12 13 14',1,'2026-08-25','2026-09-25'),
  ('aaaaaaa1-0000-4000-8000-000000000006','საოფისე შენობა „ბათუმი თაუერი“','ბათუმი, ნინოშვილის 3','LFT-006','OT-2022-6650','Otis','შპს ბათუმი დეველოპმენტი','+995 577 22 33 44',2,'2026-07-10','2026-09-10');

INSERT INTO public.service_calls (object_id, site_name, address, elevator_code, serial_number, service_type, priority, status, description, client_name, client_phone, assigned_to, scheduled_at, received_at) VALUES
  ('aaaaaaa1-0000-4000-8000-000000000001','ბიზნეს ცენტრი „ვერე“','თბილისი, ვაჟა-ფშაველას 71','LFT-001','OT-2019-4412','chamokideba','kritikuli','gzashi','ლიფტში ჩარჩა ორი მგზავრი მე-7 სართულზე','შპს ვერე მენეჯმენტი','+995 322 11 22 33','11111111-1111-4111-8111-111111111111', now() + interval '1 hour', now() - interval '35 minutes'),
  ('aaaaaaa1-0000-4000-8000-000000000002','საცხოვრებელი კომპლექსი „დიდუბე პლაზა“','თბილისი, ცოტნე დადიანის 12','LFT-002','KN-2020-8830','avaria','maghali','mimdinare','ლიფტი არ ჩერდება სართულზე ზუსტად','ამხანაგობა დიდუბე','+995 322 44 55 66','22222222-2222-4222-8222-222222222222', now() + interval '2 hours', now() - interval '3 hours'),
  ('aaaaaaa1-0000-4000-8000-000000000003','სასტუმრო „ოლდ თბილისი“','თბილისი, კოტე აფხაზის 44','LFT-003','SC-2018-1177','gegmiuri','sashualo','akhali','თვიური გეგმიური სერვისი','შპს ოლდ თბილისი','+995 322 77 88 99',NULL, now() + interval '1 day', now() - interval '5 hours'),
  ('aaaaaaa1-0000-4000-8000-000000000004','სავაჭრო ცენტრი „საბურთალო მოლი“','თბილისი, პეკინის 24','ESC-004','TK-2021-5522','avaria','maghali','mighebuli','ესკალატორი გაჩერდა მე-2 დონეზე, უცნაური ხმა','შპს მოლ ჯგუფი','+995 322 90 10 11','33333333-3333-4333-8333-333333333333', now() + interval '3 hours', now() - interval '1 hour'),
  ('aaaaaaa1-0000-4000-8000-000000000005','საავადმყოფო „მედალფა“','თბილისი, გურამიშვილის 8','LFT-005','MP-2017-3391','avaria','kritikuli','akhali','სატვირთო ლიფტი არ მუშაობს, საჭიროა სასწრაფო რეაგირება','სს მედალფა','+995 322 12 13 14',NULL, NULL, now() - interval '2 hours'),
  ('aaaaaaa1-0000-4000-8000-000000000006','საოფისე შენობა „ბათუმი თაუერი“','ბათუმი, ნინოშვილის 3','LFT-006','OT-2022-6650','inspeqcia','dabali','shesrulebuli','წლიური ტექნიკური ინსპექცია','შპს ბათუმი დეველოპმენტი','+995 577 22 33 44','11111111-1111-4111-8111-111111111111', now() - interval '1 day', now() - interval '2 days'),
  ('aaaaaaa1-0000-4000-8000-000000000001','ბიზნეს ცენტრი „ვერე“','თბილისი, ვაჟა-ფშაველას 71','LFT-001','OT-2019-4412','gegmiuri','dabali','dakhuruli','კარის მექანიზმის რეგულირება','შპს ვერე მენეჯმენტი','+995 322 11 22 33','22222222-2222-4222-8222-222222222222', now() - interval '3 days', now() - interval '4 days'),
  ('aaaaaaa1-0000-4000-8000-000000000002','საცხოვრებელი კომპლექსი „დიდუბე პლაზა“','თბილისი, ცოტნე დადიანის 12','LFT-002','KN-2020-8830','avaria','sashualo','dakhuruli','განათება არ მუშაობს კაბინაში','ამხანაგობა დიდუბე','+995 322 44 55 66','33333333-3333-4333-8333-333333333333', now() - interval '2 days', now() - interval '3 days'),
  ('aaaaaaa1-0000-4000-8000-000000000003','სასტუმრო „ოლდ თბილისი“','თბილისი, კოტე აფხაზის 44','LFT-003','SC-2018-1177','avaria','maghali','akhali','ლიფტი ვიბრირებს მოძრაობისას','შპს ოლდ თბილისი','+995 322 77 88 99',NULL, NULL, now() - interval '6 hours'),
  ('aaaaaaa1-0000-4000-8000-000000000005','საავადმყოფო „მედალფა“','თბილისი, გურამიშვილის 8','LFT-005','MP-2017-3391','gegmiuri','sashualo','gaukmebuli','დამკვეთმა გადაავადა ვიზიტი','სს მედალფა','+995 322 12 13 14','11111111-1111-4111-8111-111111111111', now() - interval '1 day', now() - interval '2 days'),
  ('aaaaaaa1-0000-4000-8000-000000000004','სავაჭრო ცენტრი „საბურთალო მოლი“','თბილისი, პეკინის 24','ESC-004','TK-2021-5522','inspeqcia','sashualo','mighebuli','კვარტალური ინსპექცია ესკალატორზე','შპს მოლ ჯგუფი','+995 322 90 10 11','22222222-2222-4222-8222-222222222222', now() + interval '5 hours', now() - interval '20 hours');
