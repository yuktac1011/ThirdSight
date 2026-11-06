import uuid
from sqlalchemy.orm import Session
from app.core.models import Framework, SecurityControl, ControlFrameworkMapping, SecurityDomain


def seed_security_controls_and_frameworks(db: Session):
    """
    Seed baseline industry frameworks (NIST CSF 2.0, ISO/IEC 27001:2022, SOC 2 TSC 2017)
    and mapped security controls.
    """
    # 1. Frameworks
    framework_data = [
        ("NIST CSF 2.0", "2.0", "NIST Cybersecurity Framework 2.0 (Govern, Identify, Protect, Detect, Respond, Recover)"),
        ("ISO/IEC 27001:2022", "2022", "Information security, cybersecurity and privacy protection — Information security management systems"),
        ("SOC 2 Trust Services Criteria", "2017", "AICPA Trust Services Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy"),
    ]

    existing_fw = {fw.name: fw for fw in db.query(Framework).all()}
    for name, version, desc in framework_data:
        if name not in existing_fw:
            fw = Framework(id=str(uuid.uuid4()), name=name, version=version, description=desc)
            db.add(fw)
            existing_fw[name] = fw
    db.commit()

    # 2. Controls & Crosswalk Mappings
    controls = [
        {
            "code": "AC-01",
            "domain": SecurityDomain.ACCESS_CONTROL,
            "title": "Multi-Factor Authentication (MFA) & Credential Enforcement",
            "description": "Multi-factor authentication is enforced across all internal and administrative accounts, customer tenant portals, and remote access pathways.",
            "guidance": "Verify hardware token, WebAuthn/FIDO2, or authenticator app requirement. SMS-based 2FA is discouraged for privileged roles.",
            "mappings": [
                ("NIST CSF 2.0", "PR.AA-01", "Identities are verified before granting access"),
                ("ISO/IEC 27001:2022", "A.5.15", "Access control policy & authentication mechanisms"),
                ("SOC 2 Trust Services Criteria", "CC6.1", "Logical access security controls"),
            ]
        },
        {
            "code": "AC-02",
            "domain": SecurityDomain.ACCESS_CONTROL,
            "title": "Privileged Access Management & Least Privilege",
            "description": "Administrative privileges are restricted based on principle of least privilege, requiring separate administrator accounts and just-in-time access.",
            "guidance": "Review quarterly user entitlement reviews and check for standing domain admin accounts.",
            "mappings": [
                ("NIST CSF 2.0", "PR.AA-05", "Access permissions and authorizations are managed"),
                ("ISO/IEC 27001:2022", "A.8.2", "Privileged access rights management"),
                ("SOC 2 Trust Services Criteria", "CC6.3", "Role-based authorization and access restriction"),
            ]
        },
        {
            "code": "DP-01",
            "domain": SecurityDomain.DATA_PROTECTION,
            "title": "Cryptographic Protection of Data at Rest",
            "description": "All confidential customer data, database volumes, backups, and object stores are encrypted at rest using AES-256 or approved cryptographic algorithms.",
            "guidance": "Inspect KMS key management configurations and automated rotation schedules.",
            "mappings": [
                ("NIST CSF 2.0", "PR.DS-01", "Data-at-rest is protected cryptographically"),
                ("ISO/IEC 27001:2022", "A.8.24", "Use of cryptography and key management"),
                ("SOC 2 Trust Services Criteria", "CC6.6", "Protection of data at rest"),
            ]
        },
        {
            "code": "DP-02",
            "domain": SecurityDomain.DATA_PROTECTION,
            "title": "Cryptographic Protection of Data in Transit",
            "description": "Data in transit across public and untrusted networks is encrypted using TLS 1.2 or TLS 1.3 with forward secrecy cipher suites.",
            "guidance": "Check SSL Labs grade A or above, and verify legacy TLS 1.0/1.1 protocols are disabled.",
            "mappings": [
                ("NIST CSF 2.0", "PR.DS-02", "Data-in-transit is protected"),
                ("ISO/IEC 27001:2022", "A.8.20", "Network security controls and transmission encryption"),
                ("SOC 2 Trust Services Criteria", "CC6.7", "Transmission boundary protections"),
            ]
        },
        {
            "code": "VM-01",
            "domain": SecurityDomain.VULNERABILITY_MGMT,
            "title": "Vulnerability Scanning & Patch Management",
            "description": "Automated vulnerability scans are performed at least weekly against external and internal perimeters, with critical patches remediated within 14 days.",
            "guidance": "Review SLA metrics and sample scan remediation tickets.",
            "mappings": [
                ("NIST CSF 2.0", "PR.PS-02", "Software is maintained and patched"),
                ("ISO/IEC 27001:2022", "A.8.8", "Management of technical vulnerabilities"),
                ("SOC 2 Trust Services Criteria", "CC7.1", "Vulnerability identification and infrastructure monitoring"),
            ]
        },
        {
            "code": "VM-02",
            "domain": SecurityDomain.VULNERABILITY_MGMT,
            "title": "Annual Third-Party Penetration Testing",
            "description": "Independent certified third-party penetration tests are executed at least annually covering web apps, cloud infrastructure, and internal networks.",
            "guidance": "Verify pentest scope and confirmation of remediation for any high or critical findings.",
            "mappings": [
                ("NIST CSF 2.0", "DE.CM-01", "Networks and perimeters are monitored and tested"),
                ("ISO/IEC 27001:2022", "A.8.8", "Independent security assessment"),
                ("SOC 2 Trust Services Criteria", "CC7.1", "Independent security testing"),
            ]
        },
        {
            "code": "IR-01",
            "domain": SecurityDomain.INCIDENT_RESPONSE,
            "title": "Incident Response Plan & Breach Notification SLA",
            "description": "A formal incident response plan is documented, tested annually via tabletop exercises, and guarantees security breach notification to customers within 24-48 hours.",
            "guidance": "Inspect incident response runbooks and tabletop test post-mortem logs.",
            "mappings": [
                ("NIST CSF 2.0", "RS.MA-01", "Incident response plans are executed during an incident"),
                ("ISO/IEC 27001:2022", "A.5.24", "Information security incident management planning"),
                ("SOC 2 Trust Services Criteria", "CC7.3", "Incident handling and communication procedures"),
            ]
        },
        {
            "code": "TP-01",
            "domain": SecurityDomain.THIRD_PARTY_GOVERNANCE,
            "title": "Subprocessor & Vendor Security Risk Management",
            "description": "Subprocessors and critical third parties undergo formal security assessments, SOC 2 / ISO review, and contractually agree to equivalent security controls.",
            "guidance": "Request third-party risk management register and subprocessor DPA terms.",
            "mappings": [
                ("NIST CSF 2.0", "GV.SC-06", "Supply chain risk is assessed and managed"),
                ("ISO/IEC 27001:2022", "A.5.19", "Information security in supplier relationships"),
                ("SOC 2 Trust Services Criteria", "CC9.2", "Vendor and partner risk management"),
            ]
        },
    ]

    existing_ctrls = {c.code: c for c in db.query(SecurityControl).all()}
    for c_info in controls:
        code = c_info["code"]
        if code not in existing_ctrls:
            ctrl = SecurityControl(
                id=str(uuid.uuid4()),
                code=code,
                domain=c_info["domain"],
                title=c_info["title"],
                description=c_info["description"],
                guidance=c_info["guidance"],
                version=1,
            )
            db.add(ctrl)
            db.flush()
            existing_ctrls[code] = ctrl

            # Add framework mappings
            for fw_name, ref, note in c_info["mappings"]:
                if fw_name in existing_fw:
                    mapping = ControlFrameworkMapping(
                        id=str(uuid.uuid4()),
                        control_id=ctrl.id,
                        framework_id=existing_fw[fw_name].id,
                        framework_ref=ref,
                        mapping_notes=note,
                    )
                    db.add(mapping)

    db.commit()

