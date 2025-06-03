# Grid Brain Backend

[![Python Coverage](https://img.shields.io/badge/coverage-pending-lightgrey)](<!-- URL to Python coverage report -->)
[![Frontend Coverage](https://img.shields.io/badge/frontend_coverage-pending-lightgrey)](<!-- URL to Frontend coverage report -->)

Il sistema AI che funge da "quinto socio" per The Grid Company, osservando, apprendendo e guidando proattivamente il team.

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Docker & Docker Compose
- Supabase account
- Anthropic API key
- OpenAI API key

### Setup

1. Clone the repository

```bash
git clone <repository-url>
cd the-grid-advisor
```

2. Create virtual environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies

```bash
pip install -r requirements.txt
```

4. Copy environment variables

```bash
cp .env.example .env
# Edit .env with your credentials
```

5. Run database migrations

```bash
alembic upgrade head
```

6. Start the development server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 🏗️ Architecture

### Stack

- **Backend**: FastAPI + Python 3.11
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: Anthropic Claude + OpenAI Embeddings
- **Email**: IMAP/SMTP (Register.it)
- **Cache**: Redis (optional)
- **Container**: Docker

### Project Structure

```
the-grid-advisor/
├── app/
│   ├── api/            # API endpoints
│   ├── core/           # Core configuration
│   ├── db/             # Database models and schemas
│   ├── services/       # Business logic
│   ├── ai/             # AI integration
│   ├── email/          # Email processing
│   └── main.py         # FastAPI app
├── migrations/         # Alembic migrations
├── tests/              # Test suite
├── scripts/            # Utility scripts
├── docker/             # Docker configurations
└── requirements.txt    # Python dependencies
```

## 🔑 Key Features

### 1. Email Integration

- Automatic email sync every 5 minutes
- Pattern recognition in email communications
- Smart categorization and prioritization
- Alert system for important unanswered emails

### 2. AI Advisor

- Daily briefing generation
- Pattern recognition engine
- Proactive monitoring and alerts
- Memory system with pgvector

### 3. Authentication

- Magic link authentication
- Restricted to @thegridcompany.it emails
- Automatic team member association

### 4. Analytics

- Real-time metrics dashboard
- Client engagement tracking
- Team productivity metrics
- AI suggestion tracking

## 🧪 Testing

Python tests are written using [pytest](https://docs.pytest.org).

Configuration for pytest (test paths, default options, coverage settings) can be found in `pytest.ini` at the project root.

Tests should be placed in the `tests/` directory, mirroring the structure of the `app/` directory (e.g., tests for `app/core/config.py` go into `tests/core/test_config.py`).

Run the test suite:

```bash
pytest
```

Run with coverage:

```bash
pytest --cov=app tests/
```

## 📊 Database

The system uses Supabase with the following main tables:

- `team_members`: Team member profiles
- `clients`: Client information
- `interactions`: All interactions (emails, meetings, etc.)
- `learned_patterns`: AI-identified patterns
- `automation_rules`: Automation configurations

## 🔒 Security

- Email passwords encrypted with Supabase Vault
- Rate limiting on all endpoints
- Comprehensive audit logging
- GDPR compliance features
- Data retention policies

## 📈 Performance

Target metrics:

- API response time: < 200ms (p95)
- Email sync: < 30 seconds per account
- AI analysis: < 5 seconds per query
- Dashboard load: < 1 second

## 🚨 Monitoring

The system includes:

- Health check endpoints
- Prometheus metrics
- Structured logging
- Error tracking
- Performance monitoring

## 📝 Environment Variables

See `.env.example` for all required environment variables.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request

## 📄 License

Proprietary - The Grid Company
