"""
Email client for IMAP/SMTP operations.
"""
import imaplib
import smtplib
import email
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import decode_header
from email.utils import parsedate_to_datetime
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import html2text
import re
from imap_tools import MailBox, AND, OR
import pendulum

from ..core.logging import get_logger, LoggerMixin
from ..core.config import settings

logger = get_logger(__name__)


class EmailClient(LoggerMixin):
    """Client for email operations via IMAP/SMTP."""
    
    def __init__(self, email_address: str, password: str):
        self.email_address = email_address
        self.password = password
        self.imap_server = settings.email_server_imap
        self.imap_port = settings.email_port_imap
        self.smtp_server = settings.email_server_smtp
        self.smtp_port = settings.email_port_smtp
        self._mailbox: Optional[MailBox] = None
        
    def __enter__(self):
        self.connect()
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()
        
    def connect(self) -> None:
        """Connect to IMAP server."""
        try:
            self._mailbox = MailBox(self.imap_server)
            self._mailbox.login(self.email_address, self.password)
            self.log_event("email_client_connected", email=self.email_address)
        except Exception as e:
            self.log_error("Failed to connect to IMAP server", exception=e, email=self.email_address)
            raise
    
    def disconnect(self) -> None:
        """Disconnect from IMAP server."""
        if self._mailbox:
            try:
                self._mailbox.logout()
                self.log_event("email_client_disconnected", email=self.email_address)
            except Exception as e:
                self.log_error("Error disconnecting from IMAP", exception=e)
    
    def fetch_emails(
        self, 
        since_date: Optional[datetime] = None,
        limit: Optional[int] = None,
        folder: str = "INBOX",
        mark_seen: bool = False
    ) -> List[Dict[str, Any]]:
        """Fetch emails from the server."""
        if not self._mailbox:
            raise RuntimeError("Not connected to IMAP server")
        
        emails = []
        
        try:
            # Default to last 7 days if no date specified
            if not since_date:
                since_date = datetime.now() - timedelta(days=7)
            
            # Select folder
            self._mailbox.folder.set(folder)
            
            # Build search criteria
            criteria = AND(date_gte=since_date.date())
            
            # Fetch messages
            messages = self._mailbox.fetch(criteria, mark_seen=mark_seen, limit=limit)
            
            for msg in messages:
                email_data = self._parse_email(msg)
                if email_data:
                    emails.append(email_data)
            
            self.log_event(
                "emails_fetched", 
                count=len(emails), 
                folder=folder,
                since_date=since_date.isoformat()
            )
            
        except Exception as e:
            self.log_error("Failed to fetch emails", exception=e, folder=folder)
            raise
        
        return emails
    
    def _parse_email(self, msg) -> Optional[Dict[str, Any]]:
        """Parse email message into structured data."""
        try:
            # Extract text content
            text_content = ""
            html_content = ""
            
            if msg.text:
                text_content = msg.text
            elif msg.html:
                h = html2text.HTML2Text()
                h.ignore_links = False
                text_content = h.handle(msg.html)
                html_content = msg.html
            
            # Parse recipients
            to_addresses = [addr for addr in (msg.to or [])]
            cc_addresses = [addr for addr in (msg.cc or [])]
            
            # Build email data
            email_data = {
                "message_id": msg.uid,
                "subject": msg.subject or "(No Subject)",
                "from": msg.from_,
                "to": to_addresses,
                "cc": cc_addresses,
                "date": msg.date,
                "text_content": text_content,
                "html_content": html_content,
                "has_attachments": len(msg.attachments) > 0,
                "attachment_count": len(msg.attachments),
                "flags": list(msg.flags),
                "headers": dict(msg.headers),
            }
            
            # Extract thread ID from headers if available
            if "In-Reply-To" in msg.headers:
                email_data["in_reply_to"] = msg.headers["In-Reply-To"]
            if "References" in msg.headers:
                email_data["references"] = msg.headers["References"]
            
            return email_data
            
        except Exception as e:
            self.log_error("Failed to parse email", exception=e, uid=getattr(msg, 'uid', 'unknown'))
            return None
    
    def send_email(
        self,
        to: List[str],
        subject: str,
        body: str,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None,
        reply_to: Optional[str] = None,
        html_body: Optional[str] = None
    ) -> bool:
        """Send an email via SMTP."""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.email_address
            msg['To'] = ', '.join(to)
            
            if cc:
                msg['Cc'] = ', '.join(cc)
            if reply_to:
                msg['Reply-To'] = reply_to
            
            # Add text part
            text_part = MIMEText(body, 'plain')
            msg.attach(text_part)
            
            # Add HTML part if provided
            if html_body:
                html_part = MIMEText(html_body, 'html')
                msg.attach(html_part)
            
            # Connect to SMTP server and send
            with smtplib.SMTP_SSL(self.smtp_server, self.smtp_port) as server:
                server.login(self.email_address, self.password)
                
                # Combine all recipients
                all_recipients = to + (cc or []) + (bcc or [])
                server.send_message(msg, to_addrs=all_recipients)
            
            self.log_event(
                "email_sent",
                to=to,
                subject=subject,
                has_html=bool(html_body)
            )
            return True
            
        except Exception as e:
            self.log_error("Failed to send email", exception=e, to=to, subject=subject)
            return False
    
    def mark_as_read(self, message_ids: List[str]) -> bool:
        """Mark emails as read."""
        if not self._mailbox:
            raise RuntimeError("Not connected to IMAP server")
        
        try:
            for msg_id in message_ids:
                self._mailbox.flag(msg_id, '\\Seen', True)
            
            self.log_event("emails_marked_read", count=len(message_ids))
            return True
            
        except Exception as e:
            self.log_error("Failed to mark emails as read", exception=e)
            return False
    
    def search_emails(
        self,
        query: str,
        folder: str = "INBOX",
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Search emails by query."""
        if not self._mailbox:
            raise RuntimeError("Not connected to IMAP server")
        
        emails = []
        
        try:
            self._mailbox.folder.set(folder)
            
            # Search in subject and from fields
            criteria = OR(
                subject=query,
                from_=query,
                text=query
            )
            
            messages = self._mailbox.fetch(criteria, limit=limit)
            
            for msg in messages:
                email_data = self._parse_email(msg)
                if email_data:
                    emails.append(email_data)
            
            self.log_event("emails_searched", query=query, results=len(emails))
            
        except Exception as e:
            self.log_error("Email search failed", exception=e, query=query)
            
        return emails
    
    def get_folders(self) -> List[str]:
        """Get list of available folders."""
        if not self._mailbox:
            raise RuntimeError("Not connected to IMAP server")
        
        try:
            folders = [f.name for f in self._mailbox.folder.list()]
            self.log_event("folders_retrieved", count=len(folders))
            return folders
        except Exception as e:
            self.log_error("Failed to get folders", exception=e)
            return []
    
    def extract_domain_from_email(self, email_address: str) -> Optional[str]:
        """Extract domain from email address."""
        match = re.match(r'^[^@]+@(.+)$', email_address)
        return match.group(1) if match else None
    
    def is_important_email(self, email_data: Dict[str, Any]) -> Tuple[bool, float]:
        """Determine if an email is important and calculate importance score."""
        importance_score = 0.5  # Base score
        
        # Check if from known important domains
        from_domain = self.extract_domain_from_email(email_data.get('from', ''))
        
        # Keywords that increase importance
        important_keywords = [
            'urgent', 'important', 'asap', 'deadline', 'contract', 
            'proposal', 'invoice', 'payment', 'meeting', 'call'
        ]
        
        subject = email_data.get('subject', '').lower()
        content = email_data.get('text_content', '').lower()
        
        # Check subject and content for keywords
        for keyword in important_keywords:
            if keyword in subject:
                importance_score += 0.2
            if keyword in content:
                importance_score += 0.1
        
        # Check if it's a reply to our email
        if email_data.get('in_reply_to'):
            importance_score += 0.2
        
        # Cap the score at 1.0
        importance_score = min(1.0, importance_score)
        
        # Consider important if score > threshold
        is_important = importance_score >= settings.ai_analysis_threshold
        
        return is_important, importance_score 