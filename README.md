# Feedback System

A lightweight internal feedback system with role-based access control, built with FastAPI (backend) and React (frontend).

## Features

- **User Authentication**: Separate signup and login pages
- **Role-based Access**: Manager and Employee roles with different permissions
- **Team Management**: Managers can assign employees to their team
- **Feedback Submission**: Managers can submit feedback to their team members
- **Feedback Acknowledgment**: Employees can acknowledge feedback they receive
- **Feedback Editing**: Managers can edit their past feedback
- **Dashboard Analytics**: Comprehensive statistics and tracking
- **Real-time Updates**: Immediate UI updates after actions

## User Flow

### 1. Signup Process

1. **Visit Signup Page**: Navigate to `/signup`
2. **Fill Form**: Enter name, email, and select role (Manager/Employee)
3. **Validation**: System validates email format and checks for duplicates
4. **Account Creation**: User account is created in the database
5. **Redirect to Login**: User is redirected to login page

### 2. Login Process

1. **Visit Login Page**: Navigate to `/login`
2. **Enter Email**: Provide the email used during signup
3. **Authentication**: System verifies user exists
4. **Role-based Redirect**: User is redirected to appropriate dashboard

### 3. Dashboard Access

- **Managers**: Access to team management, feedback submission, and analytics
- **Employees**: Access to feedback timeline and acknowledgment features

## Feedback Acknowledgment Feature

### What is Feedback Acknowledgment?

The acknowledgment feature allows employees to confirm that they have read and understood the feedback provided by their managers. This creates a closed feedback loop and ensures accountability.

### How It Works

1. **Manager Submits Feedback**: Manager creates feedback for an employee
2. **Employee Receives Feedback**: Employee sees the feedback in their dashboard
3. **Employee Acknowledges**: Employee clicks "Acknowledge Feedback" button
4. **Optional Comment**: Employee can add a comment when acknowledging
5. **Status Tracking**: System tracks acknowledgment status and timestamps
6. **Manager Visibility**: Manager can see which feedback has been acknowledged

### Features

#### For Employees:

- ✅ **Visual Indicators**: Acknowledged feedback has green border and badge
- ✅ **Acknowledgment Button**: One-click acknowledgment with optional comment
- ✅ **Status Display**: Shows acknowledgment date and time
- ✅ **Comment Support**: Can add comments when acknowledging
- ✅ **Prevent Duplicate**: Cannot acknowledge the same feedback twice

#### For Managers:

- ✅ **Status Overview**: See which feedback has been acknowledged
- ✅ **Acknowledgment Statistics**: Dashboard shows acknowledgment rates
- ✅ **Pending Alerts**: Highlight feedback waiting for acknowledgment
- ✅ **Employee Comments**: View employee comments on acknowledgments
- ✅ **Timestamps**: See when feedback was acknowledged

## Feedback Editing Feature

### What is Feedback Editing?

Managers can edit their previously submitted feedback to correct mistakes, add additional information, or update the sentiment.

### How It Works

1. **Manager Views Feedback**: Manager sees their submitted feedback in dashboard
2. **Edit Button**: Click "Edit Feedback" button on any feedback item
3. **Inline Editing**: Form appears with current feedback data
4. **Make Changes**: Update strengths, improvements, or sentiment
5. **Save Changes**: Click "Save Changes" to update the feedback
6. **Visual Indicators**: Employees see "Updated" indicator on modified feedback

### Features

- ✅ **Inline Editing**: Edit feedback directly in the dashboard
- ✅ **Partial Updates**: Update only specific fields
- ✅ **Authorization**: Only original manager can edit their feedback
- ✅ **Timestamp Tracking**: Shows when feedback was last updated
- ✅ **Employee Notifications**: Employees see update indicators

## Database Schema

```sql
-- Users table
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    role VARCHAR NOT NULL,
    manager_id VARCHAR REFERENCES users(id)
);

-- Feedback table
CREATE TABLE feedback (
    id VARCHAR PRIMARY KEY,
    employee_id VARCHAR REFERENCES users(id),
    manager_id VARCHAR REFERENCES users(id),
    strengths VARCHAR,
    improvements VARCHAR,
    sentiment VARCHAR,
    created_at DATETIME,
    updated_at DATETIME
);

-- Acknowledgments table
CREATE TABLE acknowledgements (
    feedback_id VARCHAR PRIMARY KEY,
    employee_id VARCHAR PRIMARY KEY,
    acknowledged BOOLEAN DEFAULT FALSE,
    comment VARCHAR,
    acknowledged_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Authentication

- `POST /users/` - Create new user (signup)
- `GET /users/by_email/{email}` - Get user by email (login)

### Feedback Management

- `POST /feedback/` - Submit new feedback
- `GET /feedback/{feedback_id}` - Get specific feedback
- `PUT /feedback/{feedback_id}` - Update feedback
- `GET /feedback/employee/{employee_id}` - Get employee's feedback
- `GET /feedback/manager/{manager_id}` - Get manager's feedback

### Feedback Acknowledgment

- `POST /feedback/{feedback_id}/acknowledge` - Acknowledge feedback
- `GET /feedback/{feedback_id}/acknowledgement/{employee_id}` - Get acknowledgment status

### Team Management

- `GET /manager/{manager_id}/team` - Get team members
- `GET /manager/{manager_id}/available-employees` - Get available employees
- `POST /manager/{manager_id}/assign-employee/{employee_id}` - Assign employee to manager

### Dashboard

- `GET /dashboard/manager/{manager_id}` - Manager dashboard with stats
- `GET /dashboard/employee/{employee_id}` - Employee dashboard

## Frontend Components

- **Signup**: User registration with validation
- **Login**: User authentication by email
- **ManagerDashboard**: Team management, feedback submission, and analytics
- **EmployeeDashboard**: Feedback timeline and acknowledgment
- **Visual Indicators**: Status badges, update indicators, and color coding

## Installation and Setup

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Database Setup

The system uses SQLite by default. The database is automatically created when you first run the backend.

## Usage

### Complete User Journey

1. **Signup**: Visit `/signup` and create an account
2. **Login**: Visit `/login` and authenticate with your email
3. **Dashboard**: Access role-specific dashboard
4. **Manager Actions**: Create teams, submit feedback, view analytics
5. **Employee Actions**: View feedback, acknowledge, add comments
6. **Logout**: Use logout button to end session

### Manager Workflow

1. **Signup/Login** as a manager
2. **Manage Team**: Assign employees to your team
3. **Submit Feedback**: Create feedback for team members
4. **Edit Feedback**: Update feedback if needed
5. **Monitor Acknowledgments**: Check dashboard for acknowledgment status
6. **Follow Up**: Contact employees who haven't acknowledged feedback

### Employee Workflow

1. **Signup/Login** as an employee
2. **View Feedback**: See feedback from your manager
3. **Acknowledge**: Click "Acknowledge Feedback" button
4. **Add Comment**: Optionally add a comment
5. **Track History**: View acknowledgment history

## API Documentation

The API documentation is available at `http://localhost:8000/docs` when the backend is running.

## Testing

Run the signup flow test:

```bash
cd backend
python test_signup_flow.py
```

This will create test users and demonstrate the signup/login workflow.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
