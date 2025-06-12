# Timestamp Notes

A minimalist web application built with Next.js and Tailwind CSS, designed for taking meeting notes with easy, timezone-aware timestamp insertion. Ideal for software support professionals or anyone needing to accurately log events with times and share them across different timezones.

## Key Features

- **Quick Timestamp Insertion:** Press `Shift+Enter` in the notes editor to insert the current time.
- **Timezone-Aware Timestamps:**
  - Timestamps are inserted into the editor in a special format: `[Displayed Time (in selected TZ)|Universal ISO 8601 Time]`. For example: `[2023-10-27 14:30:15 GMT+05:30|2023-10-27T09:00:00.000Z]`.
  - The "Displayed Time" part automatically updates if you change the selected timezone.
- **Timezone Selector:** A searchable dropdown menu to select the desired display timezone for your notes.
  - Defaults to the user's system timezone on first load.
  - Lists IANA timezones with their GMT offsets.
- **Clean Copied Notes:** When using the "Copy Notes" button, timestamps are copied in a clean format, showing only the "Displayed Time" part, relevant to the currently selected timezone. For example: `[2023-10-27 14:30:15 GMT+05:30]`.
- **Local Storage Persistence:** Your notes and selected timezone preference are automatically saved in your browser's local storage, so your work isn't lost if you close the tab or browser.
- **Responsive UI:** Built with Tailwind CSS for a clean and responsive experience.
- **Iconography:** Uses `lucide-react` for clear and modern icons.

## Tech Stack

- **Framework:** Next.js (v15+)
- **Language:** TypeScript
- **UI Library:** React (v19+)
- **Styling:** Tailwind CSS
- **Date/Time Management:**
  - `date-fns`
  - `date-fns-tz` (for timezone-aware formatting and conversions)
- **Icons:** `lucide-react`
- **State Management:** React Hooks (`useState`, `useEffect`)

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (v18 or later recommended)
- npm (v8 or later) or yarn (v1.22 or later)

## Installation & Setup

To get Timestamp Notes running locally:

1.  **Clone the repository (or download the files):**

    ```bash
    git clone <your-repository-url>
    cd timestamp-notes
    ```

2.  **Install dependencies:**
    Using npm:
    ```bash
    npm install
    ```
    Or using yarn:
    ```bash
    yarn install
    ```

## Running the Application (Development)

To start the development server:

Using npm:

```bash
npm run dev
```

Or using yarn:

```bash
yarn dev
```

The application will typically be available at `http://localhost:3000`.

## How to Use

1.  **Open the Application:** Navigate to the application in your web browser.
2.  **Set Timezone:**
    - The application will attempt to default to your system's timezone.
    - You can change the display timezone at any time using the "Display Timezone" dropdown. This list is searchable.
3.  **Take Notes:**
    - Type your notes into the main text area.
    - When you need to insert a timestamp, press `Shift+Enter`.
    - The timestamp will be inserted at your cursor's current position. It will be formatted according to the currently selected timezone but will also contain the underlying UTC ISO time (e.g., `[2023-10-27 14:30:15 GMT+05:30|2023-10-27T09:00:00.000Z]`).
4.  **Dynamic Timezone Conversion:**
    - If you change the selected timezone from the dropdown, all existing timestamps within the note editor will dynamically update their _displayed_ portion to reflect the new timezone. The underlying ISO time remains constant.
5.  **Copy Notes:**
    - When you're ready to share your notes, click the "Copy Notes" button.
    - This will copy the entire content of the notes editor to your clipboard.
    - The timestamps in the copied text will be in the clean, display-only format, reflecting the timezone selected at the time of copying (e.g., `[2023-10-27 14:30:15 GMT+05:30]`).
6.  **Persistence:** Your notes and the last selected timezone are automatically saved to your browser's local storage.

## Timestamp Storage and Display Explained

A key aspect of this application is how timestamps are handled to allow for flexible timezone conversion:

- **In the Editor:** When a timestamp is inserted using `Shift+Enter`, it's stored in the text area with two parts, separated by a pipe `|` and enclosed in square brackets:

  - `[Displayed Formatted Time|ISO 8601 UTC Time]`
  - Example: `Client issue reported [2023-10-27 14:30:15 GMT+05:30|2023-10-27T09:00:00.000Z]`
  - The "Displayed Formatted Time" is what you see, and it changes based on the `selectedTimezone`.
  - The "ISO 8601 UTC Time" is the absolute point in time, stored in UTC, which allows for accurate conversion to any other timezone.

- **When Copied:** When you click "Copy Notes", the application processes these special timestamps. It takes only the "Displayed Formatted Time" part for the copied output.
  - Example (copied): `Client issue reported [2023-10-27 14:30:15 GMT+05:30]`

This approach ensures that the notes are always grounded in a universal time, while providing the flexibility to view and share them in any desired local timezone.

## License

This project is licensed under the **MIT License**.
