-- Run this in Supabase SQL editor. Adds the column the goal-setup "skip" flow
-- needs so a user who skips onboarding isn't sent back to the goal screen
-- every time they load the app.

alter table profiles
  add column if not exists onboarding_skipped boolean not null default false;
