import gantraLogo from "../assets/gantra-logo (2).png";

export default function GantraLogo({
  size = "md",
  clickable = false,
  onClick,
  className = "",
}) {
  const heights = {
    sm: "36px",
    md: "48px",
    lg: "64px",
    xl: "84px",
  };

  const content = (
    <img
      src={gantraLogo}
      alt="GANTRA"
      style={{
        height: heights[size] || heights.md,
        width: "auto",
        objectFit: "contain",
        display: "block",
      }}
      className={className}
    />
  );

  if (clickable) {
    return (
      <button
        onClick={onClick}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        {content}
      </button>
    );
  }

  return content;
}