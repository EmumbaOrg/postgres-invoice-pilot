/* File to create, set up extensions, create tables, and load sample data */

/* Create extensions */
CREATE EXTENSION IF NOT EXISTS azure_ai;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_diskann;
CREATE EXTENSION IF NOT EXISTS age;


/* Azure AI extension settings */
SELECT azure_ai.set_setting('azure_openai.endpoint', '${OPENAI_ENDPOINT}');
SELECT azure_ai.set_setting('azure_openai.subscription_key', '${OPENAI_KEY}');

SELECT azure_ai.set_setting('azure_cognitive.endpoint', '${LANGUAGE_ENDPOINT}');
SELECT azure_ai.set_setting('azure_cognitive.subscription_key', '${LANGUAGE_KEY}');

/* End Azure AI Extension Settings */

/* VENDORS */

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
    id BIGSERIAL PRIMARY KEY,
    name text NOT NULL,
    address text NOT NULL,
    contact_name text NOT NULL,
    contact_email text NOT NULL,
    contact_phone text NOT NULL,
    website text NOT NULL,
    type text NOT NULL
);

-- Insert vendors only if vendors table is empty
INSERT INTO vendors (id, name, address, contact_name, contact_email, contact_phone, website, type)
SELECT v.id, v.name, v.address, v.contact_name, v.contact_email, v.contact_phone, v.website, v.type
FROM (
    SELECT 1 as id, 'Adatum Corporation' as name, '789 Goldsmith Road, MainTown City' as address, 'Elizabeth Moore' as contact_name, 'elizabeth.moore@adatum.com' as contact_email, '555-789-7890' as contact_phone, 'http://www.adatum.com' as website, 'Data Engineering' as type
    UNION ALL
    SELECT 2, 'Trey Research', '456 Research Avenue, Redmond', 'Serena Davis', 'serena.davis@treyresearch.net', '555-867-5309', 'http://www.treyresearch.net', 'DevOps'
    UNION ALL
    SELECT 3, 'Lucerne Publishing', '789 Live Street, Woodgrove', 'Ana Bowman', 'abowman@lucernepublishing.com', '555-654-9870', 'http://www.lucernepublishing.com', 'Graphic Design'
    UNION ALL
    SELECT 4, 'VanArsdel, Ltd.', '123 Innovation Drive, TechVille', 'Gabriel Diaz', 'gdiaz@vanarsdelltd.com', '555-321-0987', 'http://www.vanarsdelltd.com', 'Software Engineering'
    UNION ALL
    SELECT 5, 'Contoso, Ltd.', '456 Industrial Road, Scooton City', 'Nicole Wagner', 'nicole@contoso.com', '555-654-3210', 'http://www.contoso.com', 'Software Engineering'
    UNION ALL
    SELECT 6, 'Fabrikam, Inc.', '24601 South St., Philadelphia', 'Remy Morris', 'remy.morris@fabrikam.com', '610-321-0987', 'http://www.fabrikam.com', 'AI Services'
    UNION ALL
    SELECT 7, 'The Phone Company', '10642 Meridian St., Indianapolis', 'Ashley Schroeder', 'ashley.schroeder@thephone-company.com', '719-444-2345', 'http://www.thephone-company.com', 'Communications'
) as v
WHERE NOT EXISTS (SELECT 1 FROM vendors);

CREATE SEQUENCE IF NOT EXISTS vendors_id_seq;
SELECT setval('vendors_id_seq', COALESCE((SELECT MAX(id) FROM vendors), 1) + 1);
ALTER TABLE vendors ALTER COLUMN id SET DEFAULT nextval('vendors_id_seq');

/* END VENDORS */

/* STATUS */

-- Status table
DROP TABLE IF EXISTS status;
CREATE TABLE IF NOT EXISTS status (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT
);

-- Insert status values
INSERT INTO status (id, name, description) VALUES (1, 'Pending', 'Awaiting action');
INSERT INTO status (id, name, description) VALUES (2, 'In Progress', 'In progress');
INSERT INTO status (id, name, description) VALUES (3, 'In Review', 'Review is required');
INSERT INTO status (id, name, description) VALUES (4, 'Cancelled', 'The process was stopped');
INSERT INTO status (id, name, description) VALUES (5, 'Overdue', 'The invoice has passed the due date without payment');
INSERT INTO status (id, name, description) VALUES (6, 'Paid', 'The invoice has been fully paid');
INSERT INTO status (id, name, description) VALUES (7, 'Completed', 'Work has been finished');

CREATE SEQUENCE IF NOT EXISTS status_id_seq;
SELECT setval('status_id_seq', COALESCE((SELECT MAX(id) FROM status), 1) + 1);
ALTER TABLE status ALTER COLUMN id SET DEFAULT nextval('status_id_seq');

/* END STATUS */

/* SOWs */

-- Statement of work table
CREATE TABLE IF NOT EXISTS sows (
    id BIGSERIAL PRIMARY KEY,
    number text NOT NULL,
    vendor_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget DECIMAL(18,2) NOT NULL,
    document text NOT NULL,
    metadata JSONB, --  additional metadata
    summary text,
    embedding vector(1536),
    FOREIGN KEY (vendor_id) REFERENCES vendors (id) ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION sows_insert_trigger_fn()
RETURNS trigger AS $$
BEGIN
  IF NEW.metadata IS NOT NULL THEN
    NEW.embedding := azure_openai.create_embeddings('embeddings', NEW.metadata::text, throw_on_error => FALSE, max_attempts => 5, retry_delay_ms => 2000);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- setup INSERT TRIGGER to call function
CREATE TRIGGER sows_insert_trigger
BEFORE INSERT ON sows
FOR EACH ROW
EXECUTE FUNCTION sows_insert_trigger_fn();

-- Insert sow values only if the specific sow number does not exist
INSERT INTO sows (number, vendor_id, start_date, end_date, budget, document, metadata, summary)
SELECT 'SOW-2024-073',
       1,
       '2024-11-01',
       '2025-12-31',
       43600.00,
       '1/sows/Statement_of_Work_Adatum_Corporation_Invoice_Pilot_20241101.pdf',
       '{
  "Project_Name": "Optimization of Azure Resources",
  "Effective_Date": "2024-11-01",
  "Project_Completion_Date": "2024-12-31",
  "SOW_Number": "SOW-2024-073",
  "Project_Scope": "Adatum Corporation will provide comprehensive Azure resource management services, including infrastructure monitoring, automated scaling, cost optimization, and application troubleshooting, to ensure high availability and efficiency for Invoice Pilot.",
  "Project_Objectives": [
    "Ensure the continuous performance and scalability of Azure resources.",
    "Implement cost-efficient resource management strategies.",
    "Minimize downtime through proactive monitoring and rapid troubleshooting.",
    "Provide detailed reporting and analysis of resource usage and performance metrics.",
    "Collaborate with Invoice Pilot."
  ],
  "Tasks": [
    "Set up Azure resource monitoring tools.",
    "Design and implement automated scaling strategies.",
    "Conduct cost analysis and apply optimization measures.",
    "Perform regular maintenance on Azure-hosted applications.",
    "Troubleshoot and resolve any application or resource issues."
  ],
  "Schedules": [
    {"Milestone_Name": "Project kick-off", "Milestone_Completion_Due_Date": "2024-11-01"},
    {"Milestone_Name": "Initial monitoring setup", "Milestone_Completion_Due_Date": "2024-11-08"},
    {"Milestone_Name": "Scaling implementation", "Milestone_Completion_Due_Date": "2024-11-15"},
    {"Milestone_Name": "Cost optimization review", "Milestone_Completion_Due_Date": "2024-11-22"},
    {"Milestone_Name": "Maintenance practices established", "Milestone_Completion_Due_Date": "2024-12-13"},
    {"Milestone_Name": "Final troubleshooting and wrap-up", "Milestone_Completion_Due_Date": "2024-12-31"}
  ],
  "Requirements": [
    "Access to Invoice Pilot''s Azure environment and necessary credentials.",
    "Active collaboration from Invoice Pilot''s IT team for resource planning and feedback.",
    "Approval of milestone completion before moving to subsequent phases."
  ],
  "Payments": {
    "terms": "Net 30",
    "penalty": "10% for late deliveries or payments"
  },
  "Compliance": {
    "Data Security": "All data transfers between the Service Provider and Client will use secure, encrypted communication protocols. Data at rest will be encrypted using industry-standard encryption algorithms (e.g., AES-256).",
    "Access Control": "Access to the Azure resources and sensitive client information will be granted only to authorized personnel.",
    "Multi-factor authentication (MFA)": "will be enforced for all administrative access.",
    "Audit and Monitoring": "Adatum Corporation will maintain comprehensive logs of all access and changes to Azure resources. Regular audits will be conducted to ensure compliance with security protocols.",
    "Incident Response": "In the event of a security incident, the Service Provider will notify the Client within 24 hours. A detailed incident report will be provided within 48 hours, outlining the root cause, impact, and mitigation steps.",
    "Regulatory Compliance": "The project will comply with applicable regulations, including GDPR, PCI DSS, and ISO 27001, as they pertain to the management of Azure resources."
  },
  "Project_Deliverables": [
    {"Milestone_Name": "Monitoring", "Deliverables": "Monitoring of resources", "Amount": "8600", "Milestone_Payment_Due_Date": "2024-12-08"},
    {"Milestone_Name": "Resource Scaling", "Deliverables": "Implementation of automated scaling", "Amount": "7000", "Milestone_Payment_Due_Date": "2024-12-08"},
    {"Milestone_Name": "Cost Management", "Deliverables": "Cost Management Implementation", "Amount": "7000", "Milestone_Payment_Due_Date": "2024-12-22"},
    {"Milestone_Name": "Maintenance Practices", "Deliverables": "Maintenance & troubleshooting practices", "Amount": "10500", "Milestone_Payment_Due_Date": "2024-12-27"},
    {"Milestone_Name": "App Troubleshooting", "Deliverables": "Identify Azure application issues", "Amount": "2000", "Milestone_Payment_Due_Date": "2024-12-27"},
    {"Milestone_Name": "App Troubleshooting", "Deliverables": "Resolution of Azure application issues", "Amount": "3500", "Milestone_Payment_Due_Date": "2025-01-31"},
    {"Milestone_Name": "App Troubleshooting", "Deliverables": "Implementation of app monitoring", "Amount": "5000", "Milestone_Payment_Due_Date": "2025-01-31"}
  ],
  "Total_Amount": "43600",
  "Signatures": {
    "Adatum Corporation": "Elizabeth Moore",
    "Invoice Pilot": "Chris Green"
  }
}',
'Adatum Corporation has been tasked with optimizing Azure resources for Invoice Pilot, with a focus on performance, scalability, cost efficiency, and minimal downtime. The project, effective November 1, 2024, aims to establish comprehensive monitoring, automate scaling, conduct cost optimization, and ensure robust troubleshooting for applications hosted on Azure. Deliverables include setting up monitoring tools, implementing scaling strategies, and applying cost-saving measures, with a final wrap-up by the end of 2024. Payments are structured with a penalty for late deliveries or payments, and strict compliance with data security, access control, auditing, incident response, and regulatory standards is mandatory. The total projected cost for all deliverables is $43,600, with a final deadline for all tasks and troubleshooting completed by early 2025 or shortly thereafter. The project involves close collaboration between Adatum Corporation and Invoice Pilot''s IT team, with necessary approvals required to progress through the phases.'
WHERE NOT EXISTS (SELECT 1 FROM sows WHERE number = 'SOW-2024-073');

INSERT INTO sows (number, vendor_id, start_date, end_date, budget, document, metadata, summary)
SELECT 'SOW-2024-038',
       2,
       '2024-05-01',
       '2025-08-31',
       60000.00,
       '2/sows/Statement_of_Work_Trey_Research_Invoice_Pilot_20241111.pdf',
       '{
  "Project_Name": "DevOps Implementation",
  "Effective_Date": "2024-05-01",
  "Project_Completion_Date": "2025-08-31",
  "SOW_Number": "SOW-2024-038",
  "Project_Scope": "Trey Research will provide comprehensive DevOps implementation services, including strategy and planning, CI/CD pipeline implementation, infrastructure as code, and security, monitoring, and optimization.",
  "Project_Objectives": [
    "Develop a comprehensive DevOps strategy and roadmap.",
    "Implement CI/CD pipelines for automated build and deployment.",
    "Implement infrastructure as code (IaC) for consistent and repeatable infrastructure management.",
    "Integrate security, monitoring, and optimization practices into the DevOps processes."
  ],
  "Tasks": [
    "DevOps Strategy & Planning",
    "CI/CD Pipeline Implementation",
    "Infrastructure as Code (IaC)",
    "Security, Monitoring & Optimization"
  ],
  "Schedules": [
    {"Milestone_Name": "Project kick-off", "Milestone_Completion_Due_Date": "2024-05-01"},
    {"Milestone_Name": "DevOps Strategy & Planning", "Milestone_Completion_Due_Date": "2024-05-15"},
    {"Milestone_Name": "CI/CD Pipeline Implementation", "Milestone_Completion_Due_Date": "2024-06-01"},
    {"Milestone_Name": "Infrastructure as Code (IaC)", "Milestone_Completion_Due_Date": "2024-09-01"},
    {"Milestone_Name": "Security, Monitoring & Optimization", "Milestone_Completion_Due_Date": "2024-12-01"}
  ],
  "Requirements": [
    "Access to existing infrastructure and systems.",
    "Collaboration with the IT team for planning and implementation.",
    "Approval of milestone completion before moving to subsequent phases."
  ],
  "Payments": {
    "terms": "Net 30",
    "penalty": "10% for late deliveries or payments"
  },
  "Compliance": {
    "Data_Security": "All data transfers between the Service Provider and Client will use secure, encrypted communication protocols. Data at rest will be encrypted using industry-standard encryption algorithms (e.g., AES-256).",
    "Access_Control": "Access to the infrastructure and sensitive client information will be granted only to authorized personnel.",
    "MFA": "Multi-factor authentication (MFA) will be enforced for all administrative access.",
    "Audit_and_Monitoring": "Trey Research will maintain comprehensive logs of all access and changes to the infrastructure. Regular audits will be conducted to ensure compliance with security protocols.",
    "Incident_Response": "In the event of a security incident, the Service Provider will notify the Client within 24 hours. A detailed incident report will be provided within 48 hours, outlining the root cause, impact, and mitigation steps.",
    "Regulatory_Compliance": "The project will comply with applicable regulations, including GDPR, PCI DSS, and ISO 27001, as they pertain to the management of infrastructure."
  },
  "Project_Deliverables": [
    {"Milestone_Name": "DevOps Strategy & Planning", "Deliverables": "DevOps Roadmap & Report, CI/CD Pipeline Design", "Amount": "10000", "Milestone_Payment_Due_Date": "2024-05-30"},
    {"Milestone_Name": "CI/CD Pipeline Implementation", "Deliverables": "Deployment Pipeline, Version Control Implementation, Branching Strategy", "Amount": "20000", "Milestone_Payment_Due_Date": "2024-06-28"},
    {"Milestone_Name": "Infrastructure as Code (IaC)", "Deliverables": "Infrastructure as Code Implementation, Containerization, Orchestration Setup", "Amount": "15000", "Milestone_Payment_Due_Date": "2024-09-15"},
    {"Milestone_Name": "Security, Monitoring & Optimization", "Deliverables": "Security & Compliance Integration, Monitoring & Logging Setup, Performance Optimization", "Amount": "15000", "Milestone_Payment_Due_Date": "2024-12-01"}
  ],
  "Total_Amount": "60000",
  "Signatures": {
    "Trey Research": "Serena Davis",
    "Invoice Pilot": "Chris Green"
  }
}',
'Trey Research has been tasked with implementing comprehensive DevOps services for a project commencing on May 1, 2024, with completion expected by the end of August 2025. The project''s objectives include developing a DevOps strategy, implementing CI/CD pipelines, adopting Infrastructure as Code, and integrating security, monitoring, and optimization into DevOps processes. Payments are structured with a penalty for late deliveries or payments, and strict data security and access control measures are in place, including encryption and multi-factor authentication. The project will adhere to GDPR, PCI DSS, and ISO 27001 standards, with deliverables including a DevOps roadmap, CI/CD pipeline deployment, Infrastructure as Code implementation, and a detailed security integration plan, all with specified due dates and financial expectations. Regular audits, incident response protocols, and a focus on compliance underscore the project''s commitment to security and regulatory adherence. The overall goal is to enhance the client''s DevOps capabilities through a structured timeline and clear deliverables.'
WHERE NOT EXISTS (SELECT 1 FROM sows WHERE number = 'SOW-2024-038');

-- SOW Chunks table: Holds the content of the SOW in sections
CREATE TABLE IF NOT EXISTS sow_chunks (
    id BIGSERIAL PRIMARY KEY,
    sow_id BIGINT NOT NULL,
    heading text NOT NULL,
    content text NOT NULL,
    page_number INT NOT NULL,
    embedding vector(1536),
    FOREIGN KEY (sow_id) REFERENCES sows (id) ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION sow_chunks_insert_trigger_fn()
RETURNS trigger AS $$
BEGIN
  IF NEW.content IS NOT NULL THEN
    NEW.embedding := azure_openai.create_embeddings('embeddings', NEW.content, throw_on_error => FALSE, max_attempts => 5, retry_delay_ms => 2000);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- setup INSERT TRIGGER to call function
CREATE TRIGGER sow_chunks_insert_trigger
BEFORE INSERT ON sow_chunks
FOR EACH ROW
EXECUTE FUNCTION sow_chunks_insert_trigger_fn();

-- Insert starter data for sow_chunks
INSERT INTO sow_chunks (sow_id, heading, content, page_number)
VALUES
(1, 'Project Scope', 'Adatum Corporation will provide comprehensive Azure resource management services, including infrastructure monitoring, automated scaling, cost optimization, and application troubleshooting, to ensure high availability and efficiency for Invoice Pilot.', 1),
(1, 'Project Objectives', 'Ensure the continuous performance and scalability of Azure resources. Implement cost-efficient resource management strategies. Minimize downtime through proactive monitoring and rapid troubleshooting.', 1),
(1, 'Tasks', '1. Set up Azure resource monitoring tools. 2. Design and implement automated scaling strategies. 3. Conduct cost analysis and apply optimization measures. 4. Perform regular maintenance on Azure-hosted applications. 5. Troubleshoot and resolve any application or resource issues.', 1),
(1, 'Schedules', 'Project kick-off: November 01, 2024 - Initial monitoring setup: November 08, 2024 - Scaling implementation: November 15, 2024 - Cost optimization review: November 22, 2024 - Maintenance practices established: December 13, 2024 - Final troubleshooting and wrap-up: December 31, 2025', 1),
(1, 'Payments', 'Payment terms are Net 30. Invoices will be issued upon the completion of each milestone and are payable within 30 days. A penalty of 10% will be applied for late deliveries or payments.', 1),
(1, 'Compliance', '- Data Security: All data transfers between the Service Provider and Client will use secure, encrypted communication protocols. Data at rest will be encrypted using industry-standard encryption algorithms (e.g., AES-256). - Access Control: Access to the Azure resources and sensitive client information will be granted only to authorized personnel. Multi-factor authentication (MFA) will be enforced for all administrative access. - Audit and Monitoring: Adatum Corporation will maintain comprehensive logs of all access and changes to Azure resources. Regular audits will be conducted to ensure compliance with security protocols. - Incident Response: In the event of a security incident, the Service Provider will notify the Client within 24 hours. A detailed incident report will be provided within 48 hours, outlining the root cause, impact, and mitigation steps. - Regulatory Compliance: The project will comply with applicable regulations, including GDPR, PCI DSS, and ISO 27001, as they pertain to the management of Azure resources.', 2),
(1, 'Project Deliverables', 'Milestone Name Deliverables Amount Due Date 1 Monitoring Monitoring of resources $8,600.00 2024-11-08 2 Resource Scaling Implementation of automated scaling $7,000.00 2024-11-15 3 Cost Management Cost Management Implementation $7,000.00 2024-11-22 4 Maintenance Practices Maintenance & troubleshooting practice $10,500.00 2024-11-27 5 App Troubleshooting Identify Azure application issues $2,000.00 2024-11-27 5 App Troubleshooting Resolution of Azure application issues $3,500.00 2024-12-13 5 App Troubleshooting Implementation of app monitoring $5,000.00 2024-12-31 Total $43,600.00 Signatures (Adatum Corporation - Elizabeth Moore) (Invoice Pilot - Sora Kim)', 2),
(2, 'Project Scope', 'Trey Research will provide comprehensive DevOps implementation services, including strategy and planning, CI/CD pipeline implementation, infrastructure as code, and security, monitoring, and optimization.', 1),
(2, 'Project Objectives', 'Develop a comprehensive DevOps strategy and roadmap. Implement CI/CD pipelines for automated build and deployment. Implement infrastructure as code (IaC) for consistent and repeatable infrastructure management. Integrate security, monitoring, and optimization practices into the DevOps processes.', 1),
(2, 'Tasks', '1. DevOps Strategy & Planning 2. CI/CD Pipeline Implementation 3. Infrastructure as Code (IaC) 4. Security, Monitoring & Optimization', 1),
(2, 'Schedules', 'Project kick-off: May 01, 2024 - DevOps Strategy & Planning: May 15, 2024 - CI/CD Pipeline Implementation: June 01, 2024 - Infrastructure as Code (IaC): September 01, 2024 - Security, Monitoring & Optimization: December 01, 2024', 1),
(2, 'Payments', 'Payment terms are Net 30. Invoices will be issued upon the completion of each milestone and are payable within 30 days. A penalty of 10% will be applied for late deliveries or payments.', 1),
(2, 'Compliance', '- Data Security: All data transfers between the Service Provider and Client will use secure, encrypted communication protocols. Data at rest will be encrypted using industry-standard encryption algorithms (e.g., AES-256). - Access Control: Access to the infrastructure and sensitive client information will be granted only to authorized personnel. Multi-factor authentication (MFA) will be enforced for all administrative access. - Audit and Monitoring: Trey Research will maintain comprehensive logs of all access and changes to the infrastructure. Regular audits will be conducted to ensure compliance with security protocols. - Incident Response: In the event of a security incident, the Service Provider will notify the Client within 24 hours. A detailed incident report will be provided within 48 hours, outlining the root cause, impact, and mitigation steps. - Regulatory Compliance: The project will comply with applicable regulations, including GDPR, PCI DSS, and ISO 27001, as they pertain to the management of infrastructure.', 2),
(2, 'Project Deliverables', 'Milestone Name Deliverables Amount Due Date 1 DevOps Strategy & Planning DevOps Roadmap & Report $10,000.00 2024-05-30 2 CI/CD Pipeline Implementation Deployment Pipeline, Version Control Implementation, Branching Strategy $20,000.00 2024-06-28 3 Infrastructure as Code (IaC) Infrastructure as Code Implementation, Containerization, Orchestration Setup $15,000.00 2024-09-15 4 Security, Monitoring & Optimization Security & Compliance Integration, Monitoring & Logging Setup, Performance Optimization $15,000.00 2024-12-01 Total $60,000.00 Signatures (Trey Research - Serena Davis) (Invoice Pilot - Sora Kim)', 2);

CREATE SEQUENCE IF NOT EXISTS sow_chunks_id_seq;
SELECT setval('sow_chunks_id_seq', COALESCE((SELECT MAX(id) FROM sow_chunks), 1) + 1);
ALTER TABLE sow_chunks ALTER COLUMN id SET DEFAULT nextval('sow_chunks_id_seq');

-- Milestones table: Holds the milestones for each SOW
CREATE TABLE IF NOT EXISTS milestones (
    id BIGSERIAL PRIMARY KEY,
    sow_id BIGINT NOT NULL,
    name text NOT NULL,
    status VARCHAR(50) NOT NULL,
    FOREIGN KEY (sow_id) REFERENCES sows (id) ON DELETE CASCADE
);

-- Insert starter data for milestones 
INSERT INTO milestones (sow_id, name, status)
VALUES
    (1,'Monitoring','Completed'),
    (1,'Resource Scaling','Completed'),
    (1,'Cost Management','Completed'),
    (1,'Maintenance Practices','Completed'),
    (1,'App Troubleshooting','In Progress'),
    (2,'DevOps Strategy & Planning','Completed'),
    (2,'CI/CD Pipeline Implementation','Completed'),
    (2,'Infrastructure as Code (IaC)','Completed'),
    (2,'Security, Monitoring & Optimization', 'In Progress');

CREATE SEQUENCE IF NOT EXISTS milestones_id_seq;
SELECT setval('milestones_id_seq', COALESCE((SELECT MAX(id) FROM milestones), 1) + 1);
ALTER TABLE milestones ALTER COLUMN id SET DEFAULT nextval('milestones_id_seq');

-- Deliverables table: Holds the deliverables for each milestone
CREATE TABLE IF NOT EXISTS deliverables (
    id BIGSERIAL PRIMARY KEY,
    milestone_id BIGINT NOT NULL,
    description TEXT,
    amount NUMERIC(10, 2),
    status TEXT NOT NULL,
    embedding vector(1536),
    due_date DATE NOT NULL,
    FOREIGN KEY (milestone_id) REFERENCES milestones (id) ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION deliverables_insert_trigger_fn()
RETURNS trigger AS $$
BEGIN
  IF NEW.description IS NOT NULL THEN
    NEW.embedding := azure_openai.create_embeddings('embeddings', NEW.description, throw_on_error => FALSE, max_attempts => 5, retry_delay_ms => 2000);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- setup INSERT TRIGGER to call function
CREATE TRIGGER deliverables_insert_trigger
BEFORE INSERT ON deliverables
FOR EACH ROW
EXECUTE FUNCTION deliverables_insert_trigger_fn();

-- Insert starter data for deliverables
INSERT INTO deliverables (milestone_id, description, amount, status, due_date)
VALUES
(1,'Monitoring of resources',8600.00,'Completed', '2024-11-08'),
(2,'Implementation of automated scaling',7000.00,'Completed', '2024-11-08'),
(3,'Cost Management Implementation',7000.00,'Completed', '2024-11-22'),
(4,'Maintenance and troubleshooting practices',10500.00,'Completed', '2024-11-27'),
(5,'Identify Azure application issues',2000.00,'In Progress', '2024-11-27'),
(5,'Resolution of Azure application issues',3500.00,'Completed', '2024-12-13'),
(5,'Implementation of app monitoring',5000.00,'In Progress', '2024-12-31'),
(6,'DevOps Roadmap & Report, CI/CD Pipeline Design',10000.00,'Completed','2024-11-20'),
(7,'Deployment Pipeline, Version Control Implementation, Branching Strategy Implementation',20000.00,'pending','2024-05-17'),
(8,'Infrastructure as Code Implementation, Containerization & Orchestration Setup',15000.00,'pending','2024-06-15'),
(9,'Security & Compliance Integration, Monitoring & Logging Setup, Performance Optimization',15000.00,'pending','2024-11-01');


CREATE SEQUENCE IF NOT EXISTS deliverables_id_seq;
SELECT setval('deliverables_id_seq', COALESCE((SELECT MAX(id) FROM deliverables), 1) + 1);
ALTER TABLE deliverables ALTER COLUMN id SET DEFAULT nextval('deliverables_id_seq');

-- SOW Validation Results table
CREATE TABLE IF NOT EXISTS sow_validation_results (
    id BIGSERIAL PRIMARY KEY,
    sow_id BIGINT NOT NULL,
    datestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    result TEXT,
    validation_passed BOOLEAN,
    embedding vector(1536),
    FOREIGN KEY (sow_id) REFERENCES sows (id) ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION sow_validation_results_insert_trigger_fn()
RETURNS trigger AS $$
BEGIN
  IF NEW.result IS NOT NULL THEN
    NEW.embedding := azure_openai.create_embeddings('embeddings', NEW.result, throw_on_error => FALSE, max_attempts => 5, retry_delay_ms => 2000);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- setup INSERT TRIGGER to call function
CREATE TRIGGER sow_validation_results_insert_trigger
BEFORE INSERT ON sow_validation_results
FOR EACH ROW
EXECUTE FUNCTION sow_validation_results_insert_trigger_fn();

-- Insert starter data for sow_validation_results
INSERT INTO sow_validation_results (
    sow_id,
    datestamp,
    result,
    validation_passed
)
VALUES
    (1, CURRENT_TIMESTAMP - INTERVAL '2 hours', 'Missing deliverables section.', FALSE),
    (1, CURRENT_TIMESTAMP - INTERVAL '1 hour', 'Deliverables section contains wrong information and incorrect total billable amount for milestone 1.', FALSE),
    (1, CURRENT_TIMESTAMP, 'The SOW has been correct and is now correct.', TRUE),
    (2, CURRENT_TIMESTAMP - INTERVAL '1 hour', 'Incorrect milestone dates.', FALSE),
    (2, CURRENT_TIMESTAMP, 'Everything is correct now.', TRUE);

CREATE SEQUENCE IF NOT EXISTS sow_validation_results_id_seq;
SELECT setval('sow_validation_results_id_seq', COALESCE((SELECT MAX(id) FROM sow_validation_results), 1) + 1);
ALTER TABLE sow_validation_results ALTER COLUMN id SET DEFAULT nextval('sow_validation_results_id_seq');

/* END SOWs */

/* INVOICES */

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id BIGSERIAL PRIMARY KEY,
    number text NOT NULL,
    vendor_id BIGINT NOT NULL,
    sow_id BIGINT NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    invoice_date DATE NOT NULL,
    payment_status VARCHAR(50) NOT NULL,
    document text NOT NULL, -- document path
    content text, --  text content from the invoice
    metadata JSONB, --  additional metadata
    embedding vector(1536),
    FOREIGN KEY (vendor_id) REFERENCES vendors (id) ON DELETE CASCADE,
    FOREIGN KEY (sow_id) REFERENCES sows (id) ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION invoices_insert_trigger_fn()
RETURNS trigger AS $$
BEGIN
  IF NEW.content IS NOT NULL THEN
    NEW.embedding := azure_openai.create_embeddings('embeddings', NEW.content, throw_on_error => FALSE, max_attempts => 5, retry_delay_ms => 2000);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- setup INSERT TRIGGER to call function
CREATE TRIGGER invoices_insert_trigger
BEFORE INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION invoices_insert_trigger_fn();

-- Insert starter data for invoices
INSERT INTO invoices (id, number, vendor_id, sow_id, amount, invoice_date, payment_status, document, content, metadata)
VALUES
    (1, 'INV-AC2024-001', 1, 1, 15600, '2024-11-08', 'Paid', '1/invoices/INV-AC2024-001.pdf',  '{"Invoice Number: INV-AC2024-001 Vendor: Adatum Corporation Address: 789 Goldsmith Road, MainTown City Contact Name: Elizabeth Moore Contact Email: elizabeth.moore@adatum.com Contact Number: 123-789-7890 SOW Number: SOW-2024-073 Invoice Date: 2024-11-08 Client: Invoice Pilot Address: 123 Financial Avenue, Woodgrove City Milestone  Deliverables Amount Due Date Monitoring Monitoring of resources $8600.00 2024-12-08 Cost Management Cost Mangement Implementation $7000.00 2024-12-08 Total Amount $15600.00 If paying by Direct Credit please pay into the following bank account: Account Name: Adatum Corporation Account Number: 99182326 To help us allocate money correctly, please reference your invoice number: INV-AC2024-001 Payment Terms - Payment is due within 30 days of the invoice date. - A penalty of 10% will be applied for late payments."}', '{
  "Invoice_Number": "INV-AC2024-001",
  "Vendor": "Adatum Corporation",
  "Vendor_Address": "789 Goldsmith Road, MainTown City",
  "Vendor_Contact_Name": "Elizabeth Moore",
  "Vendor_Contact_Email": "elizabeth.moore@adatum.com",
  "Vendor_Contact_Number": "555-789-7890",
  "SOW_Number": "SOW-2024-073",
  "Invoice_Date": "2024-11-08",
  "Client": "Invoice Pilot",
  "Client_Contact_Name": "Chris Green",
  "Client_Contact_Email": "chris.green@invoicepilot.com",
  "Total_Amount": "15600",
  "Payment_Account_Name": "Adatum Corporation",
  "Payment_Account_Number": "48273615",
  "Payment_Terms": [
    "Payment is due within 30 days of the invoice date.",
    "A penalty of 10% will be applied for late payments."
  ]
}'),
    (2, 'INV-AC2024-002', 1, 1, 7000, '2024-11-22', 'Paid', '1/invoices/INV-AC2024-002.pdf', '{"Invoice Number: INV-AC2024-002 Vendor: Adatum Corporation Address: 789 Goldsmith Road, MainTown City Contact Name: Elizabeth Moore Contact Email: elizabeth.moore@adatum.com Contact Number: 123-789-7890 SOW Number: SOW-2024-073 Invoice Date: 2024-11-22 Client: Invoice Pilot Address: 123 Financial Avenue, Woodgrove City Milestone Deliverables Amount Due Date Resource Scaling Implementation of automated scaling $7000.00 2024-12-22 Total Amount $7000.00 If paying by Direct Credit please pay into the following bank account: Account Name: Adatum Corporation Account Number: 99182326 To help us allocate money correctly, please reference your invoice number: INV-AC2024-002 Payment Terms - Payment is due within 30 days of the invoice date. - A penalty of 10% will be applied for late payments."}', '{
        "Invoice_Number": "INV-AC2024-002",
        "Vendor": "Adatum Corporation",
        "Vendor_Address": "789 Goldsmith Road, MainTown City",
        "Vendor_Contact_Name": "Elizabeth Moore",
        "Vendor_Contact_Email": "elizabeth.moore@adatum.com",
        "Vendor_Contact_Number": "555-789-7890",
        "SOW_Number": "SOW-2024-073",
        "Invoice_Date": "2024-11-22",
        "Client": "Invoice Pilot",
        "Client_Contact_Name": "Chris Green",
        "Client_Contact_Email": "chris.green@invoicepilot.com",
        "Total_Amount": "7000",
        "Payment_Account_Name": "Adatum Corporation",
        "Payment_Account_Number": "48273615",
        "Payment_Terms": [
            "Payment is due within 30 days of the invoice date.",
            "A penalty of 10% will be applied for late payments."
        ]
    }'),
    (3, 'INV-AC2024-003', 1, 1, 12500, '2024-11-27', 'In Review', '1/invoices/INV-AC2024-003.pdf',  '{"Invoice Number: INV-AC2024-003 Vendor: Adatum Corporation Address: 789 Goldsmith Road, MainTown City Contact Name: Elizabeth Moore Contact Email: elizabeth.moore@adatum.com Contact Number: 123-789-7890 SOW Number: SOW-2024-073 Invoice Date: 2024-11-27 Client: Invoice Pilot Address: 123 Financial Avenue, Woodgrove City Milestone Deliverables Amount Due Date Maintenance Practices Maintenance and troubleshooting practices $10500.00 2024-12-27 App Troubleshooting Identify Azure application issues $2000.00 2024-12-27 Total Amount $12500.00 If paying by Direct Credit please pay into the following bank account: Account Name: Adatum Corporation Account Number: 99182326 To help us allocate money correctly, please reference your invoice number: INV-AC2024-003 Payment Terms - Payment is due within 30 days of the invoice date. - A penalty of 10% will be applied for late payments."}', '{
        "Invoice_Number": "INV-AC2024-003",
        "Vendor": "Adatum Corporation",
        "Vendor_Address": "789 Goldsmith Road, MainTown City",
        "Vendor_Contact_Name": "Elizabeth Moore",
        "Vendor_Contact_Email": "elizabeth.moore@adatum.com",
        "Vendor_Contact_Number": "555-789-7890",
        "SOW_Number": "SOW-2024-073",
        "Invoice_Date": "2024-11-27",
        "Client": "Invoice Pilot",
        "Client_Contact_Name": "Chris Green",
        "Client_Contact_Email": "chris.green@invoicepilot.com",
        "Total_Amount": "12500",
        "Payment_Account_Name": "Adatum Corporation",
        "Payment_Account_Number": "48273615",
        "Payment_Terms": [
            "Payment is due within 30 days of the invoice date.",
            "A penalty of 10% will be applied for late payments."
        ]
    }'),
    (4, 'INV-AC2024-004', 1, 1, 8500, '2025-01-01', 'Pending', '1/invoices/INV-AC2024-004.pdf',  '{"Invoice Number: INV-AC2024-004 Vendor: Adatum Corporation Address: 789 Goldsmith Road, MainTown City Contact Name: Elizabeth Moore Contact Email: elizabeth.moore@adatum.com Contact Number: 123-789-7890 SOW Number: SOW-2024-073 Invoice Date: 2025-01-01 Client: Invoice Pilot Address: 123 Financial Avenue, Woodgrove City Milestone Deliverables Amount Due Date App Troubleshooting Resolution of Azure application issues $3500.00 2025-01-31 App Troubleshooting Implementation of app monitoring 5,000.00 2025-01-31 Total Amount $8500.00 If paying by Direct Credit please pay into the following bank account: Account Name: Adatum Corporation Account Number: 99182326 To help us allocate money correctly, please reference your invoice number: INV-AC2024-004 Payment Terms - Payment is due within 30 days of the invoice date. - A penalty of 10% will be applied for late payments."}', '{
        "Invoice_Number": "INV-AC2024-004",
        "Vendor": "Adatum Corporation",
        "Vendor_Address": "789 Goldsmith Road, MainTown City",
        "Vendor_Contact_Name": "Elizabeth Moore",
        "Vendor_Contact_Email": "elizabeth.moore@adatum.com",
        "Vendor_Contact_Number": "555-789-7890",
        "SOW_Number": "SOW-2024-073",
        "Invoice_Date": "2025-01-01",
        "Client": "Invoice Pilot",
        "Client_Contact_Name": "Chris Green",
        "Client_Contact_Email": "chris.green@invoicepilot.com",
        "Total_Amount": "8500",
        "Payment_Account_Name": "Adatum Corporation",
        "Payment_Account_Number": "48273615",
        "Payment_Terms": [
            "Payment is due within 30 days of the invoice date.",
            "A penalty of 10% will be applied for late payments."
        ]
    }'),
    (5, 'INV-TR2024-001', 2, 2, 10000, '2024-11-20', 'Paid', '2/invoices/INV-TR2024-001.pdf',  '{"Invoice Number: INV-TR2024-001 Vendor: Trey Research Address: 456 Research Avenue, Redmond Contact Name: Serena Davis Contact Email: serena.davis@treyresearch.net Contact Number: 555-867-5309 SOW Number: SOW-2024-038 Invoice Date: 2024-11-20 Client: Invoice Pilot Address: 123 Financial Avenue, Woodgrove City Milestone Deliverables Amount Due Date DevOps Strategy DevOps Roadmap & Report $10000.00 2024-12-20 Total Amount $10000.00 If paying by Direct Credit please pay into the following bank account: Account Name: Trey Research Account Number: 41536685 To help us allocate money correctly, please reference your invoice number: INV-TR2024-001 Payment Terms - Payment is due within 30 days of the invoice date. - A penalty of 10% will be applied for late payments."}', '{
        "Invoice_Number": "INV-TR2024-001",
        "Vendor": "Trey Research",
        "Vendor_Address": "456 Research Avenue, Redmond",
        "Vendor_Contact_Name": "Serena Davis",
        "Vendor_Contact_Email": "serena.davis@treyresearch.net",
        "Vendor_Contact_Number": "555-867-5309",
        "SOW_Number": "SOW-2024-038",
        "Invoice_Date": "2024-11-20",
        "Client": "Invoice Pilot",
        "Client_Contact_Name": "Chris Green",
        "Client_Contact_Email": "chris.green@invoicepilot.com",
        "Total_Amount": "10000.00",
        "Payment_Account_Name": "Trey Research",
        "Payment_Account_Number": "61809232",
        "Payment_Terms": [
            "Payment is due within 30 days of the invoice date.",
            "A penalty of 10% will be applied for late payments."
        ]
    }');

CREATE SEQUENCE IF NOT EXISTS invoices_id_seq;
SELECT setval('invoices_id_seq', COALESCE((SELECT MAX(id) FROM invoices), 1) + 1);
ALTER TABLE invoices ALTER COLUMN id SET DEFAULT nextval('invoices_id_seq');



-- Invoice Line Items table
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    milestone_of_line_item TEXT,
    description TEXT,
    amount NUMERIC(10, 2),
    status TEXT NOT NULL,
    embedding vector(1536),
    due_date DATE NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION invoice_line_items_insert_trigger_fn()
RETURNS trigger AS $$
BEGIN
  IF NEW.description IS NOT NULL THEN
    NEW.embedding := azure_openai.create_embeddings('embeddings', NEW.description, throw_on_error => FALSE, max_attempts => 5, retry_delay_ms => 2000);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- setup INSERT TRIGGER to call function
CREATE TRIGGER invoice_line_items_insert_trigger
BEFORE INSERT ON invoice_line_items
FOR EACH ROW
EXECUTE FUNCTION invoice_line_items_insert_trigger_fn();

-- Insert starter data for invoice_line_items
INSERT INTO invoice_line_items (invoice_id, milestone_of_line_item, description, amount, status, due_date)
VALUES
(1,'Monitoring','Monitoring of resources',8600,'Completed','2024-12-08'),
(1,'Resource Scaling','Implementation of automated scaling',7000,'Completed','2024-12-08'),
(2,'Cost Management','Cost Management Implementation',7000,'Completed','2024-12-22'),
(3,'Maintenance Practices','Maintenance and troubleshooting practices',10500,'Completed','2024-12-27'),
(3,'App Troubleshooting','Identify Azure application issues',2000,'In Progress','2024-12-27'),
(4,'App Troubleshooting','Resolution of Azure application issues',3500,'Completed','2025-01-31'),
(4,'App Troubleshooting','Implementation of app monitoring',5000,'In Progress','2025-01-31'),
(5,'DevOps Strategy','DevOps Roadmap & Report',10000,'Completed','2024-12-20');

CREATE SEQUENCE IF NOT EXISTS invoice_line_items_id_seq;
SELECT setval('invoice_line_items_id_seq', COALESCE((SELECT MAX(id) FROM invoice_line_items), 1) + 1);
ALTER TABLE invoice_line_items ALTER COLUMN id SET DEFAULT nextval('invoice_line_items_id_seq');

-- Invoice Validation Results table
CREATE TABLE IF NOT EXISTS invoice_validation_results (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    datestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    result TEXT,
    validation_passed BOOLEAN,
    embedding vector(1536),
    FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION invoice_validation_results_insert_trigger_fn()
RETURNS trigger AS $$
BEGIN
  IF NEW.result IS NOT NULL THEN
    NEW.embedding := azure_openai.create_embeddings('embeddings', NEW.result, throw_on_error => FALSE, max_attempts => 5, retry_delay_ms => 2000);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- setup INSERT TRIGGER to call function
CREATE TRIGGER invoice_validation_results_insert_trigger
BEFORE INSERT ON invoice_validation_results
FOR EACH ROW
EXECUTE FUNCTION invoice_validation_results_insert_trigger_fn();

-- Insert starter data for invoice_validation_results
INSERT INTO invoice_validation_results (
    invoice_id, 
	datestamp,
    result, 
    validation_passed
)
VALUES
    
    (1, CURRENT_TIMESTAMP - INTERVAL '2 hours', 'Total amount was wrong.', FALSE),
    (1, CURRENT_TIMESTAMP, 'Invoice had total amount added changed and passed with no errors.', TRUE),
    (2, CURRENT_TIMESTAMP, 'Invoice validation passed with warnings: Payment terms was missing penalty text.', TRUE),
    (3, CURRENT_TIMESTAMP - INTERVAL '2 hours', 'The amount invoiced for fixing application issues was $500 more than allowed by the contract.', FALSE),
    (4, CURRENT_TIMESTAMP - INTERVAL '2 hours', 'Lots of mistakes. Returning to vendor for corrections', FALSE),
    (4, CURRENT_TIMESTAMP, 'Everything fix. All good.', TRUE);


CREATE SEQUENCE IF NOT EXISTS invoice_validation_results_id_seq;
SELECT setval('invoice_validation_results_id_seq', COALESCE((SELECT MAX(id) FROM invoice_validation_results), 1) + 1);
ALTER TABLE invoice_validation_results ALTER COLUMN id SET DEFAULT nextval('invoice_validation_results_id_seq');


/* END INVOICES */


/* COPILOT CHAT HISTORY */

CREATE TABLE IF NOT EXISTS copilot_chat_sessions (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    datestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS copilot_chat_session_history (
    id BIGSERIAL PRIMARY KEY,
    copilot_chat_session_id BIGINT NOT NULL,
    role VARCHAR(50) NOT NULL,
    content TEXT,
    datestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* END COPILOT CHAT HISTORY */

/* ACTIVITY_LOGS */

CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(50) NOT NULL, 
    resource_type VARCHAR(50) NOT NULL, 
    resource_name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL, 
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()    
);

/* END_ACTIVITY_LOGS */

/* Create a diskann index by using Cosine distance operator */

CREATE INDEX SOWS_diskann_idx ON sows USING diskann (embedding vector_cosine_ops);
CREATE INDEX INVOICES_diskann_idx ON invoices USING diskann (embedding vector_cosine_ops);
CREATE INDEX deliverables_diskann_idx ON deliverables USING diskann (embedding vector_cosine_ops);
CREATE INDEX line_items_diskann_idx ON invoice_line_items USING diskann (embedding vector_cosine_ops);
CREATE INDEX invoice_validation_results_diskann_idx ON invoice_validation_results USING diskann (embedding vector_cosine_ops);
CREATE INDEX sow_chunks_diskann_idx ON sow_chunks USING diskann (embedding vector_cosine_ops);
CREATE INDEX sow_validation_results_diskann_idx ON sow_validation_results USING diskann (embedding vector_cosine_ops);

/* End DiskAnn Index Creation */