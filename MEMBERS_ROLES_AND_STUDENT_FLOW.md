
## Who does what

- **Super Admin** — Looks after the whole system. Contact for login or permission problems.
- **Head Teacher** — Manages class lists and schedules. Contact for section or timetable issues.
- **Registrar** — Handles student records, enrollments, payments, and re‑enrollment. Contact to add or change student details or payments.
- **Teacher** — Teaches, posts materials, and enters grades. Contact for grade or material problems.
- **Student** — Uses the portal to see grades, pay fees, and download materials. Students cannot change official records.

---

## Student journey (step by step)

1. **Admission** — Registrar creates the student account (first Enrollment)
2. **Enrollment** — Registrar or Admin enrolls the student in a class. Head Teacher helps with class lists.
3. **Payments & holds** — Registrar records payments. If a student owes money, they may be put on hold.
4. **Classes & materials** — Teachers share lessons and files. Students view or download them.
5. **Grading** — Teachers enter grades. Grades affect promotion and graduation.
6. **Progression** — All students progress and will proceed to next semester or move a yr level
7. **Records** — Term records are saved for later. They are read‑only unless reactivated.

---

## Transfers & course changes (clear difference)

### Transferee — from another school
A transferee is a student who studied at another school and wants to move here.

What we do:
- Registrar checks official transcripts and other papers.
- We compare past subjects to our subjects to see which can be counted as credit.
- Finance checks and applies any fee differences.

Student note:
- Some past subjects may be counted as credit. Some may not and will need catch‑up classes.
- The student may be marked **irregular** until required catch‑ups are finished.
- Best done in the 1st semester; 2nd semester transfers may be blocked.
- Usual time: a few working days for review and approvals.

Quick steps for Registrar (transferee):
1. Verify official documents and transcript.
2. Create or update the student record and set transfer type = **transferee**.
3. Run credit comparison and list proposed credits.
4. Ask Head Teacher / subject teachers to approve equivalencies.
5. Record accepted credits, fee changes, and any catch‑up subjects.
6. Finalize enrollment and inform the student.

---

### Course shiftee — internal program change
A course shiftee is a current student who moves from one program to another inside our school.

What we do:
- Registrar reviews the student’s record and reason for shifting.
- We compare the old and new programs to find possible credits.
- System approve which subjects can transfer.
- Finance applies fee adjustments if needed.

Student note:
- Some past subjects may count and reduce required classes.
- The student may need catch‑up subjects and can be marked **irregular** until done.
- Best done in the 1st semester; 2nd semester is blocked.
- Usual time: a few working days for review and approvals.

Quick steps for Registrar (shiftee):
1. Review student record and reason for shift.
2. Mark transfer type = **shiftee**.
3. Compare old and new curricula and suggest credits/catch‑ups.
4. Get Head Teacher / teachers to approve equivalents.
5. Record credits, set catch‑up subjects, and update fees.
6. Finalize enrollment and notify the student.

---

## Curriculums & year level guides (simple)

- **Curriculum** — the list of subjects for a program (what a student must take to finish).
- **Year level guide** — a short plan that shows which subjects a student should take each year or semester.

Why it matters:
- Staff use them for enrollment, advising, transfers, and checks for promotion.
- They help the Registrar, Head Teacher, and teachers know what each yr level is using.

Who manages them:
- Head Teacher / Program Coordinator suggest changes.


Where to look (in the system):
- Ask Admin or Registrar to show the program curriculum and year level guide for the program.

---

## Scheduling rules — teacher & subject (simple)

When you assign a subject to a teacher, check the items below. Use the system first — it blocks common conflicts.

What to check (quick):
- **Teacher availability** — teacher must not have another class at the same day/time.
- **Section conflicts** — students in the same section should not have two subjects at once.
- **Required hours** — the weekly schedule must meet the subject's hours requirement.
- **Session count** — number of meeting days should match the subject’s expected sessions.
- **Teacher load & leave** — respect maximum load and teacher leave days.


What the app already checks:
- Teacher double‑booking and time overlaps (`TeacherScheduleConflict`).
- Room and section time conflicts (checked in `ClassScheduleController`).
- `schedule_days`, `start_time`, `end_time` validation (Store/Update requests).
- Weekly hours vs required hours per subject (validated by rules).

Simple workflow to add or change a schedule:
1. Draft: pick days, start/end times, room, and teacher.
2. Run system checks (the app will reject clear conflicts).
3. If needed, get Head Teacher approval for exceptions.
4. Save the schedule and notify the teacher and affected students.

Tips for better schedules:
- Make major changes in the 1st semester when possible.
- Avoid back‑to‑back overloads for teachers.
---

## Who to contact (quick)

- Add or update student → **Registrar**
- Class list or schedule → **Head Teacher**
- Grade or material problem → **Teacher**
- System or access problem → **Super Admin / IT**

---

Want this as a one‑page handout or step‑by‑step instructions with screenshots? Tell me which and I will make it.