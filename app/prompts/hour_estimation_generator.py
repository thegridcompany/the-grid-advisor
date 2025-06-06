"""
Prompt templates for hour estimation.
"""
from string import Template

HOUR_ESTIMATION_PROMPT_TEMPLATE = Template(
'You are an experienced project manager and software engineer. Based on the following project description and roadmap, provide an hour estimation for each milestone.\\n\\n'
'Project Description:\\n$project_description\\n\\n'
'Project Roadmap:\\n$project_roadmap\\n\\n'
'For each milestone, provide a low, medium, and high estimate in hours. The medium estimate should be the most likely scenario.\\n\\n'
'Format the output as a JSON object with the following structure:\\n'
'{\\n'
'  "projectName": "$project_name",\\n'
'  "estimations": [\\n'
'    {\\n'
'      "milestoneName": "Milestone 1.1",\\n'
'      "estimates": {"low": 20, "medium": 30, "high": 40}\\n'
'    },\\n'
'    {\\n'
'      "milestoneName": "Milestone 1.2",\\n'
'      "estimates": {"low": 50, "medium": 60, "high": 80}\\n'
'    }\\n'
'  ]\\n'
'}'
) 