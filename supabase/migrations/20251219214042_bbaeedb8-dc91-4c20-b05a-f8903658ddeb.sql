-- Drop existing INSERT policies and recreate with explicit auth.uid() NOT NULL checks
-- This prevents anonymous users from creating records with NULL user_id

-- Fix conversations table INSERT policy
DROP POLICY IF EXISTS "Users can create own conversations" ON public.conversations;
CREATE POLICY "Users can create own conversations" 
  ON public.conversations 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Fix profiles table INSERT policy  
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
CREATE POLICY "Users can create their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);