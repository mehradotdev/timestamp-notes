"use client";

import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { TimezoneSelector } from "@/components/TimezoneSelector";
import { NoteEditor } from "@/components/NoteEditor";
import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export default function Home() {
  // State management
  const [notes, setNotes] = useState("");
  const [selectedTimezone, setSelectedTimezone] = useState<string>("");

  // Load user's timezone, saved timezone and saved notes from localStorage on component mount
  useEffect(() => {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const savedTimezone = localStorage.getItem("selectedTimezone");
    const savedNotes = localStorage.getItem("timestampNotes");

    if (savedNotes) {
      setNotes(savedNotes);
    }

    setSelectedTimezone(savedTimezone || userTimeZone);
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("timestampNotes", notes);
  }, [notes]);

  // Save selected timezone to localStorage whenever it changes
  useEffect(() => {
    if (selectedTimezone) {
      localStorage.setItem("selectedTimezone", selectedTimezone);
      setNotes(processNotesForDisplay());
    }
  }, [selectedTimezone]);

  // Process notes to display timestamps in the selected timezone
  const processNotesForDisplay = () => {
    if (!selectedTimezone) return notes; // Return original notes if timezone isn't loaded yet

    // Regular expression to find timestamps with ISO data
    const timestampRegex = /\[(.*?)\|(.*?)\]/g;

    return notes.replace(timestampRegex, (match, _, isoTime) => {
      try {
        // Parse the ISO time and format it in the selected timezone
        const date = parseISO(isoTime);
        const newFormattedTime = formatInTimeZone(
          date,
          selectedTimezone,
          "yyyy-MM-dd HH:mm:ss OOOO"
        );
        return `[${newFormattedTime}|${isoTime}]`;
      } catch (error) {
        // If parsing fails, return the original match
        return match;
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="flex flex-col h-full max-w-4xl mx-auto p-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Type your notes!
          </h1>

          <TimezoneSelector
            selectedTimezone={selectedTimezone}
            setSelectedTimezone={setSelectedTimezone}
          />

          <NoteEditor
            notes={notes}
            selectedTimezone={selectedTimezone}
            setNotes={setNotes}
          />
        </div>
      </main>
    </div>
  );
}
