# სერვისის დისპეჩერი

Build a dispatching / service-management web app for an elevator & escalator service company. IMPORTANT: the entire user interface, all labels, buttons, statuses and sample data must be in GEORGIAN language (ქართული). Use the Georgian font stack (system-ui / Noto Sans Georgian). This is an internal operational tool, so prioritize a clean, dense, professional dashboard UI (not a marketing landing page).

TECH: Use Lovable's default stack (React + TypeScript + Tailwind + shadcn/ui). Enable Supabase for the database and authentication. Use email/password auth.

USER ROLES (3):
1) დისპეჩერი (Dispatcher) — creates and manages service calls, assigns technicians.
2) ტექნიკოსი (Technician) — sees only calls assigned to them, updates status, adds notes.
3) მენეჯერი (Manager/Admin) — full access + reports + KPI dashboard + user management.
Add a role field on the profiles table and gate the UI/routes by role.

BUILD THESE 4 MODULES:

MODULE 1 — გამოძახებების მიღება (Service call intake):
A form + table to register incoming service/breakdown requests. Fields: ID (auto), ობიექტი/მისამართი (building/site + address), ლიფტის ID / ქარხნული ნომერი (elevator ID / serial), მომსახურების ტიპი (type: ავარია / გეგმიური სერვისი / ინსპექცია / ჩამოკიდება[trapped passenger]), პრიორიტეტი (priority: კრიტიკული / მაღალი / საშუალო / დაბალი), აღწერა (description), დამკვეთი/საკონტაქტო (client + contact phone), მიღების დრო (auto timestamp). "ჩამოკიდება" (trapped person) priority auto-defaults to კრიტიკული.

MODULE 2 — ტექნიკოსზე მიბმა + გრაფიკი (Technician assignment + schedule):
Dispatcher assigns each call to a technician and a scheduled date/time. Show a daily/weekly schedule view (a simple board or calendar grouped by technician). Show each technician's current open-call load. Allow reassignment.

MODULE 3 — სტატუსი + SLA (Status + SLA tracking):
Each call moves through a status workflow: ახალი → მიღებული → გზაში → მიმდინარე → შესრულებული → დახურული (also გაუქმებული). Show a status timeline per call with timestamps. Compute SLA: response deadline based on priority (კრიტიკული=1სთ, მაღალი=4სთ, საშუალო=24სთ, დაბალი=72სთ). Show an SLA badge (in time / warning / breached / დარღვეული) and highlight breached calls in red.

MODULE 4 — პრევენცია + რეპორტები (Preventive maintenance + reports):
- A registry of contracted elevators/objects with a preventive-maintenance interval (e.g. monthly) and next-due date; flag units that are overdue.
- A reports/KPI dashboard: total calls, open vs closed, average response time, SLA compliance %, calls by priority, calls by technician, calls by type. Use charts (bar/pie/line). Add a date-range filter and CSV export.

GENERAL: Main dashboard landing after login = summary cards (ღია გამოძახებები, დღეს დაგეგმილი, SLA რისკის ქვეშ, ვადაგადაცილებული პრევენცია) + recent calls table. Include seed/sample data in Georgian (5-6 objects, 3 technicians, ~10 calls of mixed priority/status) so the app looks alive on first load. Make it mobile-friendly so technicians can use it on a phone.

Start by setting up the data model and Supabase, then the dashboard and Module 1, and tell me what you built.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e1cffb3f-677f-4ddb-ab52-b3ed3812ae00).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
