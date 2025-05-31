"""
AI analyzer for interaction analysis and insights generation.
"""
from typing import Dict, Any, List, Optional
import json
import asyncio
from datetime import datetime
import anthropic
import openai
from openai import AsyncOpenAI
import tiktoken

from ..core.config import settings
from ..core.logging import get_logger, LoggerMixin
from ..db.models import Interaction, InteractionType

logger = get_logger(__name__)


class AIAnalyzer(LoggerMixin):
    """AI analyzer for processing interactions and generating insights."""
    
    def __init__(self):
        self.anthropic_client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
    
    async def analyze_interaction(self, interaction: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze an interaction and return insights."""
        try:
            # Prepare context
            context = self._prepare_interaction_context(interaction)
            
            # Analyze with Claude
            analysis = await self._analyze_with_claude(context)
            
            # Calculate sentiment if not provided
            if "sentiment" not in analysis:
                analysis["sentiment"] = await self._calculate_sentiment(interaction["content"])
            
            # Generate embeddings for memory storage
            analysis["embedding"] = await self._generate_embedding(context)
            
            self.log_event(
                "interaction_analyzed",
                interaction_id=interaction["id"],
                interaction_type=interaction["type"]
            )
            
            return analysis
            
        except Exception as e:
            self.log_error("Failed to analyze interaction", exception=e, interaction_id=interaction["id"])
            return {
                "sentiment": 0.0,
                "summary": "Analysis failed",
                "suggested_actions": [],
                "error": str(e)
            }
    
    def _prepare_interaction_context(self, interaction: Dict[str, Any]) -> str:
        """Prepare interaction context for AI analysis."""
        context_parts = [
            f"Type: {interaction['type']}",
            f"Subject: {interaction['subject']}",
            f"From: {interaction.get('email_from', 'Unknown')}",
            f"Date: {interaction.get('created_at', 'Unknown')}",
            f"\nContent:\n{interaction['content']}"
        ]
        
        return "\n".join(context_parts)
    
    async def _analyze_with_claude(self, context: str) -> Dict[str, Any]:
        """Analyze content with Claude."""
        try:
            prompt = f"""You are an AI advisor for The Grid Company. Analyze this business interaction and provide insights.

Interaction:
{context}

Provide your analysis in the following JSON format:
{{
    "summary": "Brief 2-3 sentence summary of the key points",
    "sentiment": float between -1 (negative) and 1 (positive),
    "urgency": "low", "medium", or "high",
    "key_topics": ["topic1", "topic2", ...],
    "suggested_actions": ["action1", "action2", ...],
    "requires_followup": true/false,
    "followup_deadline": "YYYY-MM-DD" or null,
    "business_impact": "Brief assessment of potential business impact",
    "red_flags": ["flag1", "flag2", ...] or empty list
}}

Focus on practical business insights and actionable recommendations."""

            response = await self.anthropic_client.messages.create(
                model=settings.ai_model_name,
                max_tokens=1000,
                temperature=0.3,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            # Parse response
            analysis_text = response.content[0].text
            
            # Extract JSON from response
            try:
                # Find JSON block in response
                import re
                json_match = re.search(r'\{.*\}', analysis_text, re.DOTALL)
                if json_match:
                    analysis = json.loads(json_match.group())
                else:
                    raise ValueError("No JSON found in response")
            except:
                # Fallback parsing
                analysis = {
                    "summary": analysis_text[:200],
                    "sentiment": 0.0,
                    "suggested_actions": [],
                    "urgency": "medium"
                }
            
            return analysis
            
        except Exception as e:
            self.log_error("Claude analysis failed", exception=e)
            raise
    
    async def _calculate_sentiment(self, text: str) -> float:
        """Calculate sentiment score using OpenAI."""
        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a sentiment analyzer. Return only a number between -1 (very negative) and 1 (very positive)."
                    },
                    {
                        "role": "user",
                        "content": f"Analyze the sentiment of this text:\n\n{text[:1000]}"
                    }
                ],
                temperature=0,
                max_tokens=10
            )
            
            sentiment_text = response.choices[0].message.content.strip()
            return float(sentiment_text)
            
        except Exception as e:
            self.log_error("Sentiment calculation failed", exception=e)
            return 0.0
    
    async def _generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text using OpenAI."""
        try:
            # Truncate text if too long
            max_tokens = 8000
            tokens = self.encoding.encode(text)
            if len(tokens) > max_tokens:
                tokens = tokens[:max_tokens]
                text = self.encoding.decode(tokens)
            
            response = await self.openai_client.embeddings.create(
                model=settings.embedding_model,
                input=text
            )
            
            return response.data[0].embedding
            
        except Exception as e:
            self.log_error("Embedding generation failed", exception=e)
            return []
    
    async def analyze_patterns(self, interactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze patterns across multiple interactions."""
        try:
            # Prepare interactions summary
            summary = self._prepare_interactions_summary(interactions)
            
            prompt = f"""Analyze these business interactions from The Grid Company and identify patterns:

{summary}

Identify:
1. Communication patterns (frequency, response times, preferred channels)
2. Business patterns (common requests, recurring issues, deal progression)
3. Risk patterns (delayed responses, negative sentiment trends, stalled deals)
4. Opportunity patterns (upsell signals, expansion opportunities, referral potential)

Provide specific, actionable insights with confidence scores."""

            response = await self.anthropic_client.messages.create(
                model=settings.ai_model_name,
                max_tokens=2000,
                temperature=0.5,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            patterns_text = response.content[0].text
            
            return {
                "patterns_identified": patterns_text,
                "analysis_date": datetime.now().isoformat(),
                "interactions_analyzed": len(interactions)
            }
            
        except Exception as e:
            self.log_error("Pattern analysis failed", exception=e)
            return {"error": str(e)}
    
    def _prepare_interactions_summary(self, interactions: List[Dict[str, Any]]) -> str:
        """Prepare summary of interactions for pattern analysis."""
        summary_parts = []
        
        # Group by client
        by_client = {}
        for interaction in interactions:
            client_id = interaction.get("client_id", "unknown")
            if client_id not in by_client:
                by_client[client_id] = []
            by_client[client_id].append(interaction)
        
        for client_id, client_interactions in by_client.items():
            summary_parts.append(f"\nClient {client_id}:")
            summary_parts.append(f"Total interactions: {len(client_interactions)}")
            
            # Type breakdown
            type_counts = {}
            for i in client_interactions:
                type_counts[i["type"]] = type_counts.get(i["type"], 0) + 1
            summary_parts.append(f"Types: {type_counts}")
            
            # Recent subjects
            recent = sorted(client_interactions, key=lambda x: x.get("created_at", ""), reverse=True)[:5]
            subjects = [i["subject"] for i in recent]
            summary_parts.append(f"Recent topics: {subjects}")
        
        return "\n".join(summary_parts)
    
    async def generate_daily_briefing(
        self, 
        team_member_id: str,
        interactions: List[Dict[str, Any]],
        metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate personalized daily briefing for team member."""
        try:
            # Prepare context
            context = self._prepare_briefing_context(interactions, metrics)
            
            prompt = f"""Generate a daily briefing for a Grid Company team member:

{context}

Create a briefing that includes:
1. Executive Summary (2-3 sentences on key items)
2. Priority Actions (top 3-5 things to do today)
3. Follow-ups Needed (specific clients/proposals requiring attention)
4. Key Metrics Insight (what the numbers tell us)
5. AI Recommendations (strategic suggestions based on patterns)

Make it concise, actionable, and motivating. Use a professional but friendly tone."""

            response = await self.anthropic_client.messages.create(
                model=settings.ai_model_name,
                max_tokens=1500,
                temperature=0.7,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            briefing_content = response.content[0].text
            
            # Structure the briefing
            briefing = {
                "team_member_id": team_member_id,
                "briefing_date": datetime.now().isoformat(),
                "summary": self._extract_section(briefing_content, "Executive Summary"),
                "key_metrics": metrics,
                "priority_items": self._extract_list_section(briefing_content, "Priority Actions"),
                "follow_ups_needed": self._extract_list_section(briefing_content, "Follow-ups Needed"),
                "insights": self._extract_list_section(briefing_content, "AI Recommendations"),
                "full_content": briefing_content
            }
            
            return briefing
            
        except Exception as e:
            self.log_error("Failed to generate daily briefing", exception=e)
            return {
                "error": str(e),
                "summary": "Failed to generate briefing"
            }
    
    def _prepare_briefing_context(self, interactions: List[Dict[str, Any]], metrics: Dict[str, Any]) -> str:
        """Prepare context for daily briefing."""
        context_parts = [
            f"Date: {datetime.now().strftime('%A, %B %d, %Y')}",
            f"\nYesterday's Activity:",
            f"- Total interactions: {len(interactions)}",
            f"- Emails received: {sum(1 for i in interactions if i['type'] == 'email')}",
            f"- Average response time: {metrics.get('avg_response_time', 'N/A')} hours",
            f"- Client engagement score: {metrics.get('avg_engagement_score', 'N/A')}",
            f"\nRecent Interactions:"
        ]
        
        # Add recent interaction summaries
        for interaction in interactions[:10]:
            context_parts.append(
                f"- {interaction['type']}: {interaction['subject']} "
                f"(from: {interaction.get('email_from', 'N/A')}, "
                f"importance: {interaction.get('importance_score', 0.5):.1f})"
            )
        
        return "\n".join(context_parts)
    
    def _extract_section(self, text: str, section_name: str) -> str:
        """Extract a section from the briefing text."""
        import re
        pattern = rf"{section_name}:?\s*\n(.*?)(?=\n\n|\n[A-Z]|\Z)"
        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        return match.group(1).strip() if match else ""
    
    def _extract_list_section(self, text: str, section_name: str) -> List[str]:
        """Extract a list section from the briefing text."""
        section_text = self._extract_section(text, section_name)
        if not section_text:
            return []
        
        # Extract bullet points or numbered items
        import re
        items = re.findall(r'[-•*\d]+\.?\s*(.+)', section_text)
        return [item.strip() for item in items if item.strip()] 