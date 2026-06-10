from src.core.database import supabase_client

def get_dashboard_overview(survey_id: int):
    result = (
        supabase_client
        .rpc(
            "get_survey_dashboard_overview",
            {"p_survey_id": survey_id}
        )
        .execute()
    )
    return result.data[0] if result.data else {}

def get_label_sentiment_summary(survey_id: int):
    result = (
        supabase_client
        .rpc(
            "get_label_sentiment_summary",
            {"p_survey_id": survey_id}
        )
        .execute()
    )
    return result.data or []

def get_question_sentiment_summary(survey_id: int):
    result = (
        supabase_client
        .rpc(
            "get_question_sentiment_summary",
            {"p_survey_id": survey_id}
        )
        .execute()
    )
    return result.data or []

def get_feedback_examples(
    survey_id: int,
    limit: int = 500
):
    result = (
        supabase_client
        .rpc(
            "get_feedback_examples",
            {
                "p_survey_id": survey_id,
                "p_limit": limit
            }
        )
        .execute()
    )
    return result.data or []

if __name__ == "__main__":
    print(get_dashboard_overview(14))
    print(get_label_sentiment_summary(14))
    print(get_question_sentiment_summary(14))
    print(get_feedback_examples(14, 5))