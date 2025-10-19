# Supabase Integration Setup

This document provides instructions for setting up Supabase integration with your Skylore app.

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project in your Supabase dashboard

## Database Setup

### 1. Create Tables

Run the following SQL commands in your Supabase SQL editor:

**Note:** If you already have the photos table created, you'll need to run the migration script below to update the constellation column to an array.

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  cultures TEXT[], -- Array of selected cultures
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create photos table
CREATE TABLE photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  taken_at TIMESTAMPTZ DEFAULT now(),
  latitude FLOAT8,
  longitude FLOAT8,
  constellation TEXT[] DEFAULT '{}', -- Array of constellation names, empty for future AI analysis
  light_rating SMALLINT CHECK (light_rating >= 1 AND light_rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2. Migration Script (if updating existing table)

If you already have the photos table, run this migration to update the constellation column:

```sql
-- Update constellation column to array type
ALTER TABLE photos ALTER COLUMN constellation TYPE TEXT[] USING 
  CASE 
    WHEN constellation IS NULL THEN '{}'::TEXT[]
    WHEN constellation = '' THEN '{}'::TEXT[]
    ELSE ARRAY[constellation]::TEXT[]
  END;

-- Set default value
ALTER TABLE photos ALTER COLUMN constellation SET DEFAULT '{}';
```

### 3. Enable Row Level Security (RLS)

```sql
-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on photos table
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
```

### 4. Create RLS Policies

```sql
-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Photos policies
CREATE POLICY "Users can view own photos" ON photos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own photos" ON photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photos" ON photos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos" ON photos
  FOR DELETE USING (auth.uid() = user_id);
```

### 5. Profile Creation

Profiles are created synchronously during the signup process in the application code. No database triggers are needed.

## Storage Setup

### 1. Create Storage Bucket

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `user_photos`
3. Set it to **Private**

### 2. Create Storage Policies

```sql
-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user_photos' AND
    auth.role() = 'authenticated'
  );

-- Allow users to view their own photos
CREATE POLICY "Users can view own photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user_photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own photos
CREATE POLICY "Users can delete own photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user_photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## App Configuration

### 1. Update Supabase Configuration

Edit `src/config/supabase.js` and replace the placeholder values:

```javascript
const supabaseUrl = 'YOUR_SUPABASE_URL'; // Found in Project Settings > API
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // Found in Project Settings > API
```

### 2. Install Dependencies

Run the following command to install the Supabase client:

```bash
npm install @supabase/supabase-js
```

## Features Included

### Authentication
- User signup and signin
- Automatic profile creation
- Session management
- Password validation

### Photo Management
- Camera integration for photo capture
- Photo upload to Supabase Storage
- Metadata storage (location, constellation array, light rating)
- Photo gallery with thumbnails
- Photo deletion
- Signed URL generation for secure photo viewing
- Constellation array support for future AI analysis
- Empty constellation arrays by default (ready for AI detection)

### Data Security
- Row Level Security (RLS) policies
- User-specific data access
- Secure file storage
- Automatic data cleanup on user deletion

## Usage

1. **Sign Up/Sign In**: Users can create accounts or sign in through the onboarding screen
2. **Capture Photos**: Use the camera button to capture constellation photos
3. **Rate Light Pollution**: Rate sky clarity from 1-5 after capturing
4. **View Gallery**: Access saved photos through the gallery button
5. **Manage Photos**: View details and delete photos as needed

## Troubleshooting

### Common Issues

1. **Camera Permission**: Ensure camera permissions are granted
2. **Storage Errors**: Check that the `user_photos` bucket exists and is private
3. **RLS Errors**: Verify all policies are correctly set up
4. **Authentication**: Check that Supabase URL and keys are correct

### Testing

1. Test user registration and login
2. Test photo capture and upload
3. Test photo gallery functionality
4. Test photo deletion
5. Verify data isolation between users

## Next Steps

Consider adding:
- Photo sharing between users
- Constellation recognition using AI
- Photo metadata editing
- Export functionality
- Social features
