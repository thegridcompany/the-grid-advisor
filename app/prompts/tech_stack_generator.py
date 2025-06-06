"""
Prompt templates for tech stack recommendation.
"""
from string import Template

TECH_STACK_PROMPT_TEMPLATE = Template(
'You are a senior solutions architect. Based on the following project description, recommend a technology stack.\\n\\n'
'Project Description:\\n$project_description\\n\\n'
'The recommendation should include the following categories: Frontend, Backend, Database, and Deployment/Hosting.\\n'
'For each category, provide a primary recommendation and a brief justification for your choice.\\n\\n'
'Format the output as a JSON object with the following structure:\\n'
'{\\n'
'  "projectName": "$project_name",\\n'
'  "techStack": {\\n'
'    "frontend": {"name": "React", "justification": "Justification for choosing React."},\\n'
'    "backend": {"name": "Node.js", "justification": "Justification for choosing Node.js."},\\n'
'    "database": {"name": "PostgreSQL", "justification": "Justification for choosing PostgreSQL."},\\n'
'    "deployment": {"name": "AWS", "justification": "Justification for choosing AWS."}\\n'
'  }\\n'
'}'
) 