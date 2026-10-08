ALTER TABLE assets ADD CONSTRAINT assets_current_owner_id_fkey FOREIGN KEY (current_owner_id) REFERENCES profiles (id);
