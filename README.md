# DocuVault

A full-stack web application for managing file uploads, user authentication, and profiles with a modern dashboard interface.

## Features

- User authentication and profile management
- File upload, download and management with size and type validation
- Dashboard with file statistics and visualizations
- Modern, responsive UI built with React and Ant Design
- Secure authentication using JWT
- RESTful API backend with Django

## Tech Stack

- Frontend: React + TypeScript
- Backend: Django REST Framework
- Authentication: JWT
- UI Framework: Ant Design
- State Management: React Context
- API Client: Axios

## Prerequisites

- Python 3.8+
- Node.js 14+
- PostgreSQL
- Git

## Setup

### Backend Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the project root with:
   ```
   DEBUG=False
   SECRET_KEY=your-secret-key-here
   DATABASE_URL=postgres://user:password@localhost:5432/userportal
   ```

4. Run migrations:
   ```bash
   python manage.py migrate
   ```

5. Create a superuser:
   ```bash
   python manage.py createsuperuser
   ```

### Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

### Running the Application

1. Start the backend server:
   ```bash
   python manage.py runserver
   ```

2. The frontend will automatically start on `http://localhost:3000`

## Project Structure

```
userportal/
├── backend/              # Django backend
│   ├── userportal/      # Django project
│   │   ├── users/       # User management
│   │   └── files/       # File management
│   └── config/          # Django settings
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── api/         # API client
│   │   └── auth/        # Authentication
└── docs/               # Documentation
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License

[![Built with Cookiecutter Django](https://img.shields.io/badge/built%20with-Cookiecutter%20Django-ff69b4.svg?logo=cookiecutter)](https://github.com/cookiecutter/cookiecutter-django/)
[![Ruff](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json)](https://github.com/astral-sh/ruff)

## Settings

Moved to [settings](https://cookiecutter-django.readthedocs.io/en/latest/1-getting-started/settings.html).

## Screenshots

<div align="center">
  <h3>Dashboard</h3>
  <img src="screenshots/dashboard.png" alt="Dashboard" width="800">
  
  <h3>Login Page</h3>
  <img src="screenshots/login.png" alt="Login Page" width="800">
  
  <h3>Register Page</h3>
  <img src="screenshots/register.png" alt="Register Page" width="800">
  
  <h3>Profile Page</h3>
  <img src="screenshots/profile.png" alt="Profile Page" width="800">
</div>

## Basic Commands

### Setting Up Your Users

- To create a **normal user account**, just go to Register and fill out the form. Once you submit it and get success message you'll be ready to go.

- To create a **superuser account**, use this command:

      $ python manage.py createsuperuser

For convenience, you can keep your normal user logged in on Chrome and your superuser logged in on Firefox (or similar), so that you can see how the site behaves for both kinds of users.

### Type checks

Running type checks with mypy:

    $ mypy userportal

### Test coverage

To run the tests, check your test coverage, and generate an HTML coverage report:

    $ coverage run -m pytest
    $ coverage html
    $ open htmlcov/index.html

#### Running tests with pytest

    $ pytest

### Live reloading and Sass CSS compilation

Moved to [Live reloading and SASS compilation](https://cookiecutter-django.readthedocs.io/en/latest/2-local-development/developing-locally.html#using-webpack-or-gulp).
