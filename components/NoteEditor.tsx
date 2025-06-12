import { useRef, useState, type KeyboardEvent } from "react";
import { Copy } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";

export interface NoteEditorProps {
  notes: string;
  setNotes: (notes: string) => void;
  selectedTimezone: string;
}

export function NoteEditor({
  notes,
  setNotes,
  selectedTimezone,
}: NoteEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      insertTimestamp();
    }
  };

  // Copy notes to clipboard (without the ISO data)
  const copyToClipboard = () => {
    const cleanNotes = notes.replace(
      /\[(.*?)\|(.*?)\]/g,
      (match, formattedTime) => `[${formattedTime}]`
    );
    navigator.clipboard.writeText(cleanNotes).then(() => setCopySuccess(true));
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const insertTimestamp = () => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPosition = textarea.selectionStart;
    const now = new Date();
    const formattedTime = formatInTimeZone(
      now,
      selectedTimezone,
      "yyyy-MM-dd HH:mm:ss OOOO"
    );
    const isoTime = now.toISOString();
    const timestampText = `[${formattedTime}|${isoTime}]`;
    const newNotes = `${notes.substring(
      0,
      cursorPosition
    )}${timestampText}${notes.substring(textarea.selectionEnd)}`;
    setNotes(newNotes);
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPosition = cursorPosition + timestampText.length;
        textareaRef.current.setSelectionRange(
          newCursorPosition,
          newCursorPosition
        );
        textareaRef.current.focus();
      }
    }, 0);
  };

  return (
    <>
      <div className="flex-grow mb-4">
        <label
          htmlFor="note-editor"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
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

      <div className="flex justify-end items-center">
        <button
          onClick={copyToClipboard}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Copy className="w-4 h-4 mr-2" />
          {copySuccess ? "Copied!" : "Copy Notes"}
        </button>
      </div>
    </>
  );
}
