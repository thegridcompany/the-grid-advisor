"""
Templating engine for rendering Jinja2 templates.
"""
from jinja2 import Environment, FileSystemLoader, select_autoescape
from app.core.config import settings
import os

class TemplateEngine:
    """
    Handles Jinja2 template loading and rendering.
    """
    def __init__(self, template_dir: str = "app/templates"):
        self.env = Environment(
            loader=FileSystemLoader(template_dir),
            autoescape=select_autoescape(['html', 'xml'])
        )

    def render_template(self, template_name: str, context: dict) -> str:
        """
        Renders a template with the given context.

        Args:
            template_name: The name of the template file.
            context: A dictionary of data to pass to the template.

        Returns:
            The rendered template as a string.
        """
        template = self.env.get_template(template_name)
        return template.render(context)

template_engine = TemplateEngine() 