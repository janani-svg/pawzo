"use client";

// Simplified weekday-only calendar (Mon–Fri) matching Figma
const WEEKS = [
  [1, 2, 3, 4, 5],
  [8, 9, 10, 11, 12],
  [15, 16, 17, 18, 19],
  [22, 23, 24, 25, 26],
];

const TODAY = 15;

export default function CalendarBlock() {
  return (
    <div
      style={{
        background: "#C8E4FF",
        borderRadius: "18px",
        padding: "14px 12px",
        flex: 1,
      }}
    >
      <h3
        style={{
          fontSize: "16px",
          fontWeight: 800,
          color: "#1A5276",
          margin: "0 0 10px",
        }}
      >
        Calendar
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {WEEKS.map((week, wi) => (
          <div
            key={wi}
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            {week.map((day) => (
              <div
                key={day}
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  background: day === TODAY ? "#1E2D4F" : "transparent",
                  color: day === TODAY ? "white" : "#1a2a4a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: day === TODAY ? 700 : 400,
                }}
              >
                {day}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
