-- =====================================================
-- 1. TỔNG QUAN DASHBOARD
-- =====================================================

CREATE OR REPLACE FUNCTION get_survey_dashboard_overview(
p_survey_id bigint
)
RETURNS TABLE (
total_responses bigint,
total_open_feedbacks bigint,
total_labels bigint,
positive_count bigint,
negative_count bigint,
neutral_count bigint
)
LANGUAGE sql
AS $$
SELECT
COUNT(DISTINCT sr.id) AS total_responses,

COUNT(DISTINCT (
    rl.response_id,
    rl.question_id
)) AS total_open_feedbacks,

COUNT(*) AS total_labels,

COUNT(*) FILTER (
    WHERE rl.sentiment = 'positive'
) AS positive_count,

COUNT(*) FILTER (
    WHERE rl.sentiment = 'negative'
) AS negative_count,

COUNT(*) FILTER (
    WHERE rl.sentiment = 'neutral'
) AS neutral_count


FROM survey_responses sr

LEFT JOIN response_labels rl
ON rl.response_id = sr.id

WHERE sr.survey_id = p_survey_id;
$$;

-- =====================================================
-- 2. THỐNG KÊ THEO NHÃN
-- =====================================================

CREATE OR REPLACE FUNCTION get_label_sentiment_summary(
p_survey_id bigint
)
RETURNS TABLE (
label_id bigint,
label_name text,
positive_count bigint,
negative_count bigint,
neutral_count bigint,
total_count bigint
)
LANGUAGE sql
AS $$
SELECT
l.id,
l.label_name,

COUNT(*) FILTER (
    WHERE rl.sentiment = 'positive'
) AS positive_count,

COUNT(*) FILTER (
    WHERE rl.sentiment = 'negative'
) AS negative_count,

COUNT(*) FILTER (
    WHERE rl.sentiment = 'neutral'
) AS neutral_count,

COUNT(*) AS total_count

FROM response_labels rl

JOIN survey_label_definitions l
ON l.id = rl.label_id

JOIN survey_responses sr
ON sr.id = rl.response_id

WHERE sr.survey_id = p_survey_id

GROUP BY
l.id,
l.label_name

ORDER BY total_count DESC;
$$;

-- =====================================================
-- 3. THỐNG KÊ THEO CÂU HỎI MỞ
-- =====================================================

CREATE OR REPLACE FUNCTION get_question_sentiment_summary(
p_survey_id bigint
)
RETURNS TABLE (
question_id text,
positive_count bigint,
negative_count bigint,
neutral_count bigint,
total_count bigint
)
LANGUAGE sql
AS $$
SELECT
rl.question_id,

COUNT(*) FILTER (
    WHERE rl.sentiment='positive'
) AS positive_count,

COUNT(*) FILTER (
    WHERE rl.sentiment='negative'
) AS negative_count,

COUNT(*) FILTER (
    WHERE rl.sentiment='neutral'
) AS neutral_count,

COUNT(*) AS total_count

FROM response_labels rl

JOIN survey_responses sr
ON sr.id = rl.response_id

WHERE sr.survey_id = p_survey_id

GROUP BY rl.question_id

ORDER BY total_count DESC;
$$;

-- =====================================================
-- 4. FEEDBACK CHI TIẾT (AI REPORT)
-- =====================================================

CREATE OR REPLACE FUNCTION get_feedback_examples(
p_survey_id bigint,
p_limit integer DEFAULT 500
)
RETURNS TABLE (
response_id bigint,
question_id text,
label_id bigint,
label_name text,
sentiment text,
feedback_text text
)
LANGUAGE sql
AS $$
SELECT
rl.response_id,
rl.question_id,

l.id,
l.label_name,

rl.sentiment,

rl.feedback_text

FROM response_labels rl

JOIN survey_label_definitions l
ON l.id = rl.label_id

JOIN survey_responses sr
ON sr.id = rl.response_id

WHERE sr.survey_id = p_survey_id

ORDER BY rl.id DESC

LIMIT p_limit;
$$;

-- =====================================================
-- 5. DRILL DOWN THEO NHÃN
-- =====================================================

CREATE OR REPLACE FUNCTION get_feedbacks_by_label(
p_survey_id bigint,
p_label_id bigint
)
RETURNS TABLE (
response_id bigint,
question_id text,
sentiment text,
feedback_text text,
submitted_at timestamptz
)
LANGUAGE sql
AS $$
SELECT
rl.response_id,
rl.question_id,
rl.sentiment,
rl.feedback_text,
sr.submitted_at

FROM response_labels rl

JOIN survey_responses sr
ON sr.id = rl.response_id

WHERE sr.survey_id = p_survey_id
AND rl.label_id = p_label_id

ORDER BY sr.submitted_at DESC;
$$;
