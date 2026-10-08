-- Add NFC UID column to assets table
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS nfc_uid TEXT;

-- Add fingerprint hash column to assets table  
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS fingerprint_hash TEXT;

-- Add QR verified timestamp
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS qr_verified_at TIMESTAMPTZ;

-- Create index for NFC UID lookups
CREATE INDEX IF NOT EXISTS idx_assets_nfc_uid ON public.assets(nfc_uid) WHERE nfc_uid IS NOT NULL;

-- Grant access (adjust as needed)
COMMENT ON COLUMN public.assets.nfc_uid IS 'NFC chip UID for physical asset identification';
COMMENT ON COLUMN public.assets.fingerprint_hash IS 'Physical asset fingerprint hash for authentication';
COMMENT ON COLUMN public.assets.qr_verified_at IS 'Timestamp when QR code was last scanned and verified';

-- Verify columns were added
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'assets' AND table_schema = 'public'
AND column_name IN ('nfc_uid', 'fingerprint_hash', 'qr_verified_at');
