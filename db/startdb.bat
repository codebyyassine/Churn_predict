docker run -d --name ml-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -v "%cd%\init.sql":/docker-entrypoint-initdb.d/init.sql postgres
pause