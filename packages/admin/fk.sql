ALTER TABLE assets ADD CONSTRAINT assets_current_owner_id_fkey FOREIGN KEY (current_owner_id) REFERENCES profiles (id);
ALTER TABLE assets ADD CONSTRAINT assets_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES companies (id);
ALTER TABLE assets ADD CONSTRAINT assets_laboratory_id_fkey FOREIGN KEY (laboratory_id) REFERENCES labs (id);
