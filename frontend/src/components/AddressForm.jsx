import React from "react";
import { COUNTRIES } from "../utils/countries";

export default function AddressForm({ address, onChange }) {
  const update = (field, value) => {
    onChange({ ...address, [field]: value });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Address Line 1 *</label>
        <input value={address.line1 || ""} onChange={(e) => update("line1", e.target.value)}
          placeholder="Street address, P.O. box"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/20 focus:border-[#2a7c7c]" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Address Line 2</label>
        <input value={address.line2 || ""} onChange={(e) => update("line2", e.target.value)}
          placeholder="Apartment, suite, unit (optional)"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/20 focus:border-[#2a7c7c]" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Country *</label>
          <select value={address.country || ""} onChange={(e) => update("country", e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/20 focus:border-[#2a7c7c] bg-white">
            <option value="">Select country</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">State / Region</label>
          <input value={address.state || ""} onChange={(e) => update("state", e.target.value)}
            placeholder="State or region"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/20 focus:border-[#2a7c7c]" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">City *</label>
          <input value={address.city || ""} onChange={(e) => update("city", e.target.value)}
            placeholder="City"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/20 focus:border-[#2a7c7c]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Postal Code</label>
          <input value={address.postalCode || ""} onChange={(e) => update("postalCode", e.target.value)}
            placeholder="Postal code"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/20 focus:border-[#2a7c7c]" />
        </div>
      </div>
    </div>
  );
}

export function formatAddress(address) {
  if (!address) return "";
  if (typeof address === "string") return address;
  const parts = [address.line1, address.line2, address.city, address.state, address.postalCode, address.country].filter(Boolean);
  return parts.join(", ");
}
