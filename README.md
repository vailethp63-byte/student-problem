# StudentLearn

StudentLearn is a web-based learning resources library for students at Mbeya University of Science and Technology (MUST). It helps students find, share and download notes, past papers, tutorials and books in one place.

## The Problem

Students often struggle to find past papers, notes and books for their courses. Materials are scattered across phones, WhatsApp groups and the physical library, and much time is wasted asking others for files.

## Features

- Add learning resources (notes, past papers, tutorials, books)
- Upload and download files (PDF, Word, PowerPoint, TXT, up to 20MB)
- Search by title, course or description, and filter by resource type
- Live statistics (total resources, notes, past papers, tutorials)
- Admin login: only the admin can edit and delete resources
- Responsive design for phones, tablets and desktops

## Technologies

| Part | Technology |
|---|---|
| Front-end | HTML, CSS, JavaScript |
| Back-end | Java 17, Spring Boot 4.1.1, Spring Data JPA |
| Database | PostgreSQL |
| Tools | VS Code, Maven, pgAdmin, Live Server |

## Project Structure

```
student-problem/
├── pom.xml
└── src/main/
    ├── java/student_problem/
    │   ├── StudentProblemApplication.java
    │   ├── Controller/    (Resource, File and Auth controllers)
    │   ├── Entity/        (LearningResource)
    │   └── Repository/    (LearningResourceRepository, frontend/)
    └── resources/
        └── application.properties   (not included, see below)
```

The front-end files (`index.html`, `style.css`, `script.js`) are in `src/main/java/student_problem/Repository/frontend/`.

## Getting Started

### Requirements

- Java 17
- PostgreSQL
- VS Code with the Live Server extension

### 1. Create the database

```sql
CREATE DATABASE student_problem_db;
```

### 2. Create the configuration file

Create `src/main/resources/application.properties` with:

```properties
spring.application.name=student-problem
server.port=8080

spring.datasource.url=jdbc:postgresql://localhost:5432/student_problem_db
spring.datasource.username=postgres
spring.datasource.password=YOUR_DATABASE_PASSWORD

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

spring.servlet.multipart.max-file-size=20MB
spring.servlet.multipart.max-request-size=20MB
app.upload-dir=uploads

app.admin.username=admin
app.admin.password=YOUR_ADMIN_PASSWORD
```

This file is excluded from GitHub on purpose because it contains passwords.

### 3. Run the back-end

```
./mvnw spring-boot:run
```

On Windows PowerShell use `.\mvnw spring-boot:run`. Wait for `Started StudentProblemApplication`. The API runs at `http://localhost:8080`.

### 4. Run the front-end

Open the `frontend` folder in VS Code, right-click `index.html` and choose **Open with Live Server**. It must run on port 5500, because the back-end only allows that origin (CORS).

## API Endpoints

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/resources` | List all resources | Public |
| GET | `/api/resources/{id}` | Get one resource | Public |
| POST | `/api/resources` | Add a resource | Public |
| PUT | `/api/resources/{id}` | Update a resource | Admin |
| DELETE | `/api/resources/{id}` | Delete a resource | Admin |
| POST | `/api/files/upload` | Upload a file | Public |
| GET | `/api/files/download/{name}` | Download a file | Public |
| POST | `/api/auth/login` | Admin login | Public |
| POST | `/api/auth/logout` | Admin logout | Admin |

## Limitations and Future Improvements

- Only one admin account, and the password is stored in the configuration file
- Admin sessions are lost when the back-end restarts
- Files are not deleted from disk when a resource is deleted
- Not yet deployed online
- Planned: multi-user registration, hashed passwords, pagination, online deployment, and book borrowing

## Author

[Your full name], [Registration number]
Mbeya University of Science and Technology (MUST), 2026
