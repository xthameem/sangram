# Implementation Plan: KEAM Pro Major Feature Update

## 1. Data Layer Changes
- Add `class_level` field to Question interface (11 or 12)
- Map each chapter to its class (based on KEAM syllabus from materials)
- Add class_level to all questions in questions.ts

## 2. Database Schema Changes  
- Update `user_progress` to support proper tracking
- Fix leaderboard: The current schema has leaderboard as a VIEW, but progress API tries writing to it as TABLE
- Solution: Remove leaderboard table writes from progress API; use the VIEW which auto-computes from user_progress
- Add minimum 5 solved questions threshold for leaderboard visibility
- Add `full_name` to leaderboard view

## 3. Navigation Restructure
Flow: KEAM → Chapterwise → Class 11/Class 12 → Chapters List → Questions

Files to create/modify:
- `/keam/chapterwise/page.tsx` → Class selection (11 or 12)
- `/keam/chapterwise/[classLevel]/page.tsx` → Chapters list for that class
- `/keam/chapterwise/[classLevel]/[chapter]/page.tsx` → Questions for that chapter
- `/keam/chapterwise/[classLevel]/[chapter]/[questionId]/page.tsx` → Single question

Remove:
- Subject-level routing (physics/chemistry/maths as separate routes)
- "All Questions" option
- Next/Previous navigation

## 4. Question Attempt Flow
- Remove difficulty chooser
- Add confirmation modal: "Are you sure you want to submit this answer?"
- After submit → redirect back to chapter questions list
- Remove Next/Previous navigation buttons

## 5. Progress Tracking API  
- Create `/api/dashboard/stats` endpoint  
- Return: total attempted, total solved, chapter-wise & subject-wise progress, accuracy
- Each question: Solved / Attempted / Fresh

## 6. Dashboard Update
- Show total attempted, total solved
- Chapter-wise progress bars  
- Subject-wise progress bars

## 7. Leaderboard Fix
- Use the SQL VIEW (auto-computes from user_progress)
- Filter: only show users with ≥5 solved questions
- Display: name, username, avatar, stats (problems solved, accuracy)
- Remove mock stats generation
- Show real full_name from profiles
