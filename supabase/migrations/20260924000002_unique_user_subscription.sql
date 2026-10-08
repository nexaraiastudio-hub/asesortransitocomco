-- 20260924000002_unique_user_subscription.sql

-- Ensure that a user can only have one active subscription row at a time.
-- This is critical for idempotent UPSERT operations in the RevenueCat webhook.
ALTER TABLE public.subscriptions
ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
