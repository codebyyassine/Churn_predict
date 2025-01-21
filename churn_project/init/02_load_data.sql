-- Adjust the column list and file path as needed.
COPY customer_churn (
    row_number,
    customer_id,
    surname,
    credit_score,
    geography,
    gender,
    age,
    tenure,
    balance,
    num_of_products,
    has_cr_card,
    is_active_member,
    estimated_salary,
    exited
)
FROM '/docker-entrypoint-initdb.d/churn_data.csv'  -- The CSV file path inside container
CSV HEADER
DELIMITER ',';
