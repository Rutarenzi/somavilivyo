-- Create indexes to improve courses query performance and prevent timeouts

-- Index on user_id for faster filtering (if not already exists)
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON public.courses (user_id);

-- Composite index on user_id and created_at for optimized ordering
CREATE INDEX IF NOT EXISTS idx_courses_user_id_created_at ON public.courses (user_id, created_at DESC);

-- Index on status for filtering (commonly used)  
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses (status);

-- Composite index for shared course access queries
CREATE INDEX IF NOT EXISTS idx_shared_course_access_user_id ON public.shared_course_access (user_id, course_id);