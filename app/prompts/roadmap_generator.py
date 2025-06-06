"""
Prompt templates for project roadmap generation.
"""
from string import Template

ROADMAP_PROMPT_TEMPLATE = Template(
'You are an expert project manager. Based on the following project description, generate a high-level project roadmap.\\n\\n'
'Project Description:\\n$project_description\\n\\n'
'Context from similar projects:\\n$context\\n\\n'
'The roadmap should be structured into distinct phases, with 3-5 key milestones for each phase.\\n'
'For each milestone, provide a brief description of the work involved.\\n\\n'
'Format the output as a JSON object with the following structure:\\n'
'{\\n'
'  "projectName": "$project_name",\\n'
'  "roadmap": [\\n'
'    {\\n'
'      "phaseName": "Phase 1: Discovery & Planning",\\n'
'      "milestones": [\\n'
'        {"milestoneName": "Milestone 1.1", "description": "Description of milestone 1.1"},\\n'
'        {"milestoneName": "Milestone 1.2", "description": "Description of milestone 1.2"}\\n'
'      ]\\n'
'    },\\n'
'    {\\n'
'      "phaseName": "Phase 2: Development & Implementation",\\n'
'      "milestones": [\\n'
'        {"milestoneName": "Milestone 2.1", "description": "Description of milestone 2.1"}\\n'
'      ]\\n'
'    }\\n'
'  ]\\n'
'}'
) 