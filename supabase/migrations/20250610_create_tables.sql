-- Create wines table
CREATE TABLE wines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colour_style TEXT NOT NULL,
  region TEXT,
  country TEXT,
  producer TEXT NOT NULL,
  name TEXT NOT NULL,
  vintage TEXT,
  grapes TEXT,
  btg BOOLEAN DEFAULT FALSE,
  importer TEXT,
  cost_price NUMERIC(10, 2),
  sale_price NUMERIC(10, 2),
  glass_price NUMERIC(10, 2),
  inventory_location TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create menus table
CREATE TABLE menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create menu_sections table
CREATE TABLE menu_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

-- Create menu_items table
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES menu_sections(id) ON DELETE CASCADE,
  wine_id UUID NOT NULL REFERENCES wines(id),
  sort_order INTEGER NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_wines_colour_style ON wines(colour_style);
CREATE INDEX idx_wines_country ON wines(country);
CREATE INDEX idx_wines_status ON wines(status);
CREATE INDEX idx_menu_sections_menu_id ON menu_sections(menu_id);
CREATE INDEX idx_menu_items_section_id ON menu_items(section_id);

-- Enable Row Level Security
ALTER TABLE wines ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for wines table (everyone can read active wines)
CREATE POLICY "Everyone can read active wines" ON wines
  FOR SELECT USING (status = 'Active');

CREATE POLICY "Authenticated users can read all wines" ON wines
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create RLS policies for menus (authenticated users only)
CREATE POLICY "Authenticated users can create menus" ON menus
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read their own menus" ON menus
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their own menus" ON menus
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete their own menus" ON menus
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for menu_sections
CREATE POLICY "Authenticated users can manage menu_sections" ON menu_sections
  FOR ALL USING (auth.role() = 'authenticated');

-- Create RLS policies for menu_items
CREATE POLICY "Authenticated users can manage menu_items" ON menu_items
  FOR ALL USING (auth.role() = 'authenticated');
