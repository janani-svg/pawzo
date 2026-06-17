"use client";

import { useState } from "react";
import { Check, X, Plus } from "lucide-react";

interface Task {
  id: string;
  text: string;
  done: boolean;
}

const initialTasks: Task[] = [
  { id: "1", text: "Morning walk with Buddy", done: false },
  { id: "2", text: "Vet appointment - Whiskers", done: true },
];

export default function TodaysSchedule() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [input, setInput] = useState("");

  const toggle = (id: string) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );

  const remove = (id: string) =>
    setTasks((prev) => prev.filter((t) => t.id !== id));

  const addTask = () => {
    const text = input.trim();
    if (!text) return;
    setTasks((prev) => [
      ...prev,
      { id: Date.now().toString(), text, done: false },
    ]);
    setInput("");
  };

  return (
    <section
      style={{
        background: "white",
        borderRadius: "20px",
        margin: "0 16px 100px",
        padding: "18px 16px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
      }}
    >
      <h3
        style={{
          fontSize: "18px",
          fontWeight: 800,
          color: "#1a1a2e",
          margin: "0 0 14px",
        }}
      >
        Today&apos;s Schedule
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {tasks.map((task) => (
          <div
            key={task.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              background: task.done ? "#FFF9E0" : "white",
              border: "1.5px solid #e8e8e8",
              borderRadius: "10px",
            }}
          >
            <button
              onClick={() => toggle(task.id)}
              style={{
                width: "18px",
                height: "18px",
                border: `2px solid ${task.done ? "#4CAF50" : "#ccc"}`,
                background: task.done ? "#4CAF50" : "transparent",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                padding: 0,
              }}
            >
              {task.done && <Check size={10} color="white" strokeWidth={3} />}
            </button>

            <span
              style={{
                flex: 1,
                fontSize: "14px",
                color: task.done ? "#aaa" : "#1a1a2e",
                textDecoration: task.done ? "line-through" : "none",
              }}
            >
              {task.text}
            </span>

            <button
              onClick={() => remove(task.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#ccc",
                padding: "0",
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Add task row */}
      <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="Add a task..."
          style={{
            flex: 1,
            padding: "10px 12px",
            border: "1.5px solid #e8e8e8",
            borderRadius: "10px",
            fontSize: "14px",
            outline: "none",
            background: "white",
          }}
        />
        <button
          onClick={addTask}
          style={{
            padding: "10px 14px",
            background: "#FF8C42",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <Plus size={14} />
          Add task
        </button>
      </div>
    </section>
  );
}
