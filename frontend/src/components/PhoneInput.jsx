import React from "react";
import { COUNTRIES } from "../utils/countries";

const PHONE_CODES = (() => {
  const seen = new Set();
  return COUNTRIES.filter((c) => {
    if (seen.has(c.phone)) return false;
    seen.add(c.phone);
    return true;
  }).sort((a, b) => {
    const numA = parseInt(a.phone.replace("+", ""));
    const numB = parseInt(b.phone.replace("+", ""));
    return numA - numB;
  });
})();

export default function PhoneInput({ phone, onChange }) {
  const update = (field, value) => {
    onChange({ ...phone, [field]: value });
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">Mobile Number *</label>
      <div className="flex gap-2">
        <select value={phone.countryCode || "+1"} onChange={(e) => update("countryCode", e.target.value)}
          className="w-28 px-2 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/20 focus:border-[#2a7c7c] bg-white">
          {PHONE_CODES.map((c) => (
            <option key={`${c.code}-${c.phone}`} value={c.phone}>{c.phone} {c.code}</option>
          ))}
        </select>
        <input type="tel" value={phone.number || ""} onChange={(e) => update("number", e.target.value)}
          placeholder="Phone number"
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/20 focus:border-[#2a7c7c]" />
      </div>
    </div>
  );
}

export function formatPhone(phone) {
  if (!phone) return "";
  if (typeof phone === "string") return phone;
  return `${phone.countryCode || ""} ${phone.number || ""}`.trim();
}
