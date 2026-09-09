-- One-time owner-confirmed cleanup. Not a seed or automatic migration.
-- Preserves administrative audit history; removes only the exact empty account.
DO $cleanup$
DECLARE
  target_id constant uuid := '349bdd7b-ec04-4377-b399-92a590206289';
  before_others jsonb;
  before_activities jsonb;
  before_audits jsonb;
  before_memberships jsonb;
  affected integer;
BEGIN
  PERFORM 1 FROM users WHERE id=target_id
    AND email='hazhir.a.2004@auis.edu.krd' AND name='Hazhir Aso'
    AND role='STUDENT' AND active=false FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Exact inactive student not found; aborting'; END IF;
  IF EXISTS (SELECT 1 FROM activities WHERE user_id=target_id OR created_by=target_id OR last_edited_by=target_id)
     OR EXISTS (SELECT 1 FROM semesters WHERE created_by=target_id)
     OR EXISTS (SELECT 1 FROM audit_logs WHERE actor_user_id=target_id)
  THEN RAISE EXCEPTION 'Meaningful references found; aborting'; END IF;
  IF (SELECT count(*) FROM semester_memberships WHERE user_id=target_id) <> 1
     OR NOT EXISTS (SELECT 1 FROM semester_memberships WHERE id='5d3f5791-1e1d-4f1f-af62-e6b78f623f51'
       AND user_id=target_id AND semester_id='cded88fe-6f0e-4357-87f9-756912a8d1bc' AND active=false)
  THEN RAISE EXCEPTION 'Membership changed; aborting'; END IF;
  SELECT jsonb_agg(to_jsonb(u) ORDER BY id) INTO before_others FROM users u WHERE id<>target_id;
  SELECT jsonb_agg(to_jsonb(a) ORDER BY id) INTO before_activities FROM activities a;
  SELECT jsonb_agg(to_jsonb(a) ORDER BY id) INTO before_audits FROM audit_logs a;
  SELECT jsonb_agg(to_jsonb(m) ORDER BY id) INTO before_memberships FROM semester_memberships m WHERE user_id<>target_id;
  DELETE FROM semester_memberships WHERE id='5d3f5791-1e1d-4f1f-af62-e6b78f623f51' AND user_id=target_id;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected<>1 THEN RAISE EXCEPTION 'Unexpected membership deletion count'; END IF;
  DELETE FROM users WHERE id=target_id AND email='hazhir.a.2004@auis.edu.krd';
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected<>1 THEN RAISE EXCEPTION 'Unexpected user deletion count'; END IF;
  IF before_others IS DISTINCT FROM (SELECT jsonb_agg(to_jsonb(u) ORDER BY id) FROM users u)
     OR before_activities IS DISTINCT FROM (SELECT jsonb_agg(to_jsonb(a) ORDER BY id) FROM activities a)
     OR before_audits IS DISTINCT FROM (SELECT jsonb_agg(to_jsonb(a) ORDER BY id) FROM audit_logs a)
     OR before_memberships IS DISTINCT FROM (SELECT jsonb_agg(to_jsonb(m) ORDER BY id) FROM semester_memberships m)
  THEN RAISE EXCEPTION 'Unrelated data changed; rolling back'; END IF;
END $cleanup$;
