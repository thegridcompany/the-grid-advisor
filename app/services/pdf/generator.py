"""
PDF generation service using WeasyPrint.
"""
from weasyprint import HTML
from markdown2 import Markdown

class PdfGenerator:
    """
    Handles PDF generation from HTML or Markdown content.
    """
    def __init__(self):
        self.markdowner = Markdown()

    def from_html(self, html_content: str) -> bytes:
        """
        Converts HTML content to a PDF.

        Args:
            html_content: The HTML content to convert.

        Returns:
            The PDF content as a byte stream.
        """
        return HTML(string=html_content).write_pdf()

    def from_markdown(self, markdown_content: str) -> bytes:
        """
        Converts Markdown content to a PDF.

        Args:
            markdown_content: The Markdown content to convert.

        Returns:
            The PDF content as a byte stream.
        """
        html_content = self.markdowner.convert(markdown_content)
        return self.from_html(html_content)


pdf_generator = PdfGenerator() 