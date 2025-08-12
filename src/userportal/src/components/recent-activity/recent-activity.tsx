import { Container, Row, Col } from "react-bootstrap";
import ActivityTile from "../activity-tile/activity-tile";
import "./recent-activity.css";

export default function RecentActivity() {
  // Document icon component
  const DocumentIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
    </svg>
  );

  // Sample data for Recent Activity
  const recentActivities = [
    {
      title: 'Vendor "Ralph Advertisements.co" is added',
      timestamp: "07 Oct, 2025 04:30:23",
    },
    {
      title:
        'A new invoice "1/invoices/Invoice LP 2024 001.pdf" is uploaded for the "ABC Company" vendor',
      timestamp: "07 Oct, 2025 04:30:23",
    },
    {
      title:
        'Sow "3/sows/Statement_of_Work_Lucerne_Publishing_Woodgrove_Bank_20241201.pdf" is updated',
      timestamp: "07 Oct, 2025 04:30:23",
    },
  ];

  // Sample data for Recent Documents
  const recentDocuments = [
    {
      title: "2/invoices/INV-TR2024-002.pdf",
      timestamp: "07 Oct, 2025 04:30:23",
      fileSize: "1.87 KB",
    },
    {
      title: "1/invoices/Invoice LP 2024 001.pdf",
      timestamp: "07 Oct, 2025 04:30:23",
      fileSize: "8.27 KB",
    },
    {
      title: "3/sows/Statement_of_Work_Lucerne_Publis...pdf",
      timestamp: "07 Oct, 2025 04:30:23",
      fileSize: "3.88 KB",
    },
  ];

  const handleMenuAction = (action: string, document: string) => {
    console.log(`${action} action for ${document}`);
  };

  return (
    <Container fluid className="p-4 section-wrapper">
      <Row className="gap-5">
        {/* Left Section - Recent Activity */}
        <Col lg={6}>
          <div className="mb-4">
            <h3 className="fw-bold text-dark mb-2">Recent Activity</h3>
            <p className="text-muted">Some description text goes here</p>
          </div>
          <div>
            {recentActivities.map((activity, index) => (
              <ActivityTile
                key={index}
                icon={<i className="fa-solid fa-file-invoice"></i>}
                title={activity.title}
                timestamp={activity.timestamp}
                showMenu={false}
              />
            ))}
          </div>
        </Col>

        {/* Right Section - Recent Documents */}
        <Col lg={5}>
          <div className="mb-4">
            <h3 className="fw-bold text-dark mb-2">Recent Documents</h3>
            <p className="text-muted">Some description text goes here</p>
          </div>
          <div>
            {recentDocuments.map((document, index) => (
              <ActivityTile
                key={index}
                icon={<i className="fa-solid fa-file-invoice"></i>}
                title={document.title}
                timestamp={document.timestamp}
                fileSize={document.fileSize}
                showMenu={true}
                onMenuAction={(action) =>
                  handleMenuAction(action, document.title)
                }
              />
            ))}
          </div>
        </Col>
      </Row>
    </Container>
  );
}
