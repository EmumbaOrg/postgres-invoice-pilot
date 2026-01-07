import { Card, Row, Col, Dropdown } from "react-bootstrap";
import { formatFileSize } from "../../utils/common-functions";
import "./activity-tile.css";

export default function ActivityTile({
  icon,
  title,
  timestamp,
  fileSize,
  showMenu = false,
  onMenuAction = () => {},
}) {
  return (
    <Card className="border-1 shadow-sm tile-outer">
      <Card.Body className="py-3 px-4">
        <Row className="align-items-center gap-4">
          <Col xs="auto" className="icon-bg">
            <div className="text-primary fs-4">{icon}</div>
          </Col>
          <Col className="flex-grow-1 min-width-0">
            <div className="fw-bold text-dark mb-1 text-truncate">{title}</div>
            <div className="text-muted small">
              {timestamp}
              {fileSize && (
                <>
                  <span className="mx-2">|</span>
                  {formatFileSize(fileSize)}
                </>
              )}
            </div>
          </Col>
          {showMenu && (
            <Col xs="auto" className="flex-shrink-0">
              <Dropdown>
                <Dropdown.Toggle
                  variant="outline-primary"
                  size="sm"
                  id={`dropdown-menu`}
                  className="border-0"
                >
                  <i className="fas fa-ellipsis-v"></i>
                </Dropdown.Toggle>
                <Dropdown.Menu align="end">
                  <Dropdown.Item
                    onClick={() => onMenuAction("view")}
                    className="d-flex align-items-center gap-1"
                  >
                    <i
                      className="fas fa-eye me-2"
                      style={{ color: "var(--bs-primary)" }}
                    ></i>
                    View
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => onMenuAction("download")}
                    className="d-flex align-items-center gap-1"
                  >
                    <i
                      className="fas fa-download me-2"
                      style={{ color: "var(--bs-primary)" }}
                    ></i>
                    Download
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item
                    onClick={() => onMenuAction("delete")}
                    className="text-danger d-flex align-items-center gap-1"
                  >
                    <i
                      className="fas fa-trash me-2"
                      style={{ color: "var(--bs-danger)" }}
                    ></i>
                    Delete
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Col>
          )}
        </Row>
      </Card.Body>
    </Card>
  );
}
