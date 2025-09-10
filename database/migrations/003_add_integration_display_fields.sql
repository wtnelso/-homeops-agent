-- Add display fields to integrations table for modal
ALTER TABLE integrations 
ADD COLUMN long_description TEXT, -- Detailed description of the service
ADD COLUMN platform_url TEXT, -- Link to the platform (e.g., gmail.com)
ADD COLUMN how_it_works TEXT, -- How this integration works with the app
ADD COLUMN required_scopes TEXT[]; -- OAuth scopes required by this integration