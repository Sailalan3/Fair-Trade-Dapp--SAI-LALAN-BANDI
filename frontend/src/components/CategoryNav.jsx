import React from "react";
import { CATEGORIES } from "../utils/store";

export default function CategoryNav({ selected, onSelect }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-1.5 flex gap-1 overflow-x-auto">
      <button
        onClick={() => onSelect(null)}
        className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
          !selected
            ? "bg-gray-900 text-white shadow-sm"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
        }`}
      >
        {"\u{1F4E6}"} All Products
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
            selected === cat.id
              ? "bg-[#2a7c7c] text-white shadow-sm"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
          }`}
        >
          {cat.emoji} {cat.label}
        </button>
      ))}
    </div>
  );
}
