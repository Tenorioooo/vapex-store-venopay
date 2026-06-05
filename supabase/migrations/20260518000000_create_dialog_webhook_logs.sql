/*
  # Create system_settings and dialog_webhook_logs tables

  1. New Tables:
    - `system_settings`: Stores integration settings (like DIALOG_WEBHOOK_URL) securely.
    - `dialog_webhook_logs`: Audit logs for tracking webhook dispatches to DiaLOG.
  2. Security:
    - Enable RLS on both tables.
    - Setup flexible read/write policies for secure access.
*/

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS dialog_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  status_code INT NOT NULL,
  response_body TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dialog_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policies for system_settings
CREATE POLICY "Anyone can view system settings" 
  ON system_settings FOR SELECT 
  TO authenticated, anon 
  USING (true);

CREATE POLICY "Authenticated users can modify system settings" 
  ON system_settings FOR ALL 
  TO authenticated 
  USING (true)
  WITH CHECK (true);

-- Policies for dialog_webhook_logs
CREATE POLICY "Authenticated users can manage webhook logs" 
  ON dialog_webhook_logs FOR ALL 
  TO authenticated 
  USING (true)
  WITH CHECK (true);
