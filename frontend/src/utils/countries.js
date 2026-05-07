// Country list with phone codes for dropdowns
export const COUNTRIES = [
  { code: "US", name: "United States", phone: "+1" },
  { code: "GB", name: "United Kingdom", phone: "+44" },
  { code: "IN", name: "India", phone: "+91" },
  { code: "CN", name: "China", phone: "+86" },
  { code: "JP", name: "Japan", phone: "+81" },
  { code: "DE", name: "Germany", phone: "+49" },
  { code: "FR", name: "France", phone: "+33" },
  { code: "BR", name: "Brazil", phone: "+55" },
  { code: "AU", name: "Australia", phone: "+61" },
  { code: "CA", name: "Canada", phone: "+1" },
  { code: "IT", name: "Italy", phone: "+39" },
  { code: "ES", name: "Spain", phone: "+34" },
  { code: "MX", name: "Mexico", phone: "+52" },
  { code: "KR", name: "South Korea", phone: "+82" },
  { code: "ID", name: "Indonesia", phone: "+62" },
  { code: "TR", name: "Turkey", phone: "+90" },
  { code: "SA", name: "Saudi Arabia", phone: "+966" },
  { code: "ZA", name: "South Africa", phone: "+27" },
  { code: "AE", name: "United Arab Emirates", phone: "+971" },
  { code: "NL", name: "Netherlands", phone: "+31" },
  { code: "CH", name: "Switzerland", phone: "+41" },
  { code: "SE", name: "Sweden", phone: "+46" },
  { code: "PL", name: "Poland", phone: "+48" },
  { code: "BE", name: "Belgium", phone: "+32" },
  { code: "AT", name: "Austria", phone: "+43" },
  { code: "NO", name: "Norway", phone: "+47" },
  { code: "DK", name: "Denmark", phone: "+45" },
  { code: "FI", name: "Finland", phone: "+358" },
  { code: "IE", name: "Ireland", phone: "+353" },
  { code: "PT", name: "Portugal", phone: "+351" },
  { code: "GR", name: "Greece", phone: "+30" },
  { code: "NZ", name: "New Zealand", phone: "+64" },
  { code: "SG", name: "Singapore", phone: "+65" },
  { code: "MY", name: "Malaysia", phone: "+60" },
  { code: "TH", name: "Thailand", phone: "+66" },
  { code: "PH", name: "Philippines", phone: "+63" },
  { code: "VN", name: "Vietnam", phone: "+84" },
  { code: "PK", name: "Pakistan", phone: "+92" },
  { code: "BD", name: "Bangladesh", phone: "+880" },
  { code: "LK", name: "Sri Lanka", phone: "+94" },
  { code: "NG", name: "Nigeria", phone: "+234" },
  { code: "KE", name: "Kenya", phone: "+254" },
  { code: "GH", name: "Ghana", phone: "+233" },
  { code: "ET", name: "Ethiopia", phone: "+251" },
  { code: "TZ", name: "Tanzania", phone: "+255" },
  { code: "UG", name: "Uganda", phone: "+256" },
  { code: "EG", name: "Egypt", phone: "+20" },
  { code: "MA", name: "Morocco", phone: "+212" },
  { code: "CO", name: "Colombia", phone: "+57" },
  { code: "PE", name: "Peru", phone: "+51" },
  { code: "CL", name: "Chile", phone: "+56" },
  { code: "AR", name: "Argentina", phone: "+54" },
  { code: "CR", name: "Costa Rica", phone: "+506" },
  { code: "GT", name: "Guatemala", phone: "+502" },
  { code: "HN", name: "Honduras", phone: "+504" },
  { code: "RW", name: "Rwanda", phone: "+250" },
  { code: "CI", name: "Ivory Coast", phone: "+225" },
].sort((a, b) => a.name.localeCompare(b.name));

export function getCountryByCode(code) {
  return COUNTRIES.find((c) => c.code === code);
}

export function getPhonePrefixes() {
  const seen = new Set();
  return COUNTRIES.filter((c) => {
    if (seen.has(c.phone)) return false;
    seen.add(c.phone);
    return true;
  }).sort((a, b) => a.phone.localeCompare(b.phone));
}
