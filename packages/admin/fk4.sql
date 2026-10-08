ALTER TABLE shipments ADD CONSTRAINT shipments_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES profiles(id);
