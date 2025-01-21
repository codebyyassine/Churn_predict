CREATE TABLE IF NOT EXISTS customer_churn (
    row_number      INT,
    customer_id     INT,
    surname         VARCHAR(50),
    credit_score    INT,
    geography       VARCHAR(50),
    gender          VARCHAR(10),
    age             INT,
    tenure          INT,
    balance         NUMERIC,
    num_of_products INT,
    has_cr_card     BOOLEAN,
    is_active_member BOOLEAN,
    estimated_salary NUMERIC,
    exited          BOOLEAN
);
