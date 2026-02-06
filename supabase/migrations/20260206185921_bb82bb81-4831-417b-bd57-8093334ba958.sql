-- Fix the overly permissive notification insert policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Only authenticated users can create notifications for other users
CREATE POLICY "Authenticated users can create notifications" ON public.notifications 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);