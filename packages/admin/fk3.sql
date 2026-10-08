ALTER TABLE shipments ADD CONSTRAINT shipments_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES profiles(id);
ALTER TABLE custody_records ADD CONSTRAINT custody_records_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES assets(id);
