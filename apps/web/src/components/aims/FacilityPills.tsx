type FacilityPillsProps = {
  facilities: string[];
  value: string;
  onChange: (facility: string) => void;
  includeAll?: boolean;
};

export function FacilityPills({
  facilities,
  value,
  onChange,
  includeAll = true,
}: FacilityPillsProps) {
  const options = includeAll ? ["", ...facilities] : facilities;
  return (
    <div className="facility-pills" role="group" aria-label="Facility">
      {options.map((code) => {
        const label = code === "" ? "All" : code;
        const pressed = value === code;
        return (
          <button
            key={label}
            type="button"
            className={`facility-pill${pressed ? " is-active" : ""}`}
            aria-pressed={pressed}
            onClick={() => onChange(code)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
