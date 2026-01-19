# Microservices Architecture Project

This is a microservices-based application with the following services:

## Services

1. **Account Service**
   - User authentication and management
   - Port: 3001

2. **Task Service**
   - Task management functionality
   - Port: 3002

3. **Frontend Service**
   - React-based web interface
   - Port: 3000

4. **MongoDB**
   - Primary database
   - Port: 27017

5. **Redis**
   - Caching and session management
   - Port: 6379

## Getting Started

1. Clone the repository
2. Run `docker-compose up --build`
3. Access the application at `http://localhost:3000`

## Development

Each service has its own directory with its own `package.json` and dependencies.

### Environment Variables

Create `.env` files in each service directory as needed. See `.env.example` files for reference.
