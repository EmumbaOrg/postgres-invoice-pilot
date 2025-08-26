import { Badge } from "react-bootstrap";

const statusColors = {
  "In Review": { bg: "#eef4ff", text: "#1a73e8" },
  "Pending": { bg: "#fff4e5", text: "#b36b00" },
  "Paid": { bg: "#edf7ed", text: "#1e7d1e" },
  "Failed": { bg: "#fdecea", text: "#d93025" },
  "Success": { bg: "#e6f4ea", text: "#188038" }
};

const StatusChip = ({ status }) => {
  const { bg, text } = statusColors[status] || { bg: "#e0e0e0", text: "#333" }; // default grey
  return (
    <Badge
        bg=""
      style={{
        backgroundColor: bg,
        color: text,
        borderRadius: "50px",
        padding: "0.4rem 0.8rem",
        fontWeight: 500
      }}
    >
      {status}
    </Badge>
  );
};

export default StatusChip;
