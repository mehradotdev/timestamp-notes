"use client"

import { useState, useEffect, useRef, type KeyboardEvent } from "react"
import { parseISO } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"
import { Copy, ChevronDown, Search } from "lucide-react"

export default function TimestampNotes() {
  // Get user's current timezone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  // State management
  const [notes, setNotes] = useState("")
  const [selectedTimezone, setSelectedTimezone] = useState(userTimeZone)
  const [copySuccess, setCopySuccess] = useState(false)
  const [timezones, setTimezones] = useState<Array<{ value: string; label: string; offset: number }>>([])

  // Timezone search states
  const [isTimezoneDropdownOpen, setIsTimezoneDropdownOpen] = useState(false)
  const [timezoneSearchQuery, setTimezoneSearchQuery] = useState("")
  const [filteredTimezones, setFilteredTimezones] = useState<Array<{ value: string; label: string; offset: number }>>(
    [],
  )

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const timezoneDropdownRef = useRef<HTMLDivElement>(null)
  const timezoneSearchRef = useRef<HTMLInputElement>(null)

  // Load available timezones with GMT offsets
  useEffect(() => {
    try {
      // Use Intl API to get all supported timezones
      const supportedTimezones = Intl.supportedValuesOf("timeZone")

      // Function to get GMT offset for a timezone
      const getGMTOffset = (timezone: string): { offset: number; formatted: string } => {
        const date = new Date()

        // Get the timezone offset in minutes
        // Create a date formatter for the target timezone
        const targetFormatter = new Intl.DateTimeFormat("en-CA", {
          timeZone: timezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })

        const utcFormatter = new Intl.DateTimeFormat("en-CA", {
          timeZone: "UTC",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })

        // Format the same date in both timezones
        const targetTime = targetFormatter.format(date)
        const utcTime = utcFormatter.format(date)

        // Parse the formatted strings back to dates
        const targetDate = new Date(
          targetTime.replace(/(\d{4})-(\d{2})-(\d{2}), (\d{2}):(\d{2}):(\d{2})/, "$1-$2-$3T$4:$5:$6"),
        )
        const utcDate = new Date(
          utcTime.replace(/(\d{4})-(\d{2})-(\d{2}), (\d{2}):(\d{2}):(\d{2})/, "$1-$2-$3T$4:$5:$6"),
        )

        // Calculate offset in minutes
        const offsetMinutes = (targetDate.getTime() - utcDate.getTime()) / (1000 * 60)

        // Format the offset
        const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60)
        const offsetMins = Math.abs(offsetMinutes) % 60
        const sign = offsetMinutes >= 0 ? "+" : "-"
        const formatted = `GMT${sign}${offsetHours.toString().padStart(2, "0")}:${offsetMins.toString().padStart(2, "0")}`

        return { offset: offsetMinutes, formatted }
      }

      // Create timezone objects with offset information
      const timezonesWithOffsets = supportedTimezones.map((tz) => {
        const { offset, formatted } = getGMTOffset(tz)
        return {
          value: tz,
          label: `${tz} (${formatted})`,
          offset: offset,
        }
      })

      // Sort by GMT offset (ascending: GMT-14:00 to GMT+12:00)
      timezonesWithOffsets.sort((a, b) => a.offset - b.offset)

      setTimezones(timezonesWithOffsets)
      setFilteredTimezones(timezonesWithOffsets)
    } catch (error) {
      // Fallback for browsers that don't support Intl.supportedValuesOf
      console.error("Error loading timezones:", error)

      // Create fallback with common timezones and their correct UTC offsets
      const fallbackTimezones = [
        { value: "Pacific/Midway", label: "Pacific/Midway (GMT-11:00)", offset: -660 },
        { value: "America/Los_Angeles", label: "America/Los_Angeles (GMT-08:00)", offset: -480 },
        { value: "America/Denver", label: "America/Denver (GMT-07:00)", offset: -420 },
        { value: "America/Chicago", label: "America/Chicago (GMT-06:00)", offset: -360 },
        { value: "America/New_York", label: "America/New_York (GMT-05:00)", offset: -300 },
        { value: "UTC", label: "UTC (GMT+00:00)", offset: 0 },
        { value: "Europe/London", label: "Europe/London (GMT+00:00)", offset: 0 },
        { value: "Europe/Paris", label: "Europe/Paris (GMT+01:00)", offset: 60 },
        { value: "Europe/Moscow", label: "Europe/Moscow (GMT+03:00)", offset: 180 },
        { value: "Asia/Kolkata", label: "Asia/Kolkata (GMT+05:30)", offset: 330 },
        { value: "Asia/Shanghai", label: "Asia/Shanghai (GMT+08:00)", offset: 480 },
        { value: "Asia/Tokyo", label: "Asia/Tokyo (GMT+09:00)", offset: 540 },
        { value: "Australia/Sydney", label: "Australia/Sydney (GMT+10:00)", offset: 600 },
        { value: "Pacific/Auckland", label: "Pacific/Auckland (GMT+12:00)", offset: 720 },
      ]

      setTimezones(fallbackTimezones)
      setFilteredTimezones(fallbackTimezones)
    }
  }, [])

  // Filter timezones based on search query
  useEffect(() => {
    if (!timezoneSearchQuery.trim()) {
      setFilteredTimezones(timezones)
    } else {
      const filtered = timezones.filter((tz) => tz.label.toLowerCase().includes(timezoneSearchQuery.toLowerCase()))
      setFilteredTimezones(filtered)
    }
  }, [timezoneSearchQuery, timezones])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timezoneDropdownRef.current && !timezoneDropdownRef.current.contains(event.target as Node)) {
        setIsTimezoneDropdownOpen(false)
        setTimezoneSearchQuery("")
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
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

  // Update notes display when timezone changes
  useEffect(() => {
    if (notes && timezones.length > 0) {
      // This will trigger a re-render with updated timestamps
      const processedNotes = processNotesForDisplay()
      // We don't need to setNotes here as processNotesForDisplay returns the processed version
      // The textarea value uses displayNotes which calls processNotesForDisplay
    }
  }, [selectedTimezone, notes, timezones])

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

  // Handle timezone selection
  const handleTimezoneSelect = (timezone: string) => {
    setSelectedTimezone(timezone)
    setIsTimezoneDropdownOpen(false)
    setTimezoneSearchQuery("")
    setNotes(processNotesForDisplay())
  }

  // Get display value for textarea (with converted timestamps)
  const displayNotes = processNotesForDisplay()

  // Get the label for the currently selected timezone
  const selectedTimezoneLabel = timezones.find((tz) => tz.value === selectedTimezone)?.label || selectedTimezone

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-4 md:p-8">
      <div className="max-w-4xl w-full mx-auto bg-white rounded-lg shadow-md p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Timestamp Notes</h1>

        {/* Timezone Selector */}
        <div className="mb-4">
          <label htmlFor="timezone-selector" className="block text-sm font-medium text-gray-700 mb-1">
            Timezone
          </label>
          <div className="relative" ref={timezoneDropdownRef}>
            <button
              type="button"
              className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-left flex items-center justify-between"
              onClick={() => {
                setIsTimezoneDropdownOpen(!isTimezoneDropdownOpen)
                if (!isTimezoneDropdownOpen) {
                  setTimeout(() => timezoneSearchRef.current?.focus(), 100)
                }
              }}
            >
              <span className="truncate">{selectedTimezoneLabel}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {isTimezoneDropdownOpen && (
              <div className="absolute z-10 w-full md:w-96 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                {/* Search Input */}
                <div className="p-2 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      ref={timezoneSearchRef}
                      type="text"
                      placeholder="Search timezones..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={timezoneSearchQuery}
                      onChange={(e) => setTimezoneSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Timezone Options */}
                <div className="max-h-60 overflow-y-auto">
                  {filteredTimezones.length > 0 ? (
                    filteredTimezones.map((tz) => (
                      <button
                        key={tz.value}
                        type="button"
                        className={`w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                          selectedTimezone === tz.value ? "bg-blue-50 text-blue-600" : "text-gray-900"
                        }`}
                        onClick={() => handleTimezoneSelect(tz.value)}
                      >
                        <div className="truncate">{tz.label}</div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500 text-center">No timezones found</div>
                  )}
                </div>
              </div>
            )}
          </div>
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
