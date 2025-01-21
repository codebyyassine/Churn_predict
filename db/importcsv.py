import pandas as pd
import psycopg2

# CSV file path
CSV_PATH = "./data/Churn_Modelling.csv"

# Database connection info
DB_HOST = "localhost"
DB_NAME = "churn_db"
DB_USER = "postgres"
DB_PASS = "postgres"
DB_PORT = 5432

def main():
    # Read CSV into DataFrame
    df = pd.read_csv(CSV_PATH)
    # Optionally rename columns if needed, e.g.:
    # df.rename(columns={"RowNumber": "row_number", ...}, inplace=True)

    # Convert columns like "HasCrCard", "IsActiveMember" to booleans if needed:
    df["HasCrCard"] = df["HasCrCard"].astype(bool)
    df["IsActiveMember"] = df["IsActiveMember"].astype(bool)
    df["Exited"] = df["Exited"].astype(bool)
    
    df.to_csv("./data/churn_data.csv", index=False)
    # Connect to Postgres
    # conn = psycopg2.connect(
    #     host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS, port=DB_PORT
    # )
    # cursor = conn.cursor()

    # # Insert rows one by one (or using COPY for large datasets)
    # for _, row in df.iterrows():
    #     cursor.execute(
    #         """
    #         INSERT INTO customer_churn (
    #             row_number,
    #             customer_id,
    #             surname,
    #             credit_score,
    #             geography,
    #             gender,
    #             age,
    #             tenure,
    #             balance,
    #             num_of_products,
    #             has_cr_card,
    #             is_active_member,
    #             estimated_salary,
    #             exited
    #         )
    #         VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
    #         """,
    #         (
    #             row["RowNumber"],
    #             row["CustomerId"],
    #             row["Surname"],
    #             row["CreditScore"],
    #             row["Geography"],
    #             row["Gender"],
    #             row["Age"],
    #             row["Tenure"],
    #             row["Balance"],
    #             row["NumOfProducts"],
    #             row["HasCrCard"],
    #             row["IsActiveMember"],
    #             row["EstimatedSalary"],
    #             row["Exited"],
    #         )
    #     )
    # conn.commit()
    # cursor.close()
    # conn.close()
    print("CSV data successfully imported!")

if __name__ == "__main__":
    main()
