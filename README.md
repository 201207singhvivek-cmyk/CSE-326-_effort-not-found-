# CSE326 — Railway Junction Platform Management Simulator

> **Course**: Internet Programming (CSE326)  
> **Repository**: `cse326_efffort_not_found`

A minimalist, high-efficiency Railway Station Platform Management Simulator built with pure Vanilla HTML, CSS, and JavaScript.

---

## Key Features
- **24-Hour Military Time**: Real-time station digital clock (`HH:MM:SS`) and schedule management without AM/PM confusion.
- **Dynamic Platform Configuration**: Scalable platforms (1–20) with live LED status indicators (Green = Free, Red = Occupied).
- **Collapsible Sidebar & Navigation**: Quick-jump navigation across all station sections with live free/occupied platform counters.
- **Traffic Forecast**: Next 1-hour traffic progress bar and capacity calculation with simulation controls.
- **Visual Train Boxes**: Active and scheduled train cards with 1-click **Allocate**, **Depart**, and **Delay** actions.
- **Conflict Prevention & Mainline Protection**: Prevents double-booking platforms and warns when stopping long stoppage trains on quick-stop tracks.
- **Master Schedule Table**: Complete operational overview of train priorities, categories, arrival/departure, delays, and platform assignments.

---

## Tech Stack
- **HTML5**: Semantic markup with native collapsible `<details>` / `<summary>` cards.
- **CSS3**: CSS Custom Properties (`:root`), Flexbox, CSS Grid, and responsive layout.
- **JavaScript**: Pure Vanilla JS with centralized state management (Zero external dependencies or frameworks).

---

## How to Run
Simply open `htmlfile.html` in any modern web browser (Chrome, Safari, Firefox, Edge).
