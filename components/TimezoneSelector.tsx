import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

export interface TimezoneSelectorProps {
  selectedTimezone: string;
  setSelectedTimezone: (timezone: string) => void;
}

export function TimezoneSelector({
  selectedTimezone,
  setSelectedTimezone,
}: TimezoneSelectorProps) {
  const timezoneDropdownRef = useRef<HTMLDivElement>(null);
  const timezoneSearchRef = useRef<HTMLInputElement>(null);

  // Timezone search states
  const [isTimezoneDropdownOpen, setIsTimezoneDropdownOpen] = useState(false);
  const [timezoneSearchQuery, setTimezoneSearchQuery] = useState("");
  const [timezones, setTimezones] = useState<
    Array<{ value: string; label: string; offset: number }>
  >([]);

  // Derived state for filtered timezones
  const filteredTimezones =
    timezoneSearchQuery.trim() === ""
      ? timezones
      : timezones.filter((tz) => {
          const query = timezoneSearchQuery.toLowerCase();
          return (
            tz.value.toLowerCase().includes(query) ||
            tz.label.toLowerCase().includes(query)
          );
        });

  // Load available timezones with GMT offsets
  useEffect(() => {
    try {
      const supportedTimezones = Intl.supportedValuesOf("timeZone");

      const timezonesWithOffsets = supportedTimezones.map((tz) => {
        const { offset, formatted } = getGMTOffset(tz);
        return { value: tz, label: `${tz} (${formatted})`, offset: offset };
      });

      timezonesWithOffsets.sort((a, b) => a.offset - b.offset);
      setTimezones(timezonesWithOffsets);
    } catch (error) {
      console.error("Error loading timezones:", error);
      setTimezones(getFallbackTimezones());
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        timezoneDropdownRef.current &&
        !timezoneDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTimezoneDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleTimezoneSelect = (timezone: string) => {
    setSelectedTimezone(timezone);
    setIsTimezoneDropdownOpen(false);
    setTimezoneSearchQuery("");
  };

  const selectedTimezoneLabel =
    timezones.find((tz) => tz.value === selectedTimezone)?.label ||
    selectedTimezone;

  return (
    <div className="mb-4">
      <label
        htmlFor="timezone-selector"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Display Timezone
      </label>
      <div ref={timezoneDropdownRef} className="relative">
        <button
          id="timezone-selector"
          type="button"
          className="w-full md:w-96 text-left bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex justify-between items-center"
          onClick={() => {
            setIsTimezoneDropdownOpen(!isTimezoneDropdownOpen);
            if (!isTimezoneDropdownOpen) {
              setTimeout(() => timezoneSearchRef.current?.focus(), 100);
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
                      selectedTimezone === tz.value
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-900"
                    }`}
                    onClick={() => handleTimezoneSelect(tz.value)}
                  >
                    <div className="truncate">{tz.label}</div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-500 text-center">
                  No timezones found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Press Shift+Enter to insert timestamp at cursor position
      </p>
    </div>
  );
}

// Helper function to get GMT offset for a timezone
const getGMTOffset = (
  timezone: string
): { offset: number; formatted: string } => {
  const date = new Date();
  const targetFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const utcFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const targetTime = targetFormatter.format(date);
  const utcTime = utcFormatter.format(date);
  const targetDate = new Date(
    targetTime.replace(
      /(\d{4})-(\d{2})-(\d{2}), (\d{2}):(\d{2}):(\d{2})/,
      "$1-$2-$3T$4:$5:$6"
    )
  );
  const utcDate = new Date(
    utcTime.replace(
      /(\d{4})-(\d{2})-(\d{2}), (\d{2}):(\d{2}):(\d{2})/,
      "$1-$2-$3T$4:$5:$6"
    )
  );
  const offsetMinutes =
    (targetDate.getTime() - utcDate.getTime()) / (1000 * 60);
  const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
  const offsetMins = Math.abs(offsetMinutes) % 60;
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const formatted = `GMT${sign}${offsetHours
    .toString()
    .padStart(2, "0")}:${offsetMins.toString().padStart(2, "0")}`;
  return { offset: offsetMinutes, formatted };
};

// Fallback timezones in case Intl.supportedValuesOf fails
const getFallbackTimezones = () => [
  {
    value: "Pacific/Midway",
    label: "Pacific/Midway (GMT-11:00)",
    offset: -660,
  },
  {
    value: "America/Los_Angeles",
    label: "America/Los_Angeles (GMT-08:00)",
    offset: -480,
  },
  {
    value: "America/Denver",
    label: "America/Denver (GMT-07:00)",
    offset: -420,
  },
  {
    value: "America/Chicago",
    label: "America/Chicago (GMT-06:00)",
    offset: -360,
  },
  {
    value: "America/New_York",
    label: "America/New_York (GMT-05:00)",
    offset: -300,
  },
  { value: "UTC", label: "UTC (GMT+00:00)", offset: 0 },
  {
    value: "Europe/London",
    label: "Europe/London (GMT+00:00)",
    offset: 0,
  },
  {
    value: "Europe/Paris",
    label: "Europe/Paris (GMT+01:00)",
    offset: 60,
  },
  {
    value: "Europe/Moscow",
    label: "Europe/Moscow (GMT+03:00)",
    offset: 180,
  },
  {
    value: "Asia/Kolkata",
    label: "Asia/Kolkata (GMT+05:30)",
    offset: 330,
  },
  {
    value: "Asia/Shanghai",
    label: "Asia/Shanghai (GMT+08:00)",
    offset: 480,
  },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (GMT+09:00)", offset: 540 },
  {
    value: "Australia/Sydney",
    label: "Australia/Sydney (GMT+10:00)",
    offset: 600,
  },
  {
    value: "Pacific/Auckland",
    label: "Pacific/Auckland (GMT+12:00)",
    offset: 720,
  },
];
