# Course Shifting UI Testing Guide

## 🎯 Quick Test Setup

Test students have been created and are ready for course shifting scenarios!

## 📋 Test Credentials

### Test Student 1: Regular BSIT Student (Ready to shift)
- **Email:** `test.shiftee@example.com`
- **Password:** `password`
- **Current Program:** BSIT (Bachelor of Science in Information Technology)
- **Year Level:** 2nd Year
- **Status:** Regular (has grades and payment)
- **Scenario:** Can shift to BSHM to test the course comparison modal

### Test Student 2: Irregular BSHM Student
- **Email:** `test.irregular@example.com`
- **Password:** `password`
- **Current Program:** BSHM
- **Year Level:** 1st Year
- **Status:** Irregular (has some failed subjects)
- **Scenario:** Test shifting while irregular

### Test Student 3: Senior BSIT Student
- **Email:** `test.senior@example.com`
- **Password:** `password`
- **Current Program:** BSIT
- **Year Level:** 3rd Year
- **Status:** Regular
- **Scenario:** Test shifting at higher year level

## 🧪 Testing the Course Shift UI

### Option 1: Test via Registrar Portal
1. **Login as Admin/Registrar:**
   - Email: `admin@example.com`
   - Password: `password`

2. **Navigate to:** Registrar Dashboard → Students → Create/Edit Student

3. **Edit Test Student:**
   - Search for "Test Shiftee" or student number "TEST-2025-001"
   - Change program from BSIT to BSHM
   - The course shift modal should appear showing:
     - ✅ Current Program: BSIT (with curriculum details)
     - ✅ Program to Shift To: BSHM (with curriculum details)
     - ✅ 2-column comparison layout
     - ✅ Subject comparison between curricula
     - ✅ Credited subjects (if any)
     - ✅ Subjects to catch up
     - ✅ Fee adjustments

4. **Test Different Scenarios:**
   - Try shifting Test Irregular student (should still allow but mark as irregular)
   - Try shifting Test Senior student (higher year level implications)
   - Cancel the modal and verify no changes saved
   - Confirm the shift and verify student marked as irregular

### Option 2: Test Curriculum Comparison Function
The course shift modal uses the `compareCurricula(currentProgramId, targetProgramId)` function.

**What to Look For:**
- ✅ **Layout:** Clean 2-column comparison (Current | New Program)
- ✅ **Labels:** "Current Program" and "Program to Shift To" (not reversed)
- ✅ **Curriculum Details:** Shows curriculum name, total units, subjects
- ✅ **Subject Matching:** Highlights which subjects transfer vs need catching up
- ✅ **Fee Information:** Removed from modal (cleaner interface)
- ✅ **Confirmation:** Must explicitly confirm course shift

## 🎨 UI Elements to Test

### Modal Components
- [ ] Modal opens when changing program
- [ ] Two-column layout displays correctly
- [ ] Current program shows on left, new program on right
- [ ] Curriculum names display properly
- [ ] Subject lists are readable and organized
- [ ] Credited subjects highlighted (if any)
- [ ] Catch-up subjects clearly marked
- [ ] Cancel button works without saving changes
- [ ] Confirm button triggers course shift logic

### Data Accuracy
- [ ] Program names are correct (not swapped)
- [ ] Curriculum versions match current curricula
- [ ] Subject codes and names display correctly
- [ ] Year levels and semesters are accurate
- [ ] Unit counts are correct

### User Experience
- [ ] Modal is easy to understand
- [ ] Information is clearly organized
- [ ] No confusing or reversed labels
- [ ] Confirmation flow makes sense
- [ ] Error messages (if any) are helpful

## 🔍 Testing Course Shift Logic

After confirming a course shift, verify:

1. **Student Status Updated:**
   - Student marked as `irregular`
   - `course_shifted_at` timestamp recorded
   - `previous_program_id` saved

2. **Credit Transfer Records Created:**
   - Check `student_credit_transfers` table
   - Credited subjects recorded
   - Catch-up subjects identified
   - Transfer type marked as 'shiftee'

3. **Regularity Check Triggered:**
   - If student has all required subjects → becomes regular
   - Oterwise stays irregular
   - Check logs for regularity check execution

## 🐛 Common Issues to Check

- ❌ Modal not appearing when changing program
- ❌ Programs/curricula displaying in reversed order
- ❌ Missing or incorrect subject information
- ❌ Fees showing when they shouldn't
- ❌ Confirmation button not working
- ❌ Student not marked as irregular after shift
- ❌ Credit transfers not recorded

## 📝 Feedback Points

When testing, note:
1. Is the layout intuitive?
2. Is the information clear and helpful?
3. Are there any confusing elements?
4. Does the confirmation flow make sense?
5. Are there any missing pieces of information?
6. Any suggestions for improvement?

## 🔄 Reset Test Data (if needed)

To reset test students:
```bash
vendor/bin/sail artisan tinker --execute="\App\Models\Student::where('student_number', 'like', 'TEST-%')->delete();"
vendor/bin/sail artisan db:seed --class=CourseShiftTestSeeder
```

## 🚀 Quick Access

**Application URL:** http://localhost
**Admin Login:** admin@example.com / password
**Test Student Login:** test.shiftee@example.com / password

---

Happy Testing! 🎉
