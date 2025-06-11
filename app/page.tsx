"use client"

import { useState, useEffect, useRef, type KeyboardEvent } from "react"
import { format } from "date-fns"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { Copy, Edit } from "lucide-react"

export default function TimestampNotes() {
  // Define timestamp format options
  const timestampFormats = [
    { id: "full", label: "Full Date & Time", format: "yyyy-MM-dd HH:mm:ss" },
    { id: "time", label: "Time Only (24h)", format: "HH:mm:ss" },
    { id: "us", label: "US Date & Time (12h)", format: "MM/dd/yyyy h:mm:ss a" },
  ]

  // State management
  const [timestampFormat, setTimestampFormat] = useState(timestampFormats[0].id)
  const [notes, setNotes] = useState("")
  const [editingTimestamp, setEditingTimestamp] = useState<{
    originalText: string
    date: Date
    startPos: number
    endPos: number
  } | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load saved notes and format from localStorage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem("timestampNotes")
    const savedFormat = localStorage.getItem("timestampFormat")

    if (savedNotes) {
      setNotes(savedNotes)
    }

    if (savedFormat && timestampFormats.some((format) => format.id === savedFormat)) {
      setTimestampFormat(savedFormat)
    }
  }, [])

  // Save notes and format to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("timestampNotes", notes)
    localStorage.setItem("timestampFormat", timestampFormat)
  }, [notes, timestampFormat])

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
    const currentFormat =
      timestampFormats.find((fmt) => fmt.id === timestampFormat)?.format || timestampFormats[0].format
    const now = new Date()
    const formattedTime = format(now, currentFormat)
    const timestampText = `[${formattedTime}]`

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

  // Find and edit selected timestamp
  const editSelectedTimestamp = () => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const selectionStart = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd

    // If no text is selected, try to find timestamp at cursor position
    let startPos = selectionStart
    let endPos = selectionEnd

    if (selectionStart === selectionEnd) {
      // Find timestamp around cursor position
      const text = notes
      let foundStart = -1
      let foundEnd = -1

      // Look backwards for opening bracket
      for (let i = selectionStart - 1; i >= 0; i--) {
        if (text[i] === "[") {
          foundStart = i
          break
        }
        if (text[i] === "]") break // Stop if we hit a closing bracket first
      }

      // Look forwards for closing bracket
      for (let i = selectionStart; i < text.length; i++) {
        if (text[i] === "]") {
          foundEnd = i + 1
          break
        }
        if (text[i] === "[") break // Stop if we hit an opening bracket first
      }

      if (foundStart !== -1 && foundEnd !== -1) {
        startPos = foundStart
        endPos = foundEnd
      }
    }

    const selectedText = notes.substring(startPos, endPos)

    // Check if selected text is a timestamp (matches pattern [timestamp])
    const timestampRegex = /^\[(.+)\]$/
    const match = selectedText.match(timestampRegex)

    if (!match) {
      alert("Please select a timestamp (text in square brackets) to edit.")
      return
    }

    const timestampContent = match[1]

    // Try to parse the timestamp using different formats
    let parsedDate: Date | null = null

    for (const fmt of timestampFormats) {
      try {
        // Simple parsing - this is a basic implementation
        // For a more robust solution, you'd want to use a proper date parsing library
        if (fmt.id === "full") {
          // yyyy-MM-dd HH:mm:ss
          const dateMatch = timestampContent.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/)
          if (dateMatch) {
            parsedDate = new Date(
              Number.parseInt(dateMatch[1]),
              Number.parseInt(dateMatch[2]) - 1,
              Number.parseInt(dateMatch[3]),
              Number.parseInt(dateMatch[4]),
              Number.parseInt(dateMatch[5]),
              Number.parseInt(dateMatch[6]),
            )
            break
          }
        } else if (fmt.id === "time") {
          // HH:mm:ss - use today's date
          const timeMatch = timestampContent.match(/(\d{2}):(\d{2}):(\d{2})/)
          if (timeMatch) {
            const today = new Date()
            parsedDate = new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate(),
              Number.parseInt(timeMatch[1]),
              Number.parseInt(timeMatch[2]),
              Number.parseInt(timeMatch[3]),
            )
            break
          }
        } else if (fmt.id === "us") {
          // MM/dd/yyyy h:mm:ss a
          const usMatch = timestampContent.match(/(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2}) (AM|PM)/)
          if (usMatch) {
            let hours = Number.parseInt(usMatch[4])
            if (usMatch[6] === "PM" && hours !== 12) hours += 12
            if (usMatch[6] === "AM" && hours === 12) hours = 0

            parsedDate = new Date(
              Number.parseInt(usMatch[3]),
              Number.parseInt(usMatch[1]) - 1,
              Number.parseInt(usMatch[2]),
              hours,
              Number.parseInt(usMatch[5]),
              Number.parseInt(usMatch[6]),
            )
            break
          }
        }
      } catch (error) {
        continue
      }
    }

    if (!parsedDate || isNaN(parsedDate.getTime())) {
      // Fallback to current date if parsing fails
      parsedDate = new Date()
    }

    setEditingTimestamp({
      originalText: selectedText,
      date: parsedDate,
      startPos,
      endPos,
    })
  }

  // Update timestamp after editing
  const handleTimestampUpdate = (date: Date) => {
    if (!editingTimestamp) return

    const currentFormat =
      timestampFormats.find((fmt) => fmt.id === timestampFormat)?.format || timestampFormats[0].format
    const formattedTime = format(date, currentFormat)
    const newTimestamp = `[${formattedTime}]`

    // Replace the old timestamp with the new one
    const beforeTimestamp = notes.substring(0, editingTimestamp.startPos)
    const afterTimestamp = notes.substring(editingTimestamp.endPos)
    const newNotes = beforeTimestamp + newTimestamp + afterTimestamp

    setNotes(newNotes)
    setEditingTimestamp(null)

    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }, 0)
  }

  // Copy notes to clipboard
  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(notes)
      .then(() => {
        setCopySuccess(true)
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err)
      })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-4 md:p-8">
      <div className="max-w-4xl w-full mx-auto bg-white rounded-lg shadow-md p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Timestamp Notes</h1>

        {/* Timestamp Format Selector */}
        <div className="mb-4">
          <label htmlFor="format-selector" className="block text-sm font-medium text-gray-700 mb-1">
            Timestamp Format
          </label>
          <select
            id="format-selector"
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={timestampFormat}
            onChange={(e) => setTimestampFormat(e.target.value)}
          >
            {timestampFormats.map((fmt) => (
              <option key={fmt.id} value={fmt.id}>
                {fmt.label} ({format(new Date(), fmt.format)})
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
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Start typing your notes here... Press Shift+Enter to insert a timestamp."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={editSelectedTimestamp}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Selected Timestamp
          </button>

          <button
            onClick={copyToClipboard}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Copy className="w-4 h-4 mr-2" />
            {copySuccess ? "Copied!" : "Copy Notes"}
          </button>
        </div>
      </div>

      {/* Date Picker Modal for Editing Timestamps */}
      {editingTimestamp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Edit Timestamp</h3>
            <p className="text-sm text-gray-600 mb-4">
              Original: <code className="bg-gray-100 px-1 rounded">{editingTimestamp.originalText}</code>
            </p>
            <DatePicker
              selected={editingTimestamp.date}
              onChange={(date: Date) => handleTimestampUpdate(date)}
              showTimeInput
              dateFormat="yyyy-MM-dd HH:mm:ss"
              inline
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditingTimestamp(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleTimestampUpdate(editingTimestamp.date)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
