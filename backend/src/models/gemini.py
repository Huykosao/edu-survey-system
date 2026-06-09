from pydantic import BaseModel, Field
from typing import List, Optional

class ClassificationItem(BaseModel):
    label_id: str
    sentiment: str = Field(description="positive or negative")

class FeedbackResult(BaseModel):
    feedback_id: str
    classifications: List[ClassificationItem]

class GeminiClassificationResponse(BaseModel):
    results: List[FeedbackResult]

class TrendSection(BaseModel):
    topic: str
    sentiment_overview: str
    key_points: List[str]
    problems: List[str]
    recommendations: List[str]

class SurveyAnalysisResponse(BaseModel):
    executive_summary: str
    detailed_trends: List[TrendSection]
    overall_score_analysis: str


class ClassificationItem(BaseModel):
    label_id: str
    sentiment: str # positive / negative

class FeedbackClassification(BaseModel):
    feedback_id: str
    classifications: List[ClassificationItem]

class ClassificationResponse(BaseModel):
    results: List[FeedbackClassification]

class TrendSection(BaseModel):
    topic: str
    sentiment_score: str
    key_points: List[str]
    problems: List[str]
    suggestions: List[str]

class FinalSurveyReport(BaseModel):
    executive_summary: str
    detailed_analysis: List[TrendSection]
    overall_recommendation: str