"use client"

import type React from "react"

import { useState, useEffect, useRef, type KeyboardEvent } from "react"
import { parseISO } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"
import { Copy } from "lucide-react"

export default function TimestampNotes() {
  // Get user's current timezone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  // State management
  const [notes, setNotes] = useState("")
  const [selectedTimezone, setSelectedTimezone] = useState(userTimeZone)
  const [copySuccess, setCopySuccess] = useState(false)
  const [timezones, setTimezones] = useState<string[]>([])

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load available timezones
  useEffect(() => {
    try {
      // Use Intl API to get all supported timezones
      const supportedTimezones = Intl.supportedValuesOf("timeZone")
      setTimezones(supportedTimezones)
    } catch (error) {
      // Fallback for browsers that don't support Intl.supportedValuesOf
      console.error("Error loading timezones:", error)
      // Provide a minimal list of common timezones as fallback
      setTimezones([
        "UTC",
        "America/New_York",
        "America/Los_Angeles",
        "Europe/London",
        "Europe/Paris",
        "Asia/Tokyo",
        "Asia/Kolkata",
        "Australia/Sydney",
      ])
    }
  }, [])

  // Load saved notes from localStorage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem("timestampNotes")
    const savedTimezone = localStorage.getItem("selectedTimezone")

    if (savedNotes) {
      setNotes(savedNotes)
    }

    if (savedTimezone) {
      setSelectedTimezone(savedTimezone)
    }
  }, [])

  // Save notes and timezone to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("timestampNotes", notes)
    localStorage.setItem("selectedTimezone", selectedTimezone)
  }, [notes, selectedTimezone])

  // Reset copy success message after 2 seconds
  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => {
        setCopySuccess(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [copySuccess])

  // Handle keyboard shortcuts in the textarea
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault()
      insertTimestamp()
    }
  }

  // Insert timestamp at current cursor position
  const insertTimestamp = () => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const cursorPosition = textarea.selectionStart

    // Get current date and format with timezone
    const now = new Date()
    const formattedTime = formatInTimeZone(now, selectedTimezone, "yyyy-MM-dd HH:mm:ss OOOO")

    // Store ISO string as data attribute for future timezone conversions
    const isoTime = now.toISOString()
    const timestampText = `[${formattedTime}|${isoTime}]`

    // Insert timestamp at cursor position
    const beforeCursor = notes.substring(0, cursorPosition)
    const afterCursor = notes.substring(textarea.selectionEnd)
    const newNotes = beforeCursor + timestampText + afterCursor

    setNotes(newNotes)

    // Set cursor position after the inserted timestamp
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPosition = cursorPosition + timestampText.length
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
        textareaRef.current.focus()
      }
    }, 0)
  }

  // Process notes to display timestamps in the selected timezone
  const processNotesForDisplay = () => {
    // Regular expression to find timestamps with ISO data
    const timestampRegex = /\[(.*?)\|(.*?)\]/g

    return notes.replace(timestampRegex, (match, formattedTime, isoTime) => {
      try {
        // Parse the ISO time and format it in the selected timezone
        const date = parseISO(isoTime)
        const newFormattedTime = formatInTimeZone(date, selectedTimezone, "yyyy-MM-dd HH:mm:ss OOOO")
        return `[${newFormattedTime}|${isoTime}]`
      } catch (error) {
        // If parsing fails, return the original match
        return match
      }
    })
  }

  // Copy notes to clipboard (without the ISO data)
  const copyToClipboard = () => {
    // Clean up the notes to remove the ISO data part before copying
    const cleanNotes = notes.replace(/\[(.*?)\|(.*?)\]/g, (match, formattedTime) => {
      return `[${formattedTime}]`
    })

    navigator.clipboard
      .writeText(cleanNotes)
      .then(() => {
        setCopySuccess(true)
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err)
      })
  }

  // Handle timezone change
  const handleTimezoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTimezone(e.target.value)
  }

  // Get display value for textarea (with converted timestamps)
  const displayNotes = processNotesForDisplay()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-4 md:p-8">
      <div className="max-w-4xl w-full mx-auto bg-white rounded-lg shadow-md p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Timestamp Notes</h1>

        {/* Timezone Selector */}
        <div className="mb-4">
          <label htmlFor="timezone-selector" className="block text-sm font-medium text-gray-700 mb-1">
            Timezone
          </label>
          <select
            id="timezone-selector"
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedTimezone}
            onChange={handleTimezoneChange}
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">Press Shift+Enter to insert timestamp at cursor position</p>
        </div>

        {/* Note Editor */}
        <div className="flex-grow mb-4">
          <label htmlFor="note-editor" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            ref={textareaRef}
            id="note-editor"
            className="w-full min-h-[300px] p-3 border border-gray-300 rounded-md shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical font-mono text-sm"
            value={displayNotes}
            onChange={(e) => setNotes(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Start typing your notes here... Press Shift+Enter to insert a timestamp."
          />
        </div>

        {/* Copy Button */}
        <div className="flex justify-end items-center">
          <button
            onClick={copyToClipboard}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Copy className="w-4 h-4 mr-2" />
            {copySuccess ? "Copied!" : "Copy Notes"}
          </button>
        </div>
      </div>
    </div>
  )
}
